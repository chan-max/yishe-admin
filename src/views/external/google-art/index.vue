<template>
  <ContentWrap :plain="true">
    <div class="google-art-page">
      <!-- 工具栏 -->
      <div class="google-art-toolbar">
        <div class="google-art-toolbar__title">Google Art 控制台</div>
        <div class="google-art-toolbar__actions">
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
      <div class="google-art-layout" v-loading="loading">
        <!-- 左侧节点栏 -->
        <ExternalClientSidebar
          :items="clientNodeItems"
          :loading="loading"
          :selected-client-id="selectedClientId"
          section-title="客户端节点"
          empty-text="暂无可用客户端"
          @select="handleSelectClient"
        />

        <!-- 右侧主区域 -->
        <section class="google-art-main">
          <div v-if="selectedClient" class="google-art-panel">
            <!-- 状态卡片 -->
            <div class="status-hero">
              <div class="hero-main" :class="`is-${availabilityTone}`">
                <div class="hero-eyebrow">Google Art</div>
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

            <!-- 作品搜索 -->
            <div class="google-art-section">
              <div class="google-art-search__header">
                <div class="google-art-section__title">作品搜索</div>
                <div class="google-art-search__count">
                  <span class="google-art-search__count-label">每页</span>
                  <el-select v-model="pageSize" size="small" style="width: 80px">
                    <el-option :value="10" label="10 条" />
                    <el-option :value="20" label="20 条" />
                    <el-option :value="30" label="30 条" />
                  </el-select>
                </div>
              </div>
              <div class="google-art-inline">
                <el-input
                  v-model="searchKeyword"
                  clearable
                  placeholder="输入关键词搜索艺术作品（英文效果更佳，如 van gogh, impressionism）"
                  @keyup.enter="handleSearch"
                />
                <el-button
                  type="primary"
                  :loading="searchLoading"
                  @click="handleSearch"
                >
                  搜索
                </el-button>
              </div>

              <!-- 搜索结果 -->
              <div v-if="searchResults.length > 0" class="google-art-search__results">
                <div class="google-art-search__info">
                  共 {{ searchTotal }} 个结果，第 {{ currentPage }} / {{ totalPages }} 页
                </div>

                <div class="google-art-list">
                  <div
                    v-for="item in searchResults"
                    :key="item.id"
                    class="google-art-item"
                    :class="{ 'is-selected': selectedItems.includes(item.url) }"
                  >
                    <el-checkbox
                      :model-value="selectedItems.includes(item.url)"
                      @change="toggleSelect(item)"
                    />
                    <div class="google-art-item__thumb">
                      <img
                        v-if="item.thumbnail"
                        :src="item.thumbnail"
                        :alt="item.title"
                        loading="lazy"
                        @error="onImageError"
                      />
                      <div v-else class="google-art-item__thumb-error">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </div>
                    <div class="google-art-item__info">
                      <div class="google-art-item__title" :title="item.title">{{ item.title }}</div>
                      <div class="google-art-item__meta">
                        <span v-if="item.artist">{{ item.artist }}</span>
                        <span v-if="item.institution">{{ item.institution }}</span>
                      </div>
                    </div>
                    <div class="google-art-item__actions">
                      <el-button
                        link
                        size="small"
                        :icon="Link"
                        @click.stop="copyLink(item.url)"
                        title="复制链接"
                      />
                      <el-button
                        link
                        size="small"
                        type="primary"
                        :loading="loadingItems.has(item.id)"
                        @click.stop="openZoomDialog(item)"
                        title="添加到素材库"
                      >
                        入库
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分辨率选择对话框 -->
              <el-dialog
                v-model="zoomDialogVisible"
                title="选择分辨率"
                width="480px"
                align-center
              >
                <div v-if="zoomDialogItem" class="zoom-dialog">
                  <div class="zoom-dialog__preview">
                    <img
                      v-if="zoomDialogItem.thumbnail"
                      :src="zoomDialogItem.thumbnail"
                      :alt="zoomDialogItem.title"
                    />
                    <div class="zoom-dialog__info">
                      <div class="zoom-dialog__title">{{ zoomDialogItem.title }}</div>
                      <div class="zoom-dialog__meta">
                        <span v-if="zoomDialogItem.artist">{{ zoomDialogItem.artist }}</span>
                        <span v-if="zoomDialogItem.institution">{{ zoomDialogItem.institution }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="zoom-dialog__options">
                    <div class="zoom-dialog__label">选择分辨率（越大越清晰，文件也越大）</div>
                    <el-radio-group v-model="selectedZoomLevel" class="zoom-options">
                      <el-radio
                        v-for="zoom in zoomDialogOptions"
                        :key="zoom.idx"
                        :value="zoom.idx"
                        class="zoom-option"
                      >
                        <span class="zoom-option__size">{{ zoom.width }} × {{ zoom.height }}</span>
                        <span class="zoom-option__label">{{ zoom.label }}</span>
                        <span class="zoom-option__tiles">{{ zoom.tiles }} tiles</span>
                      </el-radio>
                    </el-radio-group>
                  </div>
                </div>
                <template #footer>
                  <el-button @click="zoomDialogVisible = false">取消</el-button>
                  <el-button type="primary" :loading="zoomDialogLoading" @click="confirmDownload">
                    确认入库
                  </el-button>
                </template>
              </el-dialog>

              <!-- 分页 -->
              <div class="google-art-pagination">
                <el-pagination
                  v-model:current-page="currentPage"
                  :page-size="pageSize"
                  :total="searchTotal"
                  layout="prev, pager, next, jumper"
                  background
                  @current-change="handlePageChange"
                />
              </div>

              <!-- 批量操作栏 -->
              <div v-if="searchResults.length > 0" class="google-art-actions-bar">
                <el-checkbox
                  :model-value="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="toggleSelectAll"
                >
                  全选
                </el-checkbox>
                <span class="google-art-actions-bar__count">已选 {{ selectedItems.length }} 个</span>
                <el-button
                  type="primary"
                  size="small"
                  :disabled="selectedItems.length === 0"
                  :loading="batchDownloadLoading"
                  @click="handleBatchDownload"
                >
                  批量入库
                </el-button>
                <el-button
                  size="small"
                  :disabled="selectedItems.length === 0"
                  @click="copySelectedLinks"
                >
                  复制链接
                </el-button>
                <el-button size="small" @click="clearSelection">清空</el-button>
              </div>
            </div>

            <!-- 单链接下载（兼容旧模式） -->
            <div class="google-art-section">
              <div class="google-art-section__title">单链接下载</div>
              <div class="google-art-inline">
                <el-input
                  v-model="artUrl"
                  clearable
                  placeholder="https://artsandculture.google.com/asset/..."
                  @keyup.enter="handleFetchZooms"
                />
                <el-button
                  type="primary"
                  :disabled="!canOperate || !artUrl.trim()"
                  :loading="actionLoading.getZooms"
                  @click="handleFetchZooms"
                >
                  获取分辨率
                </el-button>
              </div>

              <div v-if="zoomOptions.length" class="google-art-field">
                <div class="google-art-field__label">分辨率</div>
                <el-radio-group v-model="selectedZoom" class="zoom-group">
                  <el-radio-button v-for="item in zoomOptions" :key="item.idx" :label="item.idx">
                    {{ item.width }} × {{ item.height }}
                  </el-radio-button>
                </el-radio-group>
              </div>

              <div class="google-art-actions">
                <el-button
                  type="primary"
                  :disabled="!canOperate || !artUrl.trim() || selectedZoom === null"
                  :loading="actionLoading.sync"
                  @click="handleSync"
                >
                  同步到素材库
                </el-button>
              </div>
            </div>

            <!-- 执行结果 -->
            <div class="google-art-section">
              <div class="google-art-section__title">执行结果</div>
              <el-empty v-if="!lastResult" description="暂无执行结果" />
              <div v-else class="result-block">
                <div class="result-row">
                  <span class="result-row__label">结果</span>
                  <span class="result-row__value">{{ lastResult.message }}</span>
                </div>
                <div class="result-row" v-if="lastResult.data?.filePath">
                  <span class="result-row__label">文件路径</span>
                  <span class="result-row__value result-row__value--mono">{{
                    lastResult.data.filePath
                  }}</span>
                </div>
                <div class="result-row" v-if="lastResult.data?.fileSize">
                  <span class="result-row__label">文件大小</span>
                  <span class="result-row__value">{{
                    formatFileSize(lastResult.data.fileSize)
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="google-art-panel google-art-panel--empty">
            <el-empty description="请选择客户端节点" />
          </div>
        </section>

        <!-- 分辨率选择对话框 -->
        <el-dialog
          v-model="zoomDialogVisible"
          title="选择分辨率"
          width="480px"
          align-center
        >
          <div v-if="zoomDialogItem" class="zoom-dialog">
            <div class="zoom-dialog__preview">
              <img
                v-if="zoomDialogItem.thumbnail"
                :src="zoomDialogItem.thumbnail"
                :alt="zoomDialogItem.title"
              />
              <div class="zoom-dialog__info">
                <div class="zoom-dialog__title">{{ zoomDialogItem.title }}</div>
                <div class="zoom-dialog__meta">
                  <span v-if="zoomDialogItem.artist">{{ zoomDialogItem.artist }}</span>
                  <span v-if="zoomDialogItem.institution">{{ zoomDialogItem.institution }}</span>
                </div>
              </div>
            </div>
            <div class="zoom-dialog__options">
              <div class="zoom-dialog__label">选择分辨率（越大越清晰，文件也越大）</div>
              <el-radio-group v-model="selectedZoomLevel" class="zoom-options">
                <el-radio
                  v-for="zoom in zoomDialogOptions"
                  :key="zoom.idx"
                  :value="zoom.idx"
                  class="zoom-option"
                >
                  <span class="zoom-option__size">{{ zoom.width }} × {{ zoom.height }}</span>
                  <span class="zoom-option__label">{{ zoom.label }}</span>
                  <span class="zoom-option__tiles">{{ zoom.tiles }} tiles</span>
                </el-radio>
              </el-radio-group>
            </div>
          </div>
          <template #footer>
            <el-button @click="zoomDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="zoomDialogLoading" @click="confirmDownload">
              确认入库
            </el-button>
          </template>
        </el-dialog>
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Link, Picture } from '@element-plus/icons-vue'
import {
  fetchGoogleArtZooms,
  fetchGoogleArtZoomsAndWait,
  refreshGoogleArtStatus,
  searchGoogleArts,
  searchGoogleArtsAndWait,
  syncGoogleArtToMaterialLibrary,
  syncGoogleArtToMaterialLibraryAndWait,
  type GoogleArtAsset,
  type GoogleArtClientVO,
  type GoogleArtServiceStatus,
  type GoogleArtZoomLevel,
} from '@/api/external/googleArt'
import { websocketClient, type ServiceCommandResultEvent } from '@/services/websocketClient'
import { usePluginClientNodes } from '@/services/clientNodeState'
import { formatDate } from '@/utils/formatTime'
import ExternalClientSidebar, {
  type ClientNodeItem,
} from '../components/ExternalClientSidebar.vue'

defineOptions({ name: 'ExternalGoogleArt' })

const GOOGLE_ART_QUICK_LINK = 'https://artsandculture.google.com/search/asset?q'

// ─── 客户端节点 ──────────────────────────────────────────────

const {
  clients: rawClients,
  loading,
  refresh: refreshClientNodes,
  getServiceRuntime,
} = usePluginClientNodes('google-art')

const selectedClientId = ref('')
const artUrl = ref('')
const zoomOptions = ref<GoogleArtZoomLevel[]>([])
const selectedZoom = ref<number | null>(null)
const lastResult = ref<{
  success: boolean
  message: string
  data?: Record<string, any> | null
} | null>(null)

const actionLoading = reactive({
  refreshRuntime: false,
  getZooms: false,
  sync: false,
})

const pendingCommandIds = reactive<Record<string, 'refreshRuntime' | 'getZooms' | 'sync'>>({})

// ─── 搜索 ────────────────────────────────────────────────────

const searchKeyword = ref('')
const searchLoading = ref(false)
const pageSize = ref(10)
const searchResults = ref<GoogleArtAsset[]>([])
const searchTotal = ref(0)
const currentPage = ref(1)
const totalPages = ref(0)
const nextCursor = ref<string | null>(null)
const cursorHistory = ref<string[]>([])
const selectedItems = ref<string[]>([])
const imageErrorSet = ref<Set<string>>(new Set())
const loadingItems = ref<Set<string>>(new Set())

// ─── 分辨率选择对话框 ───
const zoomDialogVisible = ref(false)
const zoomDialogLoading = ref(false)
const zoomDialogItem = ref<GoogleArtAsset | null>(null)
const zoomDialogOptions = ref<GoogleArtZoomLevel[]>([])
const selectedZoomLevel = ref<number | null>(null)
const batchDownloadLoading = ref(false)

// ─── 计算属性 ────────────────────────────────────────────────

const mapGoogleArtClient = (client: any): GoogleArtClientVO => ({
  clientId: client.id,
  isOnline: client.isOnline,
  nodeStatus: client.nodeStatus,
  connectedAt: client.connectedAt,
  lastOnlineAt: client.lastOnlineAt,
  appVersion: client.clientInfo?.appVersion || null,
  machine: client.clientInfo?.machine || null,
  location: client.clientInfo?.location || null,
  googleArt: (getServiceRuntime(client) as GoogleArtServiceStatus | null) || null,
})

const clients = computed<GoogleArtClientVO[]>(() =>
  rawClients.value.map((client) => mapGoogleArtClient(client)),
)

const selectedClient = computed(
  () => clients.value.find((item) => item.clientId === selectedClientId.value) || null,
)

const selectedService = computed<GoogleArtServiceStatus | null>(
  () => selectedClient.value?.googleArt || null,
)

const selectedDetails = computed<Record<string, any>>(() => selectedService.value?.details || {})

const canOperate = computed(
  () => !!(selectedClientId.value && selectedClient.value?.isOnline && selectedService.value?.available),
)

const clientNodeItems = computed<ClientNodeItem[]>(() =>
  clients.value.map((client) => ({
    connectionId: client.clientId,
    name: client.machine?.code || client.clientId,
    time: formatDateSafe(client.connectedAt),
    metaLeft: client.appVersion || '未知版本',
    metaRight: client.location?.ip || client.location?.city || '未知位置',
    detail: client.workspaceDirectory ? `工作目录: ${client.workspaceDirectory}` : '工作目录: 未上报',
  })),
)

const availabilityTone = computed(() =>
  selectedService.value?.available ? 'success' : selectedClient.value?.isOnline ? 'warning' : 'muted',
)

const availabilityText = computed(() => {
  if (!selectedClient.value?.isOnline) return '客户端离线'
  if (selectedService.value?.available) return '可同步'
  return '受限'
})

const clientTone = computed(() => (selectedClient.value?.isOnline ? 'success' : 'muted'))

const clientStatusText = computed(() => (selectedClient.value?.isOnline ? '客户端在线' : '客户端离线'))

const siteTone = computed(() => {
  if (!selectedClient.value?.isOnline) return 'muted'
  if (selectedDetails.value.siteAvailable) return 'success'
  return 'warning'
})

const siteStatusBadge = computed(() => {
  if (!selectedClient.value?.isOnline) return '站点未检测'
  if (selectedDetails.value.siteAvailable) {
    return Number.isFinite(selectedDetails.value.siteLatencyMs)
      ? `网站连通 ${selectedDetails.value.siteLatencyMs}ms`
      : '网站连通'
  }
  return '站点异常'
})

const platformText = computed(() => selectedDetails.value.platformName || selectedDetails.value.platform || '未知平台')

const checkedAtText = computed(() => `检测 ${formatDateSafe(selectedService.value?.lastCheckedAt)}`)

// ─── 方法 ────────────────────────────────────────────────────

const formatDateSafe = (value?: string | null) => {
  if (!value) return '-'
  try {
    return formatDate(new Date(value))
  } catch {
    return value
  }
}

const formatFileSize = (value?: number) => {
  if (!value || !Number.isFinite(value)) return '-'
  return `${(value / 1024 / 1024).toFixed(2)} MB`
}

const loadClients = async () => {
  await refreshClientNodes()
  const list = clients.value
  if (!selectedClientId.value && list.length) {
    selectedClientId.value = list[0].clientId
  } else if (selectedClientId.value && !list.some((item) => item.clientId === selectedClientId.value)) {
    selectedClientId.value = list[0]?.clientId || ''
  }
}

const handleSelectClient = (clientId: string) => {
  selectedClientId.value = clientId
  zoomOptions.value = []
  selectedZoom.value = null
  lastResult.value = null
}

// ─── 搜索相关 ────────────────────────────────────────────────

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  if (!selectedClientId.value) {
    ElMessage.warning('请先选择客户端节点')
    return
  }

  searchLoading.value = true
  currentPage.value = 1
  selectedItems.value = []
  imageErrorSet.value.clear()
  cursorHistory.value = []

  try {
    const result = await searchGoogleArtsAndWait(selectedClientId.value, searchKeyword.value.trim(), 1, 'en', pageSize.value)

    if (!result || !result.items) {
      ElMessage.error('搜索返回数据异常')
      searchLoading.value = false
      return
    }
    searchResults.value = result.items || []
    searchTotal.value = result.total || 0
    totalPages.value = Math.ceil(searchTotal.value / pageSize.value)
    nextCursor.value = result.nextCursor || null
    cursorHistory.value.push(nextCursor.value || '')

    if (searchResults.value.length === 0) {
      ElMessage.info('未找到匹配的作品')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '搜索失败')
  } finally {
    searchLoading.value = false
  }
}

const toggleSelect = (item: GoogleArtAsset) => {
  const index = selectedItems.value.indexOf(item.url)
  if (index >= 0) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(item.url)
  }
}

