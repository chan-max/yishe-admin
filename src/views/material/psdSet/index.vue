<template>
  <div class="psd-set-page">
    <div class="flex pb-4 flex-wrap justify-end gap-4 items-center search-bar">
      <div style="flex:1;"></div>
      <form-item label="关键词">
        <el-input
          v-model="queryParams.keyword"
          placeholder="名称/描述/关键词"
          style="width: 200px"
          clearable
          @change="handleKeywordChange"
        />
      </form-item>
      <form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="全部状态" style="width: 160px" clearable @change="getList">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </form-item>
      <form-item label="显示详情">
        <el-switch
          v-model="showDetails"
          active-text="显示"
          inactive-text="隐藏"
          @change="handleShowDetailsChange"
        />
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
      <div class="flex items-center" style="margin-left: auto">
        <el-button
          type="success"
          plain
          :disabled="!selectedIds.length"
          :loading="batchGeneratingProducts"
          @click="handleBatchGenerateProduct"
        >
          生成产品 ({{ selectedIds.length }})
        </el-button>
        <el-button
          type="danger"
          plain
          @click="handleBatchDelete"
          :disabled="!selectedIds.length"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="onSelectionChange"
        @checkbox-all="onSelectionChange"
      >
        <template #statusSlot="{ row }">
          <el-tag 
            :type="statusTagType(row.status)" 
            effect="plain"
            size="small"
          >
            {{ statusLabel(row.status) }}
          </el-tag>
          <div v-if="row.statusMessage" class="status-message">{{ row.statusMessage }}</div>
        </template>
        <template #imagesSlot="{ row }">
          <div class="flex gap-1 flex-wrap">
            <div
              v-for="(img, idx) in (row.images || []).slice(0, 3)"
              :key="idx"
              class="detail-thumb-wrapper"
            >
              <el-image
                v-if="img"
                :src="img"
                :preview-src-list="row.images"
                :initial-index="idx"
                :preview-teleported="true"
                :hide-on-click-modal="false"
                class="detail-thumb-image"
                fit="contain"
              />
              <span v-else class="text-gray-400 text-xs">无</span>
            </div>
            <span v-if="(row.images || []).length > 3" class="text-xs text-gray-500">+{{ (row.images.length - 3) }}</span>
            <span v-if="!row.images || !row.images.length" class="text-gray-400 text-xs">无</span>
          </div>
        </template>
        <template #stickerDetailSlot="{ row }">
          <div v-if="showDetails && row.sticker" class="detail-section-item">
            <vxe-grid
              :data="[row.sticker]"
              :show-header="true"
              border
              size="mini"
              class="detail-sub-grid"
              :columns="[
                { field: 'url', title: '图片', width: 120, slots: { default: 'stickerImageSlot' } },
                { field: 'name', title: '名称', minWidth: 100, showOverflow: true },
                { field: 'description', title: '描述', minWidth: 120, showOverflow: true },
                { field: 'keywords', title: '关键词', minWidth: 100, showOverflow: true },
                { field: 'updateTime', title: '更新时间', width: 140, slots: { default: 'stickerUpdateTimeSlot' } }
              ]"
            >
              <template #stickerImageSlot="{ row: stickerRow }">
                <div class="flex items-center justify-center p-1">
                  <el-image
                    v-if="stickerRow.url"
                    :src="stickerRow.url"
                    :preview-src-list="[stickerRow.url]"
                    :initial-index="0"
                    :preview-teleported="true"
                    :hide-on-click-modal="false"
                    class="detail-thumb-image"
                    fit="contain"
                  />
                  <span v-else class="text-gray-400 text-xs">无</span>
                </div>
              </template>
              <template #stickerUpdateTimeSlot="{ row: stickerRow }">
                <span class="text-xs">{{ stickerRow.updateTime ? formatTimestamp(stickerRow.updateTime) : '无' }}</span>
              </template>
            </vxe-grid>
          </div>
          <span v-else-if="showDetails" class="text-gray-400 text-sm">无贴纸</span>
        </template>
        <template #templateDetailSlot="{ row }">
          <div v-if="showDetails && row.psdTemplate" class="detail-section-item">
            <vxe-grid
              :data="[row.psdTemplate]"
              :show-header="true"
              border
              size="mini"
              class="detail-sub-grid"
              :columns="[
                { field: 'thumbnail', title: '缩略图', width: 120, slots: { default: 'templateThumbnailSlot' } },
                { field: 'name', title: '名称', minWidth: 100, showOverflow: true },
                { field: 'description', title: '描述', minWidth: 120, showOverflow: true },
                { field: 'keywords', title: '关键词', minWidth: 100, showOverflow: true },
                { field: 'url', title: '文件', width: 120, slots: { default: 'templateFileSlot' } },
                { field: 'updateTime', title: '更新时间', width: 140, slots: { default: 'templateUpdateTimeSlot' } }
              ]"
            >
              <template #templateThumbnailSlot="{ row: templateRow }">
                <div class="flex items-center justify-center p-1">
                  <el-image
                    v-if="templateRow.thumbnail"
                    :src="templateRow.thumbnail"
                    :preview-src-list="[templateRow.thumbnail]"
                    :initial-index="0"
                    :preview-teleported="true"
                    :hide-on-click-modal="false"
                    class="detail-thumb-image"
                    fit="contain"
                  />
                  <span v-else class="text-gray-400 text-xs">无</span>
                </div>
              </template>
              <template #templateFileSlot="{ row: templateRow }">
                <div class="flex items-center justify-center p-1">
                  <el-link
                    v-if="templateRow.url"
                    :href="templateRow.url"
                    target="_blank"
                    type="primary"
                    class="text-xs"
                  >
                    查看文件
                  </el-link>
                  <span v-else class="text-gray-400 text-xs">无</span>
                </div>
              </template>
              <template #templateUpdateTimeSlot="{ row: templateRow }">
                <span class="text-xs">{{ templateRow.updateTime ? formatTimestamp(templateRow.updateTime) : '无' }}</span>
              </template>
            </vxe-grid>
          </div>
          <span v-else-if="showDetails" class="text-gray-400 text-sm">无模板</span>
        </template>
        <template #psdImagesSlot="{ row }">
          <div v-if="showDetails" class="detail-section-item">
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(img, idx) in (row.images || [])"
                :key="idx"
                class="detail-thumb-wrapper"
              >
                <el-image
                  v-if="img"
                  :src="img"
                  :preview-src-list="row.images"
                  :initial-index="idx"
                  :preview-teleported="true"
                  :hide-on-click-modal="false"
                  class="detail-thumb-image"
                  fit="contain"
                />
                <span v-else class="text-gray-400 text-xs">无</span>
              </div>
            </div>
            <span v-if="!row.images || !row.images.length" class="text-gray-400 text-sm">无套图图片</span>
          </div>
        </template>
        <template #operationSlot="{ row }">
          <el-dropdown trigger="click" class="operation-dropdown">
            <el-button type="primary" link size="small">
              操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <div class="op-menu">
                <el-tooltip content="需要客户端连接" placement="right" :disabled="isClientConnected || startingProductionId === row.id">
                  <div class="op-menu-item" @click="() => handleStartProduction(row)" :class="{ 'is-disabled': !isClientConnected || startingProductionId === row.id }">
                    <span class="op-menu-label">开始制作</span>
                  </div>
                </el-tooltip>
                
                <div class="op-divider"></div>
                
                <div class="op-menu-section">
                  <div class="op-menu-section-title">状态标记</div>
                  <div class="op-menu-item" @click="() => updateRowStatus(row, 'pending')">
                    <span class="op-menu-label">待制作</span>
                  </div>
                  <div class="op-menu-item" @click="() => updateRowStatus(row, 'processing')">
                    <span class="op-menu-label">制作中</span>
                  </div>
                  <div class="op-menu-item" @click="() => updateRowStatus(row, 'completed')">
                    <span class="op-menu-label">已完成</span>
                  </div>
                  <div class="op-menu-item" @click="() => updateRowStatus(row, 'failed')">
                    <span class="op-menu-label">失败</span>
                  </div>
                </div>
                
                <div class="op-divider"></div>
                
                <div class="op-menu-item" @click="() => handleToProduct(row)" :class="{ 'is-disabled': generatingProductId === row.id }">
                  <span class="op-menu-label">生成产品</span>
                </div>
                
                <div class="op-divider"></div>
                
                <div class="op-menu-item danger" @click="() => handleDelete(row)">
                  <span class="op-menu-label">删除</span>
                </div>
              </div>
            </template>
          </el-dropdown>
        </template>
      </vxe-grid>
    </div>

    <div class="pagination-container">
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Search, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import { stickerPsdSetApi } from '@/api/stickerPsdSet'
import request from '@/config/axios'
import { isLocalConnected } from '@/stores/connectionStatus'
import { websocketClient } from '@/services/websocketClient'

