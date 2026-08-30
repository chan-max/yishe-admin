<template>
  <ContentWrap :plain="true">
    <div class="collect-page">
      <!-- 客户端选择 -->
      <ClientSelector
        v-model="selectedClientId"
        plugin-key="douyin_jingxuan"
        @change="handleSelectClient"
        @refresh="loadClients"
      />

      <!-- 客户端节点区域 -->
      <div class="collect-layout" v-loading="loading">
        <section class="collect-main">
          <div v-if="selectedClient" class="collect-panel">
            <!-- 视频采集 -->
            <div class="collect-section">
              <div class="collect-search__header">
                <div class="collect-section__title">抖音精选采集</div>
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
                <el-select v-model="selectedCategory" size="default" style="width: 150px">
                  <el-option
                    v-for="cat in categories"
                    :key="cat"
                    :value="cat"
                    :label="cat"
                  />
                </el-select>
                <el-button type="primary" :loading="searchLoading" @click="handleSearch">
                  采集
                </el-button>
              </div>

              <!-- 搜索结果 -->
              <div v-if="searchResults.length > 0" class="collect-search__results">
                <div class="collect-search__header">
                  <div class="collect-search__info">
                    共 {{ searchTotal }} 个结果，第 {{ currentPage }} / {{ totalPages }} 页
                  </div>
                  <div class="collect-actions-bar">
                    <span class="collect-actions-bar__count">已选 {{ selectedItems.length }} 项</span>
                    <el-button
                      type="primary"
                      size="small"
                      :disabled="selectedItems.length === 0"
                      @click="copySelectedLinks"
                    >
                      复制链接
                    </el-button>
                    <el-button size="small" @click="clearSelection">清空</el-button>
                  </div>
                </div>

                <!-- 视频列表 -->
                <div class="collect-list">
                  <div
                    v-for="item in searchResults"
                    :key="item.id"
                    class="collect-item"
                    :class="{ 'is-selected': selectedItems.includes(item.id) }"
                  >
                    <el-checkbox
                      :model-value="selectedItems.includes(item.id)"
                      @change="toggleSelect(item)"
                    />
                    <div class="collect-item__thumb">
                      <img
                        v-if="item.cover"
                        :src="item.cover"
                        :alt="item.title"
                      />
                    </div>
                    <div class="collect-item__info">
                      <div class="collect-item__title">{{ item.title }}</div>
                      <div class="collect-item__meta">
                        <span v-if="item.duration" class="meta-tag">⏱ {{ item.duration }}</span>
                        <span v-if="item.playCount" class="meta-tag">▶ {{ item.playCount }}</span>
                        <span v-if="item.author" class="meta-tag">{{ item.author }}</span>
                        <span v-if="item.date" class="meta-tag">{{ item.date }}</span>
                      </div>
                      <div v-if="item.tags && item.tags.length" class="collect-item__tags">
                        <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
                      </div>
                    </div>
                    <div class="collect-item__actions">
                      <el-button size="small" @click="openVideo(item)">打开</el-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-else-if="!searchLoading" class="collect-empty">
                <el-empty description="点击"采集"按钮获取抖音精选视频" />
              </div>
            </div>
          </div>

          <!-- 未选择客户端 -->
          <div v-else class="collect-empty">
            <el-empty description="请先选择客户端设备" />
          </div>
        </section>
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import ContentWrap from '@/components/ContentWrap/src/ContentWrap.vue'
import ClientSelector from '../components/ClientSelector.vue'
import { searchDouyinJingxuanAndWait, DouyinVideo } from '@/api/external/douyin-jingxuan'

const selectedClientId = ref('')
const selectedClient = ref<any>(null)
const loading = ref(false)
const searchLoading = ref(false)
const pageSize = ref(20)
const selectedCategory = ref('全部')
const searchResults = ref<DouyinVideo[]>([])
const searchTotal = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const selectedItems = ref<string[]>([])

const categories = [
  '全部', '公开课', '游戏', '二次元', '音乐', '影视', '美食', '知识',
  '小剧场', '生活vlog', '体育', '旅行', '亲子', '动物', '三农', '汽车', '美妆', '穿搭'
]

const isAllSelected = computed(() => {
  return searchResults.value.length > 0 && selectedItems.value.length === searchResults.value.length
})

const isIndeterminate = computed(() => {
  return selectedItems.value.length > 0 && selectedItems.value.length < searchResults.value.length
})

function handleSelectClient(client: any) {
  selectedClient.value = client
}

function loadClients() {
  // 由 ClientSelector 处理
}

function handleSizeChange() {
  // 分页大小变化
}

async function handleSearch() {
  if (!selectedClientId.value) {
    ElMessage.warning('请先选择客户端')
    return
  }

  searchLoading.value = true
  try {
    const result = await searchDouyinJingxuanAndWait(selectedClientId.value, {
      category: selectedCategory.value,
      limit: pageSize.value,
      page: 1,
    })

    if (result.success) {
      searchResults.value = result.items
      searchTotal.value = result.total
      currentPage.value = result.page
      totalPages.value = Math.ceil(result.total / pageSize.value)
      selectedItems.value = []
      ElMessage.success(`成功采集 ${result.count} 个视频`)
    } else {
      ElMessage.error(result.error || '采集失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '采集失败')
  } finally {
    searchLoading.value = false
  }
}

function toggleSelect(item: DouyinVideo) {
  const idx = selectedItems.value.indexOf(item.id)
  if (idx >= 0) {
    selectedItems.value.splice(idx, 1)
  } else {
    selectedItems.value.push(item.id)
  }
}

function clearSelection() {
  selectedItems.value = []
}

function openVideo(item: DouyinVideo) {
  if (item.videoUrl) {
    window.open(item.videoUrl, '_blank')
  }
}

async function copySelectedLinks() {
  const selected = searchResults.value.filter(v => selectedItems.value.includes(v.id))
  const links = selected.map(v => v.videoUrl).join('\n')
  try {
    await navigator.clipboard.writeText(links)
    ElMessage.success(`已复制 ${selected.length} 个视频链接`)
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped lang="scss">
.collect-page {
  padding: 16px;
}

.collect-layout {
  margin-top: 16px;
}

.collect-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.collect-section__title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.collect-search__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.collect-search__opts {
  display: flex;
  gap: 12px;
}

.collect-search__field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collect-search__label {
  font-size: 14px;
  color: #606266;
}

.collect-inline {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.collect-search__results {
  margin-top: 16px;
}

.collect-search__info {
  font-size: 14px;
  color: #909399;
}

.collect-actions-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collect-actions-bar__count {
  font-size: 14px;
  color: #606266;
}

.collect-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.collect-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  }

  &.is-selected {
    border-color: #409eff;
    background: #ecf5ff;
  }
}

.collect-item__thumb {
  width: 120px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.collect-item__info {
  flex: 1;
  min-width: 0;
}

.collect-item__title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 8px;
}

.collect-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.meta-tag {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.collect-item__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.collect-item__actions {
  flex-shrink: 0;
}

.collect-empty {
  padding: 60px 0;
  text-align: center;
}
</style>
