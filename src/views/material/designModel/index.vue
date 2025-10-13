<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <div style="flex: 1"></div>
      <form-item label="按名称搜索">
        <el-input
          v-model="queryParams.name"
          clearable
          placeholder="请输入名称"
          style="width: 160px"
        />
      </form-item>
      <form-item label="只看母版">
        <el-switch v-model="queryParams.isTemplate" :active-value="true" :inactive-value="false" @change="getList" />
      </form-item>
      <el-button type="primary" @click="getList" :icon="Search"> 搜索 </el-button>
      <div class="shrink-0">
        <!-- 删除按钮 -->
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)" :disabled="!ids.length">
          批量删除({{ ids.length }})
        </el-button>
      </div>
    </div>
    <!-- 表格展示 -->
    <div class="common-table">
      <vxe-grid
        v-bind="(gridOptions as any)"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange"
      >
        <template #operationDefaultSlot="{ row }">
          <div class="operation-buttons">
            <!-- 操作下拉菜单 -->
            <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)" class="operation-dropdown">
              <el-button type="primary" link size="small">
                操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="generate-product" :disabled="generateProductLoading[row.id]">
                    <el-icon><Goods /></el-icon>
                    {{ generateProductLoading[row.id] ? '生成中...' : '生成产品' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="view-drafts">
                    <el-icon><Picture /></el-icon>
                    查看草稿截图
                  </el-dropdown-item>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="ai-generate" :disabled="aiGenerateLoading[row.id]">
                    <el-icon><MagicStick /></el-icon>
                    {{ aiGenerateLoading[row.id] ? 'AI生成中...' : 'AI自动生成内容' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="enter-design-tool">
                    <el-icon><View /></el-icon>
                    进入设计工具查看
                  </el-dropdown-item>
                  <el-dropdown-item command="download-thumbnail" :disabled="!row.thumbnail">
                    <el-icon><Download /></el-icon>
                    下载缩略图
                  </el-dropdown-item>
                  <el-dropdown-item command="download-drafts">
                    <el-icon><Download /></el-icon>
                    下载草稿
                  </el-dropdown-item>
                  <el-dropdown-item command="copy-info" divided>
                    <el-icon><CopyDocument /></el-icon>
                    复制信息
                  </el-dropdown-item>
                  <el-dropdown-item command="view-meta">
                    <el-icon><Document /></el-icon>
                    查看元数据
                  </el-dropdown-item>
                  <el-dropdown-item command="view-stickers">
                    <el-icon><Picture /></el-icon>
                    查看关联贴纸
                  </el-dropdown-item>
                  <el-dropdown-item command="toggle-template" :disabled="templateLoading[row.id]">
                    <el-icon><Star /></el-icon>
                    {{ templateLoading[row.id] ? '处理中...' : (row.isTemplate ? '取消母版' : '设为母版') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="toggle-public" :disabled="publicLoading[row.id]">
                    <el-icon><Share /></el-icon>
                    {{ publicLoading[row.id] ? '处理中...' : (row.isPublic ? '取消发布' : '发布') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided :disabled="deleteLoading[row.id]">
                    <el-icon><Delete /></el-icon>
                    {{ deleteLoading[row.id] ? '删除中...' : '删除' }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
        <template #thumbnailSlot="{ row }">
          <el-image
            v-if="row.thumbnail"
            :src="row.thumbnail"
            :preview-src-list="[row.thumbnail]"
            style="width: 64px; height: 64px; object-fit: cover; cursor: pointer;"
            fit="cover"
            :z-index="3000"
            preview-teleported
          />
        </template>

        <template #uploaderSlot="{ row }">
          <span>{{ row.uploader?.nickname || row.uploader?.name || row.uploaderId || '' }}</span>
        </template>
        <template #phashSlot="{ row }">
          <div class="phash-display">
            <el-tooltip 
              v-if="row.phash" 
              :content="row.phash" 
              placement="top" 
              :show-after="500"
            >
              <span class="phash-text">{{ formatPhash(row.phash) }}</span>
            </el-tooltip>
            <span v-else class="no-phash">未生成</span>
          </div>
        </template>
        <template #isTemplateSlot="{ row }">
          <span v-if="row.isTemplate" class="is-template-tag">是</span>
          <span v-else class="not-template-tag">否</span>
        </template>
        <template #isPublicSlot="{ row }">
          <span v-if="row.isPublic" class="is-public-tag">是</span>
          <span v-else class="not-public-tag">否</span>
        </template>
      </vxe-grid>
    </div>
    <!-- 分页 -->
    <div class=" flex justify-end">
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      @close="dialogClose"
      align-center
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="模型名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入模型名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" placeholder="请输入描述" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="关键词" prop="keywords">
              <el-input v-model="form.keywords" placeholder="请输入关键词（逗号分隔）" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="metaDialogVisible" fullscreen title="元数据详情" :close-on-click-modal="false">
      <vue-json-pretty :data="JSON.parse(metaDialogContent)" />
    </el-dialog>
    
    <!-- 关联草稿弹窗 -->
    <el-dialog 
      v-model="draftDialogVisible" 
      title="关联草稿" 
      width="80%" 
      :close-on-click-modal="false"
    >
      <div class="draft-dialog-content">
        <div class="draft-info mb-4">
          <h3 class="text-lg font-medium mb-2">
            模型：{{ currentModel?.name || currentModel?.id }}
          </h3>
          <p v-if="currentModel?.description" class="text-color-regular">
            {{ currentModel.description }}
          </p>
        </div>
        
        <div v-if="relatedDrafts.length === 0" class="empty-state text-center py-8">
          <el-empty description="暂无关联草稿" />
        </div>
        
        <div v-else class="draft-grid">
          <div 
            v-for="draft in relatedDrafts" 
            :key="draft.id" 
            class="draft-item"
          >
            <div class="draft-preview">
              <!-- 视频预览 -->
              <div 
                v-if="draft.suffix && ['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(draft.suffix.toLowerCase())"
                class="video-preview-container"
                @click="handleDraftVideoPlay(draft)"
              >
                <video 
                  :src="draft.url" 
                  class="w-full h-32 rounded cursor-pointer object-cover"
                  preload="metadata"
                  muted
                />
                <div class="video-overlay">
                  <el-icon class="play-icon"><VideoPlay /></el-icon>
                </div>
              </div>
              <!-- 图片预览 -->
              <el-image 
                v-else
                :src="draft.url" 
                fit="cover" 
                class="w-full h-32 rounded cursor-pointer"
                :preview-src-list="[draft.url]"
                :preview-teleported="true"
                :z-index="9999"
              />
            </div>
            <div class="draft-info p-3">
              <div class="draft-header flex justify-between items-start mb-2">
                <div class="draft-name text-sm font-medium truncate flex-1">
                  {{ draft.name || '未命名' }}
                </div>
                <el-button 
                  type="danger" 
                  link 
                  size="small" 
                  @click="deleteDraftItem(draft)"
                  class="ml-2 flex-shrink-0"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <div v-if="draft.description" class="draft-desc text-xs text-color-regular mt-1 line-clamp-2">
                {{ draft.description }}
              </div>
              <div class="draft-meta text-xs text-color-placeholder mt-2">
                <span>{{ formatTimestamp(draft.createTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="draftDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="aiGenDialogVisible"
      title="AI自动生成内容"
      width="500px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">请输入你希望AI分析的内容风格或角度（如：偏艺术描述、简洁风格、突出色彩等）</div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="如：请用艺术化语言描述模型内容..."
        style="font-size:16px;min-height:120px;width:100%;resize:vertical;"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
      </template>
    </el-dialog>

    <!-- 草稿下载弹窗 -->
    <el-dialog 
      v-model="draftDownloadDialogVisible" 
      title="下载草稿" 
      :width="isMobile ? '95%' : '80%'" 
      :close-on-click-modal="false"
      :fullscreen="isMobile"
    >
      <div class="draft-download-content">
        <div class="draft-info mb-4">
          <h3 class="text-lg font-medium mb-2">
            模型：{{ currentModel?.name || currentModel?.id }}
          </h3>
          <p v-if="currentModel?.description" class="text-color-regular">
            {{ currentModel.description }}
          </p>
        </div>
        
        <div v-if="relatedDrafts.length === 0" class="empty-state text-center py-8">
          <el-empty description="暂无关联草稿" />
        </div>
        
        <div v-else class="draft-grid" :class="{ 'mobile-grid': isMobile }">
          <div 
            v-for="draft in relatedDrafts" 
            :key="draft.id" 
            class="draft-item"
            :class="{ 'mobile-item': isMobile }"
          >
            <div class="draft-preview">
              <!-- 视频预览 -->
              <div 
                v-if="draft.suffix && ['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(draft.suffix.toLowerCase())"
                class="video-preview-container"
                @click="handleDraftVideoPlay(draft)"
              >
                <video 
                  :src="draft.url" 
                  class="w-full h-32 rounded cursor-pointer object-cover"
                  preload="metadata"
                  muted
                />
                <div class="video-overlay">
                  <el-icon class="play-icon"><VideoPlay /></el-icon>
                </div>
              </div>
              <!-- 图片预览 -->
              <el-image 
                v-else
                :src="draft.url" 
                fit="cover" 
                class="w-full h-32 rounded cursor-pointer"
                :preview-src-list="[draft.url]"
                :preview-teleported="true"
                :z-index="9999"
              />
            </div>
            <div class="draft-info p-3">
              <div class="draft-header flex justify-between items-start mb-2">
                <div class="draft-name text-sm font-medium truncate flex-1">
                  {{ draft.name || '未命名' }}
                </div>
                <el-button 
                  type="primary" 
                  link 
                  size="small" 
                  @click="downloadSingleDraft(draft)"
                  class="ml-2 flex-shrink-0"
                >
                  <el-icon><Download /></el-icon>
                </el-button>
              </div>
              <div v-if="draft.description" class="draft-desc text-xs text-color-regular mt-1 line-clamp-2">
                {{ draft.description }}
              </div>
              <div class="draft-meta text-xs text-color-placeholder mt-2">
                <span>{{ formatTimestamp(draft.createTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer" :class="{ 'mobile-footer': isMobile }">
          <div class="flex justify-between items-center" :class="{ 'mobile-footer-content': isMobile }">
            <div class="text-sm text-gray-600">
              共 {{ relatedDrafts.length }} 个草稿
            </div>
            <div class="flex gap-2" :class="{ 'mobile-buttons': isMobile }">
              <el-button 
                type="success" 
                @click="downloadAllDrafts"
                :disabled="relatedDrafts.length === 0"
                :size="isMobile ? 'large' : 'default'"
              >
                <el-icon><Download /></el-icon>
                下载所有草稿
              </el-button>
              <el-button 
                @click="draftDownloadDialogVisible = false"
                :size="isMobile ? 'large' : 'default'"
              >
                关闭
              </el-button>
            </div>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 关联贴纸弹窗 -->
    <el-dialog 
      v-model="stickersDialogVisible" 
      title="关联贴纸" 
      width="80%" 
      :close-on-click-modal="false"
    >
      <div class="stickers-dialog-content">
        <div class="stickers-info mb-4">
          <h3 class="text-lg font-medium mb-2">
            模型：{{ currentModel?.name || currentModel?.id }}
          </h3>
          <p v-if="currentModel?.description" class="text-color-regular">
            {{ currentModel.description }}
          </p>
        </div>
        
        <div v-if="relatedStickers.length === 0" class="empty-state text-center py-8">
          <el-empty description="暂无关联贴纸" />
        </div>
        
        <div v-else class="stickers-grid">
          <div 
            v-for="sticker in relatedStickers" 
            :key="sticker.id" 
            class="sticker-item"
          >
            <div class="sticker-preview">
              <el-image 
                :src="sticker.url" 
                fit="cover" 
                class="w-full h-32 rounded cursor-pointer"
                :preview-src-list="[sticker.url]"
                :preview-teleported="true"
                :z-index="9999"
              />
            </div>
            <div class="sticker-info p-3">
              <div class="sticker-header flex justify-between items-start mb-2">
                <div class="sticker-name text-sm font-medium truncate flex-1">
                  {{ sticker.name || '未命名' }}
                </div>
                <el-button 
                  type="primary" 
                  link 
                  size="small" 
                  @click="downloadSticker(sticker)"
                  class="ml-2 flex-shrink-0"
                >
                  <el-icon><Download /></el-icon>
                </el-button>
              </div>
              <div v-if="sticker.description" class="sticker-desc text-xs text-color-regular mt-1 line-clamp-2">
                {{ sticker.description }}
              </div>
              <div class="sticker-meta text-xs text-color-placeholder mt-2">
                <div class="flex justify-between">
                  <span>{{ formatTimestamp(sticker.createTime) }}</span>
                  <span>{{ sticker.suffix || 'unknown' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            共 {{ relatedStickers.length }} 个贴纸
          </div>
          <div class="flex gap-2">
            <el-button 
              type="success" 
              @click="downloadAllStickers"
              :disabled="relatedStickers.length === 0"
            >
              <el-icon><Download /></el-icon>
              下载所有贴纸
            </el-button>
            <el-button @click="stickersDialogVisible = false">关闭</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 复制信息弹窗 -->
    <el-dialog
      v-model="copyInfoDialogVisible"
      title="复制信息"
      width="400px"
      align-center
      :destroy-on-close="true"
    >
      <div class="copy-info-content">
        <div class="copy-item" v-if="currentCopyModel?.name">
          <div class="copy-label">标题：</div>
          <div class="copy-content">
            <el-input 
              v-model="currentCopyModel.name" 
              readonly 
              class="copy-input"
            />
            <el-button 
              type="primary" 
              size="small" 
              @click="copyToClipboard(currentCopyModel.name, '标题')"
              class="copy-btn"
            >
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
          </div>
        </div>
        
        <div class="copy-item" v-if="currentCopyModel?.description">
          <div class="copy-label">描述：</div>
          <div class="copy-content">
            <el-input 
              v-model="currentCopyModel.description" 
              type="textarea"
              :rows="3"
              readonly 
              class="copy-input"
            />
            <el-button 
              type="primary" 
              size="small" 
              @click="copyToClipboard(currentCopyModel.description, '描述')"
              class="copy-btn"
            >
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
          </div>
        </div>
        
        <div class="copy-item" v-if="currentCopyModel?.keywords">
          <div class="copy-label">关键词：</div>
          <div class="copy-content">
            <el-input 
              v-model="currentCopyModel.keywords" 
              readonly 
              class="copy-input"
            />
            <el-button 
              type="primary" 
              size="small" 
              @click="copyToClipboard(currentCopyModel.keywords, '关键词')"
              class="copy-btn"
            >
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
          </div>
        </div>
        
        <div class="copy-all-section">
          <el-button 
            type="success" 
            @click="copyAllInfo"
            class="copy-all-btn"
            :loading="copyAllLoading"
          >
            <el-icon><CopyDocument /></el-icon>
            复制全部信息
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="copyInfoDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, ArrowDown, Edit, Picture, Goods, MagicStick, View, Star, Document, VideoPlay, Share, Download, CopyDocument } from '@element-plus/icons-vue'
import { getDesignModelList, updateDesignModel, deleteDesignModel, aiAutoGenerateDesignModelInfo, toProduct } from '@/api/designModel'
import { getDraftList, deleteDraft } from '@/api/draft'
import { getStickerById } from '@/api/material'
import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import type { DesignModelVO } from '@/api/designModel'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import Pagination from '@/components/Pagination/index.vue'
import { getDesignToolMessenger } from '@/utils/designToolMessenger'
import { useWindowSize } from '@vueuse/core'

// 格式化哈希显示
function formatPhash(phash: string): string {
  if (!phash) return '';
  // 显示前8位和后8位，中间用...省略
  if (phash.length > 16) {
    return `${phash.substring(0, 8)}...${phash.substring(phash.length - 8)}`;
  }
  return phash;
}


const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  name: '',
  isTemplate: false // 初始为false
})
const gridOptions = ref({
  ...commonGridOptions,
  rowConfig: {
    keyField: 'id'
  },
  checkboxConfig: {
    reserve: true
  },
      columns: [
      { type: 'checkbox', width: 50, ellipsis: true, reserve: true },
    // { title: 'ID', field: 'id', width: 240 },
    { title: '缩略图', field: 'thumbnail', width: 120, slots: { default: 'thumbnailSlot' } },
    { title: '模型名称', field: 'name', width: 200 },
    { title: '描述', field: 'description', minWidth: 300 },
    { title: '关键词', field: 'keywords', width: 180 },
    { title: '感知哈希', field: 'phash', width: 200, slots: { default: 'phashSlot' } },
    { title: '是否母版', field: 'isTemplate', width: 100, slots: { default: 'isTemplateSlot' } },
    { title: '是否公开', field: 'isPublic', width: 100, slots: { default: 'isPublicSlot' } },
    { title: '作者', field: 'uploader', width: 120, slots: { default: 'uploaderSlot' } },
    { title: '创建时间', field: 'createTime', width: 150 },
    { title: '修改时间', field: 'updateTime', width: 150 },
    {
      title: '操作',
      fixed: 'right',
      minWidth: 'auto',
      slots: { default: 'operationDefaultSlot' }
    }
  ]
})

const { height } = useWindowSize()

watchEffect(() => {
  (gridOptions.value as any).maxHeight = height.value - 250
})

const dataSource = ref([])
const loading = ref(false)
const ids = ref([])
const total = ref(0)
const formRef = ref()
const dialogTitle = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<DesignModelVO>>({})
const submitLoading = ref(false)
const metaDialogVisible = ref(false)
const metaDialogContent = ref('')
const draftDialogVisible = ref(false)
const currentModel = ref(null)
const relatedDrafts = ref([])
const aiGenDialogVisible = ref(false)
const aiGenPrompt = ref('')
const aiGenDialogLoading = ref(false)
let aiGenRow = null
const templateLoading = ref({})
const publicLoading = ref({})
const generateProductLoading = ref({})
const aiGenerateLoading = ref({})
const deleteLoading = ref({})
const copyInfoDialogVisible = ref(false)
const currentCopyModel = ref(null)
const copyAllLoading = ref(false)
const stickersDialogVisible = ref(false)
const relatedStickers = ref([])
const draftDownloadDialogVisible = ref(false)

function showMetaDetail(meta: any) {
  metaDialogContent.value = JSON.stringify(meta, null, 2)
  metaDialogVisible.value = true
}

// 查看关联草稿
async function viewRelatedDrafts(model: any) {
  currentModel.value = model
  draftDialogVisible.value = true
  
  try {
    const res = await getDraftList({
      customModelId: model.id,
      currentPage: 1,
      pageSize: 100 // 获取较多数据
    })
    relatedDrafts.value = res.list || []
  } catch (error) {
    ElMessage.error('获取关联草稿失败')
    relatedDrafts.value = []
  }
}

// 删除单个草稿
async function deleteDraftItem(draft: any) {
  try {
    await ElMessageBox.confirm(
      `确认删除草稿"${draft.name || '未命名'}"吗？`, 
      '删除提示', 
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteDraft([draft.id])
    ElMessage.success('删除成功')
    
    // 从当前列表中移除已删除的草稿
    const index = relatedDrafts.value.findIndex(item => item.id === draft.id)
    if (index > -1) {
      relatedDrafts.value.splice(index, 1)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 生成产品
async function generateProduct(model: any) {
  generateProductLoading.value[model.id] = true
  try {
    await toProduct(model.id)
    ElMessage.success('生成产品成功')
  } catch (e) {
    ElMessage.error('生成产品失败')
  } finally {
    generateProductLoading.value[model.id] = false
  }
}

function onAiTableAutoGenerate(row) {
  if (aiGenDialogLoading.value) return
  aiGenRow = row
  aiGenPrompt.value = ''
  aiGenDialogVisible.value = true
}

async function submitAiGenDialog() {
  if (!aiGenRow) return
  aiGenDialogLoading.value = true
  try {
    await handleAiAutoGenerate(aiGenRow, () => {
      aiGenDialogLoading.value = false
      aiGenDialogVisible.value = false
      aiGenRow = null
    }, aiGenPrompt.value)
  } catch (e) {
    aiGenDialogLoading.value = false
    aiGenDialogVisible.value = false
    aiGenRow = null
  }
}

async function handleAiAutoGenerate(row, cb, prompt) {
  aiGenerateLoading.value[row.id] = true
  try {
    const res = await aiAutoGenerateDesignModelInfo({
      id: row.id,
      prompt: prompt || ''
    })
    if (res && res.data) {
      row.name = res.data.name
      row.description = res.data.description
      row.keywords = res.data.keywords
    }
    ElMessage.success('AI自动生成内容成功')
    if (typeof cb === 'function') cb()
    getList()
  } catch (e) {
    ElMessage.error('AI自动生成内容失败')
    if (typeof cb === 'function') cb()
  } finally {
    aiGenerateLoading.value[row.id] = false
  }
}

async function getList() {
  loading.value = true
  try {
    const params = { ...queryParams }
    if (!params.isTemplate) delete params.isTemplate // 只查母版时才传
    const res = await getDesignModelList(params)
    dataSource.value = res.list || []
    total.value = res.total || 0
    ids.value = []
  } finally {
    loading.value = false
  }
}
onMounted(getList)

function checkboxChange(e) {
  // 兼容跨页多选
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  ids.value = [...new Set([...records, ...reserves].map(item => item.id))]
}
function checkboxAllChange(e) {
  // 兼容跨页多选
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  ids.value = [...new Set([...records, ...reserves].map(item => item.id))]
}
function handleEdit(row) {
  isEdit.value = true
  dialogVisible.value = true
  dialogTitle.value = '编辑模型'
  form.value = { ...row }
}
function handleDelete(row?) {
  let delIds: string[] = []
  if (row) {
    delIds = [row.id]
    deleteLoading.value[row.id] = true
  } else if (!ids.value.length) {
    return ElMessage.warning('请选择要删除的数据')
  } else {
    delIds = [...ids.value]
  }

  ElMessageBox.confirm(`确认删除选中的${delIds.length}条数据吗`, '删除提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'error'
  })
    .then(async () => {
      try {
        await deleteDesignModel(delIds)
        ElMessage.success('删除成功')
        ids.value = []
        getList()
      } catch (error) {
        ElMessage.error('删除失败')
      } finally {
        if (row) {
          deleteLoading.value[row.id] = false
        }
      }
    })
    .catch(() => {
      if (row) {
        deleteLoading.value[row.id] = false
      }
    })
}


function enterDesignToolWithId(row: any) {
  const messenger = getDesignToolMessenger()
  if (!messenger.isDesignToolConnected()) {
    ElMessage.warning('设计工具未打开，请先打开设计工具子系统')
    return
  }
  messenger.sendOpenDesignModel(row.id)
  const childWindow = messenger.getChildWindow && messenger.getChildWindow()
  if (childWindow && typeof childWindow.focus === 'function') {
    childWindow.focus()
  }
}
async function toggleTemplate(row) {
  templateLoading.value[row.id] = true
  const newVal = !row.isTemplate
  try {
    await updateDesignModel({ ...row, isTemplate: newVal })
    ElMessage.success(newVal ? '已设为母版' : '已取消母版')
    getList()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    templateLoading.value[row.id] = false
  }
}

async function togglePublic(row) {
  publicLoading.value[row.id] = true
  const newVal = !row.isPublic
  try {
    await updateDesignModel({ ...row, isPublic: newVal })
    ElMessage.success(newVal ? '已发布' : '已取消发布')
    getList()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    publicLoading.value[row.id] = false
  }
}

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'generate-product':
      generateProduct(row);
      break;
    case 'view-drafts':
      viewRelatedDrafts(row);
      break;
    case 'edit':
      handleEdit(row);
      break;
    case 'ai-generate':
      onAiTableAutoGenerate(row);
      break;
    case 'enter-design-tool':
      enterDesignToolWithId(row);
      break;
    case 'download-thumbnail':
      downloadThumbnail(row);
      break;
    case 'download-drafts':
      showDraftDownloadDialog(row);
      break;
    case 'copy-info':
      showCopyInfoDialog(row);
      break;
    case 'view-meta':
      showMetaDetail(row.meta);
      break;
    case 'view-stickers':
      viewRelatedStickers(row);
      break;
    case 'toggle-template':
      toggleTemplate(row);
      break;
    case 'toggle-public':
      togglePublic(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
    default:
      console.warn('未知的操作命令:', command);
  }
}
const rules = {
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  // 可选：keywords校验
}
const dialogClose = () => {
  dialogVisible.value = false
  submitLoading.value = false
}
const submitForm = async () => {
  submitLoading.value = true
  await formRef.value.validate().finally(() => {
    submitLoading.value = false
  })
  try {
    await updateDesignModel(form.value as any)
    ElMessage.success('更新成功')
    getList()
    dialogVisible.value = false
  } catch (e) {
  } finally {
    submitLoading.value = false
    dialogVisible.value = false
  }
}

// 处理草稿视频播放
function handleDraftVideoPlay(draft: any) {
  ElMessageBox.alert(
    `<div style="text-align: center; padding: 20px;">
      <video 
        src="${draft.url}" 
        controls 
        style="width: 100%; max-width: 800px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);"
        autoplay
        preload="metadata"
      ></video>
    </div>`,
    `播放视频 - ${draft.name || '草稿视频'}`,
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
      customClass: 'video-dialog',
      center: true,
      showClose: true,
      customStyle: {
        width: '900px',
        maxWidth: '90vw'
      }
    }
  )
}

// 下载缩略图
async function downloadThumbnail(model: any) {
  if (!model.thumbnail) {
    ElMessage.warning('该模型没有缩略图')
    return
  }
  
  try {
    const response = await fetch(model.thumbnail)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${model.name || 'model'}_thumbnail.${getFileExtension(model.thumbnail)}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('缩略图下载成功')
  } catch (error) {
    ElMessage.error('缩略图下载失败')
  }
}

// 显示草稿下载弹窗
async function showDraftDownloadDialog(model: any) {
  currentModel.value = model
  draftDownloadDialogVisible.value = true
  
  try {
    const res = await getDraftList({
      customModelId: model.id,
      currentPage: 1,
      pageSize: 100
    })
    relatedDrafts.value = res.list || []
  } catch (error) {
    ElMessage.error('获取关联草稿失败')
    relatedDrafts.value = []
  }
}

// 下载单个草稿
async function downloadSingleDraft(draft: any) {
  if (!draft.url) {
    ElMessage.warning('该草稿没有下载链接')
    return
  }
  
  try {
    const response = await fetch(draft.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 根据文件类型设置扩展名
    const extension = draft.suffix || getFileExtension(draft.url)
    const filename = `${currentModel.value?.name || 'model'}_${draft.name || 'draft'}.${extension}`
    link.download = filename
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('草稿下载成功')
  } catch (error) {
    ElMessage.error('草稿下载失败')
  }
}

// 下载所有关联草稿
async function downloadAllDrafts() {
  if (relatedDrafts.value.length === 0) {
    ElMessage.warning('没有可下载的草稿')
    return
  }
  
  ElMessage.info(`开始下载 ${relatedDrafts.value.length} 个草稿文件...`)
  
  for (let i = 0; i < relatedDrafts.value.length; i++) {
    const draft = relatedDrafts.value[i]
    try {
      if (draft.url) {
        const response = await fetch(draft.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // 根据文件类型设置扩展名
        const extension = draft.suffix || getFileExtension(draft.url)
        const filename = `${currentModel.value?.name || 'model'}_draft_${i + 1}_${draft.name || 'unnamed'}.${extension}`
        link.download = filename
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        // 添加延迟避免浏览器阻止多个下载
        if (i < relatedDrafts.value.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } catch (error) {
      console.error(`下载草稿 ${draft.name} 失败:`, error)
    }
  }
  
  ElMessage.success(`草稿下载完成，共 ${relatedDrafts.value.length} 个文件`)
}

// 获取文件扩展名
function getFileExtension(url: string): string {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
  return match ? match[1] : 'jpg'
}

// 复制到剪贴板（移动端友好）
async function copyToClipboard(text: string, type: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // 现代浏览器和移动端支持
      await navigator.clipboard.writeText(text)
    } else {
      // 兼容旧浏览器
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    ElMessage.success(`${type}已复制到剪贴板`)
  } catch (error) {
    ElMessage.error(`${type}复制失败`)
  }
}

// 复制全部信息
async function copyAllInfo() {
  if (!currentCopyModel.value) return
  
  copyAllLoading.value = true
  try {
    const allInfo = []
    if (currentCopyModel.value.name) {
      allInfo.push(`标题：${currentCopyModel.value.name}`)
    }
    if (currentCopyModel.value.description) {
      allInfo.push(`描述：${currentCopyModel.value.description}`)
    }
    if (currentCopyModel.value.keywords) {
      allInfo.push(`关键词：${currentCopyModel.value.keywords}`)
    }
    
    const fullText = allInfo.join('\n\n')
    await copyToClipboard(fullText, '全部信息')
  } finally {
    copyAllLoading.value = false
  }
}

// 显示复制信息弹窗
function showCopyInfoDialog(model: any) {
  currentCopyModel.value = model
  copyInfoDialogVisible.value = true
}

// 查看关联贴纸
async function viewRelatedStickers(model: any) {
  currentModel.value = model
  stickersDialogVisible.value = true
  
  try {
    // 从模型的meta中提取贴纸ID
    const decals = model.meta?.modelInfo?.decals || []
    const stickerIds = decals.map(decal => decal.id).filter(id => id)
    
    if (stickerIds.length === 0) {
      relatedStickers.value = []
      return
    }
    
    // 循环查询每个贴纸的详情
    const stickers = []
    for (const id of stickerIds) {
      try {
        const res = await getStickerById(id)
        if (res && res.list && res.list.length > 0) {
          stickers.push(res.list[0])
        }
      } catch (error) {
        console.warn(`获取贴纸 ${id} 失败:`, error)
        // 继续查询其他贴纸，不中断整个流程
      }
    }
    
    relatedStickers.value = stickers
  } catch (error) {
    ElMessage.error('获取关联贴纸失败')
    relatedStickers.value = []
  }
}

// 下载单个贴纸
async function downloadSticker(sticker: any) {
  if (!sticker.url) {
    ElMessage.warning('该贴纸没有下载链接')
    return
  }
  
  try {
    const response = await fetch(sticker.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${sticker.name || 'sticker'}.${sticker.suffix || 'jpg'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('贴纸下载成功')
  } catch (error) {
    ElMessage.error('贴纸下载失败')
  }
}

// 下载所有贴纸
async function downloadAllStickers() {
  if (relatedStickers.value.length === 0) {
    ElMessage.warning('没有可下载的贴纸')
    return
  }
  
  ElMessage.info(`开始下载 ${relatedStickers.value.length} 个贴纸...`)
  
  for (let i = 0; i < relatedStickers.value.length; i++) {
    const sticker = relatedStickers.value[i]
    try {
      if (sticker.url) {
        const response = await fetch(sticker.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const extension = sticker.suffix || 'jpg'
        const filename = `${sticker.name || 'sticker'}_${i + 1}.${extension}`
        link.download = filename
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        // 添加延迟避免浏览器阻止多个下载
        if (i < relatedStickers.value.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } catch (error) {
      console.error(`下载贴纸 ${sticker.name} 失败:`, error)
    }
  }
  
  ElMessage.success(`贴纸下载完成，共 ${relatedStickers.value.length} 个文件`)
}
</script>
<style lang="less">
.draft-dialog-content {
  .draft-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .draft-item {
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: var(--el-box-shadow-light);
      transform: translateY(-2px);
    }
  }
  
  .draft-preview {
    position: relative;
  }

  .video-preview-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #000;
    border-radius: 8px;
    cursor: pointer;
    overflow: hidden;

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .video-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.6);
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;

      .play-icon {
        font-size: 30px;
        color: #fff;
      }
    }
  }
  
  .draft-info {
    background: var(--el-bg-color);
  }
  
  .draft-header {
    .draft-name {
      font-weight: 500;
    }
    
    .el-button {
      opacity: 0.6;
      transition: opacity 0.3s ease;
      
      &:hover {
        opacity: 1;
      }
    }
  }
  
  .draft-item:hover .draft-header .el-button {
    opacity: 1;
  }
  
  .draft-desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .draft-meta {
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 8px;
  }
}

.empty-state {
  color: var(--el-text-color-placeholder);
}

// 草稿下载弹窗样式
.draft-download-content {
  .draft-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    max-height: 60vh;
    overflow-y: auto;
    
    &.mobile-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
      max-height: 70vh;
    }
  }
  
  .draft-item {
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: var(--el-box-shadow-light);
      transform: translateY(-2px);
    }
    
    &.mobile-item {
      border-radius: 6px;
      
      &:hover {
        transform: none;
        box-shadow: var(--el-box-shadow-light);
      }
    }
  }
  
  .draft-preview {
    position: relative;
  }

  .video-preview-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #000;
    border-radius: 8px;
    cursor: pointer;
    overflow: hidden;

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .video-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.6);
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;

      .play-icon {
        font-size: 30px;
        color: #fff;
      }
    }
  }
  
  .draft-info {
    background: var(--el-bg-color);
  }
  
  .draft-header {
    .draft-name {
      font-weight: 500;
    }
    
    .el-button {
      opacity: 0.6;
      transition: opacity 0.3s ease;
      
      &:hover {
        opacity: 1;
      }
    }
  }
  
  .draft-item:hover .draft-header .el-button {
    opacity: 1;
  }
  
  .draft-desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .draft-meta {
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 8px;
  }
}

// 移动端弹窗底部样式
.mobile-footer {
  padding: 16px;
  
  .mobile-footer-content {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .mobile-buttons {
    flex-direction: column;
    gap: 8px;
    width: 100%;
    
    .el-button {
      width: 100%;
      height: 48px;
      font-size: 16px;
    }
  }
}

// 移动端响应式适配
@media (max-width: 768px) {
  .draft-download-content {
    .draft-info {
      padding: 0 8px;
      
      h3 {
        font-size: 16px;
        margin-bottom: 8px;
      }
      
      p {
        font-size: 14px;
        line-height: 1.4;
      }
    }
    
    .draft-item {
      .draft-info {
        padding: 12px;
        
        .draft-header {
          margin-bottom: 8px;
          
          .draft-name {
            font-size: 14px;
          }
          
          .el-button {
            padding: 4px 8px;
            font-size: 12px;
          }
        }
        
        .draft-desc {
          font-size: 12px;
          margin-top: 6px;
        }
        
        .draft-meta {
          font-size: 11px;
          padding-top: 6px;
        }
      }
    }
  }
  
  .mobile-footer {
    .text-sm {
      font-size: 14px;
      text-align: center;
      margin-bottom: 8px;
    }
  }
}

// 关联贴纸弹窗样式
.stickers-dialog-content {
  .stickers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .sticker-item {
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: var(--el-box-shadow-light);
      transform: translateY(-2px);
    }
  }
  
  .sticker-preview {
    position: relative;
  }
  
  .sticker-info {
    background: var(--el-bg-color);
  }
  
  .sticker-header {
    .sticker-name {
      font-weight: 500;
    }
    
    .el-button {
      opacity: 0.6;
      transition: opacity 0.3s ease;
      
      &:hover {
        opacity: 1;
      }
    }
  }
  
  .sticker-item:hover .sticker-header .el-button {
    opacity: 1;
  }
  
  .sticker-desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .sticker-meta {
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 8px;
  }
}

// 操作按钮样式
.operation-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .el-button {
    flex-shrink: 0;
  }
}

// 操作dropdown样式
.operation-dropdown {
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .el-icon {
      margin-right: 4px;
    }
  }
}

// 视频对话框样式
.video-dialog {
  .el-message-box__content {
    padding: 30px;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .el-message-box__message {
    margin: 0;
  }
  
  video {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 70vh;
    object-fit: contain;
  }
}
.operation-btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0 12px;
  min-width: 120px;
  max-width: 200px;
  justify-content: center;
  align-items: center;
  row-gap: 4px;
}
.is-template-tag, .not-template-tag, .is-public-tag, .not-public-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  height: 28px;
  line-height: 28px;
  border-radius: 16px;
  font-size: 15px;
}
.is-template-tag {
  font-weight: bold;
  color: #fff;
  background: linear-gradient(90deg, #FFD700 0%, #FFB300 100%);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.12);
  border: 1.5px solid #FFD700;
}
.not-template-tag {
  font-weight: 500;
  color: rgba(120,120,120,0.25);
  background: rgba(220,220,220,0.12);
  border: 1px solid rgba(200,200,200,0.12);
  transition: all 0.2s;
}
.is-public-tag {
  font-weight: bold;
  color: #fff;
  background: linear-gradient(90deg, #67C23A 0%, #85CE61 100%);
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.12);
  border: 1.5px solid #67C23A;
}
.not-public-tag {
  font-weight: 500;
  color: rgba(120,120,120,0.25);
  background: rgba(220,220,220,0.12);
  border: 1px solid rgba(200,200,200,0.12);
  transition: all 0.2s;
}

.phash-display {
  .phash-text {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #409eff;
    background: rgba(64, 158, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(64, 158, 255, 0.2);
      color: #337ecc;
    }
  }
  
  .no-phash {
    color: #909399;
    font-size: 12px;
    font-style: italic;
  }
}

// 复制信息弹窗样式
.copy-info-content {
  .copy-item {
    margin-bottom: 20px;
    
    .copy-label {
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--el-text-color-primary);
    }
    
    .copy-content {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      
      .copy-input {
        flex: 1;
        
        :deep(.el-input__inner),
        :deep(.el-textarea__inner) {
          background-color: var(--el-fill-color-light);
          border-color: var(--el-border-color-light);
          color: var(--el-text-color-primary);
          font-size: 14px;
          line-height: 1.4;
        }
      }
      
      .copy-btn {
        flex-shrink: 0;
        height: 32px;
        padding: 0 12px;
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
  }
  
  .copy-all-section {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    text-align: center;
    
    .copy-all-btn {
      padding: 12px 24px;
      font-size: 14px;
      
      .el-icon {
        margin-right: 6px;
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .copy-info-content {
    .copy-content {
      flex-direction: column;
      gap: 12px;
      
      .copy-btn {
        width: 100%;
        height: 40px;
        font-size: 16px;
      }
    }
    
    .copy-all-section {
      .copy-all-btn {
        width: 100%;
        height: 48px;
        font-size: 16px;
      }
    }
  }
}
</style> 