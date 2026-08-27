<template>
  <div class="res-lib-page">
    <!-- 顶部操作栏 -->
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

      <!-- 图片类：瀑布流照片墙 -->
      <div v-else-if="isImageType" class="res-wall">
        <div
          v-for="item in libraryList"
          :key="item.id"
          class="res-wall__item"
        >
          <div class="res-wall__img-box" @click="openImagePreview(item.coverUrl)">
            <img
              :src="item.coverUrl"
              :alt="item.name"
              class="res-wall__img"
              loading="lazy"
            />
          </div>
          <!-- 默认显示：底部标题条 -->
          <div class="res-wall__bar">
            <span class="res-wall__bar-title" :title="item.name">{{ item.name }}</span>
            <el-button
              type="primary"
              link
              size="small"
              class="res-wall__detail-btn"
              @click.stop="openDetailDialog(item)"
            >
              详情
            </el-button>
          </div>
          <!-- Hover 遮罩 -->
          <div class="res-wall__overlay">
            <div class="res-wall__overlay-content">
              <span class="res-wall__title" :title="item.name">{{ item.name }}</span>
              <div v-if="item.tags?.length" class="res-wall__tags">
                <span
                  v-for="(tag, idx) in item.tags.slice(0, 2)"
                  :key="idx"
                  class="res-wall__tag"
                >
                  {{ tag }}
                </span>
              </div>
              <div class="res-wall__footer">
                <span class="res-wall__meta">{{ item.authorName || '官方' }} · {{ item.importCount || 0 }}次</span>
                <div class="res-wall__actions">
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    class="res-btn-mini"
                    :loading="importingId === item.id"
                    @click.stop="handleImport(item)"
                  >
                    保存
                  </el-button>
                  <el-button
                    v-if="isAdmin"
                    type="danger"
                    link
                    size="small"
                    class="res-btn-mini"
                    :loading="deletingId === item.id"
                    @click.stop="handleRemove(item)"
                  >
                    下架
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文案类：紧凑列表 -->
      <div v-else class="res-list">
        <div
          v-for="item in libraryList"
          :key="item.id"
          class="res-list__item"
        >
          <div class="res-list__icon">
            <Icon :icon="getTypeIcon(currentResourceType)" :size="16" />
          </div>
          <div class="res-list__body">
            <div class="res-list__title-row">
              <span class="res-list__title" :title="item.name">{{ item.name }}</span>
              <span v-if="item.description" class="res-list__preview">{{ item.description }}</span>
            </div>
            <div v-if="item.tags?.length" class="res-list__tags">
              <span
                v-for="(tag, idx) in item.tags.slice(0, 3)"
                :key="idx"
                class="res-list__tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="res-list__meta">
            <span>{{ item.authorName || '官方' }}</span>
            <span class="res-list__divider">·</span>
            <span>{{ item.importCount || 0 }}次</span>
          </div>
          <div class="res-list__actions">
            <el-button
              type="primary"
              link
              size="small"
              class="res-btn-mini"
              @click="openDetailDialog(item)"
            >
              详情
            </el-button>
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

      <!-- 分页 -->
      <div v-if="total > queryParams.pageSize" class="res-lib-pagination">
        <el-pagination
          v-model:current-page="queryParams.currentPage"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes":[24, 48, 72]"
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

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      width="480px"
      :show-close="true"
      :close-on-click-modal="true"
      class="res-detail-dialog"
    >
      <template v-if="detailItem">
        <div class="res-detail">
          <!-- 图片预览 -->
          <div v-if="detailItem.coverUrl" class="res-detail__cover">
            <img :src="detailItem.coverUrl" :alt="detailItem.name" />
          </div>
          <!-- 内容区 -->
          <div class="res-detail__info">
            <h3 class="res-detail__name">{{ detailItem.name }}</h3>
            <p v-if="detailItem.description" class="res-detail__desc">{{ detailItem.description }}</p>
            <div v-if="detailItem.tags?.length" class="res-detail__tags">
              <span
                v-for="(tag, idx) in detailItem.tags"
                :key="idx"
                class="res-detail__tag"
              >
                {{ tag }}
              </span>
            </div>
            <div class="res-detail__meta">
              <span>发布者：{{ detailItem.authorName || '官方' }}</span>
              <span>保存次数：{{ detailItem.importCount || 0 }}</span>
              <span>发布时间：{{ formatTime(detailItem.publishedAt) }}</span>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button
          v-if="isAdmin"
          type="danger"
          :loading="deletingId === detailItem?.id"
          @click="handleRemove(detailItem!)"
        >
          下架
        </el-button>
        <el-button
          type="primary"
          :loading="importingId === detailItem?.id"
          @click="handleImport(detailItem!)"
        >
          保存到我的空间
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@/components/Icon'
import { ResourceLibraryApi, ResourceLibraryItem, ResourceLibraryType } from '@/api/resource-library'
import { useUserStore } from '@/store/modules/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

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

