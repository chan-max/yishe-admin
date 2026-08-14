<template>
  <ContentWrap :plain="true">
    <div class="collect-page">
      <!-- 工具栏 -->
      <div class="collect-toolbar">
        <div class="collect-toolbar__left">
          <div class="collect-toolbar__title">Rawpixel 艺术与免版权控制台</div>
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
                <div class="hero-eyebrow">Rawpixel</div>
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
                <div class="collect-section__title">Rawpixel 艺术与免版权采集</div>
                <div class="collect-search__opts">
                  <div class="collect-search__field">
                    <span class="collect-search__label">排序</span>
                    <el-select v-model="sort" size="small" style="width: 110px">
                      <el-option value="curated" label="精选推荐" />
                      <el-option value="latest" label="最新上线" />
                      <el-option value="popular" label="热门高赞" />
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
                  v-model="searchKeyword"
                  clearable
                  placeholder="输入搜索词，如: cat, vintage, art, pattern"
                  style="max-width: 400px"
                  @keyup.enter="handleSearch"
                />
                <el-button
                  type="primary"
                  :loading="searching"
                  :disabled="!selectedClient?.isOnline"
                  @click="handleSearch"
                >
                  搜索
                </el-button>
                <el-button
                  type="success"
                  :loading="batchLoading"
                  :disabled="!selectedClient?.isOnline"
                  @click="openBatchModal"
                >
                  批量入库
                </el-button>
              </div>

              <!-- 搜索结果列表 -->
              <div v-loading="searching" class="search-results__wrap">
                <div v-if="searchCount > 0" class="search-results__summary">
                  <span>共找到 {{ searchCount }} 条图片</span>
                  <span v-if="queryKeyword">，关键词：“{{ queryKeyword }}”</span>
                </div>

                <div v-if="searchResults.length" class="photo-grid">
                  <div v-for="item in searchResults" :key="item.id" class="photo-card">
                    <div class="photo-card__preview" @click="handlePreviewPhoto(item)">
                      <img :src="item.thumbnail || item.image" :alt="item.title" loading="lazy" />
                      <div class="photo-card__badge">Rawpixel</div>
                    </div>
                    <div class="photo-card__info">
                      <div class="photo-card__title" :title="item.title">{{ item.title || 'Rawpixel 素材' }}</div>
                      <div class="photo-card__meta">
                        <span v-if="item.author" class="photo-card__artist">作者: {{ item.author }}</span>
                        <span v-if="item.width && item.height" class="photo-card__dim">{{ item.width }}x{{ item.height }}</span>
                      </div>
                    </div>
                    <div class="photo-card__actions">
                      <el-button size="small" type="primary" plain @click="handleSyncSingle(item)">
                        入库到素材库
                      </el-button>
                      <el-button size="small" text type="info" @click="openExternalUrl(item.link)">
                        查看原网页
                      </el-button>
                    </div>
                  </div>
                </div>

                <el-empty
                  v-else-if="hasSearched && !searching"
                  description="未找到匹配的 Rawpixel 图片素材"
                />
              </div>

              <!-- 分页 -->
              <div v-if="searchCount > 0" class="pagination-wrap">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :total="searchCount"
                  :page-sizes="[10, 20, 30, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleSizeChange"
                  @current-change="handlePageChange"
                />
              </div>
            </div>
          </div>
          <el-empty v-else description="请先在上方选择客户端节点" />
        </section>
      </div>

      <!-- 预览模态框 -->
      <el-dialog v-model="previewVisible" title="图片详情" width="700px" destroy-on-close>
        <div v-if="activePhoto" class="preview-modal">
          <div class="preview-modal__img">
            <img :src="activePhoto.image || activePhoto.thumbnail" :alt="activePhoto.title" />
          </div>
          <div class="preview-modal__info">
            <h3>{{ activePhoto.title }}</h3>
            <p v-if="activePhoto.description">{{ activePhoto.description }}</p>
            <div class="preview-modal__meta">
              <div><strong>ID:</strong> {{ activePhoto.id }}</div>
              <div><strong>作者:</strong> {{ activePhoto.author || 'Rawpixel' }}</div>
              <div><strong>授权:</strong> {{ activePhoto.license || 'Public Domain / Free' }}</div>
              <div v-if="activePhoto.width"><strong>分辨率:</strong> {{ activePhoto.width }} x {{ activePhoto.height }}</div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="previewVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleSyncSingle(activePhoto)">入库素材库</el-button>
        </template>
      </el-dialog>

      <!-- 批量入库弹窗 -->
      <el-dialog v-model="batchModalVisible" title="批量入库到素材库" width="500px">
        <el-form label-width="100px">
          <el-form-item label="关键词">
            <el-input v-model="batchKeyword" placeholder="输入搜索关键词" />
          </el-form-item>
          <el-form-item label="入库数量">
            <el-input-number v-model="batchMaxCount" :min="1" :max="50" />
          </el-form-item>
          <el-form-item label="排序方式">
            <el-select v-model="batchSort" style="width: 100%">
              <el-option value="curated" label="精选推荐" />
              <el-option value="latest" label="最新上线" />
              <el-option value="popular" label="热门高赞" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="batchModalVisible = false">取消</el-button>
          <el-button type="primary" :loading="batchLoading" @click="handleExecuteBatch">开始入库</el-button>
        </template>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePluginClientNodes } from '@/services/clientNodeState'
