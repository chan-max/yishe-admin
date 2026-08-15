<template>
  <ContentWrap :plain="true">
    <div class="collect-page">
      <!-- 工具栏 -->
      <div class="collect-toolbar">
        <div class="collect-toolbar__left">
          <div class="collect-toolbar__title">SVGRepo 50万+开源矢量图库</div>
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
                <div class="hero-eyebrow">SVGRepo (500k+ Free SVG Vectors)</div>
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
                <div class="status-pill is-info">
                  <span>{{ svgrepoRuntime.message || '50万+开源商用矢量图库' }}</span>
                </div>
              </div>
            </div>

            <!-- 搜索与采集面板 -->
            <div class="collect-card">
              <div class="card-header">
                <span class="card-title">🔍 矢量素材搜索与批量入库</span>
              </div>
              <div class="search-bar">
                <el-input
                  v-model="searchForm.keyword"
                  placeholder="输入搜索关键词（如 cat, animal, tech, arrow, shopping, nature）"
                  clearable
                  style="flex: 1; min-width: 240px;"
                  @keyup.enter="handleSearch"
                />
                <el-select v-model="searchForm.style" placeholder="风格类型" style="width: 140px;">
                  <el-option label="全部风格" value="all" />
                  <el-option label="单色图标" value="monotone" />
                  <el-option label="多色插画" value="multicolor" />
                  <el-option label="双色渐变" value="duotone" />
                  <el-option label="线性轮廓" value="outlined" />
                  <el-option label="实心填充" value="filled" />
                </el-select>
                <el-button
                  type="primary"
                  :loading="actionLoading.search"
                  :disabled="!selectedClient?.isOnline"
                  @click="handleSearch"
                >
                  搜索
                </el-button>
                <el-button
                  type="success"
                  :loading="actionLoading.batchCollect"
                  :disabled="!selectedClient?.isOnline || selectedItems.length === 0"
                  @click="handleBatchCollect"
                >
                  批量存入素材库 ({{ selectedItems.length }})
                </el-button>
              </div>

              <!-- 搜索结果列表 -->
              <div v-if="searchResult.items.length > 0" class="results-section">
                <div class="results-meta">
                  <span>找到 {{ searchResult.total || searchResult.items.length }} 个矢量素材</span>
                  <el-checkbox
                    v-model="isAllSelected"
                    :indeterminate="isIndeterminate"
                    @change="handleSelectAll"
                  >
                    全选当前页
                  </el-checkbox>
                </div>

                <div class="vector-grid">
                  <div
                    v-for="item in searchResult.items"
                    :key="item.id"
                    class="vector-card"
                    :class="{ 'is-selected': isItemSelected(item) }"
                    @click="toggleSelectItem(item)"
                  >
                    <div class="vector-preview">
                      <img :src="item.image || item.svgUrl" :alt="item.title" loading="lazy" />
                      <div class="card-select-mask" v-if="isItemSelected(item)">
                        <el-icon><Check /></el-icon>
                      </div>
                    </div>
                    <div class="vector-info">
                      <div class="vector-title" :title="item.title">{{ item.title }}</div>
                      <div class="vector-tags" v-if="item.license">
                        <el-tag size="small" type="info">{{ item.license }}</el-tag>
                      </div>
                    </div>
                    <div class="vector-actions" @click.stop>
                      <el-button size="small" link type="primary" @click="handleDownloadSingle(item)">
                        下载SVG
                      </el-button>
                      <el-button size="small" type="primary" plain @click="handleCollectSingle(item)">
                        入库
                      </el-button>
                    </div>
                  </div>
                </div>

                <!-- 分页 -->
                <div class="pagination-bar">
                  <el-pagination
                    v-model:current-page="searchForm.page"
                    :page-size="searchForm.limit"
                    :total="searchResult.total"
                    layout="prev, pager, next, total"
                    @current-change="handlePageChange"
                  />
                </div>
              </div>
              <el-empty v-else-if="hasSearched" description="未找到相关矢量素材" />
            </div>
          </div>
          <el-empty v-else description="请选择或配置客户端节点" />
        </section>
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { usePluginClientNodes } from '@/hooks/web/usePluginClientNodes'

const PLUGIN_KEY = 'svgrepo'
const {
  clients,
  selectedClientId,
  selectedClient,
  loading,
  actionLoading,
  loadClients,
  executeCommand,
  getServiceRuntime,
} = usePluginClientNodes(PLUGIN_KEY)

const svgrepoRuntime = computed(() => {
  return getServiceRuntime(selectedClient.value, PLUGIN_KEY) || {}
})

// 自动选中首个在线设备
watch(
  clients,
  (list) => {
    if (list && list.length > 0 && !selectedClientId.value) {
      const online = list.find((c) => c.isOnline)
      if (online) {
        selectedClientId.value = online.clientId
      } else {
        selectedClientId.value = list[0].clientId
      }
    }
  },
  { immediate: true },
)

const isOnline = computed(() => selectedClient.value?.isOnline ?? false)
const clientTone = computed(() => (isOnline.value ? 'success' : 'danger'))
const clientStatusText = computed(() => (isOnline.value ? '在线' : '离线'))
const isAvailable = computed(() => isOnline.value && svgrepoRuntime.value?.available !== false)
const availabilityTone = computed(() => (isAvailable.value ? 'success' : 'danger'))
const availabilityText = computed(() => (isAvailable.value ? '服务正常' : '不可用'))

