<template>
  <ContentWrap :plain="true">
    <div class="collect-page">
      <!-- 工具栏 -->
      <div class="collect-toolbar">
        <div class="collect-toolbar__left">
          <div class="collect-toolbar__title">{{ title }}</div>
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
          <el-button @click="loadClients">刷新节点</el-button>
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
                <div class="hero-eyebrow">{{ eyebrow || title }}</div>
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

            <!-- 图片采集搜索区 -->
            <div class="collect-section">
              <div class="collect-search__header">
                <div class="collect-section__title">图片采集 (原图直链与元数据提取)</div>
                <div class="collect-search__opts">
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
                  v-model="searchKeyword"
                  :placeholder="placeholder || '输入关键词搜索高清素材图片...'"
                  clearable
                  size="default"
                  style="flex: 1"
                  @keyup.enter="handleSearch"
                >
                  <template #prefix>
                    <el-icon><Picture /></el-icon>
                  </template>
                </el-input>
                <el-button
                  type="primary"
                  :loading="searchLoading"
                  :disabled="!selectedClientId || !selectedClient?.isOnline"
                  @click="handleSearch"
                >
                  搜索素材
                </el-button>
              </div>
            </div>

            <!-- 批量操作栏 -->
            <div v-if="searchResults.length > 0" class="collect-batch-bar">
              <div class="batch-left">
                <span class="batch-count">已选 {{ selectedItems.length }} / {{ searchResults.length }} 项</span>
                <el-button size="small" @click="selectAll">全选</el-button>
                <el-button size="small" @click="invertSelection">反选</el-button>
                <el-button size="small" @click="clearSelection">清空</el-button>
              </div>
              <div class="batch-right">
                <el-button
                  type="primary"
                  size="small"
                  :loading="batchDownloadLoading"
                  :disabled="selectedItems.length === 0 || !selectedClientId || !selectedClient?.isOnline"
                  @click="handleBatchSync"
                >
                  批量入库 ({{ selectedItems.length }})
                </el-button>
              </div>
            </div>

            <!-- 搜索结果列表 -->
            <div v-if="searchResults.length > 0" class="collect-grid">
              <div
                v-for="item in searchResults"
                :key="item.id"
                class="collect-card"
                :class="{ 'is-selected': selectedItems.includes(item.id) }"
                @click="toggleSelectItem(item.id)"
              >
                <div class="card-checkbox" @click.stop="toggleSelectItem(item.id)">
                  <el-checkbox :model-value="selectedItems.includes(item.id)" />
                </div>
                <div class="card-thumb" @click.stop="openPreview(item)">
                  <el-image
                    :src="item.thumbnail || item.image"
                    fit="cover"
                    loading="lazy"
                    class="card-img"
                  >
                    <template #error>
                      <div class="img-error">
                        <el-icon><Picture /></el-icon>
                        <span>加载失败</span>
                      </div>
                    </template>
                  </el-image>
                  <div class="card-overlay">
                    <span class="card-preview-btn">查看详情</span>
                  </div>
                </div>
                <div class="card-info">
                  <div class="card-title" :title="item.title">{{ item.title || '未命名素材' }}</div>
                  <div class="card-meta">
                    <span v-if="item.width && item.height" class="meta-tag">{{ item.width }}x{{ item.height }}</span>
                    <span v-if="item.author" class="meta-author" :title="item.author">{{ item.author }}</span>
                  </div>
                  <div class="card-actions">
                    <el-button
                      size="small"
                      type="primary"
                      plain
                      :loading="loadingItems.has(item.id)"
                      :disabled="!selectedClientId || !selectedClient?.isOnline"
                      @click.stop="handleSyncOne(item)"
                    >
                      入库
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!searchLoading && searchTotal === 0 && searchKeyword" class="collect-empty">
              <el-empty description="未找到相关素材图片，请尝试更换关键词" />
            </div>

            <!-- 分页 -->
            <div v-if="searchResults.length > 0" class="collect-pagination">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="searchTotal || 100"
                layout="prev, pager, next"
                @current-change="handlePageChange"
              />
            </div>
          </div>

          <!-- 未选择节点 -->
          <div v-else class="collect-empty">
            <el-empty description="请选择可用的客户端节点" />
          </div>
        </section>
      </div>
    </div>

    <!-- 详情预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="素材详情"
      width="720px"
      destroy-on-close
      class="preview-dialog"
    >
      <div v-if="previewItem" class="preview-content">
        <div class="preview-img-box">
          <el-image :src="previewItem.image || previewItem.thumbnail" fit="contain" class="preview-img" />
        </div>
        <div class="preview-info">
          <h3 class="preview-title">{{ previewItem.title }}</h3>
          <p v-if="previewItem.description" class="preview-desc">{{ previewItem.description }}</p>
          <div class="preview-tags">
            <el-tag v-if="previewItem.width && previewItem.height" size="small" type="info">
              {{ previewItem.width }} x {{ previewItem.height }}
            </el-tag>
            <el-tag v-if="previewItem.author" size="small" type="success">
              来源: {{ previewItem.author }}
            </el-tag>
            <el-tag v-if="previewItem.tags" size="small">
              {{ previewItem.tags }}
            </el-tag>
          </div>
          <div v-if="previewItem.link || previewItem.url" class="preview-link">
            <el-link :href="previewItem.link || previewItem.url" target="_blank" type="primary">
              查看原网页 ↗
            </el-link>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button
          v-if="previewItem"
          type="primary"
          :loading="loadingItems.has(previewItem.id)"
          :disabled="!selectedClientId || !selectedClient?.isOnline"
          @click="handleSyncOne(previewItem)"
        >
          保存到贴纸素材库
        </el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { usePluginClientNodes } from '@/services/clientNodeState'