const clearSelection = () => {
  selectedItems.value = []
}

const handleBatchDownload = async () => {
  if (!selectedClientId.value || !selectedItems.value.length) return

  batchDownloadLoading.value = true
  let successCount = 0
  let failCount = 0

  ElNotification.info({
    title: '批量下载',
    message: `开始下载 ${selectedItems.value.length} 个作品...`,
    duration: 3000,
  })

  for (let i = 0; i < selectedItems.value.length; i++) {
    const url = selectedItems.value[i]
    try {
      // 获取分辨率
      const zoomsResult = await fetchGoogleArtZoomsAndWait(selectedClientId.value, url)
      if (!zoomsResult.success || !zoomsResult.data?.zooms?.length) {
        failCount++
        continue
      }

      const zooms = zoomsResult.data.zooms
      const maxZoom = zooms[zooms.length - 1]

      // 下载
      const syncResult = await syncGoogleArtToMaterialLibraryAndWait(selectedClientId.value, {
        url,
        zoomLevel: maxZoom.idx,
      })

      if (syncResult.success) {
        successCount++
      } else {
        failCount++
      }
    } catch {
      failCount++
    }
  }

  batchDownloadLoading.value = false

  ElNotification({
    title: '批量下载完成',
    message: `成功 ${successCount} 个，失败 ${failCount} 个`,
    type: failCount === 0 ? 'success' : 'warning',
    duration: 5000,
  })

  clearSelection()
  loadClients()
}