function handleSelectClient(val: string) {
  selectedClientId.value = val
}

async function handleRefreshRuntime() {
  await executeCommand('refreshRuntime', {}, { loadingKey: 'refreshRuntime' })
  ElMessage.success('已刷新状态')
}

// 搜索表单
const searchForm = reactive({
  keyword: 'cat',
  page: 1,
  limit: 24,
  style: 'all',
})

const searchResult = reactive<{
  total: number
  items: any[]
}>({
  total: 0,
  items: [],
})

const hasSearched = ref(false)
const selectedItems = ref<any[]>([])

function isItemSelected(item: any) {
  return selectedItems.value.some((i) => i.id === item.id)
}

function toggleSelectItem(item: any) {
  const idx = selectedItems.value.findIndex((i) => i.id === item.id)
  if (idx >= 0) {
    selectedItems.value.splice(idx, 1)
  } else {
    selectedItems.value.push(item)
  }
}

const isAllSelected = computed(() => {
  if (!searchResult.items.length) return false
  return searchResult.items.every((item) => isItemSelected(item))
})

const isIndeterminate = computed(() => {
  const count = searchResult.items.filter((item) => isItemSelected(item)).length
  return count > 0 && count < searchResult.items.length
})

function handleSelectAll(val: boolean) {
  if (val) {
    searchResult.items.forEach((item) => {
      if (!isItemSelected(item)) {
        selectedItems.value.push(item)
      }
    })
  } else {
    const pageIds = new Set(searchResult.items.map((i) => i.id))
    selectedItems.value = selectedItems.value.filter((i) => !pageIds.has(i.id))
  }
}

async function handleSearch() {
  if (!searchForm.keyword.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  hasSearched.value = true
  selectedItems.value = []

  try {
    const res = await executeCommand(
      'search',
      {
        keyword: searchForm.keyword.trim(),
        query: searchForm.keyword.trim(),
        page: searchForm.page,
        limit: searchForm.limit,
        style: searchForm.style,
      },
      { loadingKey: 'search' },
    )

    const data = (res?.data || res) as any
    searchResult.items = data?.items || []
    searchResult.total = data?.total || searchResult.items.length
    ElMessage.success(`检索到 ${searchResult.items.length} 个矢量素材`)
  } catch (err: any) {
    ElMessage.error(err?.message || '搜索失败')
  }
}

function handlePageChange(newPage: number) {
  searchForm.page = newPage
  handleSearch()
}

async function handleDownloadSingle(item: any) {
  try {
    await executeCommand('download', {
      imageUrl: item.svgUrl || item.image,
      filename: item.name || item.title,
    })
    ElMessage.success(`已下载 SVG: ${item.title}`)
  } catch (err: any) {
    ElMessage.error(err?.message || '下载失败')
  }
}

async function handleCollectSingle(item: any) {
  try {
    await executeCommand('collect', {
      imageUrl: item.svgUrl || item.image,
      title: item.title,
      metadata: {
        id: item.id,
        source: 'svgrepo',
        title: item.title,
        style: item.style,
      },
    })
    ElMessage.success(`已成功保存至个人素材库: ${item.title}`)
  } catch (err: any) {
    ElMessage.error(err?.message || '保存至素材库失败')
  }
}

async function handleBatchCollect() {
  if (!selectedItems.value.length) return

  actionLoading.batchCollect = true
  let succ = 0
  let fail = 0

  for (const item of selectedItems.value) {
    try {
      await executeCommand('collect', {
        imageUrl: item.svgUrl || item.image,
        title: item.title,
        metadata: {
          id: item.id,
          source: 'svgrepo',
          title: item.title,
        },
      })
      succ++
    } catch {
      fail++
    }
  }

  actionLoading.batchCollect = false
  ElMessage.success(`批量入库完成: 成功 ${succ} 个, 失败 ${fail} 个`)
  selectedItems.value = []
}
</script>

<style scoped>
.collect-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

.collect-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.collect-toolbar__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collect-toolbar__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.status-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: var(--el-bg-color);
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.hero-eyebrow {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.hero-value {
  font-size: 24px;
  font-weight: 800;
  color: #10b981;
}

.hero-main.is-danger .hero-value {
  color: #ef4444;
}

.hero-subtitle {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

.status-pills {
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: var(--el-fill-color-light);
}

.status-pill.is-success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-pill.is-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status-pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.collect-card {
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  margin-bottom: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.results-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.vector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.vector-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 12px;
  background: var(--el-bg-color);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.vector-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: var(--el-color-primary);
}

.vector-card.is-selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.vector-preview {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
}

.vector-preview img {
  max-width: 85%;
  max-height: 85%;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.vector-card:hover .vector-preview img {
  transform: scale(1.08);
}

.card-select-mask {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--el-color-primary);
  color: #fff;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.vector-info {
  width: 100%;
  text-align: center;
  margin-bottom: 8px;
}

.vector-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vector-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--el-border-color-extra-light);
  padding-top: 8px;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
