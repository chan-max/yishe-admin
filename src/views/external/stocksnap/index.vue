<template>
  <ContentWrap :plain="true">
    <div class="collect-page">
      <!-- 工具栏 -->
      <div class="collect-toolbar">
        <div class="collect-toolbar__left">
          <div class="collect-toolbar__title">StockSnap CC0 图库控制台</div>
          <el-select
            v-model="selectedClientId"
            placeholder="选择客户端节点"
            size="default"
            style="width: 220px;"
            @change="handleSelectClient"
          >
            <el-option
              v-for="item in clients"
              :key="item.clientId"
              :label="item.machine?.code || item.clientId"
              :value="item.clientId"
            >
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <span>{{ item.machine?.code || item.clientId }}</span>
                <el-tag :type="item.isOnline ? 'success' : 'info'" size="small">
                  {{ item.isOnline ? '在线' : '离线' }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </div>
        <div class="collect-toolbar__actions">
          <el-button @click="refreshClientNodes">刷新节点</el-button>
          <el-button
            type="primary"
            :disabled="!selectedClientId || !selectedClient?.isOnline"
            :loading="actionLoading.refreshRuntime"
            @click="handleRefreshRuntime"
          >
            刷新状态
          </el-button>
        </div>
      </div>

      <!-- 客户端节点区域 -->
      <div class="collect-layout" v-loading="loading">
        <!-- 主区域 -->
        <section class="collect-main">
          <div v-if="selectedClient" class="collect-panel">
            <!-- 状态卡片 -->
            <div class="status-hero">
              <div class="hero-main" :class="`is-${availabilityTone}`">
                <div class="hero-eyebrow">StockSnap</div>
                <div class="hero-value">{{ availabilityText }}</div>
                <div class="hero-subtitle">
                  {{ selectedClient.machine?.code || selectedClient.clientId }}
                </div>
              </div>
              <div class="status-pills">
                <div class="status-pill" :class="`is-${clientTone}`">
                  <span class="status-pill__dot" />
                  <span>{{ clientStatusText }}</span>
                </div>
                <div class="status-pill" :class="`is-${siteTone}`">
                  <span class="status-pill__dot" />
                  <span>{{ siteStatusBadge }}</span>
                </div>
                <div class="status-pill is-neutral">
                  <span>{{ platformText }}</span>
                </div>
                <div class="status-pill is-neutral">
                  <span>{{ checkedAtText }}</span>
                </div>
              </div>
            </div>

            <!-- 图片采集 -->
            <div class="collect-section">
              <div class="collect-search__header">
                <div class="collect-section__title">图片采集 (CC0 免版权)</div>
                <div class="collect-search__opts">
                  <div class="collect-search__field">
                    <span class="collect-search__label">排序</span>
                    <el-select v-model="sort" size="small" style="width: 110px">
                      <el-option value="date" label="最新发布" />
                      <el-option value="popular" label="热门浏览" />
                    </el-select>
                  </div>
                  <div class="collect-search__field">
                    <span class="collect-search__label">每页数量</span>
                    <el-select v-model="pageSize" size="small" style="width: 100px" @change="handleSizeChange">
                      <el-option :value="10" label="10 条" />
                      <el-option :value="20" label="20 条" />
                      <el-option :value="30" label="30 条" />
                      <el-option :value="50" label="50 条" />
                    </el-select>
                  </div>
                </div>
              </div>

              <div class="collect-inline">
                <el-input
                  v-model="keyword"
                  placeholder="请输入搜索关键词 (如 cat, vintage, nature)..."
                  clearable
                  size="default"
                  style="width: 320px;"
                  @keyup.enter="handleSearch"
                >
                  <template #prefix>
                    <Icon icon="ep:search" />
                  </template>
                </el-input>

                <el-button
                  type="primary"
                  :disabled="!selectedClient?.isOnline"
                  :loading="actionLoading.search"
                  @click="handleSearch"
                >
                  搜索素材
                </el-button>

                <el-button
                  type="warning"
                  :disabled="!selectedClient?.isOnline || !keyword"
                  :loading="actionLoading.collect"
                  @click="handleBatchCollect"
                >
                  一键转存素材库 (后台)
                </el-button>
              </div>

              <!-- 批量多选工具栏 -->
              <div class="batch-bar" v-if="searchResult && searchResult.items && searchResult.items.length">
                <div class="batch-bar__left">
                  <el-checkbox
                    v-model="isAllSelected"
                    :indeterminate="isIndeterminate"
                    @change="handleSelectAllChange"
                  >
                    全选当前页 ({{ selectedItems.length }}/{{ searchResult.items.length }})
                  </el-checkbox>
                  <span v-if="selectedItems.length" class="batch-bar__tip">
                    已选择 <strong class="highlight-count">{{ selectedItems.length }}</strong> 项素材
                  </span>
                </div>
                <div class="batch-bar__right">
                  <el-button
                    type="primary"
                    size="small"
                    :disabled="!selectedItems.length"
                    :loading="batchSyncLoading"
                    @click="handleBatchDownload"
                  >
                    批量同步入库 ({{ selectedItems.length }})
                  </el-button>
                  <el-button
                    size="small"
                    :disabled="!selectedItems.length"
                    @click="handleCopySelectedLinks"
                  >
                    复制已选链接
                  </el-button>
                </div>
              </div>

              <!-- 结果网格 -->
              <div v-if="searchResult" class="collect-result">
                <div class="collect-result__meta">
                  <span>搜索 "{{ searchResult.query }}" 找到 {{ searchResult.count }} 个高清素材</span>
                  <span v-if="searchResult.total"> (共 {{ searchResult.total }} 个)</span>
                </div>

                <div v-if="searchResult.items && searchResult.items.length" class="photo-grid">
                  <div
                    v-for="photo in searchResult.items"
                    :key="photo.id"
                    class="photo-card"
                    :class="{ 'is-selected': isItemSelected(photo.id) }"
                    @click="toggleItemSelect(photo)"
                  >
                    <div class="photo-card__checkbox" @click.stop>
                      <el-checkbox
                        :model-value="isItemSelected(photo.id)"
                        @change="() => toggleItemSelect(photo)"
                      />
                    </div>
                    <div class="photo-card__preview">
                      <el-image
                        :src="photo.thumbnail || photo.image"
                        fit="cover"
                        loading="lazy"
                        class="photo-card__img"
                      />
                      <div class="photo-card__overlay">
                        <el-button
                          type="primary"
                          circle
                          size="small"
                          title="查看大图"
                          @click.stop="openPreview(photo)"
                        >
                          <Icon icon="ep:view" />
                        </el-button>
                        <el-button
                          type="success"
                          circle
                          size="small"
                          title="同步素材库"
                          :loading="syncingPhotoIds.has(photo.id)"
                          @click.stop="handleSyncItem(photo)"
                        >
                          <Icon icon="ep:download" />
                        </el-button>
                      </div>
                    </div>
                    <div class="photo-card__info">
                      <div class="photo-card__title" :title="photo.title">{{ photo.title }}</div>
                      <div class="photo-card__sub">
                        <span>{{ photo.author || 'StockSnap' }}</span>
                        <span v-if="photo.width && photo.height">{{ photo.width }}x{{ photo.height }}</span>
                        <el-tag size="small" type="success">CC0 Free</el-tag>
                      </div>
                    </div>
                  </div>
                </div>

                <el-empty v-else description="未搜到匹配结果" />

                <!-- 分页 -->
                <div v-if="searchResult.items && searchResult.items.length" class="pagination-container">
                  <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 30, 50]"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="searchResult.total || 100"
                    @size-change="handleSizeChange"
                    @current-change="handlePageChange"
                  />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="collect-empty">
            <el-empty description="请选择在线客户端节点" />
          </div>
        </section>
      </div>

      <!-- 图片预览 Modal -->
      <el-dialog
        v-model="previewVisible"
        title="素材预览"
        width="720px"
        destroy-on-close
      >
        <div v-if="previewPhoto" class="preview-dialog">
          <div class="preview-dialog__img-box">
            <el-image
              :src="previewPhoto.image || previewPhoto.thumbnail"
              fit="contain"
              class="preview-dialog__img"
            />
          </div>
          <div class="preview-dialog__info">
            <h3>{{ previewPhoto.title }}</h3>
            <p v-if="previewPhoto.description">{{ previewPhoto.description }}</p>
            <div class="preview-dialog__meta">
              <div><strong>作者:</strong> {{ previewPhoto.author || 'StockSnap' }}</div>
              <div><strong>尺寸:</strong> {{ previewPhoto.width || '-' }} x {{ previewPhoto.height || '-' }}</div>
              <div><strong>授权:</strong> CC0 免版权</div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="previewVisible = false">关闭</el-button>
          <el-button
            type="primary"
            :loading="syncingPhotoIds.has(previewPhoto?.id || '')"
            @click="previewPhoto && handleSyncItem(previewPhoto)"
          >
            同步至素材库
          </el-button>
        </template>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { usePluginClientNodes } from '@/services/clientNodeState'
