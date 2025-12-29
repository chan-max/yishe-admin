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
      <form-item label="排序方式">
        <el-select
          v-model="queryParams.sortingFields"
          style="width: 160px"
          @change="getList"
        >
          <el-option
            v-for="item in sortTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </form-item>
      <form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 360px"
          :shortcuts="dateShortcuts"
          @change="handleDateRangeChange"
        />
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
      <div class="flex items-center" style="margin-left: auto">
        <el-dropdown trigger="click" :disabled="!selectedIds.length" style="margin-right: 8px">
          <el-button
            plain
            :disabled="!selectedIds.length"
            :loading="batchUpdatingStatus"
          >
            批量改状态 ({{ selectedIds.length }})
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="() => handleBatchUpdateStatus('pending')">
                待制作
              </el-dropdown-item>
              <el-dropdown-item @click="() => handleBatchUpdateStatus('processing')">
                制作中
              </el-dropdown-item>
              <el-dropdown-item @click="() => handleBatchUpdateStatus('completed')">
                已完成
              </el-dropdown-item>
              <el-dropdown-item @click="() => handleBatchUpdateStatus('failed')">
                失败
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
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
        <template #idSlot="{ row }">
          <div class="flex items-center gap-2 cursor-pointer group" @click="copyId(row.id)">
            <span class="text-sm">{{ row.id }}</span>
            <el-icon class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <DocumentCopy />
            </el-icon>
          </div>
        </template>
        <template #stickersCountSlot="{ row }">
          <div class="flex items-center gap-2">
            <el-tag 
              :type="getStickersCount(row) > 1 ? 'success' : 'info'" 
              size="small" 
              effect="plain"
              class="material-association-tag"
            >
              <span class="tag-text">{{ getStickersCount(row) === 1 ? '单素材' : `多素材(${getStickersCount(row)})` }}</span>
            </el-tag>
          </div>
        </template>
        <template #statusSlot="{ row }">
          <el-tag 
            :type="statusTagType(row.status)" 
            effect="plain"
            size="small"
          >
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
        <template #imagesSlot="{ row }">
          <div class="flex items-center gap-2">
            <el-carousel 
              v-if="row.images && row.images.length > 0"
              :interval="3000"
              height="100px"
              indicator-position="none"
              :arrow="row.images.length > 1 ? 'always' : 'never'"
              class="w-40 custom-carousel"
            >
              <el-carousel-item v-for="(url, index) in row.images" :key="index">
                <el-image 
                  :src="url"
                  :preview-src-list="row.images"
                  :initial-index="index"
                  :preview-teleported="true"
                  :hide-on-click-modal="false"
                  :lazy="true"
                  loading="lazy"
                  class="w-full h-full object-contain rounded cursor-pointer"
                  fit="contain"
                />
                <div class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                  {{ Number(index) + 1 }}/{{ row.images.length }}
                </div>
              </el-carousel-item>
            </el-carousel>
            <span v-else class="text-gray-400 text-xs">无</span>
          </div>
        </template>
        <!-- 关联信息插槽：合并显示贴纸详情和PSD模板详情 -->
        <template #operationSlot="{ row }">
          <el-dropdown trigger="click" class="operation-dropdown">
            <el-button type="primary" link size="small">
              操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <div class="op-menu">
                <div class="op-menu-item" @click="() => handleViewDetail(row)">
                  <span class="op-menu-label">查看详情</span>
                </div>
                
                <div class="op-divider"></div>
                
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

    <el-dialog
      v-model="detailDialogVisible"
      title="套图详情"
      width="75%"
      align-center
      :destroy-on-close="true"
    >
      <div v-loading="detailLoading" class="detail-dialog-content" v-if="detailData">
        <div class="detail-section-item">
          <div class="detail-header">
            <span class="detail-label">贴纸信息 ({{ detailStickers.length }})</span>
          </div>
          <div v-if="detailStickers.length" class="detail-sticker-list">
            <div v-for="sticker in detailStickers" :key="sticker.id" class="detail-sticker-card">
              <el-image
                v-if="sticker.url"
                :src="sticker.url"
                :preview-src-list="detailStickers.map(s => s.url).filter(Boolean)"
                :initial-index="detailStickers.findIndex(s => s.id === sticker.id)"
                :preview-teleported="true"
                :hide-on-click-modal="false"
                fit="contain"
                class="detail-thumb-image"
              />
              <span v-else class="text-gray-400 text-xs">无图</span>
              <div class="detail-sticker-meta">
                <div class="detail-sticker-name">{{ sticker.name || '未命名贴纸' }}</div>
                <div class="detail-sticker-desc">{{ sticker.description || '-' }}</div>
                <div class="detail-sticker-keywords">{{ sticker.keywords || '-' }}</div>
              </div>
            </div>
          </div>
          <span v-else class="text-gray-400 text-sm">无贴纸</span>
        </div>

        <div class="detail-section-item">
          <div class="detail-header">
            <span class="detail-label">PSD模板信息</span>
          </div>
          <div v-if="detailData.psdTemplate" class="detail-template-card">
            <el-image
              v-if="detailData.psdTemplate.thumbnail"
              :src="getPreviewImageUrl(detailData.psdTemplate.thumbnail, { width: 260, quality: 80, format: 'webp' })"
              :preview-src-list="[detailData.psdTemplate.thumbnail]"
              :preview-teleported="true"
              :hide-on-click-modal="false"
              fit="contain"
              class="detail-thumb-image"
            />
            <div class="detail-template-meta">
              <div class="detail-sticker-name">{{ detailData.psdTemplate.name || '未命名模板' }}</div>
              <div class="detail-sticker-desc">{{ detailData.psdTemplate.description || '-' }}</div>
              <div class="detail-template-paths">
                <div>云资源：{{ detailData.psdTemplate.url || '无' }}</div>
                <div>本地路径：{{ detailData.psdTemplate.windowsLocalPath || '无' }}</div>
              </div>
              <div class="detail-sticker-keywords">关键词：{{ detailData.psdTemplate.keywords || '-' }}</div>
            </div>
          </div>
          <span v-else class="text-gray-400 text-sm">无模板</span>
        </div>

        <div class="detail-section-item">
          <div class="detail-header">
            <span class="detail-label">套图图片 ({{ detailImages.length }})</span>
          </div>
          <div class="detail-image-list">
            <div v-for="(img, idx) in detailImages" :key="idx" class="detail-thumb-wrapper">
              <el-image
                v-if="img"
                :src="img"
                :preview-src-list="detailImages"
                :initial-index="idx"
                :preview-teleported="true"
                :hide-on-click-modal="false"
                class="detail-thumb-image"
                fit="contain"
                loading="lazy"
              />
              <span v-else class="text-gray-400 text-xs">无</span>
            </div>
            <span v-if="!detailImages.length" class="text-gray-400 text-sm">无套图图片</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <div class="pagination-container">
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
    
    <!-- 状态详情对话框已移除；状态说明使用默认单元格文本显示 -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watchEffect } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { Search, ArrowDown, DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import { stickerPsdSetApi } from '@/api/stickerPsdSet'
import request from '@/config/axios'
import { isLocalConnected } from '@/stores/connectionStatus'
import { websocketClient } from '@/services/websocketClient'
import { sortTypeOptions, defaultSortingValue } from '@/common/sort'
import { getPreviewImageUrl } from '@/utils/image'

const loading = ref(false)
const dataSource = ref<any[]>([])
const total = ref(0)
const selectedIds = ref<string[]>([])
const generatingProductId = ref<string>('')
const batchGeneratingProducts = ref(false)
const batchUpdatingStatus = ref(false)
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
  status: '',
  sortingFields: defaultSortingValue(),
  startTime: '',
  endTime: ''
})

