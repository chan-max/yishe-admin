<template>
  <div>
    <div class="pb-4 flex flex-wrap justify-end gap-4 items-center">
      <div style="flex: 1"></div>
      <form-item label="按名称搜索">
        <el-input
          v-model="queryParams.imageName"
          placeholder="请输入图片名称"
          style="width: 160px"
          clearable
          @change="(val) => { if (!val) getList() }"
        />
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList"> 搜索 </el-button>
      <form-item label="按时间查询">
        <DateRangePicker
          @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end; getList() }"
        />
      </form-item>
      <div class="flex shrink-0">
        <el-button type="success" :icon="Upload" @click="handleBatchImport" :loading="importLoading">批量入库({{ ids.length }})</el-button>
        <el-button type="default" @click="handleMultiDownload(null)">下载 ({{ ids.length }})</el-button>
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)">批量删除({{ ids.length }})</el-button>
      </div>
    </div>
    <div class="flex gap-4">
      <div class="content-container" :style="{ width: '100%' }">
        <div class="common-table">
          <vxe-grid
            ref="gridRef"
            v-bind="gridOptions"
            :data="dataSource"
            :loading="loading"
            @checkbox-change="checkboxChange"
            @checkbox-all="checkboxAllChange"
          >
            <template #previewDefaultSlot="{ row }">
              <div class="flex items-center justify-center p-2">
                <img
                  :src="row.url"
                  :alt="row.name || '素材图片'"
                  style="width:120px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer;"
                  @click="openImagePreview(row.url, row.name)"
                  @error="handleImageError"
                />
              </div>
            </template>
            <template #sizeSlot="{ row }">
              <span>{{ row.size ? (row.size / 1024).toFixed(1) + ' KB' : '-' }}</span>
            </template>
            <template #operationDefaultSlot="{ row }">
              <div class="flex items-center">
                <el-dropdown trigger="click">
                  <el-button circle size="small" style="border: 1px solid #d9d9d9; background: #f4f6fa; color: #333; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                      <el-dropdown-item @click="handleDownload(row)">下载</el-dropdown-item>
                      <el-dropdown-item @click="handleSingleImport(row)">入库</el-dropdown-item>
                      <el-dropdown-item divided @click="handleDelete(row)">
                        <span style="color:var(--el-color-danger)">删除</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </vxe-grid>
        </div>
        <div class="flex justify-end">
          <pagination
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            :total="total"
            @pagination="getList"
          />
        </div>
      </div>
    </div>
    <el-dialog v-model="editDialogVisible" title="编辑素材信息" width="800px" :destroy-on-close="true" align-center>
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" placeholder="请输入名称" style="font-size:16px;height:48px;width:100%;" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="5" placeholder="请输入描述" style="font-size:16px;min-height:100px;width:100%;" />
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="editForm.keywords" placeholder="请输入关键字（逗号分隔）" style="font-size:16px;height:48px;width:100%;" />
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="editForm.source"  placeholder="请输入来源" style="font-size:16px;height:48px;width:100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 图片预览弹窗，点击蒙层可关闭（由 ImagePreview 组件实现） -->
    <ImagePreview
      :visible="imagePreviewVisible"
      :image-url="currentImageUrl"
      @close="closeImagePreview"
    />
  </div>
</template>
<script setup lang="tsx">
import { ref, reactive, watchEffect } from 'vue'
import { CrawlerMaterialApi } from '@/api/crawler-material'
import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Search, More, Upload } from '@element-plus/icons-vue'
import { useWindowSize } from '@vueuse/core'
import { downloadImage } from '@/common/download'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  imageName: '',
  startTime: '',
  endTime: '',
})
const gridRef = ref()
const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: { keyField: 'id' },
  checkboxConfig: { reserve: true },
  columns: [
    { type: 'checkbox', width: 50, ellipsis: true, reserve: true },
    { title: '图片预览', field: 'url', width: 120, slots: { default: 'previewDefaultSlot' } },
    { title: '图片名称', field: 'name', minWidth: 180, className: 'font-bold' },
    { title: '描述', field: 'description', minWidth: 200 },
    { title: '关键词', field: 'keywords', minWidth: 160 },
    { title: '后缀', field: 'suffix', width: 80 },
    { title: '来源', field: 'source', minWidth: 160 }, // 新增来源列
    { title: '创建时间', field: 'createTime', width: 150, ellipsis: true, formatter: (e) => formatTimestamp(e.cellValue) },
    { title: '修改时间', field: 'updateTime', width: 150, ellipsis: true, formatter: (e) => formatTimestamp(e.cellValue) },
    { title: '操作', fixed: 'right', width: 'auto', field: 'operation', slots: { default: 'operationDefaultSlot' } }
  ]
})
const { height } = useWindowSize()
watchEffect(() => { gridOptions.value.maxHeight = height.value - 210 })
const dataSource = ref([])
const loading = ref(false)
const importLoading = ref(false)
const ids = ref<string[]>([])
const total = ref(0)
const editDialogVisible = ref(false)
const editForm = ref({ id: '', name: '', description: '', keywords: '', source: '' })
const editLoading = ref(false)