import {
  createImageEngineApi,
  type ImageEnginePhoto,
  type ImageEngineClientVO,
  type ImageEngineServiceStatus,
} from '@/api/external/imageEngineApi'
import '@/styles/external-collect.css'

const props = defineProps<{
  pluginKey: string
  title: string
  eyebrow?: string
  placeholder?: string
  accentColor?: string
}>()

const api = createImageEngineApi(props.pluginKey)

const actionLoading = reactive({
  refreshRuntime: false,
})

// ─── 客户端节点 ──────────────────────────────────────────────

const {
  clients: rawClients,
  loading,
  refresh: refreshClientNodes,
  getServiceRuntime,
} = usePluginClientNodes(props.pluginKey)

const selectedClientId = ref('')

// ─── 搜索状态 ────────────────────────────────────────────────

const searchKeyword = ref('')
const searchLoading = ref(false)
const pageSize = ref(20)
const searchResults = ref<ImageEnginePhoto[]>([])
const searchTotal = ref(0)
const currentPage = ref(1)
const selectedItems = ref<string[]>([])
const loadingItems = ref<Set<string>>(new Set())
const batchDownloadLoading = ref(false)

const previewVisible = ref(false)
const previewItem = ref<ImageEnginePhoto | null>(null)

const clients = computed<ImageEngineClientVO[]>(() => {
  return rawClients.value.map((client) => {
    const service = (getServiceRuntime(client) as ImageEngineServiceStatus | null) || null
    return {
      clientId: client.id,
      isOnline: client.isOnline,
      nodeStatus: client.nodeStatus,
      connectedAt: client.connectedAt,
      lastOnlineAt: client.lastOnlineAt,
      appVersion: client.clientInfo?.appVersion || null,
      workspaceDirectory: client.clientInfo?.workspaceDirectory || null,
      machine: client.clientInfo?.machine || null,
      location: client.clientInfo?.location || null,
      service,
    }
  })
})

watch(
  clients,
  (list) => {
    if (list.length > 0 && !selectedClientId.value) {
      const onlineClient = list.find((c) => c.isOnline)
      selectedClientId.value = onlineClient ? onlineClient.clientId : list[0].clientId
    }
  },
  { immediate: true },
)

const selectedClient = computed<ImageEngineClientVO | null>(() => {
  if (!selectedClientId.value) return null
  return clients.value.find((c) => c.clientId === selectedClientId.value) || null
})

const currentService = computed<ImageEngineServiceStatus | null>(
  () => selectedClient.value?.service || null,
)

// ─── 状态展示 ──────────────────────────────────────────────

const isOnline = computed(() => !!selectedClient.value?.isOnline)
const isServiceConnected = computed(() => !!currentService.value?.connected)
const isAvailable = computed(
  () => isOnline.value && (isServiceConnected.value || currentService.value?.available),
)

const availabilityTone = computed(() => (isAvailable.value ? 'success' : 'danger'))
const availabilityText = computed(() => (isAvailable.value ? '服务就绪' : '不可用'))

const clientTone = computed(() => (isOnline.value ? 'success' : 'danger'))
const clientStatusText = computed(() => (isOnline.value ? '客户端在线' : '客户端离线'))

const siteTone = computed(() => (isServiceConnected.value ? 'success' : 'warning'))
const siteStatusBadge = computed(() =>
  isServiceConnected.value ? `${props.title} 可用` : `${props.title} 离线`,
)

const platformText = computed(() => {
  const p = selectedClient.value?.machine?.platform
  if (!p) return '未知平台'
  return p === 'darwin' ? 'macOS' : p === 'win32' ? 'Windows' : p
})

const checkedAtText = computed(() => {
  const t = currentService.value?.lastCheckedAt
  if (!t) return '未检查'
  return new Date(t).toLocaleTimeString()
})

function handleSelectClient(val: string) {
  selectedClientId.value = val
}

async function loadClients() {
  await refreshClientNodes()
  ElMessage.success('客户端列表已刷新')
}

async function handleRefreshRuntime() {
  if (!selectedClientId.value) return
  actionLoading.refreshRuntime = true
  try {
    await api.refreshStatus(selectedClientId.value)
    await refreshClientNodes()
    ElMessage.success('服务状态已刷新')
  } catch (e: any) {
    ElMessage.error(e?.message || '刷新状态失败')
  } finally {
    actionLoading.refreshRuntime = false
  }
}