// ─── 分辨率选择和分页 ────────────────────────────────────────

const openZoomDialog = async (item: GoogleArtAsset) => {
  if (!selectedClientId.value || !item.url) {
    ElMessage.warning('请先选择客户端节点')
    return
  }
  loadingItems.value.add(item.id)
  try {
    const result = await fetchGoogleArtZoomsAndWait(selectedClientId.value, item.url)
    if (!result.success || !result.data?.zooms?.length) {
      ElMessage.error(`获取分辨率失败: ${result.message || item.title}`)
      return
    }
    zoomDialogItem.value = item
    zoomDialogOptions.value = result.data.zooms
    selectedZoomLevel.value = result.data.zooms[result.data.zooms.length - 1]?.idx ?? null
    zoomDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(`获取分辨率异常: ${error?.message}`)
  } finally {
    loadingItems.value.delete(item.id)
  }
}

const confirmDownload = async () => {
  if (!zoomDialogItem.value || !selectedZoomLevel.value || !selectedClientId.value) return
  zoomDialogLoading.value = true
  try {
    const syncResult = await syncGoogleArtToMaterialLibraryAndWait(selectedClientId.value, {
      url: zoomDialogItem.value.url,
      zoomLevel: selectedZoomLevel.value,
    })
    if (syncResult.success) {
      ElMessage.success(`已入库: ${zoomDialogItem.value.title}`)
      zoomDialogVisible.value = false
    } else {
      ElMessage.error(`入库失败: ${syncResult.message}`)
    }
  } catch (error: any) {
    ElMessage.error(`入库异常: ${error?.message}`)
  } finally {
    zoomDialogLoading.value = false
  }
}