const loading = ref(false)
const dataSource = ref<any[]>([])
const total = ref(0)
const selectedIds = ref<string[]>([])
const generatingProductId = ref<string>('')
const batchGeneratingProducts = ref(false)
const startingProductionId = ref<string>('')

// 客户端连接状态（参考 header 中的状态检测方式）
const isClientConnected = computed(() => isLocalConnected.value)

const statusOptions = [
  { label: '待制作', value: 'pending' },
  { label: '制作中', value: 'processing' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' }
]

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  keyword: '',
  status: ''
})

const showDetails = ref(false)

function getColumns() {
  const baseColumns = [
    { type: 'checkbox', width: 50, fixed: 'left' as const },
    { title: '套图名称', field: 'name', minWidth: 180 },
    { title: '描述', field: 'description', minWidth: 200 },
    { title: '关键词', field: 'keywords', minWidth: 180 },
    { title: '套图图片', field: 'images', width: 200, slots: { default: 'imagesSlot' } },
    { title: '状态', field: 'status', width: 120, slots: { default: 'statusSlot' } },
    {
      title: '创建时间',
      field: 'createTime',
      width: 160,
      formatter: ({ cellValue }) => formatTimestamp(cellValue)
    },
    {
      title: '更新时间',
      field: 'updateTime',
      width: 160,
      formatter: ({ cellValue }) => formatTimestamp(cellValue)
    }
  ]
  
  const detailColumns = showDetails.value ? [
    { 
      title: '贴纸详情', 
      field: 'stickerDetail', 
      width: 'auto', 
      slots: { default: 'stickerDetailSlot' } 
    },

    { 
      title: 'PSD模板详情', 
      field: 'templateDetail', 
      width: 'auto', 
      slots: { default: 'templateDetailSlot' } 
    }
  ] : []
  
  const operationColumn = [
    { title: '操作', width: 80, fixed: 'right' as const, slots: { default: 'operationSlot' } }
  ]
  
  return [...baseColumns, ...detailColumns, ...operationColumn]
}

