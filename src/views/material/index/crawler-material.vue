<template>
  <div>
    <!-- PC端显示原有搜索栏，移动端只显示筛选按钮 -->
    <div class="pb-4 flex flex-wrap justify-end gap-4 items-center search-bar">
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
      <form-item label="ID精确查询">
        <el-input
          v-model="queryParams.id"
          placeholder="请输入ID"
          style="width: 120px"
          clearable
          @change="(val) => { if (!val) getList() }"
        />
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList"> 搜索 </el-button>
      <form-item label="排序">
        <el-select v-model="queryParams.sortingFields" placeholder="请选择排序方式" style="width: 140px" @change="getList">
          <el-option label="创建时间倒序" value="createTime DESC" />
          <el-option label="创建时间正序" value="createTime ASC" />
        </el-select>
      </form-item>
      <form-item label="后缀">
        <el-select v-model="queryParams.suffix" placeholder="请选择后缀" style="width: 120px" clearable @change="getList">
          <el-option label="全部" value="" />
          <el-option label="jpg" value="jpg" />
          <el-option label="jpeg" value="jpeg" />
          <el-option label="png" value="png" />
          <el-option label="gif" value="gif" />
          <el-option label="webp" value="webp" />
          <el-option label="svg" value="svg" />
          <el-option label="bmp" value="bmp" />
          <el-option label="tiff" value="tiff" />
        </el-select>
      </form-item>
      <form-item class="date-range-picker">
        <DateRangePicker
          @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end; getList() }"
        />
      </form-item>
      <div class="flex shrink-0">
        <el-button v-if="isAdmin" type="success" :icon="Upload" @click="handleBatchImport" :loading="importLoading">批量入库({{ ids.length }})</el-button>
        <el-button type="default" @click="handleMultiDownload">下载 ({{ ids.length }})</el-button>
        <el-button v-if="isAdmin" type="danger" :icon="Delete" @click="handleDelete(null)">批量删除({{ ids.length }})</el-button>
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
              <div class="flex flex-col items-center justify-center p-2">
                <img
                  :src="row.url"
                  :alt="row.name || '素材图片'"
                  style="width:120px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer;"
                  @click="openImagePreview(row.url, row.name)"
                  @error="handleImageError"
                  @load="(event) => handleImageLoad(event, row)"
                />
                <div v-if="row.imageDimensions" class="text-xs text-gray-500 mt-1 text-center">
                  {{ row.imageDimensions.width }} × {{ row.imageDimensions.height }}
                </div>
              </div>
            </template>
            <template #sizeSlot="{ row }">
              <span>{{ row.size ? (row.size / 1024).toFixed(1) + ' KB' : '-' }}</span>
            </template>
            <template #operationDefaultSlot="{ row }">
              <div class="flex items-center">
                <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)" class="operation-dropdown">
                  <el-button type="primary" link size="small">
                    操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="isAdmin" command="edit">
                        <el-icon><Edit /></el-icon>
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item command="download">
                        <el-icon><Download /></el-icon>
                        下载
                      </el-dropdown-item>
                      <el-dropdown-item v-if="isAdmin" command="import">
                        <el-icon><Upload /></el-icon>
                        入库
                      </el-dropdown-item>
                      <el-dropdown-item v-if="isAdmin" command="delete" divided>
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
            <template #idSlot="{ row }">
              <span style="color: #999; font-size: 12px;">{{ row.id }}</span>
            </template>
            <template #phashSlot="{ row }">
              <code style="font-size: 12px; background: #f4f4f4; padding: 2px 6px; border-radius: 4px;">{{ row.phash || '-' }}</code>
            </template>
            <template #suffixSlot="{ row }">
              <el-tag :type="getSuffixTagType(row.suffix)" size="small">{{ row.suffix || '-' }}</el-tag>
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
import { ref, reactive, watchEffect, computed } from 'vue'
import { CrawlerMaterialApi } from '@/api/crawler-material'
import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Search, Upload, ArrowDown, Edit, Download } from '@element-plus/icons-vue'
import { useWindowSize } from '@vueuse/core'
import { downloadImage } from '@/common/download'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