const handlePageChange = async (page: number) => {
  if (!searchKeyword.value.trim() || !selectedClientId.value) return
  searchLoading.value = true
  selectedItems.value = []
  try {
    let cursor: string | null = null
    if (page > 1) {
      const prevPageIndex = page - 2
      if (prevPageIndex < cursorHistory.value.length) {
        cursor = cursorHistory.value[prevPageIndex]
      }
    }
    const result = await searchGoogleArtsAndWait(selectedClientId.value, searchKeyword.value.trim(), page, 'en', pageSize.value, cursor)
    searchResults.value = result.items || []
    nextCursor.value = result.nextCursor || null
    currentPage.value = page
    if (nextCursor.value) {
      cursorHistory.value[page - 1] = nextCursor.value
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '加载失败')
  } finally {
    searchLoading.value = false
  }
}

// ─── 单链接下载 ──────────────────────────────────────────────

const trackCommand = async (
  action: 'refreshRuntime' | 'getZooms' | 'sync',
  request: Promise<{ success: boolean; message: string; data?: { commandId?: string } }>,
) => {
  actionLoading[action] = true
  try {
    const response = await request
    if (!response.success) {
      finishAction(action)
      ElMessage.error(response.message || '命令发送失败')
      return
    }

    const commandId = response.data?.commandId
    if (!commandId) {
      finishAction(action)
      ElMessage.success(response.message || '命令已执行')
      return
    }

    pendingCommandIds[commandId] = action
    ElMessage.success(response.message || '命令已发送')
  } catch (error: any) {
    finishAction(action)
    ElMessage.error(error?.message || '命令发送失败')
  }
}

