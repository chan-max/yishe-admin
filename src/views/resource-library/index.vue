<template>
  <div class="res-lib-page">
    <!-- 顶部操作栏：极简轻量，凸显内容 -->
    <div class="res-lib-toolbar">
      <div class="res-lib-toolbar__left">
        <span class="res-lib-title">{{ currentModuleTitle }}</span>
        <span v-if="total" class="res-lib-count">({{ total }})</span>
      </div>

      <div class="res-lib-toolbar__right">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索关键词..."
          clearable
          size="small"
          class="res-lib-search-input"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button size="small" :loading="loading" @click="handleSearch">刷新</el-button>
      </div>
    </div>

    <!-- 资源内容区 -->
    <div v-loading="loading" class="res-lib-content">
      <div v-if="!libraryList.length && !loading" class="res-lib-empty">
        <el-empty description="暂无公共资源" :image-size="70" />
      </div>

      <div v-else class="res-lib-grid">
        <div
          v-for="item in libraryList"
          :key="item.id"
          class="res-card"
        >
          <!-- 1. 视觉类封面展示（贴纸 / 模板 / 3D / 文件等） -->
          <div
            v-if="item.coverUrl"
            class="res-card__cover"
            @click="openImagePreview(item.coverUrl)"
          >
            <img
              :src="item.coverUrl"
              :alt="item.name"
              class="res-card__img"
              loading="lazy"
            />
          </div>

          <!-- 2. 卡片文本主体 -->
          <div class="res-card__body">
            <div class="res-card__header">
              <span class="res-card__title" :title="item.name">{{ item.name }}</span>
            </div>

            <div v-if="item.description" class="res-card__desc" :title="item.description">
              {{ item.description }}
            </div>

            <!-- 标签 -->
            <div v-if="item.tags?.length" class="res-card__tags">
              <span
                v-for="(tag, idx) in item.tags.slice(0, 3)"
                :key="idx"
                class="res-card__tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 3. 卡片底部极简操作与元信息 -->
          <div class="res-card__footer">
            <span class="res-card__meta">
              {{ item.authorName || '官方' }} · {{ item.importCount || 0 }}次保存
            </span>

            <div class="res-card__actions">
              <el-button
                v-if="isAdmin"
                type="danger"
                link
                size="small"
                class="res-btn-mini"
                :loading="deletingId === item.id"
                @click="handleRemove(item)"
              >
                下架
              </el-button>

              <el-button
                type="primary"
                plain
                size="small"
                class="res-btn-mini"
                :loading="importingId === item.id"
                @click="handleImport(item)"
              >
                保存
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > queryParams.pageSize" class="res-lib-pagination">
        <el-pagination
          v-model:current-page="queryParams.currentPage"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[24, 48, 72]"
          small
          layout="total, sizes, prev, pager, next"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </div>

    <!-- 大图预览 -->
    <el-image-viewer
      v-if="previewViewerVisible"
      :url-list="[previewImageUrl]"
      @close="previewViewerVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ResourceLibraryApi, ResourceLibraryItem, ResourceLibraryType } from '@/api/resource-library'
import { useUserStore } from '@/store/modules/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()
const isAdmin = computed(() => !!userStore.user?.isAdmin)

const loading = ref(false)
const libraryList = ref<ResourceLibraryItem[]>([])
const total = ref(0)
const importingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

// 图片预览
const previewViewerVisible = ref(false)
const previewImageUrl = ref('')

const queryParams = reactive<{
  currentPage: number
  pageSize: number
  resourceType: ResourceLibraryType | ''
  keyword: string
}>({
  currentPage: 1,
  pageSize: 24,
  resourceType: '',
  keyword: '',
})

// 根据当前路由 meta 动态获取模块类型
const currentResourceType = computed<ResourceLibraryType>(() => {
  return (route.meta?.resourceType as ResourceLibraryType) || 'sticker'
})

const currentModuleTitle = computed(() => {
  const map: Record<string, string> = {
    sticker: '贴纸素材',
    psd_template: 'PSD 模板',
    font_template: '字体库',
    asset_3d: '3D 资产',
    file_resource: '文件资源',
    sentence: '文案库',
    ai_skill: 'AI 技能',
    prompt: '提示词',
    design_prompt: '设计提示词',
  }
  return map[currentResourceType.value] || '公共资源'
})

async function loadData() {
  loading.value = true
  queryParams.resourceType = currentResourceType.value
  try {
    const res = await ResourceLibraryApi.getPage(queryParams)
    libraryList.value = res?.list || []
    total.value = res?.total || 0
  } catch (err: any) {
    ElMessage.error(err?.message || '获取资源列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.currentPage = 1
  loadData()
}

function openImagePreview(url?: string) {
  if (!url) return
  previewImageUrl.value = url
  previewViewerVisible.value = true
}

async function handleImport(item: ResourceLibraryItem) {
  importingId.value = item.id
  try {
    const res = await ResourceLibraryApi.importToUser(item.id)
    ElMessage.success(res?.message || `已成功保存「${item.name}」到我的数据空间`)
    item.importCount = (item.importCount || 0) + 1
  } catch (err: any) {
    ElMessage.error(err?.message || '保存失败，请重试')
  } finally {
    importingId.value = null
  }
}

async function handleRemove(item: ResourceLibraryItem) {
  try {
    await ElMessageBox.confirm(`确定要下架「${item.name}」吗？已保存用户的私有数据不受影响。`, '下架确认', {
      confirmButtonText: '确定下架',
      cancelButtonText: '取消',
      type: 'warning',
    })
    deletingId.value = item.id
    await ResourceLibraryApi.remove(item.id)
    ElMessage.success(`已下架「${item.name}」`)
    loadData()
  } catch {
    // cancel
  } finally {
    deletingId.value = null
  }
}

watch(
  () => route.path,
  () => {
    queryParams.currentPage = 1
    queryParams.keyword = ''
    loadData()
  }
)

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.res-lib-page {
  padding: 0;
  box-sizing: border-box;
}

/* 顶部操作条 */
.res-lib-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.res-lib-toolbar__left {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.res-lib-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.res-lib-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.res-lib-toolbar__right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.res-lib-search-input {
  width: 200px;
}

.res-lib-content {
  min-height: 200px;
}

.res-lib-empty {
  padding: 40px 0;
}

/* 网格排版 */
.res-lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}

/* 卡片外观：极简边框与圆角，突出内容本身 */
.res-card {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.res-card:hover {
  border-color: var(--el-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 封面区 */
.res-card__cover {
  width: 100%;
  height: 130px;
  background: var(--el-fill-color-light);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.res-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.res-card__img:hover {
  transform: scale(1.02);
}

/* 卡片内容主体 */
.res-card__body {
  padding: 8px 10px 4px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.res-card__header {
  margin-bottom: 3px;
}

.res-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.res-card__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.45;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  flex: 1;
}

/* 微标签 */
.res-card__tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.res-card__tag {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 1px 5px;
  border-radius: 3px;
  line-height: 1.4;
}

/* 卡片底部 */
.res-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px 8px;
  border-top: 1px solid var(--el-border-color-extra-light);
  font-size: 11px;
}

.res-card__meta {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.res-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 小巧精致的按钮样式 */
.res-btn-mini {
  padding: 2px 8px !important;
  height: 22px !important;
  font-size: 11.5px !important;
  border-radius: 4px !important;
}

.res-lib-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