// 详情弹窗
const detailDialogVisible = ref(false)
const detailItem = ref<ResourceLibraryItem | null>(null)

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

// 图片类资源类型
const IMAGE_TYPES: ResourceLibraryType[] = [
  'sticker',
  'psd_template',
  'font_template',
  'asset_3d',
  'file_resource',
]

// 根据当前路由 meta 动态获取模块类型
const currentResourceType = computed<ResourceLibraryType>(() => {
  return (route.meta?.resourceType as ResourceLibraryType) || 'sticker'
})

// 当前是否为图片类型
const isImageType = computed(() => IMAGE_TYPES.includes(currentResourceType.value))

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

// 获取类型图标
function getTypeIcon(type: ResourceLibraryType): string {
  const map: Record<string, string> = {
    sentence: 'lucide:text',
    ai_skill: 'lucide:zap',
    prompt: 'lucide:sparkles',
    design_prompt: 'lucide:palette',
  }
  return map[type] || 'lucide:file-text'
}

// 格式化时间
function formatTime(time?: string): string {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

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

// 打开详情弹窗
function openDetailDialog(item: ResourceLibraryItem) {
  detailItem.value = item
  detailDialogVisible.value = true
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
    detailDialogVisible.value = false
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
  },
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

/* ============================================================
   图片类：瀑布流照片墙
   ============================================================ */
.res-wall {
  column-count: 5;
  column-gap: 8px;
}

@media (width >= 1800px) {
  .res-wall {
    column-count: 6;
  }
}

@media (width <= 1400px) {
  .res-wall {
    column-count: 4;
  }
}

@media (width <= 1000px) {
  .res-wall {
    column-count: 3;
  }
}

@media (width <= 600px) {
  .res-wall {
    column-count: 2;
  }
}

.res-wall__item {
  break-inside: avoid;
  margin-bottom: 8px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  background: var(--el-fill-color-light);
  /* 提升为合成层，避免 hover 卡顿 */
  will-change: transform;
  transform: translateZ(0);
}

.res-wall__img-box {
  width: 100%;
  cursor: pointer;
  line-height: 0;
}

.res-wall__img {
  width: 100%;
  display: block;
}

/* 默认显示：底部标题条 */
.res-wall__bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 8px;
  background: linear-gradient(to top, rgb(0 0 0 / 60%) 0%, transparent 100%);
  opacity: 1;
  transition: opacity 0.2s ease;
}

.res-wall__item:hover .res-wall__bar {
  opacity: 0;
}

.res-wall__bar-title {
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.res-wall__detail-btn {
  font-size: 11px !important;
  color: rgb(255 255 255 / 90%) !important;
  padding: 0 4px !important;
  height: 20px !important;
  flex: none;
}

.res-wall__detail-btn:hover {
  color: #fff !important;
}

/* Hover 遮罩 */
.res-wall__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgb(0 0 0 / 80%) 0%,
    rgb(0 0 0 / 20%) 50%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity 0.15s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.res-wall__item:hover .res-wall__overlay {
  opacity: 1;
}

.res-wall__overlay-content {
  padding: 8px;
}

.res-wall__title {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  margin-bottom: 4px;
}

.res-wall__tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.res-wall__tag {
  font-size: 10px;
  color: rgb(255 255 255 / 90%);
  background: rgb(255 255 255 / 18%);
  padding: 1px 5px;
  border-radius: 3px;
  line-height: 1.4;
}

.res-wall__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.res-wall__meta {
  font-size: 10px;
  color: rgb(255 255 255 / 65%);
}

.res-wall__actions {
  display: flex;
  gap: 4px;
}

/* ============================================================
   文案类：紧凑列表
   ============================================================ */
.res-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}

.res-list__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  transition: background-color 0.12s ease;
}

.res-list__item:hover {
  background: var(--el-fill-color-light);
}

.res-list__item + .res-list__item {
  border-top: 1px solid var(--el-border-color-extra-light);
}

.res-list__icon {
  flex: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.res-list__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.res-list__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.res-list__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: none;
  max-width: 30%;
}

.res-list__preview {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.res-list__tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.res-list__tag {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 1px 5px;
  border-radius: 3px;
  line-height: 1.4;
}

.res-list__meta {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.res-list__divider {
  color: var(--el-text-color-placeholder);
}

.res-list__actions {
  flex: none;
  display: flex;
  gap: 4px;
}

/* 通用按钮样式 */
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

/* ============================================================
   详情弹窗
   ============================================================ */
.res-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.res-detail__cover {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.res-detail__cover img {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  display: block;
}

.res-detail__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px;
}

.res-detail__desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin: 0 0 10px;
}

.res-detail__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.res-detail__tag {
  font-size: 11px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  padding: 2px 8px;
  border-radius: 4px;
}

.res-detail__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-extra-light);
}
</style>

<style>
/* 弹窗全局样式（非 scoped 以覆盖 el-dialog） */
.res-detail-dialog .el-dialog__body {
  padding: 16px 20px;
}
</style>