import {
  searchStockSnapAndWait,
  collectStockSnap,
  type StockSnapPhoto,
  type StockSnapSearchResult,
} from '@/api/external/stocksnap'
import { sendServiceCommand } from '@/api/system/websocket'

// 客户端节点 Hook
const {
  clients,
  selectedClientId,
  selectedClient,
  loading,
  refresh: refreshClientNodes,
  getServiceRuntime,
} = usePluginClientNodes('stocksnap')

const actionLoading = ref({
  refreshRuntime: false,
  search: false,
  collect: false,
})

const keyword = ref('cat')
const sort = ref('date')
const currentPage = ref(1)
const pageSize = ref(20)

const searchResult = ref<StockSnapSearchResult | null>(null)
const selectedItems = ref<StockSnapPhoto[]>([])
const syncingPhotoIds = ref<Set<string>>(new Set())
const batchSyncLoading = ref(false)

const previewVisible = ref(false)
const previewPhoto = ref<StockSnapPhoto | null>(null)

// 节点与站点连通度 UI 状态
const serviceRuntime = computed(() => {
  if (!selectedClientId.value) return null
  return getServiceRuntime(selectedClientId.value)
})

const clientTone = computed(() => (selectedClient.value?.isOnline ? 'success' : 'info'))
const clientStatusText = computed(() => (selectedClient.value?.isOnline ? '客户端节点在线' : '客户端离线'))

