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
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange"
      >
        <template #operationDefaultSlot="{ row }">
          <div class="operation-buttons">
            <!-- 生成产品按钮 - 独立显示，便于看到loading状态 -->
            <el-button 
              type="primary" 
              size="small" 
              :loading="generateProductLoading[row.id]"
              @click="generateProduct(row)"
              style="margin-right: 8px;"
            >
              {{ generateProductLoading[row.id] ? '生成中...' : '生成产品' }}
            </el-button>
            
            <!-- 其他操作下拉菜单 -->
            <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)" class="operation-dropdown">
              <el-button type="primary" link size="small">
                操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
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
                  <el-dropdown-item command="toggle-template" :disabled="templateLoading[row.id]">
                    <el-icon><Star /></el-icon>
                    {{ templateLoading[row.id] ? '处理中...' : (row.isTemplate ? '取消母版' : '设为母版') }}
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
        <template #metaSlot="{ row }">
          <el-button type="primary" link size="small" @click="showMetaDetail(row.meta)">查看详情</el-button>
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
      </vxe-grid>
    </div>
    <!-- 分页 -->
    <div class="py-4 flex justify-end">
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
              <el-image 
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
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, More, ArrowDown, Edit, Picture, Goods, MagicStick, View, Star } from '@element-plus/icons-vue'
import { getDesignModelList, updateDesignModel, deleteDesignModel, aiAutoGenerateDesignModelInfo, toProduct } from '@/api/designModel'
import { getDraftList, deleteDraft } from '@/api/draft'
import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import type { DesignModelVO } from '@/api/designModel'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import Pagination from '@/components/Pagination/index.vue'
import { getDesignToolMessenger } from '@/utils/designToolMessenger'

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
    { title: '元数据', field: 'meta', width: 120, slots: { default: 'metaSlot' } },
    { title: '是否母版', field: 'isTemplate', width: 100, slots: { default: 'isTemplateSlot' } },
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
const generateProductLoading = ref({})
const aiGenerateLoading = ref({})
const deleteLoading = ref({})

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

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
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
    case 'toggle-template':
      toggleTemplate(row);
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
.is-template-tag, .not-template-tag {
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
</style> 