const dateRange = ref<[string, string] | null>(null)

// 日期快捷选项
const dateShortcuts = [
  {
    text: '一个小时内',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 60 * 60 * 1000)
      return [start, end]
    }
  },
  {
    text: '今天',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0)
      return [start, end]
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date()
      end.setDate(end.getDate() - 1)
      end.setHours(23, 59, 59, 999)
      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0)
      return [start, end]
    }
  },
  {
    text: '最近三天',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000)
      start.setHours(0, 0, 0, 0)
      return [start, end]
    }
  },
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
      start.setHours(0, 0, 0, 0)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
      start.setHours(0, 0, 0, 0)
      return [start, end]
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
      start.setHours(0, 0, 0, 0)
      return [start, end]
    }
  }
]

// 处理日期范围选择器变化
function handleDateRangeChange(value: [string, string] | null) {
  if (value && value.length === 2) {
    queryParams.startTime = value[0]
    queryParams.endTime = value[1]
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }
  getList()
}

const showDetails = ref(false)
const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<any>(null)
const detailStickers = computed(() => getStickers(detailData.value || {}))
const detailImages = computed(() => Array.isArray(detailData.value?.images) ? detailData.value.images : [])

function getColumns() {
  const baseColumns = [
    { type: 'checkbox', width: 50, fixed: 'left' as const },
    { 
      title: 'ID', 
      field: 'id', 
      width: 120, 
      showOverflow: false,
      slots: { default: 'idSlot' }
    },
    { title: '套图图片', field: 'images', width: 200, slots: { default: 'imagesSlot' } },
    { title: '套图名称', field: 'name', minWidth: 180 },
    { title: '多素材关联', field: 'stickers', width: 120, slots: { default: 'stickersCountSlot' } },
    { title: '描述', field: 'description', minWidth: 200, showOverflow: true },
    { title: '关键词', field: 'keywords', minWidth: 180, showOverflow: true },
    { title: '状态', field: 'status', width: 120, slots: { default: 'statusSlot' } },
    { title: '状态说明', field: 'statusMessage', width: 320, showOverflow: true },
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
  
  const operationColumn = [
    { title: '操作', width: 80, fixed: 'right' as const, slots: { default: 'operationSlot' } }
  ]
  
  return [...baseColumns, ...operationColumn]
}

const gridOptions = ref<any>({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: 'id'
  },
  checkboxConfig: {
    reserve: true
  },
  columns: getColumns()
})