const finishAction = (action?: keyof typeof actionLoading) => {
  if (!action) return
  actionLoading[action] = false
}

const handleRefreshRuntime = async () => {
  if (!selectedClientId.value) return
  await trackCommand('refreshRuntime', refreshGoogleArtStatus(selectedClientId.value))
}

const handleFetchZooms = async () => {
  if (!selectedClientId.value || !artUrl.value.trim()) {
    ElMessage.warning('请输入 Google Art 链接')
    return
  }
  zoomOptions.value = []
  selectedZoom.value = null
  lastResult.value = null
  await trackCommand('getZooms', fetchGoogleArtZooms(selectedClientId.value, artUrl.value.trim()))
}

const handleSync = async () => {
  if (!selectedClientId.value || !artUrl.value.trim()) {
    ElMessage.warning('请输入 Google Art 链接')
    return
  }
  if (selectedZoom.value === null) {
    ElMessage.warning('请先获取并选择分辨率')
  }

  await trackCommand(
    'sync',
    syncGoogleArtToMaterialLibrary(selectedClientId.value, {
      url: artUrl.value.trim(),
      zoomLevel: selectedZoom.value!,
    }),
  )
}

const handleServiceCommandResult = async (event: ServiceCommandResultEvent) => {
  const pendingAction = pendingCommandIds[event.commandId]
  if (pendingAction) {
    delete pendingCommandIds[event.commandId]
    finishAction(pendingAction)
  }

  if (pendingAction === 'getZooms') {
    const zooms = Array.isArray(event.data?.zooms) ? event.data.zooms : []
    zoomOptions.value = zooms
    selectedZoom.value = zooms.length ? (zooms[zooms.length - 1]?.idx ?? null) : null
  }

  if (pendingAction === 'sync') {
    lastResult.value = {
      success: event.success,
      message: event.message || (event.success ? '执行完成' : '执行失败'),
      data: event.data || null,
    }
  }

  if (!event.success) {
    ElMessage.error(event.message || '执行失败')
    await loadClients()
    return
  }

  if (pendingAction === 'refreshRuntime') {
    ElMessage.success(event.message || '状态已刷新')
  } else if (pendingAction === 'getZooms') {
    ElMessage.success(event.message || '已获取可用分辨率')
  } else if (pendingAction === 'sync') {
    ElMessage.success(event.message || '已同步到素材库')
  }

  await loadClients()
}