const siteTone = computed(() => {
  if (!selectedClient.value?.isOnline) return 'info'
  if (serviceRuntime.value?.connected) return 'success'
  return 'warning'
})

const siteStatusBadge = computed(() => {
  if (!selectedClient.value?.isOnline) return '网络断开'
  if (serviceRuntime.value?.connected) return 'StockSnap 正常连通'
  return 'StockSnap 未检测'
})

const availabilityTone = computed(() => {
  if (selectedClient.value?.isOnline && serviceRuntime.value?.connected) return 'success'
  if (selectedClient.value?.isOnline) return 'warning'
  return 'offline'
})

const availabilityText = computed(() => {
  if (selectedClient.value?.isOnline && serviceRuntime.value?.connected) return 'StockSnap 采集就绪'
  if (selectedClient.value?.isOnline) return '客户端就绪 / 网页等待检测'
  return '客户端离线'
})

const platformText = computed(() => `平台: ${serviceRuntime.value?.details?.runtime || 'Electron Node'}`)
const checkedAtText = computed(() => {
  if (!serviceRuntime.value?.lastCheckedAt) return '未刷新检测'
  return `检查时间: ${new Date(serviceRuntime.value.lastCheckedAt).toLocaleTimeString()}`
})

// 多选控制
const isItemSelected = (id: string) => selectedItems.value.some((item) => item.id === id)

