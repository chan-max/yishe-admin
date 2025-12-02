<template>
  <div >
    <div class="py-4 flex justify-between items-center">
      <div class="flex gap-4 items-center">
        
        <!-- 发布状态筛选已移除 -->
        
        <!-- 产品代码搜索已注释 -->
        <!-- <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">产品代码：</span>
          <el-input
            v-model="queryParams.code"
            placeholder="请输入产品代码"
            style="width: 200px"
            clearable
            @keyup.enter="handleCodeSearch"
            @clear="handleCodeClear"
          />
          <el-button type="primary" @click="handleCodeSearch">查询</el-button>
        </div> -->
      </div>
      <div class="flex gap-2">
        <el-button
          type="success"
          :disabled="!selectedIds.length"
          :loading="batchGeneratingProducts"
          @click="handleBatchGenerateProduct"
        >
          批量生成产品 ({{ selectedIds.length }})
        </el-button>
        <el-button type="danger" @click="handleBatchDelete" :disabled="!selectedIds.length">批量删除 ({{ selectedIds.length }})</el-button>
      </div>
    </div>
    
    <!-- 素材详情弹窗 -->
    <el-dialog
      v-model="materialDialogVisible"
      title="素材详情"
      width="800px"
      :before-close="handleCloseMaterialDialog"
    >
      <div v-if="materialDetail" class="material-detail">
        <div v-if="materialDetail.url" class="mb-4">
          <h4>素材图片：</h4>
          <div class="material-images">
            <el-image
              :src="materialDetail.url"
              :preview-src-list="[materialDetail.url]"
              fit="contain"
              class="material-image"
            />
          </div>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="素材ID">{{ materialDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="素材名称">{{ materialDetail.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="文件后缀">{{ materialDetail.suffix || '-' }}</el-descriptions-item>
          <el-descriptions-item label="素材分组">{{ materialDetail.group || '-' }}</el-descriptions-item>
          <el-descriptions-item label="是否公开">{{ materialDetail.isPublic ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="是否材质">{{ materialDetail.isTexture ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="是否自定义">{{ materialDetail.isCustom ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="是否侵权">{{ materialDetail.isInfringement ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="是否发布">{{ materialDetail.isPublish ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="上传者">{{ materialDetail.uploader?.name || materialDetail.uploader?.account || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ materialDetail.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ materialDetail.updateTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关键词" :span="2">{{ materialDetail.keywords || '-' }}</el-descriptions-item>
          <el-descriptions-item label="素材描述" :span="2">{{ materialDetail.description || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <div v-else class="text-center py-8">
        <el-icon class="text-4xl text-gray-400"><Loading /></el-icon>
        <p class="mt-2 text-gray-500">加载中...</p>
      </div>
    </el-dialog>

    <!-- 模板详情弹窗 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="模板详情"
      width="800px"
      :before-close="handleCloseTemplateDialog"
    >
      <div v-if="templateDetail" class="template-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模板组ID">{{ templateDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="模板组名称">{{ templateDetail.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ templateDetail.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ templateDetail.updateTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关键词" :span="2">{{ templateDetail.keywords || '-' }}</el-descriptions-item>
          <el-descriptions-item label="模板描述" :span="2">{{ templateDetail.description || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="getTemplateImages(templateDetail).length" class="mt-4">
          <h4>模板图片：</h4>
          <div class="template-images">
            <div v-for="(image, index) in getTemplateImages(templateDetail)" :key="index" class="template-image-item">
              <div class="template-image-preview">
                <el-image
                  :src="image"
                  :preview-src-list="getTemplateImages(templateDetail)"
                  :initial-index="index"
                  fit="cover"
                  class="preview-thumb"
                />
                <div class="image-overlay">
                  <span class="image-label">图片{{ index + 1 }}</span>
                </div>
              </div>
              <div class="template-image-config">
                <div v-if="getTemplateImageConfig(templateDetail, index + 1)" class="config-details">
                  <div class="config-line">
                    <span class="label">位置:</span>
                    <span class="value">{{ getTemplateImageConfig(templateDetail, index + 1).position?.xPercent || 0 }}%, {{ getTemplateImageConfig(templateDetail, index + 1).position?.yPercent || 0 }}%</span>
                  </div>
                  <div class="config-line">
                    <span class="label">尺寸:</span>
                    <span class="value">{{ getTemplateImageConfig(templateDetail, index + 1).size?.widthPercent || 30 }}%</span>
                  </div>
                  <div class="config-line">
                    <span class="label">透明度:</span>
                    <span class="value">{{ getTemplateImageConfig(templateDetail, index + 1).opacity || 100 }}%</span>
                  </div>
                  <div class="config-line" v-if="getTemplateImageConfig(templateDetail, index + 1).keepOriginal">
                    <span class="label">保持原图:</span>
                    <span class="value">是</span>
                  </div>
                </div>
                <div v-else class="config-default">默认配置</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8">
        <el-icon class="text-4xl text-gray-400"><Loading /></el-icon>
        <p class="mt-2 text-gray-500">加载中...</p>
      </div>
    </el-dialog>

    <!-- 编辑信息弹窗 -->
    <el-dialog
      v-model="editProductDialogVisible"
      title="编辑信息"
      width="600px"
      align-center
      :before-close="handleCloseEditProductDialog"
    >
      <el-form
        ref="editProductFormRef"
        :model="editProductForm"
        :rules="editProductRules"
        label-width="80px"
      >
        <el-form-item label="产品名称" prop="name">
          <el-input
            v-model="editProductForm.name"
            placeholder="请输入产品名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="产品描述" prop="description">
          <el-input
            v-model="editProductForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入产品描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="关键词" prop="keywords">
          <el-input
            v-model="editProductForm.keywords"
            placeholder="请输入关键词，多个关键词用逗号分隔"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <!-- 产品代码字段已注释 -->
        <!-- <el-form-item label="产品代码" prop="code">
          <el-input
            v-model="editProductForm.code"
            placeholder="请输入产品代码"
            maxlength="50"
            show-word-limit
          />
        </el-form-item> -->
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseEditProductDialog">取消</el-button>
          <el-button type="primary" @click="handleSaveProductInfo" :loading="editProductLoading">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- AI生成二维设计信息弹窗 -->
    <el-dialog
      v-model="aiGenerateDialogVisible"
      title="AI生成二维设计信息"
      width="500px"
      align-center
      :before-close="handleCloseAiGenerateDialog"
    >
      <div class="ai-generate-content">
        <div class="ai-prompt-section">
          <h4>自定义提示词（可选）</h4>
          <p class="ai-prompt-tip">可以添加特定的风格要求、目标受众或其他条件，让AI生成更符合需求的内容</p>
          <el-input
            v-model="aiGenerateForm.customPrompt"
            type="textarea"
            :rows="4"
            placeholder="例如：请生成适合年轻女性的时尚T恤设计，风格偏向简约现代，目标价格在100-200元之间"
            maxlength="500"
            show-word-limit
          />
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseAiGenerateDialog">取消</el-button>
          <el-button type="primary" @click="handleAiGenerate" :loading="aiGenerateLoading">
            开始生成
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 视频生成弹窗已注释 -->
    <!-- <el-dialog
      v-model="videoGenerateDialogVisible"
      title="生成视频"
      width="500px"
      align-center
      :before-close="handleCloseVideoGenerateDialog"
    >
      <div class="video-generate-content">
        <el-form label-width="100px">
          <el-form-item label="每张图片时长">
            <el-input-number
              v-model="videoGenerateForm.duration"
              :min="1"
              :max="10"
              :step="0.5"
              controls-position="right"
            />
            <span class="ml-2 text-sm text-gray-500">秒</span>
          </el-form-item>
          <el-form-item label="过渡效果">
            <el-select v-model="videoGenerateForm.transition" placeholder="选择过渡效果">
              <el-option label="无过渡" value="false" />
              <el-option label="淡入淡出" value="fade" />
              <el-option label="滑动" value="slide" />
              <el-option label="缩放" value="zoom" />
            </el-select>
          </el-form-item>
          <el-form-item label="帧率">
            <el-input-number
              v-model="videoGenerateForm.fps"
              :min="1"
              :max="30"
              controls-position="right"
            />
            <span class="ml-2 text-sm text-gray-500">fps</span>
          </el-form-item>
          <el-form-item label="循环次数">
            <el-input-number
              v-model="videoGenerateForm.loop"
              :min="1"
              :max="5"
              controls-position="right"
            />
            <span class="ml-2 text-sm text-gray-500">次</span>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseVideoGenerateDialog">取消</el-button>
          <el-button type="primary" @click="handleVideoGenerate" :loading="videoGenerateLoading">
            开始生成
          </el-button>
        </div>
      </template>
    </el-dialog> -->

    <!-- 视频播放弹窗已注释 -->
    <!-- <el-dialog
      v-model="videoDialogVisible"
      title="视频播放"
      width="90%"
      :before-close="() => videoDialogVisible = false"
      align-center
      destroy-on-close
    >
      <div class="video-player-container">
        <video
          v-if="currentVideoUrl"
          :src="currentVideoUrl"
          controls
          autoplay
          class="video-player-full"
        >
          您的浏览器不支持视频播放
        </video>
      </div>
    </el-dialog> -->


    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="onCheckboxChange"
        @checkbox-all="onCheckboxAll"
      >
        <template #imagesSlot="{ row }">
          <div class="images">
            <div v-for="(image, index) in getImageList(row)" :key="index" class="img-wrap">
              <el-image
                :src="image"
                :preview-src-list="getImageList(row)"
                :initial-index="index"
                fit="cover"
                class="preview-image"
                :preview-teleported="true"
                :preview-mask="true"
                :preview-close-on-press-escape="true"
                :preview-close-on-click-modal="true"
                :preview-append-to-body="true"
                @preview-close="handlePreviewClose"
                @preview-switch="handlePreviewSwitch"
                @click="handleImageClick(getImageList(row), index)"
              />
            </div>
            <div v-if="!getImageList(row).length" class="no-images">
              暂无合成图片
            </div>
          </div>
        </template>
        <!-- 状态列已移除 -->
        <template #nameSlot="{ row }">
          <div class="product-name">
            <span v-if="row.name" class="name-text">{{ row.name }}</span>
          </div>
        </template>
        <template #descriptionSlot="{ row }">
          <div class="product-description">
            <span v-if="row.description" class="description-text">{{ row.description }}</span>
          </div>
        </template>
        <template #keywordsSlot="{ row }">
          <div class="product-keywords">
            <span v-if="row.keywords" class="keywords-text">{{ row.keywords }}</span>
          </div>
        </template>
        <template #materialIdSlot="{ row }">
          <div class="flex items-center justify-center">
            <el-button 
              link 
              type="primary" 
              size="small" 
              @click="handleViewMaterial(row.materialId)"
              :disabled="!row.materialId"
            >
              查看素材
            </el-button>
          </div>
        </template>
        <template #templateGroup2DIdSlot="{ row }">
          <div class="flex items-center justify-center">
            <el-button 
              link 
              type="primary" 
              size="small" 
              @click="handleViewTemplate(row.templateGroup2DId)"
              :disabled="!row.templateGroup2DId"
            >
              查看模板
            </el-button>
          </div>
        </template>
        <!-- 视频列已注释 -->
        <!-- <template #videoSlot="{ row }">
          <div class="video-container">
            <div v-if="row.videoUrl && row.videoStatus === VIDEO_STATUS.COMPLETED" class="video-preview">
              <div class="video-wrapper" @click="handleVideoClick(row.videoUrl)">
                <video 
                  :src="row.videoUrl" 
                  preload="metadata"
                  class="video-player"
                  muted
                >
                  您的浏览器不支持视频播放
                </video>
                <div class="video-play-overlay">
                  <el-icon class="play-icon"><VideoPlay /></el-icon>
                </div>
              </div>
            </div>
            <div v-else-if="row.videoStatus === VIDEO_STATUS.GENERATING" class="video-generating">
              <el-icon class="text-blue-500"><Loading /></el-icon>
              <span class="text-sm text-blue-500">生成中...</span>
            </div>
            <div v-else-if="row.videoStatus === VIDEO_STATUS.FAILED" class="video-failed">
              <el-icon class="text-red-500"><Warning /></el-icon>
              <span class="text-sm text-red-500">生成失败</span>
            </div>
            <div v-else class="video-none">
              <span class="text-sm text-gray-400">未生成</span>
            </div>
          </div>
        </template> -->
        <template #operationDefaultSlot="{ row }">
          <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)" size="small">
            <el-button link type="primary" size="small">
              操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu size="small">
                <el-dropdown-item command="edit-product" class="text-primary">编辑信息</el-dropdown-item>
                <el-dropdown-item 
                  command="ai-generate-info" 
                  class="text-blue-500"
                  :disabled="aiGeneratingId === row.id"
                >
                  {{ aiGeneratingId === row.id ? 'AI生成中...' : 'AI生成二维设计信息' }}
                </el-dropdown-item>
                <!-- 生成产品代码操作已注释 -->
                <!-- <el-dropdown-item 
                  command="generate-code" 
                  class="text-purple-500"
                  :disabled="generatingCodeId === row.id"
                >
                  {{ generatingCodeId === row.id ? '生成中...' : (row.code ? '重新生成代码' : '生成产品代码') }}
                </el-dropdown-item> -->
                <!-- 视频生成操作已注释 -->
                <!-- <el-dropdown-item 
                  command="generate-video" 
                  class="text-green-500"
                  :disabled="generatingVideoId === row.id || row.videoStatus === VIDEO_STATUS.GENERATING"
                >
                  {{ generatingVideoId === row.id ? '视频生成中...' : (row.videoUrl ? '重新生成视频' : '生成视频') }}
                </el-dropdown-item> -->
                <el-dropdown-item 
                  command="regenerate-images" 
                  class="text-orange-500"
                  :disabled="regeneratingImagesId === row.id"
                >
                  {{ regeneratingImagesId === row.id ? '图片生成中...' : '重新生成合成图片' }}
                </el-dropdown-item>
                <el-dropdown-item 
                  divided
                  command="to-product" 
                  class="text-green-600"
                  :disabled="generatingProductId === row.id"
                >
                  {{ generatingProductId === row.id ? '生成中...' : '生成产品' }}
                </el-dropdown-item>
                <!-- 前台展示相关操作已注释 -->
                <!-- <el-dropdown-item command="copy-link" class="text-purple-500">复制线上链接</el-dropdown-item> -->
                <el-dropdown-item command="delete" class="text-red-500">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </vxe-grid>
    </div>
    <div class="py-4 flex justify-end">
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { commonGridOptions } from '@/common/table'
import request from '@/config/axios'
import { ArrowDown, Loading, Warning, VideoPlay } from '@element-plus/icons-vue'
import { pageTemplateGroup2D } from '@/api/templateGroup2D'
import { useWindowSize } from '@vueuse/core'
import { copyProductCode, copyLink } from '@/utils/clipboard'

// 视频状态常量
const VIDEO_STATUS = {
  NONE: 'none',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const

// 视频状态显示文本（暂时未使用，保留以备后用）
// const VIDEO_STATUS_TEXT = {
//   [VIDEO_STATUS.NONE]: '未生成',
//   [VIDEO_STATUS.GENERATING]: '生成中',
//   [VIDEO_STATUS.COMPLETED]: '已完成',
//   [VIDEO_STATUS.FAILED]: '生成失败'
// } as const

const queryParams = reactive({ currentPage: 1, pageSize: 20, code: '' }) // code 字段保留但不使用

// 获取窗口尺寸
const { height } = useWindowSize()

const gridOptions = ref<any>({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: '合成图片', field: 'images', width: 'auto', slots: { default: 'imagesSlot' } },
    // { title: '视频', field: 'videoUrl', width: 120, slots: { default: 'videoSlot' } },
    // { title: '产品代码', field: 'code', width: 120, slots: { default: 'codeSlot' } }, // 已注释
    { title: '产品名称', field: 'name', width: 150, slots: { default: 'nameSlot' } },
    { title: '产品描述', field: 'description', width: 200, slots: { default: 'descriptionSlot' } },
    { title: '关键词', field: 'keywords', width: 150, slots: { default: 'keywordsSlot' } },
    { title: '素材详情', field: 'materialId', width: 120, slots: { default: 'materialIdSlot' } },
    { title: '模板详情', field: 'templateGroup2DId', width: 120, slots: { default: 'templateGroup2DIdSlot' } },
    { title: '创建时间', field: 'createTime', width: 180 },
    { title: '更新时间', field: 'updateTime', width: 180 },
    { title: '操作', field: 'operation', width: 120, fixed: 'right', slots: { default: 'operationDefaultSlot' } },
  ],
  checkboxConfig: { reserve: true },
})

// 监听窗口尺寸变化，动态调整表格高度
watchEffect(() => {
  // 计算表格最大高度：窗口高度 - 头部区域 - 分页区域 - 其他边距
  gridOptions.value.maxHeight = height.value - 250
}) 

const dataSource = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const selectedIds = ref<string[]>([])

// 弹窗相关状态
const materialDialogVisible = ref(false)
const templateDialogVisible = ref(false)
const materialDetail = ref<any>(null)
const templateDetail = ref<any>(null)

// 编辑信息相关状态
const editProductDialogVisible = ref(false)
const editProductFormRef = ref()
const editProductLoading = ref(false)
const editProductForm = reactive({
  id: '',
  // code: '', // 已注释
  name: '',
  description: '',
  keywords: ''
})

// 编辑信息表单验证规则
const editProductRules = {
  // code: [ // 已注释
  //   { required: true, message: '请输入产品代码', trigger: 'blur' },
  //   { min: 3, max: 50, message: '产品代码长度在 3 到 50 个字符', trigger: 'blur' }
  // ],
  name: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 1, max: 100, message: '产品名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '产品描述长度不能超过 500 个字符', trigger: 'blur' }
  ],
  keywords: [
    { max: 200, message: '关键词长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 图片预览相关状态
const currentPreviewImages = ref<string[]>([])
const currentPreviewIndex = ref(0)

// 生成代码相关状态
// const generatingCodeId = ref<string>('') // 已注释

// 重新生成图片相关状态
const regeneratingImagesId = ref<string>('')

// AI生成相关状态
const aiGeneratingId = ref<string>('')
const aiGenerateDialogVisible = ref(false)
const aiGenerateLoading = ref(false)
const aiGenerateForm = reactive({
  productId: '',
  customPrompt: ''
})

// 视频生成相关状态
const generatingVideoId = ref<string>('')
const videoGenerateDialogVisible = ref(false)
const videoGenerateLoading = ref(false)
const videoGenerateForm = reactive({
  productId: '',
  duration: 2,
  transition: 'fade',
  fps: 1,
  loop: 1
})

// 视频播放相关状态
const videoDialogVisible = ref(false)
const currentVideoUrl = ref('')

// 生成产品相关状态
const generatingProductId = ref<string>('')
const batchGeneratingProducts = ref(false)

// 生成唯一码
// async function handleGenerateCode(row: any) { // 已注释
//   if (!row?.id) return
  
//   try {
//     generatingCodeId.value = row.id
    
//     await request.post({
//       url: '/product-image-2d/generate-code',
//       data: { id: row.id }
//     })
    
//     const message = row.code ? '产品代码重新生成成功' : '产品代码生成成功'
//     ElMessage.success(message)
//     getList()
//   } catch (e) {
//     console.error('生成产品代码失败:', e)
//     ElMessage.error('生成产品代码失败')
//   } finally {
//     generatingCodeId.value = ''
//   }
// }

async function getList() {
  loading.value = true
  try {
    console.log('获取二维设计商品图列表...')
    const res = await request.post({ 
      url: '/product-image-2d/page', 
      data: { 
        page: queryParams.currentPage, 
        pageSize: queryParams.pageSize,
        code: queryParams.code // 已注释
      } 
    })
    console.log('获取到的数据:', res)
    dataSource.value = res.list || []
    total.value = res.total || 0
    console.log('数据源长度:', dataSource.value.length)
  } catch (e) {
    console.error('获取列表失败:', e)
    dataSource.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getList()
})

// 获取图片列表
function getImageList(row: any): string[] {
  const images: string[] = []
  for (let i = 1; i <= 10; i++) {
    const imageUrl = row[`image${i}`]
    if (imageUrl && imageUrl.trim()) {
      images.push(imageUrl)
    }
  }
  return images
}

// 获取图片配置（解析为对象）- 暂时未使用
// function getImageConfig(row: any, imageIndex: number): any {
//   const key = `imageOption${imageIndex}`
//   const config = row[key]
//   if (!config) return null
//   
//   try {
//     // 如果是字符串，尝试解析JSON
//     if (typeof config === 'string') {
//       return JSON.parse(config)
//     }
//     // 如果已经是对象，直接返回
//     if (typeof config === 'object') {
//       return config
//     }
//   } catch (e) {
//     console.warn(`解析图片${imageIndex}配置失败:`, e)
//   }
//   
//   return null
// }

// 获取模板图片列表
function getTemplateImages(template: any): string[] {
  const images: string[] = []
  for (let i = 1; i <= 10; i++) {
    const imageUrl = template[`image${i}`]
    if (imageUrl && imageUrl.trim()) {
      images.push(imageUrl)
    }
  }
  return images
}

// 获取模板图片配置（解析为对象）
function getTemplateImageConfig(template: any, index: number): any {
  const option = template[`imageOption${index}`]
  if (!option) return null
  
  try {
    // 如果是字符串，尝试解析JSON
    if (typeof option === 'string') {
      return JSON.parse(option)
    }
    // 如果已经是对象，直接返回
    if (typeof option === 'object') {
      return option
    }
  } catch (e) {
    console.warn(`解析图片${index}配置失败:`, e)
  }
  
  return null
}

// 获取模板图片配置（原始字符串格式，用于兼容）- 暂时未使用
// function getTemplateImageOption(template: any, index: number): string {
//   const option = template[`imageOption${index}`]
//   if (option && option.trim()) {
//     try {
//       // 尝试解析JSON配置
//       const parsed = JSON.parse(option)
//       return JSON.stringify(parsed, null, 2)
//     } catch {
//       // 如果不是JSON，直接返回字符串
//       return option
//     }
//   }
//   return ''
// }

function onCheckboxChange(e: any) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  selectedIds.value = [...records, ...reserves].map((r: any) => String(r.id))
}

function onCheckboxAll(e: any) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  selectedIds.value = [...records, ...reserves].map((r: any) => String(r.id))
}

function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'edit-product':
      handleEditProduct(row)
      break
    case 'ai-generate-info':
      handleAiGenerateInfo(row)
      break
    // case 'generate-code': // 已注释
    //   handleGenerateCode(row)
    //   break
    // case 'generate-video':
    //   handleVideoGenerateInfo(row)
    //   break
    case 'regenerate-images':
      handleRegenerateImages(row)
      break
    case 'to-product':
      handleToProduct(row)
      break
    case 'delete':
      handleDelete(row)
      break
    default:
      console.warn('未知的操作命令:', command)
  }
}

// 产品代码查询处理
// function handleCodeSearch() { // 已注释
//   queryParams.currentPage = 1
//   getList()
// }

// 清除产品代码查询
// function handleCodeClear() { // 已注释
//   queryParams.code = ''
//   queryParams.currentPage = 1
//   getList()
// }

async function handleDelete(row: any) {
  if (!row?.id) return
  try {
    await ElMessageBox.confirm(
      '确定要删除该记录吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await request.delete({ url: `/product-image-2d/${row.id}` })
    ElMessage.success('删除成功')
    getList()
  } catch (e) {}
}

async function handleBatchDelete() {
  if (!selectedIds.value.length) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条记录吗？`,
      '批量删除确认',
      { 
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await request.post({ url: '/product-image-2d/delete-batch', data: { ids: [...selectedIds.value] } })
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    getList()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 查看关联素材
async function handleViewMaterial(materialId: string) {
  if (!materialId) {
    ElMessage.warning('素材ID为空')
    return
  }
  
  materialDialogVisible.value = true
  materialDetail.value = null
  
  try {
    // 根据后端接口定义，使用 sticker/page 接口获取素材详情
    // 使用 POST 方式：POST /sticker/page
    const res = await request.post({ 
      url: `/sticker/page`, 
      data: { 
        id: materialId, 
        currentPage: 1, 
        pageSize: 1 
      } 
    })
    materialDetail.value = res.list?.[0] || res
  } catch (e) {
    console.error('获取素材详情失败:', e)
    ElMessage.error('获取素材详情失败')
    materialDetail.value = {
      id: materialId,
      name: '获取失败',
      type: '-',
      category: '-',
      createTime: '-',
      updateTime: '-',
      description: '获取素材详情失败，请稍后重试'
    }
  }
}

// 查看关联模板
async function handleViewTemplate(templateGroup2DId: string) {
  if (!templateGroup2DId) {
    ElMessage.warning('模板组ID为空')
    return
  }
  
  templateDialogVisible.value = true
  templateDetail.value = null
  
  try {
    // 使用现有的API函数获取模板详情
    // 由于分页接口不支持ID过滤，我们需要获取所有模板然后过滤
    const res = await pageTemplateGroup2D({ page: 1, pageSize: 1000 })
    const template = res.list?.find((item: any) => item.id === templateGroup2DId)
    templateDetail.value = template || null
  } catch (e) {
    console.error('获取模板详情失败:', e)
    ElMessage.error('获取模板详情失败')
    templateDetail.value = {
      id: templateGroup2DId,
      name: '获取失败',
      type: '-',
      category: '-',
      createTime: '-',
      updateTime: '-',
      description: '获取模板详情失败，请稍后重试'
    }
  }
}

// 关闭素材详情弹窗
function handleCloseMaterialDialog() {
  materialDialogVisible.value = false
  materialDetail.value = null
}

// 关闭模板详情弹窗
function handleCloseTemplateDialog() {
  templateDialogVisible.value = false
  templateDetail.value = null
}

// 编辑信息
function handleEditProduct(row: any) {
  editProductForm.id = row.id
  // editProductForm.code = row.code || '' // 已注释
  editProductForm.name = row.name || ''
  editProductForm.description = row.description || ''
  editProductForm.keywords = row.keywords || ''
  editProductDialogVisible.value = true
}

// 关闭编辑信息弹窗
function handleCloseEditProductDialog() {
  editProductDialogVisible.value = false
  editProductForm.id = ''
  // editProductForm.code = '' // 已注释
  editProductForm.name = ''
  editProductForm.description = ''
  editProductForm.keywords = ''
  // 清除表单验证
  if (editProductFormRef.value) {
    editProductFormRef.value.clearValidate()
  }
}

// 保存产品信息
async function handleSaveProductInfo() {
  if (!editProductFormRef.value) return
  
  try {
    // 验证表单
    await editProductFormRef.value.validate()
    
    editProductLoading.value = true
    
    await request.put({
      url: `/product-image-2d/${editProductForm.id}/info`,
      data: {
        // code: editProductForm.code, // 已注释
        name: editProductForm.name,
        description: editProductForm.description,
        keywords: editProductForm.keywords
      }
    })
    
    ElMessage.success('产品信息更新成功')
    handleCloseEditProductDialog()
    getList()
  } catch (e) {
    console.error('更新产品信息失败:', e)
    ElMessage.error('更新产品信息失败')
  } finally {
    editProductLoading.value = false
  }
}

// 预览关闭事件
function handlePreviewClose() {
  currentPreviewImages.value = []
  currentPreviewIndex.value = 0
}

// 预览切换事件
function handlePreviewSwitch(index: number) {
  currentPreviewIndex.value = index
}

// 下载当前预览的图片
async function handleDownloadCurrentImage() {
  if (currentPreviewImages.value.length === 0) return
  
  const currentImage = currentPreviewImages.value[currentPreviewIndex.value]
  const filename = `合成图片${currentPreviewIndex.value + 1}`
  
  try {
    ElMessage.info('正在下载图片...')
    
    // 使用fetch获取图片数据
    const response = await fetch(currentImage)
    if (!response.ok) {
      throw new Error('图片下载失败')
    }
    
    // 获取图片的blob数据
    const blob = await response.blob()
    
    // 创建blob URL
    const blobUrl = window.URL.createObjectURL(blob)
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `${filename}.jpg`
    
    // 添加到DOM中，触发点击，然后移除
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理blob URL
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
    }, 1000)
    
    ElMessage.success('下载完成')
  } catch (error) {
    console.error('下载图片失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  }
}

// 复制产品代码
// function handleCopyCode(code: string) { // 已注释
//   copyProductCode(code)
// }

// 复制线上链接
function handleCopyLink(row: any) {
  if (!row) return
  
  // 优先使用产品代码，如果没有则使用ID
  // const identifier = row.code || row.id // 已注释，直接使用ID
  const identifier = row.id
  if (!identifier) {
    ElMessage.warning('无法生成链接：缺少ID')
    return
  }
  
  const link = `https://1s.design/view-2d-product/${identifier}`
  copyLink(link)
}

// 图片点击事件
function handleImageClick(images: string[], index: number) {
  currentPreviewImages.value = images
  currentPreviewIndex.value = index
  
  // 延迟添加下载按钮，确保预览弹窗已经渲染
  setTimeout(() => {
    addDownloadButtonToPreview()
  }, 100)
}

// 在预览弹窗中添加下载按钮
function addDownloadButtonToPreview() {
  const previewContainer = document.querySelector('.el-image-viewer__wrapper')
  if (!previewContainer) return
  
  // 检查是否已经添加了下载按钮
  if (previewContainer.querySelector('.preview-download-btn')) return
  
  const downloadBtn = document.createElement('div')
  downloadBtn.className = 'preview-download-btn'
  downloadBtn.innerHTML = `
    <button 
      style="
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 2000;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 4px;
      "
      onmouseover="this.style.background='rgba(0, 0, 0, 0.9)'"
      onmouseout="this.style.background='rgba(0, 0, 0, 0.7)'"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      下载
    </button>
  `
  
  downloadBtn.addEventListener('click', handleDownloadCurrentImage)
  previewContainer.appendChild(downloadBtn)
}

// AI生成二维设计信息
function handleAiGenerateInfo(row: any) {
  if (!row?.id) return
  
  aiGenerateForm.productId = row.id
  aiGenerateForm.customPrompt = ''
  aiGenerateDialogVisible.value = true
}

// 执行AI生成
async function handleAiGenerate() {
  if (!aiGenerateForm.productId) return
  
  try {
    aiGenerateLoading.value = true
    aiGeneratingId.value = aiGenerateForm.productId
    
    await request.post({
      url: '/product-image-2d/ai-generate-info',
      data: {
        id: aiGenerateForm.productId,
        prompt: aiGenerateForm.customPrompt || undefined
      }
    })
    
    // AI生成成功后，结果已经自动保存到数据库，直接刷新列表
    ElMessage.success('AI生成完成，产品信息已更新')
    handleCloseAiGenerateDialog()
    getList()
  } catch (e) {
    console.error('AI生成失败:', e)
    ElMessage.error('AI生成失败，请稍后重试')
  } finally {
    aiGenerateLoading.value = false
    aiGeneratingId.value = ''
  }
}

// 关闭AI生成弹窗
function handleCloseAiGenerateDialog() {
  aiGenerateDialogVisible.value = false
  aiGenerateForm.productId = ''
  aiGenerateForm.customPrompt = ''
}

// 视频生成产品信息
function handleVideoGenerateInfo(row: any) {
  if (!row?.id) return
  
  videoGenerateForm.productId = row.id
  videoGenerateForm.duration = 2
  videoGenerateForm.transition = 'fade'
  videoGenerateForm.fps = 1
  videoGenerateForm.loop = 1
  videoGenerateDialogVisible.value = true
}

// 执行视频生成
async function handleVideoGenerate() {
  if (!videoGenerateForm.productId) return
  
  try {
    videoGenerateLoading.value = true
    generatingVideoId.value = videoGenerateForm.productId
    
    // 使用重新生成视频接口，会自动处理旧视频的删除
    await request.post({
      url: '/product-image-2d/regenerate-video',
      data: {
        id: videoGenerateForm.productId,
        duration: videoGenerateForm.duration,
        transition: videoGenerateForm.transition,
        fps: videoGenerateForm.fps,
        loop: videoGenerateForm.loop
      }
    })
    
    ElMessage.success('视频生成成功')
    handleCloseVideoGenerateDialog()
    getList()
  } catch (e) {
    console.error('视频生成失败:', e)
    ElMessage.error('视频生成失败，请稍后重试')
  } finally {
    videoGenerateLoading.value = false
    generatingVideoId.value = ''
  }
}

// 关闭视频生成弹窗
function handleCloseVideoGenerateDialog() {
  videoGenerateDialogVisible.value = false
  videoGenerateForm.productId = ''
  videoGenerateForm.duration = 2
  videoGenerateForm.transition = 'fade'
  videoGenerateForm.fps = 1
  videoGenerateForm.loop = 1
}


// 视频点击事件
function handleVideoClick(videoUrl: string) {
  currentVideoUrl.value = videoUrl
  videoDialogVisible.value = true
}

// 重新生成合成图片
async function handleRegenerateImages(row: any) {
  if (!row?.id) return
  
  try {
    await ElMessageBox.confirm('确认重新生成合成图片吗？', '重新生成确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    regeneratingImagesId.value = row.id
    
    await request.post({
      url: '/product-image-2d/regenerate-images',
      data: { id: row.id }
    })
    
    ElMessage.success('合成图片重新生成成功')
    getList()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('重新生成合成图片失败:', e)
      ElMessage.error('重新生成合成图片失败')
    }
  } finally {
    regeneratingImagesId.value = ''
  }
}

// 从二维产品图生成产品
async function handleToProduct(row: any) {
  if (!row?.id) return
  
  try {
    await ElMessageBox.confirm('确认根据该二维产品图生成一个产品吗？', '生成确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    generatingProductId.value = row.id
    await request.post({ url: '/product-image-2d/to-product', data: { id: row.id } })
    ElMessage.success('生成产品成功')
  } catch (e) {
    if (e !== 'cancel') {
      console.error('生成产品失败:', e)
      ElMessage.error('生成产品失败')
    }
  } finally {
    generatingProductId.value = ''
  }
}

async function handleBatchGenerateProduct() {
  if (!selectedIds.value.length) {
    ElMessage.warning('请选择需要生成产品的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认根据选中的 ${selectedIds.value.length} 条记录生成产品吗？`,
      '批量生成确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch (error) {
    return
  }

  batchGeneratingProducts.value = true
  let successCount = 0
  let failCount = 0

  try {
    for (const id of selectedIds.value) {
      try {
        await request.post({ url: '/product-image-2d/to-product', data: { id } })
        successCount += 1
      } catch (error) {
        failCount += 1
        console.error(`生成产品失败（ID: ${id}）`, error)
      }
    }

    if (successCount) {
      ElMessage.success(`成功生成 ${successCount} 个产品`)
    }
    if (failCount) {
      ElMessage.warning(`有 ${failCount} 个产品生成失败，请稍后重试`)
    }
  } finally {
    batchGeneratingProducts.value = false
    getList()
  }
}


</script>

<style scoped>
.images {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  align-items: center;
}

.images .img-wrap {
  position: relative;
  flex-shrink: 0;
}

.images .preview-image {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.no-images {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  width: 100%;
  border: 1px dashed var(--el-border-color-light);
  border-radius: 4px;
}

/* 弹窗样式 */
.material-detail,
.template-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.material-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.material-image {
  max-width: 300px;
  max-height: 300px;
  width: auto;
  height: auto;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.template-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 8px;
}

.template-image-item {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background-color: var(--el-bg-color-page);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.template-image-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.template-image-preview {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  border-bottom: 1px solid var(--el-border-color-light);
}

.preview-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.template-image-config {
  padding: 12px;
  flex: 1;
}

/* 模板配置显示样式 */
.config-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  line-height: 1.4;
}

.config-line .label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  min-width: 50px;
}

.config-line .value {
  color: var(--el-color-primary);
  font-weight: 600;
  text-align: right;
  flex: 1;
  margin-left: 8px;
}

.config-default {
  color: var(--el-text-color-placeholder);
  font-style: italic;
  font-size: 12px;
  text-align: center;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}



.code-text,
.name-text,
.description-text,
.keywords-text {
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.code-text {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: var(--el-color-primary);
}

.product-description {
  max-width: 200px;
}

.product-description .description-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* AI生成弹窗样式 */
.ai-generate-content {
  padding: 0;
}

.ai-prompt-section {
  margin-bottom: 0;
}

.ai-prompt-section h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.ai-prompt-tip {
  margin: 0 0 12px 0;
  color: #909399;
  font-size: 14px;
  line-height: 1.5;
}

/* 视频相关样式 */
.video-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  padding: 4px;
}

.video-preview {
  width: 100%;
  max-width: 80px;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 64px;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.video-player:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.video-play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: all 0.2s ease;
  pointer-events: none;
}

.video-wrapper:hover .video-play-overlay {
  background: rgba(0, 0, 0, 0.8);
  transform: translate(-50%, -50%) scale(1.1);
}

.play-icon {
  color: white;
  font-size: 16px;
}

.video-generating,
.video-failed,
.video-none {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  min-height: 64px;
  border: 1px dashed var(--el-border-color-light);
  border-radius: 4px;
  background-color: var(--el-fill-color-lighter);
}

.video-generate-content {
  padding: 0;
}

.video-generate-content .el-form-item {
  margin-bottom: 16px;
}

/* 视频播放弹窗样式 */
.video-player-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player-full {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
}

/* 产品代码样式 */
.product-code {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.code-text {
  color: var(--el-color-primary);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
  display: inline-block;
}

.code-text:hover {
  background-color: var(--el-color-primary-light-9);
  transform: scale(1.05);
}

.code-text:active {
  transform: scale(0.98);
}

.code-empty {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

/* 小尺寸下拉菜单样式 */
.el-dropdown-menu--small .el-dropdown-menu__item {
  padding: 6px 12px;
  font-size: 12px;
  line-height: 1.4;
}

.el-dropdown-menu--small .el-dropdown-menu__item:hover {
  background-color: var(--el-color-primary-light-9);
}

.el-dropdown-menu--small {
  min-width: 120px;
  max-width: 200px;
}
</style>