// ─── 搜索业务 ──────────────────────────────────────────────

async function handleSearch() {
  if (!selectedClientId.value) {
    ElMessage.warning('请先选择客户端节点')
    return
  }
  const kw = searchKeyword.value.trim()
  if (!kw) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  searchLoading.value = true
  selectedItems.value = []
  try {
    const result = await api.searchAndWait(selectedClientId.value, kw, {
      page: currentPage.value,
      limit: pageSize.value,
    })
    if (result.success) {
      searchResults.value = result.items || []
      searchTotal.value = result.total || result.count || 0
      ElMessage.success(`搜索到 ${result.count || searchResults.value.length} 条素材`)
    } else {
      searchResults.value = []
      searchTotal.value = 0
      ElMessage.error(result.error || '搜索失败')
    }
  } catch (e: any) {
    searchResults.value = []
    searchTotal.value = 0
    ElMessage.error(e?.message || '搜索执行异常')
  } finally {
    searchLoading.value = false
  }
}

function handleSizeChange(val: number) {
  pageSize.value = val
  if (searchKeyword.value.trim()) {
    currentPage.value = 1
    handleSearch()
  }
}

function handlePageChange(val: number) {
  currentPage.value = val
  handleSearch()
}

// ─── 选择管理 ──────────────────────────────────────────────

function toggleSelectItem(id: string) {
  const idx = selectedItems.value.indexOf(id)
  if (idx === -1) {
    selectedItems.value.push(id)
  } else {
    selectedItems.value.splice(idx, 1)
  }
}

function selectAll() {
  selectedItems.value = searchResults.value.map((i) => i.id)
}

function invertSelection() {
  const cur = new Set(selectedItems.value)
  selectedItems.value = searchResults.value.filter((i) => !cur.has(i.id)).map((i) => i.id)
}

function clearSelection() {
  selectedItems.value = []
}

function openPreview(item: ImageEnginePhoto) {
  previewItem.value = item
  previewVisible.value = true
}

// ─── 单图入库 ──────────────────────────────────────────────

async function handleSyncOne(item: ImageEnginePhoto) {
  if (!selectedClientId.value) return
  loadingItems.value.add(item.id)
  try {
    const res = await api.syncAndWait(selectedClientId.value, {
      imageUrl: item.image,
      metadata: {
        title: item.title,
        description: item.description,
        url: item.url || item.link,
        author: item.author,
        width: item.width,
        height: item.height,
        tags: item.tags,
      },
    })
    if (res.success) {
      ElMessage.success(`「${item.title || '素材'}」已同步到素材库`)
    } else {
      ElMessage.error(res.message || '入库失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '入库异常')
  } finally {
    loadingItems.value.delete(item.id)
  }
}

// ─── 批量入库 ──────────────────────────────────────────────

async function handleBatchSync() {
  if (!selectedClientId.value || selectedItems.value.length === 0) return
  const itemsToSync = searchResults.value.filter((i) => selectedItems.value.includes(i.id))
  batchDownloadLoading.value = true
  let successCount = 0
  let failCount = 0

  for (const item of itemsToSync) {
    loadingItems.value.add(item.id)
    try {
      const res = await api.syncAndWait(selectedClientId.value, {
        imageUrl: item.image,
        metadata: {
          title: item.title,
          description: item.description,
          url: item.url || item.link,
          author: item.author,
          width: item.width,
          height: item.height,
          tags: item.tags,
        },
      })
      if (res.success) {
        successCount++
      } else {
        failCount++
      }
    } catch {
      failCount++
    } finally {
      loadingItems.value.delete(item.id)
    }
  }

  batchDownloadLoading.value = false
  if (successCount > 0) {
    ElMessage.success(`批量入库完成: 成功 ${successCount} 项${failCount > 0 ? `, 失败 ${failCount} 项` : ''}`)
  } else {
    ElMessage.error('批量入库失败')
  }
}
</script>

<style scoped>
.collect-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.collect-card {
  position: relative;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.25s ease;
  cursor: pointer;
}

.collect-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.collect-card.is-selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.card-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 3;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 4px;
  padding: 2px 4px;
  backdrop-filter: blur(4px);
}

.card-thumb {
  position: relative;
  width: 100%;
  padding-top: 66.6%;
  background: var(--el-fill-color-light);
  overflow: hidden;
}

.card-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.card-thumb:hover .card-overlay {
  opacity: 1;
}

.card-preview-btn {
  color: #fff;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.6);
}

.card-info {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.card-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.meta-tag {
  background: var(--el-fill-color);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 11px;
}

.meta-author {
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.collect-batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-top: 16px;
}

.batch-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-count {
  font-size: 13px;
  font-weight: 500;
  margin-right: 8px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-img-box {
  width: 100%;
  max-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  overflow: hidden;
}

.preview-img {
  max-width: 100%;
  max-height: 420px;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.preview-desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