const toggleItemSelect = (photo: StockSnapPhoto) => {
  const idx = selectedItems.value.findIndex((item) => item.id === photo.id)
  if (idx > -1) {
    selectedItems.value.splice(idx, 1)
  } else {
    selectedItems.value.push(photo)
  }
}

const isAllSelected = computed({
  get: () => {
    if (!searchResult.value?.items?.length) return false
    return searchResult.value.items.every((item) => isItemSelected(item.id))
  },
  set: (val: boolean) => {
    if (!searchResult.value?.items?.length) return
    if (val) {
      const currentIds = new Set(selectedItems.value.map((i) => i.id))
      searchResult.value.items.forEach((item) => {
        if (!currentIds.has(item.id)) {
          selectedItems.value.push(item)
        }
      })
    } else {
      const pageIds = new Set(searchResult.value.items.map((i) => i.id))
      selectedItems.value = selectedItems.value.filter((i) => !pageIds.has(i.id))
    }
  },
})

const isIndeterminate = computed(() => {
  if (!searchResult.value?.items?.length) return false
  const currentCount = searchResult.value.items.filter((item) => isItemSelected(item.id)).length
  return currentCount > 0 && currentCount < searchResult.value.items.length
})

const handleSelectAllChange = (val: boolean) => {
  isAllSelected.value = val
}

const handleSelectClient = () => {
  selectedItems.value = []
  searchResult.value = null
}

const handleRefreshRuntime = async () => {
  if (!selectedClientId.value) return
  actionLoading.value.refreshRuntime = true
  try {
    await sendServiceCommand({
      target: { clientId: selectedClientId.value, pluginKey: 'stocksnap' },
      command: { name: 'refreshRuntime', payload: {} },
      mode: 'production',
    })
    ElMessage.success('刷新指令已发送')
  } catch (err: any) {
    ElMessage.error(`刷新失败: ${err.message || err}`)
  } finally {
    actionLoading.value.refreshRuntime = false
  }
}

// 搜索
const handleSearch = async () => {
  if (!selectedClientId.value) {
    ElMessage.warning('请选择客户端节点')
    return
  }
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  actionLoading.value.search = true
  try {
    const res = await searchStockSnapAndWait(selectedClientId.value, {
      keyword: keyword.value.trim(),
      limit: pageSize.value,
      page: currentPage.value,
      sort: sort.value,
      timeoutMs: 60000,
    })
    searchResult.value = res
    selectedItems.value = []
  } catch (err: any) {
    ElMessage.error(`搜索失败: ${err.message || err}`)
  } finally {
    actionLoading.value.search = false
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  handleSearch()
}

const handlePageChange = (val: number) => {
  currentPage.value = val
  handleSearch()
}

// 批量转存素材库 (后台 Agent 节点模式)
const handleBatchCollect = async () => {
  if (!selectedClientId.value) return
  actionLoading.value.collect = true
  try {
    await collectStockSnap(selectedClientId.value, {
      keyword: keyword.value.trim(),
      maxCount: 20,
      sort: sort.value,
    })
    ElMessage.success('后台素材采集任务已启动')
  } catch (err: any) {
    ElMessage.error(`转存失败: ${err.message || err}`)
  } finally {
    actionLoading.value.collect = false
  }
}

// 单张同步素材库
const handleSyncItem = async (photo: StockSnapPhoto) => {
  if (!selectedClientId.value) return
  syncingPhotoIds.value.add(photo.id)
  try {
    await sendServiceCommand({
      target: { clientId: selectedClientId.value, pluginKey: 'stocksnap' },
      command: {
        name: 'sync',
        payload: {
          imageUrl: photo.image,
          metadata: {
            title: photo.title,
            url: photo.url,
            author: photo.author,
            width: photo.width,
            height: photo.height,
            id: photo.id,
          },
        },
      },
      mode: 'production',
    })
    ElMessage.success(`"${photo.title}" 已提交同步素材库`)
  } catch (err: any) {
    ElMessage.error(`同步失败: ${err.message || err}`)
  } finally {
    syncingPhotoIds.value.delete(photo.id)
  }
}

// 批量同步选中项
const handleBatchDownload = async () => {
  if (!selectedClientId.value || !selectedItems.value.length) return
  batchSyncLoading.value = true
  let successCount = 0
  let failCount = 0

  for (const item of selectedItems.value) {
    try {
      await sendServiceCommand({
        target: { clientId: selectedClientId.value, pluginKey: 'stocksnap' },
        command: {
          name: 'sync',
          payload: {
            imageUrl: item.image,
            metadata: {
              title: item.title,
              url: item.url,
              author: item.author,
              width: item.width,
              height: item.height,
              id: item.id,
            },
          },
        },
        mode: 'production',
      })
      successCount++
    } catch {
      failCount++
    }
  }

  batchSyncLoading.value = false
  ElMessage.success(`批量同步完成: 成功 ${successCount} 个, 失败 ${failCount} 个`)
}

// 复制已选链接
const handleCopySelectedLinks = () => {
  if (!selectedItems.value.length) return
  const links = selectedItems.value.map((i) => i.image).join('\n')
  navigator.clipboard.writeText(links)
  ElMessage.success(`已复制 ${selectedItems.value.length} 条图片链接到剪贴板`)
}

const openPreview = (photo: StockSnapPhoto) => {
  previewPhoto.value = photo
  previewVisible.value = true
}

onMounted(() => {
  refreshClientNodes()
})
</script>

<style scoped lang="scss">
.collect-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.collect-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-bg-color);
  padding: 14px 20px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.collect-toolbar__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collect-toolbar__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.collect-toolbar__actions {
  display: flex;
  gap: 12px;
}

