<template>
  <div class="res-lib-page">
    <!-- 顶部操作栏 -->
    <div class="res-lib-toolbar">
      <div class="res-lib-toolbar__left">
        <span class="res-lib-title">{{ currentModuleTitle }}</span>
        <span v-if="total" class="res-lib-count">({{ total }})</span>
        
        <!-- 批量操作栏 -->
        <template v-if="selectedIds.length">
          <span class="res-lib-selected-badge">已选 {{ selectedIds.length }} 项</span>
          <el-button size="small" @click="toggleSelectAll">
            {{ isAllSelected ? '取消全选' : '全选本页' }}
          </el-button>
          <el-button
            size="small"
            type="primary"
            :loading="batchImporting"
            @click="handleBatchImport"
          >
            批量保存到我的空间 ({{ selectedIds.length }})
          </el-button>
          <el-button
            v-if="isAdmin"
            size="small"
            type="danger"
            :loading="batchRemoving"
            @click="handleBatchRemove"
          >
            批量下架 ({{ selectedIds.length }})
          </el-button>
          <el-button size="small" link @click="clearSelection">清空</el-button>
        </template>
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
          :class="{ 'is-selected': selectedIds.includes(item.id) }"
        >
          <!-- 多选勾选浮层 -->
          <div
            class="res-wall__checkbox"
            :class="{ 'is-checked': selectedIds.includes(item.id) }"
            title="选择"
            @click.stop="toggleItemSelection(item.id)"
          >
            <Icon
              :icon="selectedIds.includes(item.id) ? 'lucide:check-circle-2' : 'lucide:circle'"
              :size="18"
            />
          </div>

          <div class="res-wall__img-box" @click="openImagePreview(item.coverUrl)">
            <img
              :src="getFastPreviewImageUrl(item.coverUrl, { width: 300, quality: 80, format: 'webp' })"
              :alt="item.name"
              class="res-wall__img"
              loading="lazy"
            />
          </div>
          <!-- 默认显示：底部标题条 -->
          <div class="res-wall__bar">
            <span class="res-wall__bar-title" :title="item.name">{{ item.name }}</span>
          </div>
          <!-- Hover 遮罩 -->
          <div class="res-wall__overlay">
            <div class="res-wall__overlay-top">
              <el-button
                class="res-wall__detail-icon"
                @click.stop="openDetailDialog(item)"
              >
                <Icon icon="lucide:more-horizontal" :size="14" />
              </el-button>
            </div>
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
                    size="small"
                    class="res-btn-mini"
                    :loading="importingId === item.id"
                    @click.stop="handleImport(item)"
                  >
                    保存
                  </el-button>
                  <el-tooltip v-if="isAdmin" content="下架/移出广场" placement="top" :show-after="300">
                    <el-button
                      type="danger"
                      circle
                      size="small"
                      class="res-btn-icon-danger"
                      :loading="deletingId === item.id"
                      @click.stop="handleRemove(item)"
                    >
                      <Icon icon="lucide:trash-2" :size="13" />
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文案类：卡片网格 -->
      <div v-else class="res-text-grid">
        <div
          v-for="item in libraryList"
          :key="item.id"
          class="res-text-card"
          :class="{ 'is-selected': selectedIds.includes(item.id) }"
        >
          <div class="res-text-card__header">
            <div class="res-text-card__header-left">
              <!-- 多选勾选浮层 -->
              <div
                class="res-text-card__checkbox"
                :class="{ 'is-checked': selectedIds.includes(item.id) }"
                title="选择"
                @click.stop="toggleItemSelection(item.id)"
              >
                <Icon
                  :icon="selectedIds.includes(item.id) ? 'lucide:check-circle-2' : 'lucide:circle'"
                  :size="16"
                />
              </div>
              <div class="res-text-card__icon">
                <Icon :icon="getTypeIcon(currentResourceType)" :size="14" />
              </div>
            </div>
            <div class="res-text-card__header-right">
              <el-tooltip v-if="isAdmin" content="下架/移出广场" placement="top" :show-after="300">
                <el-button
                  type="danger"
                  link
                  size="small"
                  class="res-text-card__remove-icon"
                  :loading="deletingId === item.id"
                  @click.stop="handleRemove(item)"
                >
                  <Icon icon="lucide:trash-2" :size="14" />
                </el-button>
              </el-tooltip>
              <el-button
                class="res-text-card__more"
                @click.stop="openDetailDialog(item)"
              >
                <Icon icon="lucide:more-horizontal" :size="12" />
              </el-button>
            </div>
          </div>
          <div class="res-text-card__body">
            <span class="res-text-card__title" :title="item.name">{{ item.name }}</span>
            <span v-if="item.description" class="res-text-card__preview">{{ item.description }}</span>
          </div>
          <div v-if="item.tags?.length" class="res-text-card__tags">
            <span
              v-for="(tag, idx) in item.tags.slice(0, 2)"
              :key="idx"
              class="res-text-card__tag"
            >
              {{ tag }}
            </span>
          </div>
          <div class="res-text-card__footer">
            <span class="res-text-card__meta">{{ item.authorName || '官方' }} · {{ item.importCount || 0 }}次</span>
            <el-button
              type="primary"
              size="small"
              class="res-text-card__save"
              :loading="importingId === item.id"
              @click.stop="handleImport(item)"
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

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      width="420px"
      align-center
      :show-close="true"
      :close-on-click-modal="true"
      class="res-detail-dialog"
    >
      <template v-if="detailItem">
        <div class="res-detail">
          <!-- 图片预览 -->
          <div v-if="detailItem.coverUrl" class="res-detail__cover">
            <img :src="getFastPreviewImageUrl(detailItem.coverUrl, { width: 420, quality: 85, format: 'webp' })" :alt="detailItem.name" />
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
              {{ detailItem.authorName || '官方' }} · {{ detailItem.importCount || 0 }}次保存 · {{ formatTime(detailItem.publishedAt) }}
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
          plain
          @click="detailDialogVisible = false"
        >
          取消
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
import { getFastPreviewImageUrl } from '@/utils/image'