// 图片预览相关状态
const imagePreviewVisible = ref(false)
const currentImageUrl = ref('')

function getList() {
  loading.value = true
  CrawlerMaterialApi.getCrawlerMaterialPage({ ...queryParams }).then(res => {
    dataSource.value = res.list
    total.value = res.total
  }).finally(() => { loading.value = false })
}

function checkboxChange(e) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)]
}

function checkboxAllChange(e) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)]
}

function handleDownload(row) {
  try {
    const downloadUrl = row.url
    const fileName = row.name || `image_${row.id}.jpg`
    if (!downloadUrl) {
      ElMessage.error(`图片 ${fileName} 下载失败：缺少下载链接`)
      return
    }
    downloadImage(downloadUrl, fileName)
    ElNotification.success(`图片 ${fileName} 下载成功`)
  } catch (error) {
    ElMessage.error('图片下载失败')
  }
}

function handleMultiDownload() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要下载的数据')
  }
  // 处理批量下载逻辑
  ids.value.forEach((id, index) => {
    const row = dataSource.value.find(item => item.id === id)
    if (row) {
      setTimeout(() => {
        handleDownload(row)
      }, 500 * index)
    }
  })
}

function handleDelete(row?) {
  let delIds: any = null
  if (row) {
    delIds = [row.id]
  } else {
    delIds = Array.isArray(ids.value) ? [...ids.value] : []
    if (!delIds.length) {
      return ElMessage.warning('请选择要删除的数据')
    }
  }
  ElMessageBox.confirm('确认删除该数据吗', '删除提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'error'
  })
    .then(async () => {
      delIds = delIds.map((id) => String(id))
      await CrawlerMaterialApi.deleteCrawlerMaterial({ ids: delIds })
      ElNotification.success('删除成功')
      getList()
    })
    .catch(() => { })
}

function handleEdit(row) {
  editForm.value = { id: row.id, name: row.name, description: row.description, keywords: row.keywords, source: row.source }
  editDialogVisible.value = true
}

async function submitEdit() {
  editLoading.value = true
  try {
    await CrawlerMaterialApi.updateCrawlerMaterial(editForm.value)
    ElNotification.success('保存成功')
    editDialogVisible.value = false
    getList()
  } catch (e) {
    ElNotification.error('保存失败')
  } finally {
    editLoading.value = false
  }
}

// 批量入库到贴纸
async function handleBatchImport() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要入库的数据')
  }
  
  ElMessageBox.confirm(`确认将选中的 ${ids.value.length} 个素材入库到贴纸吗？\n注意：入库成功后，这些素材将从爬虫素材列表中删除。`, '入库确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  })
    .then(async () => {
      importLoading.value = true
      try {
        const result = await CrawlerMaterialApi.batchImportToSticker({
          ids: ids.value,
          uploaderId: String(userStore.user.id)
        })
        
        if (result.success.length > 0) {
          ElNotification.success(`成功入库 ${result.success.length} 个素材`)
        }
        if (result.failed.length > 0) {
          ElNotification.warning(`入库失败 ${result.failed.length} 个素材`)
        }
        // 清空选择
        ids.value = []
        // 刷新列表（入库成功后立即刷新）
        getList()
      } catch (error) {
        ElNotification.error('入库失败：' + error.message)
      } finally {
        importLoading.value = false
      }
    })
    .catch(() => { })
}

// 单个入库到贴纸
async function handleSingleImport(row) {
  ElMessageBox.confirm(`确认将素材"${row.name}"入库到贴纸吗？\n注意：入库成功后，该素材将从爬虫素材列表中删除。`, '入库确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  })
    .then(async () => {
      try {
        const result = await CrawlerMaterialApi.batchImportToSticker({
          ids: [row.id],
          uploaderId: String(userStore.user.id)
        })
        
        if (result.success.length > 0) {
          ElNotification.success('入库成功')
          getList() // 单个入库成功后立即刷新
        } else if (result.failed.length > 0) {
          ElNotification.error('入库失败：' + result.failed[0].error)
        }
      } catch (error) {
        ElNotification.error('入库失败：' + error.message)
      }
    })
    .catch(() => { })
}

// 图片预览相关方法
function openImagePreview(imageUrl: string, imageName?: string) {
  currentImageUrl.value = imageUrl
  imagePreviewVisible.value = true
}

function closeImagePreview() {
  imagePreviewVisible.value = false
  currentImageUrl.value = ''
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/src/assets/images/image-error.png' // 错误图片占位符，可以根据实际情况调整
  console.warn('图片加载失败:', img.alt)
}

getList()
</script> 