const gridOptions = ref<any>({
  ...commonGridOptions,
  rowConfig: {
    keyField: 'id'
  },
  checkboxConfig: {
    reserve: true
  },
  columns: getColumns()
})

async function getList() {
  loading.value = true
  try {
    const res = await stickerPsdSetApi.page({
      ...queryParams,
      status: queryParams.status || undefined,
      keyword: queryParams.keyword?.trim() || undefined,
      includeDetails: showDetails.value
    })
    dataSource.value = res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleShowDetailsChange() {
  // 更新列配置
  updateColumns()
  // 重新获取数据
  getList()
}

function updateColumns() {
  gridOptions.value.columns = getColumns()
}

function handleKeywordChange(val: string) {
  if (!val) {
    getList()
  }
}


function statusLabel(status: string) {
  const item = statusOptions.find((s) => s.value === status)
  return item ? item.label : status || '-'
}

function statusTagType(status: string) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'warning'
    case 'failed':
      return 'danger'
    case 'pending':
      return 'info'
    default:
      return 'info'
  }
}

function onSelectionChange({ records, reserves }) {
  const current = Array.isArray(records) ? records : []
  const reserveList = Array.isArray(reserves) ? reserves : []
  selectedIds.value = [...current, ...reserveList].map((item) => item.id)
}