watch(clients, (list) => {
  if (!selectedClientId.value && list.length) {
    selectedClientId.value = list[0].clientId
  } else if (
    selectedClientId.value &&
    !list.some((item) => item.clientId === selectedClientId.value)
  ) {
    selectedClientId.value = list[0]?.clientId || ''
  }
})

// ─── 计算属性 ───

const isAllSelected = computed(() => {
  return searchResults.value.length > 0 && selectedItems.value.length === searchResults.value.length
})

const isIndeterminate = computed(() => {
  return selectedItems.value.length > 0 && selectedItems.value.length < searchResults.value.length
})

// ─── 列表操作 ───

const onImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  const id = target.alt || target.src
  imageErrorSet.value.add(id)
  target.style.display = 'none'
}

const copyLink = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

const copySelectedLinks = async () => {
  if (selectedItems.value.length === 0) return
  try {
    await navigator.clipboard.writeText(selectedItems.value.join('\n'))
    ElMessage.success(`已复制 ${selectedItems.value.length} 个链接`)
  } catch {
    ElMessage.error('复制失败')
  }
}

const toggleSelectAll = (val: boolean) => {
  if (val) {
    selectedItems.value = searchResults.value.map((item) => item.url)
  } else {
    selectedItems.value = []
  }
}

/** 单个作品添加到素材库 */
const downloadOne = async (item: GoogleArtAsset) => {
  if (!selectedClientId.value || !item.url) {
    ElMessage.warning('请先选择客户端节点')
    return
  }

  // 标记加载状态
  item._loading = true

  try {
    // 获取分辨率
    const zoomsResult = await fetchGoogleArtZooms(selectedClientId.value, item.url)
    if (!zoomsResult.success || !zoomsResult.data?.zooms?.length) {
      ElMessage.error(`获取分辨率失败: ${item.title}`)
      return
    }

    const zooms = zoomsResult.data.zooms
    const maxZoom = zooms[zooms.length - 1]

    // 下载
    const syncResult = await syncGoogleArtToMaterialLibrary(selectedClientId.value, {
      url: item.url,
      zoomLevel: maxZoom.idx,
    })

    if (syncResult.success) {
      ElMessage.success(`已入库: ${item.title}`)
    } else {
      ElMessage.error(`入库失败: ${syncResult.message}`)
    }
  } catch (error: any) {
    ElMessage.error(`入库异常: ${error?.message}`)
  } finally {
    loadingItems.value.delete(item.id)
  }
}