.collect-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-hero {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--el-bg-color);
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.hero-main {
  &.is-success .hero-value { color: var(--el-color-success); }
  &.is-warning .hero-value { color: var(--el-color-warning); }
  &.is-offline .hero-value { color: var(--el-text-color-placeholder); }
}

.hero-eyebrow {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.hero-value {
  font-size: 20px;
  font-weight: 700;
  margin: 4px 0;
}

.hero-subtitle {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.status-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);

  &.is-success {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
    .status-pill__dot { background: var(--el-color-success); }
  }

  &.is-warning {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
    .status-pill__dot { background: var(--el-color-warning); }
  }

  &.is-info {
    background: var(--el-fill-color);
    color: var(--el-text-color-placeholder);
    .status-pill__dot { background: var(--el-text-color-placeholder); }
  }

  .status-pill__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
}

.collect-section {
  background: var(--el-bg-color);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.collect-search__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.collect-section__title {
  font-size: 15px;
  font-weight: 600;
}

.collect-search__opts {
  display: flex;
  gap: 16px;
}

.collect-search__field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.collect-inline {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-extra-light);
}

.batch-bar__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.batch-bar__tip {
  font-size: 13px;
  color: var(--el-text-color-regular);

  .highlight-count {
    color: var(--el-color-primary);
  }
}

.batch-bar__right {
  display: flex;
  gap: 8px;
}

.collect-result__meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.photo-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--el-box-shadow-light);

    .photo-card__overlay {
      opacity: 1;
    }
  }

  &.is-selected {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
  }
}

.photo-card__checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 5;
  background: rgba(255, 255, 255, 0.85);
  padding: 2px 6px;
  border-radius: 4px;
}

.photo-card__preview {
  position: relative;
  width: 100%;
  height: 160px;
  background: var(--el-fill-color-dark);
}

.photo-card__img {
  width: 100%;
  height: 100%;
}

.photo-card__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.photo-card__info {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.photo-card__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-card__sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.preview-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-dialog__img-box {
  width: 100%;
  max-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-dark);
  border-radius: 8px;
  overflow: hidden;
}

.preview-dialog__img {
  max-width: 100%;
  max-height: 400px;
}

.preview-dialog__meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-top: 8px;
}
</style>