const route = useRoute()
const userStore = useUserStore()
const isAdmin = computed(() => !!userStore.user?.isAdmin)

const loading = ref(false)
const libraryList = ref<ResourceLibraryItem[]>([])
const total = ref(0)
const importingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

// 多选状态
const selectedIds = ref<string[]>([])
const batchImporting = ref(false)
const batchRemoving = ref(false)

const isAllSelected = computed(() => {
  return (
    libraryList.value.length > 0 &&
    libraryList.value.every((item) => selectedIds.value.includes(item.id))
  )
})

function toggleItemSelection(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    const pageIds = new Set(libraryList.value.map((i) => i.id))
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.has(id))
  } else {
    const nextSet = new Set(selectedIds.value)
    libraryList.value.forEach((i) => nextSet.add(i.id))
    selectedIds.value = Array.from(nextSet)
  }
}

function clearSelection() {
  selectedIds.value = []
}

// 批量保存
async function handleBatchImport() {
  if (!selectedIds.value.length) return
  const ids = [...selectedIds.value]
  batchImporting.value = true
  try {
    const res = await ResourceLibraryApi.batchImportToUser(ids)
    ElMessage.success(`成功将 ${res?.successCount || ids.length} 项资源保存到我的空间`)
    clearSelection()
    loadData()
  } catch (err: any) {
    ElMessage.error(err?.message || '批量保存失败')
  } finally {
    batchImporting.value = false
  }
}