onMounted(async () => {
  await loadClients()
  websocketClient.events.on('serviceCommandResult', handleServiceCommandResult)
})

onUnmounted(() => {
  websocketClient.events.off('serviceCommandResult', handleServiceCommandResult)
})
</script>

<style scoped>
.google-art-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.google-art-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.google-art-toolbar__title {
  font-size: 16px;
  font-weight: 600;
}

.google-art-toolbar__actions {
  display: flex;
  gap: 8px;
}

/* ─── 搜索区域 ─── */
.google-art-search__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.google-art-search__count {
  display: flex;
  align-items: center;
  gap: 6px;
}

.google-art-search__count-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.google-art-search__results {
  margin-top: 12px;
}

.google-art-search__info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ─── 列表 ─── */
.google-art-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 480px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

/* 窄滚动条 */
.google-art-list::-webkit-scrollbar {
  width: 4px;
}
.google-art-list::-webkit-scrollbar-track {
  background: transparent;
}
.google-art-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 2px;
}
.google-art-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-secondary);
}

.google-art-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: background 0.15s;
}

.google-art-item:last-child {
  border-bottom: none;
}

.google-art-item:hover {
  background: var(--el-fill-color-light);
}

.google-art-item.is-selected {
  background: var(--el-color-primary-light-9);
}