const { height } = useWindowSize()

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 240
})

async function getList() {
  loading.value = true
  try {
    const res = await stickerPsdSetApi.page({
      ...queryParams,
      status: queryParams.status || undefined,
      keyword: queryParams.keyword?.trim() || undefined,
      includeDetails: showDetails.value,
      sortingFields: queryParams.sortingFields,
      startTime: queryParams.startTime || undefined,
      endTime: queryParams.endTime || undefined
    })
    dataSource.value = res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
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

// 获取贴纸数组（兼容旧数据：优先使用 stickers，没有则使用 sticker）
function getStickers(row: any) {
  if (Array.isArray(row.stickers) && row.stickers.length > 0) {
    return row.stickers
  }
  if (row.sticker) {
    return [row.sticker]
  }
  return []
}

// 获取贴纸数量
function getStickersCount(row: any) {
  const stickers = getStickers(row)
  if (stickers.length > 0) {
    return stickers.length
  }
  // 如果没有 stickers 数据，尝试从 stickerIds 获取数量
  if (Array.isArray(row.stickerIds) && row.stickerIds.length > 0) {
    return row.stickerIds.length
  }
  // 如果有 stickerId，说明至少有一个
  if (row.stickerId) {
    return 1
  }
  return 0
}

// 复制 ID
async function copyId(id: string) {
  if (!id) return
  try {
    await navigator.clipboard.writeText(id)
    ElMessage.success('ID 已复制到剪贴板')
  } catch (e) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = id
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('ID 已复制到剪贴板')
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
    const result = await request.post({
      url: '/sticker-psd-set/to-product',
      data: { id: row.id }
    })
    const message = result?.data?.message || '生成产品成功'
    ElMessage.success(message)
    getList()
  } catch (error: any) {
    console.error('生成产品失败:', error)
    ElMessage.error(error?.message || '生成产品失败')
  } finally {
    generatingProductId.value = ''
  }
}

async function handleViewDetail(row: any) {
  if (!row?.id) {
    return ElMessage.warning('缺少ID，无法查看详情')
  }
  detailDialogVisible.value = true
  detailLoading.value = true
  try {
    const res = await request.get({
      url: `/sticker-psd-set/${row.id}`
    })
    detailData.value = res?.data || res || {}
  } catch (error: any) {
    console.error('获取套图详情失败:', error)
    ElMessage.error(error?.message || '获取详情失败')
    detailDialogVisible.value = false
  } finally {
    detailLoading.value = false
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

async function handleBatchUpdateStatus(status: string) {
  if (!selectedIds.value.length) {
    return ElMessage.warning('请至少选择一条记录')
  }

  const statusLabel = statusOptions.find(s => s.value === status)?.label || status
  try {
    await ElMessageBox.confirm(
      `确定将选中的 ${selectedIds.value.length} 条记录的状态改为"${statusLabel}"吗？`,
      '批量修改状态',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
  } catch (e) {
    return
  }

  batchUpdatingStatus.value = true
  let successCount = 0
  let failCount = 0

  try {
    for (const id of selectedIds.value) {
      try {
        await stickerPsdSetApi.updateStatus(id, { status })
        successCount += 1
      } catch (error) {
        failCount += 1
        console.error(`批量更新状态失败（ID: ${id}）`, error)
      }
    }

    if (successCount) {
      ElMessage.success(`成功更新 ${successCount} 条记录的状态`)
    }
    if (failCount) {
      ElMessage.warning(`有 ${failCount} 条记录更新失败，请稍后重试`)
    }
    
    if (successCount > 0) {
      selectedIds.value = []
      getList()
    }
  } finally {
    batchUpdatingStatus.value = false
  }
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
        // 不在这里乐观更新为「制作中」，改由客户端上报 production-status 时再更新
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
    
    // 如果指定了 psdSetId，清除对应的 startingProductionId，并确保行状态不误标为 processing
    if (data.psdSetId) {
      if (startingProductionId.value === data.psdSetId) {
        startingProductionId.value = ''
      }
      const row = dataSource.value.find((r) => r.id === data.psdSetId)
      if (row && row.status === 'processing') {
        row.status = 'pending'
      }
    }
  } else {
    // 如果成功，也清除对应的 startingProductionId
    if (data.psdSetId && startingProductionId.value === data.psdSetId) {
      startingProductionId.value = ''
    }
  }
}

// 监听客户端推送的制作状态（实时更新表格行）
const productionStatusHandler = (data: { psdSetId?: string; status: string; message?: string; progress?: number; total?: number }) => {
  try {
    if (!data || !data.psdSetId) return
    const row = dataSource.value.find((r) => r.id === data.psdSetId)
    if (row) {
      // 优先使用客户端上报的状态
      row.status = data.status || row.status
      if (data.message) row.statusMessage = data.message
      // 当任务完成或失败时，重新刷新列表以保证数据一致
      if (data.status === 'completed' || data.status === 'failed') {
        getList()
      }
    }
  } catch (e) {
    console.error('处理 production-status 事件失败', e)
  }
}

onMounted(() => {
  // 添加全局监听器
  websocketClient.events.on('start-psd-set-production-response', globalResponseHandler)
  websocketClient.events.on('production-status', productionStatusHandler)
})

onUnmounted(() => {
  // 清理全局监听器
  websocketClient.events.off('start-psd-set-production-response', globalResponseHandler)
  websocketClient.events.off('production-status', productionStatusHandler)
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

.related-info-container {
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
.detail-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detail-sticker-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-sticker-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.detail-sticker-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
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
.detail-template-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.detail-template-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.detail-template-paths {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.template-file-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: flex-start;
  padding: 4px 0;
  min-width: 120px;
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

/* 轮播样式 */
.custom-carousel {
  position: relative;
  padding: 0 20px;
}

.custom-carousel :deep(.el-carousel__container) {
  margin: 0 -20px;
}

.custom-carousel :deep(.el-carousel__arrow) {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  width: 24px;
  height: 24px;
}

.custom-carousel :deep(.el-carousel__arrow):hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.custom-carousel :deep(.el-carousel__arrow) i {
  font-size: 14px;
}

.custom-carousel :deep(.el-carousel__arrow--left) {
  left: 0;
}

.custom-carousel :deep(.el-carousel__arrow--right) {
  right: 0;
}

/* 素材关联标签样式 */
.material-association-tag {
  font-weight: 500;
  min-width: 70px;
  text-align: center;
}

.material-association-tag .tag-text {
  display: inline-block;
}
</style>