import { searchRawpixelAndWait, collectRawpixel, type RawpixelPhoto } from '@/api/external/rawpixel'
import '@/styles/external-collect.css'

defineOptions({ name: 'ExternalRawpixel' })

const {
  clients: rawClients,
  loading,
  refresh: refreshClientNodes,
  getServiceRuntime,
} = usePluginClientNodes('rawpixel')

const selectedClientId = ref('')
const searching = ref(false)
const hasSearched = ref(false)
const searchKeyword = ref('cat')
const queryKeyword = ref('')
const sort = ref('curated')
const currentPage = ref(1)
const pageSize = ref(20)
const searchCount = ref(0)
const searchResults = ref<RawpixelPhoto[]>([])

const actionLoading = reactive({ refreshRuntime: false })
const activePhoto = ref<RawpixelPhoto | null>(null)
const previewVisible = ref(false)

const batchModalVisible = ref(false)
const batchKeyword = ref('cat')
const batchMaxCount = ref(10)
const batchSort = ref('curated')
const batchLoading = ref(false)

const clients = computed(() => {
  return rawClients.value.map((client) => {
    const rawpixel = getServiceRuntime(client) || null
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
      os: client.clientInfo?.os || null,
      rawpixel,
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
  { immediate: true }
)

const selectedClient = computed(() => {
  if (!selectedClientId.value) return null
  return clients.value.find((c) => c.clientId === selectedClientId.value) || null
})

const availabilityTone = computed(() => (selectedClient.value?.isOnline ? 'online' : 'offline'))
const availabilityText = computed(() => (selectedClient.value?.isOnline ? 'Rawpixel 图库采集服务就绪' : '节点离线'))
const clientTone = computed(() => (selectedClient.value?.isOnline ? 'online' : 'offline'))
const clientStatusText = computed(() => (selectedClient.value?.isOnline ? '客户端在线' : '客户端离线'))
const siteTone = computed(() => 'online')
const siteStatusBadge = computed(() => 'www.rawpixel.com 可用')
const platformText = computed(() => `平台: ${selectedClient.value?.os?.platform || 'Unknown'}`)
const checkedAtText = computed(() => `检查于: ${new Date().toLocaleTimeString()}`)

const handleSelectClient = () => {
  searchResults.value = []
  hasSearched.value = false
}

const handleRefreshRuntime = async () => {
  actionLoading.refreshRuntime = true
  try {
    await refreshClientNodes()
    ElMessage.success('刷新就绪状态成功')
  } finally {
    actionLoading.refreshRuntime = false
  }
}

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  if (!selectedClientId.value) {
    ElMessage.warning('请选择客户端节点')
    return
  }
  searching.value = true
  hasSearched.value = true
  queryKeyword.value = searchKeyword.value.trim()

  try {
    const res = await searchRawpixelAndWait(selectedClientId.value, {
      keyword: queryKeyword.value,
      limit: pageSize.value,
      page: currentPage.value,
      sort: sort.value,
    })
    searchResults.value = res?.items || []
    searchCount.value = res?.total || res?.count || (res?.items || []).length
    if (res?.items?.length) {
      ElMessage.success(`找到 ${res.items.length} 张 Rawpixel 图片`)
    } else {
      ElMessage.info('未搜到匹配结果')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '搜索 Rawpixel 失败')
  } finally {
    searching.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  handleSearch()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  handleSearch()
}

const handlePreviewPhoto = (photo: RawpixelPhoto) => {
  activePhoto.value = photo
  previewVisible.value = true
}

const handleSyncSingle = async (photo: RawpixelPhoto | null) => {
  if (!photo) return
  if (!selectedClientId.value) {
    ElMessage.warning('请选择客户端节点')
    return
  }
  try {
    await ElMessageBox.confirm(`确认将图片 "${photo.title}" 同步入库到素材库？`, '提示', { type: 'info' })
    const res = await collectRawpixel(selectedClientId.value, {
      keyword: photo.title || searchKeyword.value,
      maxCount: 1,
    })
    if (res?.successCount > 0) {
      ElMessage.success('成功同步入库到素材库！')
    } else {
      ElMessage.warning(res?.error || '同步入库失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '同步失败')
  }
}

const openBatchModal = () => {
  batchKeyword.value = searchKeyword.value
  batchModalVisible.value = true
}

const handleExecuteBatch = async () => {
  if (!batchKeyword.value.trim()) {
    ElMessage.warning('请输入批量入库关键词')
    return
  }
  if (!selectedClientId.value) {
    ElMessage.warning('请选择客户端节点')
    return
  }
  batchLoading.value = true
  try {
    const res = await collectRawpixel(selectedClientId.value, {
      keyword: batchKeyword.value.trim(),
      maxCount: batchMaxCount.value,
      sort: batchSort.value,
    })
    if (res?.successCount > 0) {
      ElMessage.success(`批量同步完成：成功 ${res.successCount} 个，失败 ${res.failCount || 0} 个`)
      batchModalVisible.value = false
    } else {
      ElMessage.error(res?.error || '批量同步未成功')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '批量同步触发失败')
  } finally {
    batchLoading.value = false
  }
}

const openExternalUrl = (url: string) => {
  if (url) window.open(url, '_blank')
}
</script>

<style scoped>
@import '@/styles/external-collect.css';

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.photo-card {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.25s ease;
}

.photo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.photo-card__preview {
  position: relative;
  width: 100%;
  height: 180px;
  background: #111;
  cursor: pointer;
  overflow: hidden;
}

.photo-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-card:hover .photo-card__preview img {
  transform: scale(1.05);
}

.photo-card__badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 6px;
  background: rgba(230, 81, 0, 0.85);
  color: #fff;
  font-size: 11px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.photo-card__info {
  padding: 10px 12px;
  flex: 1;
}

.photo-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-card__meta {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.photo-card__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-extra-light, #f2f6fc);
  background: var(--el-fill-color-blank);
}

.preview-modal {
  display: flex;
  gap: 16px;
}

.preview-modal__img {
  flex: 1;
  max-height: 450px;
  overflow: hidden;
  border-radius: 6px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-modal__img img {
  max-width: 100%;
  max-height: 450px;
  object-fit: contain;
}

.preview-modal__info {
  width: 260px;
}

.preview-modal__meta {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