// 判断是否为管理员
const isAdmin = computed(() => userStore.user?.isAdmin ?? false)

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  imageName: '',
  startTime: '',
  endTime: '',
  sortingFields: 'createTime DESC', // 默认倒序
  suffix: '', // 新增后缀参数
  id: '', // 新增ID精确查询参数
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
    { title: '后缀', field: 'suffix', width: 80,  },
    { title: '感知哈希', field: 'phash', width: 80,  },
    { title: 'ID', field: 'id', width: 80, },
    { title: '来源', field: 'source', minWidth: 160 }, // 新增来源列
    { title: '创建时间', field: 'createTime', width: 150, ellipsis: true, formatter: (e) => formatTimestamp(e.cellValue) },
    { title: '修改时间', field: 'updateTime', width: 150, ellipsis: true, formatter: (e) => formatTimestamp(e.cellValue) },
    { title: '操作', fixed: 'right', width: 'auto', field: 'operation', slots: { default: 'operationDefaultSlot' } }
  ]
})
const { height } = useWindowSize()
watchEffect(() => { gridOptions.value.maxHeight = height.value - 260 })
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

// 删除isMobile、filterDialogVisible、onMobileFilterSubmit相关逻辑

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
  console.log('checkboxChange - ids:', ids.value) // 添加调试信息
}

function checkboxAllChange(e) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)]
  console.log('checkboxAllChange - ids:', ids.value) // 添加调试信息
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
      console.log('删除参数:', { ids: delIds }) // 添加调试信息
      console.log('ids.value:', ids.value) // 添加调试信息
      console.log('delIds:', delIds) // 添加调试信息
      try {
        const result = await CrawlerMaterialApi.deleteCrawlerMaterial({ ids: delIds })
        console.log('删除结果:', result) // 添加调试信息
        ElNotification.success('删除成功')
        getList()
      } catch (error) {
        console.error('删除失败:', error) // 添加调试信息
        ElNotification.error('删除失败: ' + error.message)
      }
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

// 处理图片加载完成事件
function handleImageLoad(event: Event, row: any) {
  const img = event.target as HTMLImageElement
  if (img.naturalWidth && img.naturalHeight) {
    // 将图片尺寸信息存储到行数据中
    row.imageDimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight
    }
    console.log(`图片 ${row.name || row.id} 尺寸: ${img.naturalWidth} × ${img.naturalHeight}`)
    
    // 尝试获取文件大小
    // getImageFileSize(row.url).then(size => {
    //   if (size) {
    //     row.fileSize = size
    //     console.log(`图片 ${row.name || row.id} 文件大小: ${formatFileSize(size)}`)
    //   }
    // }).catch(error => {
    //   console.warn(`获取图片 ${row.name || row.id} 文件大小失败:`, error)
    // })
  } else {
    console.warn(`图片 ${row.name || row.id} 无法获取尺寸信息`)
  }
}

// 获取图片文件大小
// async function getImageFileSize(imageUrl: string): Promise<number | null> {
//   try {
//     const response = await fetch(imageUrl, { method: 'HEAD' })
//     if (response.ok) {
//       const contentLength = response.headers.get('Content-Length')
//       if (contentLength) {
//         return parseInt(contentLength, 10)
//       }
//     }
//     return null
//   } catch (error) {
//     console.warn('获取文件大小失败:', error)
//     return null
//   }
// }

// 格式化文件大小
// function formatFileSize(bytes: number): string {
//   if (bytes === 0) return '0 B'
//   const k = 1024
//   const sizes = ['B', 'KB', 'MB', 'GB']
//   const i = Math.floor(Math.log(bytes) / Math.log(k))
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
// }

function getSuffixTagType(suffix) {
  switch ((suffix || '').toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'warning';
    case 'png':
      return 'success';
    case 'gif':
      return 'danger';
    case 'svg':
      return 'info';
    case 'webp':
      return '';
    case 'bmp':
      return 'info';
    case 'tiff':
      return 'info';
    default:
      return '';
  }
}

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'edit':
      handleEdit(row);
      break;
    case 'download':
      handleDownload(row);
      break;
    case 'import':
      handleSingleImport(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
    default:
      console.warn('未知的操作命令:', command);
  }
}

getList()
</script> 
<style scoped>
/* PC端优化 */
.pb-4.flex, .search-bar {
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.pb-4.flex > *, .search-bar > * {
  margin-bottom: 0;
}
@media (max-width: 600px) {
  .pb-4.flex, .search-bar {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    padding-bottom: 8px !important;
  }
  .pb-4.flex > *, .search-bar > * {
    width: 100% !important;
    min-width: 0 !important;
    margin-right: 0 !important;
    margin-bottom: 8px !important;
  }
  .el-input,
  .el-select,
  .el-button,
  .el-date-editor {
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }
  .date-range-picker {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }
  .date-range-picker .el-date-editor,
  .date-range-picker .el-range-editor {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
  }
  .content-container {
    padding: 0 4px !important;
  }
  .common-table {
    overflow-x: auto;
  }
}

/* 操作dropdown样式 */
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
</style> 