// 批量下架
async function handleBatchRemove() {
  if (!selectedIds.value.length) return
  const ids = [...selectedIds.value]
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${ids.length} 项资源从公共广场下架吗？已保存用户的私有数据不受影响。`,
      '批量下架确认',
      {
        confirmButtonText: '确定下架',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    batchRemoving.value = true
    await ResourceLibraryApi.batchRemove(ids)
    ElMessage.success(`已成功下架 ${ids.length} 项资源`)
    clearSelection()
    loadData()
  } catch {
    // cancel
  } finally {
    batchRemoving.value = false
  }
}

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
  'custom_sticker',
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
    custom_sticker: '自定义贴纸',
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
    custom_sticker: 'lucide:stickers',
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

.res-lib-selected-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  padding: 2px 8px;
  border-radius: 4px;
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
  transition: box-shadow 0.15s ease, outline 0.15s ease;
}

.res-wall__item.is-selected {
  outline: 2.5px solid var(--el-color-primary);
  outline-offset: -1px;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--el-color-primary) 25%, transparent);
}

/* 多选勾选浮层 */
.res-wall__checkbox {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 10;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 45%);
  color: rgb(255 255 255 / 85%);
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);
}

.res-wall__item:hover .res-wall__checkbox,
.res-wall__checkbox.is-checked {
  opacity: 1;
}

.res-wall__checkbox:hover {
  background: rgb(0 0 0 / 70%);
  color: #fff;
  transform: scale(1.08);
}

.res-wall__checkbox.is-checked {
  background: var(--el-color-primary) !important;
  color: #fff !important;
  opacity: 1 !important;
  box-shadow: 0 2px 6px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
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

.res-wall__overlay-top {
  position: absolute;
  top: 6px;
  right: 6px;
}

.res-wall__detail-icon {
  width: 26px !important;
  height: 26px !important;
  padding: 0 !important;
  color: #fff !important;
  background: rgb(0 0 0 / 50%) !important;
  border: none !important;
  border-radius: 4px !important;
}

.res-wall__detail-icon:hover {
  background: rgb(0 0 0 / 70%) !important;
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
  align-items: center;
  gap: 4px;
}

.res-btn-icon-danger {
  width: 24px !important;
  height: 24px !important;
  padding: 0 !important;
  background: rgb(245 108 108 / 85%) !important;
  border: none !important;
  color: #fff !important;
}

.res-btn-icon-danger:hover {
  background: #f56c6c !important;
  transform: scale(1.08);
}

/* ============================================================
   文案类：卡片网格
   ============================================================ */
.res-text-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.res-text-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, outline 0.15s ease;
  position: relative;
}

.res-text-card:hover {
  border-color: var(--el-border-color);
  box-shadow: 0 2px 8px rgb(0 0 0 / 4%);
}

.res-text-card.is-selected {
  border-color: var(--el-color-primary);
  outline: 2px solid var(--el-color-primary);
  outline-offset: -1px;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.res-text-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.res-text-card__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.res-text-card__header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.res-text-card__checkbox {
  cursor: pointer;
  color: var(--el-text-color-placeholder);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease;
}

.res-text-card__checkbox:hover {
  color: var(--el-color-primary);
}

.res-text-card__checkbox.is-checked {
  color: var(--el-color-primary);
}

.res-text-card__remove-icon {
  width: 22px !important;
  height: 22px !important;
  padding: 0 !important;
  color: var(--el-color-danger) !important;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.res-text-card:hover .res-text-card__remove-icon {
  opacity: 0.85;
}

.res-text-card__remove-icon:hover {
  opacity: 1 !important;
  transform: scale(1.1);
}

.res-text-card__icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.res-text-card__more {
  width: 22px !important;
  height: 22px !important;
  padding: 0 !important;
  color: var(--el-text-color-secondary) !important;
  background: var(--el-fill-color) !important;
  border: none !important;
  border-radius: 4px !important;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.res-text-card__more:hover {
  background: var(--el-fill-color-dark) !important;
}

.res-text-card:hover .res-text-card__more {
  opacity: 1;
}

.res-text-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

.res-text-card__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.res-text-card__preview {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.res-text-card__tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.res-text-card__tag {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 1px 5px;
  border-radius: 3px;
  line-height: 1.4;
}

.res-text-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.res-text-card__meta {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.res-text-card__save {
  padding: 2px 8px !important;
  height: 22px !important;
  font-size: 11px !important;
  border-radius: 4px !important;
  flex: none;
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
