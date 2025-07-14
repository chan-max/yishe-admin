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
          <div class="flex table-operation-column">
            <el-button type="success" link size="small" @click="viewRelatedDrafts(row)">
              查看草稿截图
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
            <el-button type="warning" link size="small" @click="generateProduct(row)">生成产品</el-button>
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
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete } from '@element-plus/icons-vue'
import { getDesignModelList, updateDesignModel, deleteDesignModel } from '@/api/designModel'
import { getDraftList, deleteDraft } from '@/api/draft'
import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import type { DesignModelVO } from '@/api/designModel'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import Pagination from '@/components/Pagination/index.vue'
import { createProduct } from '@/api/product' // 假设有该API，无则需新建


const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  name: ''
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
    { title: '元数据', field: 'meta', width: 120, slots: { default: 'metaSlot' } },
    { title: '作者ID', field: 'uploaderId', width: 120 },
    { title: '作者', field: 'uploader', width: 120, slots: { default: 'uploaderSlot' } },
    { title: '创建时间', field: 'createTime', width: 150 },
    { title: '修改时间', field: 'updateTime', width: 150 },
    {
      title: '操作',
      fixed: 'right',
      width: 'auto',
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
  const params = {
    code: 'MODEL_' + (model.id || Date.now()),
    name: model.name || '未命名产品',
    description: model.description || '',
    type: '自定义模型',
    images: model.thumbnail ? [model.thumbnail] : [],
    price: 99.99,
    stock: 100,
    customModelId: model.id,
    keywords: model.keywords || '',
    isActive: true,
    isPublish: false,
    isLimitedEdition: 0
  }
  try {
    await createProduct(params)
    ElMessage.success('生成产品成功')
  } catch (e) {
    ElMessage.error('生成产品失败')
  }
}

async function getList() {
  loading.value = true
  try {
    const params = { ...queryParams }
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
      }
    })
    .catch(() => {})
}
const rules = {
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }]
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
</style> 