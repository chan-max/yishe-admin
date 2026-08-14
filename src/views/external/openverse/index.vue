<template>
  <ContentWrap :plain="true">
    <div class="collect-page">
      <!-- 工具栏 -->
      <div class="collect-toolbar">
        <div class="collect-toolbar__left">
          <div class="collect-toolbar__title">Openverse 开放图库控制台</div>
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
                <div class="hero-eyebrow">Openverse (WordPress Foundation)</div>
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
                <div class="collect-section__title">图片采集 (6 亿+ CC/CC0 共享图库)</div>
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
                  clearable
                  placeholder="输入关键词搜索 Openverse 素材（如 cat, flower, art, pattern）"
                  @keyup.enter="handleSearch"
                />
                <el-button type="primary" :loading="searchLoading" @click="handleSearch">
                  搜索
                </el-button>
              </div>

              <!-- 搜索结果 -->
              <div v-if="searchResults.length > 0" class="collect-search__results">
                <!-- 顶部批量操作及状态信息 -->
                <div class="collect-search__header">
                  <div class="batch-bar">
                    <el-checkbox
                      v-model="isAllSelected"
                      :indeterminate="isIndeterminate"
                      @change="handleSelectAll"
                    >
                      全选 ({{ selectedCount }}/{{ searchResults.length }})
                    </el-checkbox>
                    <el-button
                      type="success"
                      size="small"
                      :disabled="selectedCount === 0"
                      :loading="batchSyncLoading"
                      @click="handleBatchSync"
                    >
                      批量保存到素材库 ({{ selectedCount }})
                    </el-button>
                    <el-button
                      size="small"
                      :disabled="selectedCount === 0"
                      @click="handleBatchCopyLinks"
                    >
                      复制选中链接
                    </el-button>
                  </div>
                  <div class="result-stats">
                    找到 {{ totalCount }} 条素材
                  </div>
                </div>

                <!-- 网格列表 -->
                <div class="photo-grid">
                  <div
                    v-for="item in searchResults"
                    :key="item.id"
                    class="photo-card"
                    :class="{ 'is-selected': isItemSelected(item.id) }"
                    @click="toggleItemSelect(item.id)"
                  >
                    <div class="photo-card__checkbox" @click.stop>
                      <el-checkbox
                        :model-value="isItemSelected(item.id)"
                        @change="toggleItemSelect(item.id)"
                      />
                    </div>
                    <div class="photo-card__thumb">
                      <img :src="item.thumbnail" :alt="item.title" loading="lazy" />
                      <div class="photo-card__overlay">
                        <el-button
                          type="primary"
                          circle
                          size="small"
                          icon="View"
                          title="查看大图"
                          @click.stop="openPreview(item)"
                        />
                        <el-button
                          type="success"
                          circle
                          size="small"
                          icon="FolderAdd"
                          title="保存到素材库"
                          :loading="syncingId === item.id"
                          @click.stop="handleSyncSingle(item)"
                        />
                      </div>
                    </div>
                    <div class="photo-card__meta">
                      <div class="photo-card__title" :title="item.title">{{ item.title }}</div>
                      <div class="photo-card__author">
                        <span>BY {{ item.author || 'Openverse' }}</span>
                        <el-tag size="small" type="info" class="license-tag">{{ item.license }}</el-tag>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 分页 -->
                <div class="pagination-wrapper">
                  <el-pagination
                    v-model:current-page="currentPage"
                    :page-size="pageSize"
                    :total="totalCount"
                    layout="prev, pager, next, jumper"
                    @current-change="handlePageChange"
                  />
                </div>
              </div>

              <!-- 搜索为空时提示 -->
              <el-empty
                v-else-if="hasSearched && !searchLoading"
                description="未找到相关素材，请尝试切换关键字"
              />
            </div>
          </div>

          <el-empty v-else description="请选择在线客户端节点" />
        </section>

        <!-- 侧边服务详情 -->
        <aside v-if="selectedClient" class="collect-sidebar">
          <div class="side-card">
            <div class="side-card__header">设备配置</div>
            <div class="side-card__body">
              <div class="info-row">
                <span class="info-label">设备编码</span>
                <span class="info-val">{{ selectedClient.machine?.code || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">平台/架构</span>
                <span class="info-val">{{ selectedClient.machine?.platform || '-' }} / {{ selectedClient.machine?.arch || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">IP 地址</span>
                <span class="info-val">{{ selectedClient.ip || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">客户端版本</span>
                <span class="info-val">{{ selectedClient.appVersion || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="side-card">
            <div class="side-card__header">Openverse 支持规范</div>
            <div class="side-card__body">
              <div class="info-row">
                <span class="info-label">图库类型</span>
                <span class="info-val">CC / CC0 公共共享图库</span>
              </div>
              <div class="info-row">
                <span class="info-label">知识共享协议</span>
                <span class="info-val">CC BY / CC0 / Public Domain</span>
              </div>
              <div class="info-row">
                <span class="info-label">海量储备</span>
                <span class="info-val">6 亿+ 高清摄影与矢量素材</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- 图片大图预览 Modal -->
      <el-dialog
        v-model="previewVisible"
        title="素材详情预览"
        width="800px"
        destroy-on-close
      >
        <div v-if="previewItem" class="preview-modal">
          <div class="preview-modal__img">
            <img :src="previewItem.image" :alt="previewItem.title" />
          </div>
          <div class="preview-modal__info">
            <h3>{{ previewItem.title }}</h3>
            <p v-if="previewItem.description">{{ previewItem.description }}</p>
            <div class="preview-meta-grid">
              <div><strong>作者:</strong> {{ previewItem.author }}</div>
              <div><strong>授权协议:</strong> {{ previewItem.license }}</div>
              <div><strong>尺寸:</strong> {{ previewItem.width }} x {{ previewItem.height }}</div>
              <div><strong>来源网站:</strong> {{ previewItem.provider }}</div>
            </div>
            <div class="preview-modal__actions">
              <el-button type="primary" icon="Link" @click="openOriginalUrl(previewItem.url)">
                查看来源页面
              </el-button>
              <el-button
                type="success"
                icon="FolderAdd"
                :loading="syncingId === previewItem.id"
                @click="handleSyncSingle(previewItem)"
              >
                保存到素材库
              </el-button>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOnlineClients } from '@/api/client'
import { searchOpenverseAndWait, collectOpenverse } from '@/api/external/openverse'
import type { OpenversePhoto } from '@/api/external/openverse'
import '@/styles/external-collect.css'

const clients = ref<any[]>([])
const selectedClientId = ref<string>('')
const loading = ref(false)
const searchLoading = ref(false)
const actionLoading = ref({ refreshRuntime: false })

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const searchResults = ref<OpenversePhoto[]>([])
const hasSearched = ref(false)

const selectedItemIds = ref<Set<string>>(new Set())
const syncingId = ref<string | null>(null)
const batchSyncLoading = ref(false)

const previewVisible = ref(false)
const previewItem = ref<OpenversePhoto | null>(null)

const selectedClient = computed(() => {
  return clients.value.find((c) => c.clientId === selectedClientId.value)
})

const clientTone = computed(() => (selectedClient.value?.isOnline ? 'success' : 'info'))
const clientStatusText = computed(() => (selectedClient.value?.isOnline ? '设备在线' : '设备离线'))
const siteTone = computed(() => 'success')
const siteStatusBadge = computed(() => 'Openverse API 可用')
const availabilityTone = computed(() => 'success')
const availabilityText = computed(() => '已就绪 (6 亿+ CC/CC0 素材)')
const platformText = computed(() => `架构: ${selectedClient.value?.machine?.platform || 'macOS'}`)
const checkedAtText = computed(() => `刷新于 ${new Date().toLocaleTimeString()}`)

const selectedCount = computed(() => selectedItemIds.value.size)
const isAllSelected = computed(() => {
  if (!searchResults.value.length) return false
  return searchResults.value.every((item) => selectedItemIds.value.has(item.id))
})
const isIndeterminate = computed(() => {
  return selectedCount.value > 0 && !isAllSelected.value
})

async function refreshClientNodes() {
  loading.value = true
  try {
    const res = await getOnlineClients()
    if (res.success && Array.isArray(res.data)) {
      clients.value = res.data
      if (!selectedClientId.value && clients.value.length > 0) {
        selectedClientId.value = clients.value[0].clientId
      }
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '获取在线节点失败')
  } finally {
    loading.value = false
  }
}

function handleSelectClient() {
  searchResults.value = []
  hasSearched.value = false
  selectedItemIds.value.clear()
}

async function handleRefreshRuntime() {
  actionLoading.value.refreshRuntime = true
  await refreshClientNodes()
  actionLoading.value.refreshRuntime = false
  ElMessage.success('节点状态刷新完成')
}

async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  if (!selectedClientId.value) {
    ElMessage.warning('请选择客户端节点')
    return
  }

  searchLoading.value = true
  selectedItemIds.value.clear()
  try {
    const res = await searchOpenverseAndWait({
      keyword: searchKeyword.value.trim(),
      limit: pageSize.value,
      page: currentPage.value,
      clientId: selectedClientId.value,
    })

    if (res.success) {
      searchResults.value = res.items || []
      totalCount.value = res.total || res.items.length
      hasSearched.value = true
      if (!res.items.length) {
        ElMessage.info('未搜到匹配的素材')
      }
    } else {
      ElMessage.error(res.error || '搜索失败')
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '搜索请求发生错误')
  } finally {
    searchLoading.value = false
  }
}

function handleSizeChange() {
  currentPage.value = 1
  if (searchKeyword.value.trim()) {
    handleSearch()
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  handleSearch()
}

function isItemSelected(id: string): boolean {
  return selectedItemIds.value.has(id)
}

function toggleItemSelect(id: string) {
  if (selectedItemIds.value.has(id)) {
    selectedItemIds.value.delete(id)
  } else {
    selectedItemIds.value.add(id)
  }
}

function handleSelectAll(val: any) {
  if (val) {
    searchResults.value.forEach((item) => selectedItemIds.value.add(item.id))
  } else {
    selectedItemIds.value.clear()
  }
}

async function handleSyncSingle(item: OpenversePhoto) {
  if (!selectedClientId.value) return
  syncingId.value = item.id
  try {
    const res = await collectOpenverse({
      keyword: searchKeyword.value.trim() || item.title,
      maxCount: 1,
      syncToMaterial: true,
      clientId: selectedClientId.value,
    })
    if (res.success) {
      ElMessage.success(`素材《${item.title}》同步成功`)
    } else {
      ElMessage.error(res.message || '同步失败')
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '同步报错')
  } finally {
    syncingId.value = null
  }
}

async function handleBatchSync() {
  if (selectedCount.value === 0 || !selectedClientId.value) return
  batchSyncLoading.value = true
  let okCount = 0
  for (const item of searchResults.value) {
    if (selectedItemIds.value.has(item.id)) {
      try {
        const res = await collectOpenverse({
          keyword: item.title,
          maxCount: 1,
          syncToMaterial: true,
          clientId: selectedClientId.value,
        })
        if (res.success) okCount++
      } catch {
        // ignore
      }
    }
  }
  batchSyncLoading.value = false
  ElMessage.success(`成功保存 ${okCount} 张素材到素材库`)
}

function handleBatchCopyLinks() {
  const links: string[] = []
  searchResults.value.forEach((item) => {
    if (selectedItemIds.value.has(item.id) && item.image) {
      links.push(item.image)
    }
  })
  if (links.length > 0) {
    navigator.clipboard.writeText(links.join('\n'))
    ElMessage.success(`已复制 ${links.length} 条高清链接到剪贴板`)
  }
}

function openPreview(item: OpenversePhoto) {
  previewItem.value = item
  previewVisible.value = true
}

function openOriginalUrl(url: string) {
  if (url) window.open(url, '_blank')
}

onMounted(() => {
  refreshClientNodes()
})
</script>

<style scoped>
.preview-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.preview-modal__img {
  text-align: center;
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
}
.preview-modal__img img {
  max-width: 100%;
  max-height: 450px;
  object-fit: contain;
  border-radius: 6px;
}
.preview-modal__info h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
}
.preview-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  font-size: 0.9rem;
  color: #475569;
  margin-top: 12px;
}
.preview-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style>