.google-art-item__thumb {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--el-fill-color);
}

.google-art-item__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.google-art-item__thumb-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-placeholder);
  font-size: 16px;
}

.google-art-item__info {
  flex: 1;
  min-width: 0;
}

.google-art-item__title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.google-art-item__meta {
  display: flex;
  gap: 8px;
  margin-top: 2px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.google-art-item__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* ─── 分辨率选择对话框 ─── */
.zoom-dialog__preview {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.zoom-dialog__preview img {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
  background: var(--el-fill-color-light);
}

.zoom-dialog__info {
  flex: 1;
  min-width: 0;
}

.zoom-dialog__title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zoom-dialog__meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.zoom-dialog__options {
  margin-top: 8px;
}

.zoom-dialog__label {
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.zoom-options {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.zoom-option {
  display: flex !important;
  align-items: center;
  margin-right: 0 !important;
  margin-left: 0 !important;
  gap: 12px;
  margin-bottom: 8px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  transition: all 0.2s;
  max-width: 520px;
  width: 100% !important;
  justify-content: flex-start;
  text-align: left;
}

.zoom-option :deep(.el-radio__label) {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 12px;
  padding-left: 8px;
}

.zoom-option:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-fill-color-light);
}

.zoom-option__size {
  font-size: 13px;
  font-weight: 600;
  width: 120px;
  flex-shrink: 0;
  text-align: left;
}

.zoom-option__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.zoom-option__tiles {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
  text-align: right;
  min-width: 60px;
}

/* ─── 分页 ─── */
.google-art-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* ─── 操作栏 ─── */
.google-art-actions-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 8px;
}

.google-art-actions-bar__count {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
}

/* ─── 布局 ─── */
.google-art-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 12px;
}

.google-art-panel {
  padding: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
}

.google-art-panel--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
}

.google-art-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.google-art-section + .google-art-section {
  margin-top: 16px;
}

.google-art-section__title {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.google-art-inline {
  justify-content: flex-start;
}

.google-art-inline :deep(.el-input) {
  flex: 1;
}

.google-art-field {
  margin-top: 12px;
}

.google-art-field__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.zoom-group {
  display: flex;
  flex-wrap: wrap;
}

.google-art-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin-top: 12px;
}

/* ─── 状态卡片 ─── */
.status-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.hero-main {
  padding: 12px 14px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
}

.hero-main.is-success {
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-5);
}

.hero-main.is-warning {
  background: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-5);
}

.hero-main.is-muted {
  background: var(--el-fill-color-light);
}

.hero-eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
}

.hero-value {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  margin-top: 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.status-pills {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 8px;
  padding: 2px 0;
}

.status-pill {
  display: inline-flex;
  min-height: 30px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  align-items: center;
  gap: 7px;
}

.status-pill__dot {
  width: 7px;
  height: 7px;
  background: currentcolor;
  border-radius: 999px;
}

.status-pill.is-success {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-5);
}

.status-pill.is-warning {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-5);
}

.status-pill.is-muted {
  color: var(--el-text-color-secondary);
}

.status-pill.is-neutral {
  color: var(--el-text-color-secondary);
}

/* ─── 结果区域 ─── */
.result-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 2px 2px 0;
}

.result-row {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

.result-row__label {
  width: 52px;
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.result-row__value {
  font-size: 12px;
  word-break: break-all;
  flex: 1;
}

.result-row__value--mono {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
}

@media (width <= 1100px) {
  .google-art-layout {
    grid-template-columns: 1fr;
  }

  .status-hero {
    grid-template-columns: 1fr;
  }
}
</style>