async function updateRowStatus(row, status: string) {
  try {
    await stickerPsdSetApi.updateStatus(row.id, { status })
    row.status = status
    ElMessage.success('状态已更新')
    getList()
  } catch (error: any) {
    ElMessage.error(error?.message || '状态更新失败')
  }
}

async function handleToProduct(row: any) {
  if (!row?.id) {
    return ElMessage.warning('缺少ID，无法生成产品')
  }
  try {
    await ElMessageBox.confirm(
      `确认根据该套图生成一个产品吗？`,
      '生成确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch (e) {
    return
  }

  try {
    generatingProductId.value = row.id
    await request.post({
      url: '/sticker-psd-set/to-product',
      data: { id: row.id }
    })
    ElMessage.success('生成产品成功')
    getList()
  } catch (error: any) {
    console.error('生成产品失败:', error)
    ElMessage.error(error?.message || '生成产品失败')
  } finally {
    generatingProductId.value = ''
  }
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该套图记录吗？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await stickerPsdSetApi.remove(row.id)
      ElMessage.success('删除成功')
      getList()
    })
    .catch(() => {})
}

function handleBatchDelete() {
  if (!selectedIds.value.length) {
    return ElMessage.warning('请至少选择一条记录')
  }
  ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条记录吗？`, '批量删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await stickerPsdSetApi.removeBatch(selectedIds.value)
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      getList()
    })
    .catch(() => {})
}

async function handleBatchGenerateProduct() {
  if (!selectedIds.value.length) {
    return ElMessage.warning('请选择需要生成产品的记录')
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
        await request.post({ url: '/sticker-psd-set/to-product', data: { id } })
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
    getList()
  } finally {
    batchGeneratingProducts.value = false
  }
}

async function handleStartProduction(row: any) {
  if (!row?.id) {
    return ElMessage.warning('缺少ID，无法开始制作')
  }

  if (!isClientConnected.value) {
    return ElMessage.warning('客户端未连接，请先启动客户端')
  }

  if (websocketClient.state.status !== 'connected') {
    return ElMessage.warning('WebSocket未连接，请稍后重试')
  }

  try {
    await ElMessageBox.confirm(
      `确认开始制作该套图吗？制作请求将发送到您的客户端。`,
      '开始制作确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
  } catch (e) {
    return
  }

  try {
    startingProductionId.value = row.id
    
    // 通过WebSocket发送制作请求
    websocketClient.sendMessage('start-psd-set-production', { psdSetId: row.id })
    
    // 监听响应
    const responseHandler = (data: { success: boolean; message?: string }) => {
      console.log('[psd-set] 收到制作响应:', data)
      websocketClient.events.off('start-psd-set-production-response', responseHandler)
      startingProductionId.value = ''
      
      if (data.success) {
        ElMessage.success(data.message || '制作请求已发送到客户端')
        // 可选：更新状态为制作中
        if (row.status === 'pending') {
          updateRowStatus(row, 'processing')
        }
      } else {
        // 如果失败，显示警告消息（比如正在制作中）
        const message = data.message || '开始制作失败'
        console.log('[psd-set] 显示警告消息:', message)
        ElMessage.warning(message)
      }
    }
    
    // 先监听事件，再发送请求
    websocketClient.events.on('start-psd-set-production-response', responseHandler)
    
    // 设置超时，如果5秒内没有响应，显示错误
    setTimeout(() => {
      if (startingProductionId.value === row.id) {
        websocketClient.events.off('start-psd-set-production-response', responseHandler)
        startingProductionId.value = ''
        ElMessage.warning('请求超时，请检查网络连接')
      }
    }, 5000)
    
  } catch (error: any) {
    console.error('开始制作失败:', error)
    ElMessage.error(error?.message || '开始制作失败，请检查客户端连接状态')
    startingProductionId.value = ''
  }
}

// 全局监听制作响应消息（用于处理客户端主动发送的响应，比如正在制作中）
const globalResponseHandler = (data: { success: boolean; message?: string; psdSetId?: string }) => {
  console.log('[psd-set] 全局收到制作响应:', data)
  
  // 如果 success 为 false，说明可能是正在制作中或其他错误
  if (!data.success) {
    const message = data.message || '开始制作失败'
    console.log('[psd-set] 全局显示警告消息:', message)
    ElMessage.warning(message)
    
    // 如果指定了 psdSetId，清除对应的 startingProductionId
    if (data.psdSetId && startingProductionId.value === data.psdSetId) {
      startingProductionId.value = ''
    }
  } else {
    // 如果成功，也清除对应的 startingProductionId
    if (data.psdSetId && startingProductionId.value === data.psdSetId) {
      startingProductionId.value = ''
    }
  }
}

onMounted(() => {
  // 添加全局监听器
  websocketClient.events.on('start-psd-set-production-response', globalResponseHandler)
})

onUnmounted(() => {
  // 清理全局监听器
  websocketClient.events.off('start-psd-set-production-response', globalResponseHandler)
})

getList()
</script>

<style scoped>
.search-bar :deep(.el-form-item) {
  margin-bottom: 0;
}
.status-message {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}
.pagination-container :deep(.el-pagination) {
  font-size: 14px;
}
/* 详情列样式 */
.details-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.detail-section-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 6px;
  padding: 4px 8px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
  border-radius: 4px;
  border-left: 3px solid var(--el-color-primary);
}

.detail-label {
  color: var(--el-color-primary);
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.detail-sub-grid {
  width: 100%;
  margin: 0;
  padding: 0;
  background: none;
}

.detail-sub-grid :deep(.vxe-table) {
  font-size: 12px;
}

.detail-sub-grid :deep(.vxe-table--header) {
  background-color: var(--el-table-header-bg-color);
}

.detail-sub-grid :deep(.vxe-table--body) {
  background-color: transparent;
}

.detail-sub-grid :deep(.vxe-cell) {
  padding: 4px 8px;
}

.detail-sub-grid :deep(.vxe-table--header-wrapper) {
  .vxe-cell {
    font-weight: 500;
    font-size: 12px;
  }
}

.detail-thumb-image {
  width: 100px;
  height: 100px;
  object-fit: contain;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s ease;
  background-color: var(--el-bg-color-page);
}

.detail-thumb-image:hover {
  border-color: var(--el-color-primary);
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 操作下拉菜单样式 */
.operation-dropdown {
  position: relative;
}

.op-menu {
  min-width: 120px;
  padding: 2px 0;
  background: var(--el-bg-color);
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.op-menu-item {
  position: relative;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.op-menu-item:hover:not(.is-disabled) {
  background: var(--el-fill-color-light);
}

.op-menu-item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.op-menu-item.danger {
  color: var(--el-color-danger);
}

.op-menu-item.danger:hover:not(.is-disabled) {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.op-menu-label {
  flex: 1;
}

.op-menu-tip {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-left: 6px;
}

.op-menu-section {
  padding: 2px 0;
}

.op-menu-section-title {
  padding: 4px 12px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.op-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 2px 0;
}

/* 修复 Element Plus Dropdown 的样式 */
.operation-dropdown :deep(.el-popper) {
  padding: 0;
}

.operation-dropdown :deep(.el-dropdown-menu) {
  padding: 0;
  border: none;
  background: transparent;
}

.operation-dropdown :deep(.el-dropdown-menu__item) {
  padding: 0;
  height: auto;
}
</style>

