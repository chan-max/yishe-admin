<template>
  <div class="list-page-layout">
    <div class="filter-section">
      <div class="search-bar">
        <div class="search-form-container">
          <div class="search-field">
            <label class="search-label">关键词</label>
            <el-input
              v-model="queryParams.keyword"
              placeholder="标题 / 正文 / 标签"
              clearable
              @keyup.enter="getList"
              @change="handleKeywordChange"
            />
          </div>
          <div class="search-field">
            <label class="search-label">场景</label>
            <el-select v-model="queryParams.sceneType" class="story-scene-select" clearable placeholder="全部场景" @change="getList">
              <el-option label="社交平台文案" value="social_post" />
              <el-option label="短视频字幕" value="short_video_subtitle" />
              <el-option label="口播脚本" value="voiceover" />
            </el-select>
          </div>
          <div class="search-field">
            <label class="search-label">素材ID</label>
            <el-input
              v-model="queryParams.stickerId"
              placeholder="素材ID"
              clearable
              @keyup.enter="getList"
              @change="handleStickerIdChange"
            />
          </div>
          <div class="search-field search-field-actions">
            <label class="search-label"></label>
            <div class="search-actions">
              <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
              <el-button type="danger" :icon="Delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">批量删除({{ selectedIds.length }})</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="table-section story-table-section">
      <div class="common-table">
        <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading" @checkbox-change="handleCheckboxChange" @checkbox-all="handleCheckboxAll">
          <template #materialSlot="{ row }">
            <div class="story-material-cell">
              <div class="story-material-thumb">
                <el-skeleton v-if="isMaterialHydrating(row)" animated>
                  <template #template>
                    <div class="story-material-skeleton"></div>
                  </template>
                </el-skeleton>
                <SingleImage
                  v-else-if="getMaterialPreview(row)"
                  :src="getMaterialPreview(row, 'list')"
                  :width="'100%'"
                  :height="'100%'"
                  fit="cover"
                  :alt="getMaterialName(row)"
                />
                <div v-else class="story-material-placeholder">暂无预览</div>
              </div>
              <div class="story-material-meta">
                <div class="story-material-name">{{ getMaterialName(row) }}</div>
                <div class="story-material-id">ID: {{ row.stickerId || '-' }}</div>
              </div>
            </div>
          </template>
          <template #titleSlot="{ row }">
            <div class="story-title-cell">
              <div class="story-title-text">{{ row.title || '-' }}</div>
              <el-tag effect="plain" size="small">{{ getSceneLabel(row.sceneType) }}</el-tag>
            </div>
          </template>
          <template #contentSlot="{ row }">
            <div class="story-content-cell">{{ row.content || '-' }}</div>
          </template>
          <template #hashtagsSlot="{ row }">
            <div class="story-hashtag-cell">{{ row.hashtags || '-' }}</div>
          </template>
          <template #createTimeSlot="{ row }">
            <span>{{ formatTimestamp(row.createTime) }}</span>
          </template>
          <template #operationDefaultSlot="{ row }">
            <div class="flex items-center">
              <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)" class="operation-dropdown" size="small">
                <el-button type="primary" link size="small">
                  操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu class="operation-menu-compact operation-menu-small">
                    <el-dropdown-item command="detail">
                      <el-icon><View /></el-icon>
                      <span>查看详情</span>
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      <span>删除</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </vxe-grid>
      </div>
    </div>

    <div class="pagination-section">
      <Pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
  </div>

  <el-dialog v-model="detailVisible" title="故事脚本详情" fullscreen destroy-on-close class="story-detail-dialog">
    <div v-if="currentRow" class="story-detail-layout story-detail-fullscreen">
      <el-card shadow="never" class="story-detail-material-card">
        <template #header>关联素材</template>
        <div class="story-detail-material">
          <div class="story-detail-thumb">
            <el-skeleton v-if="isMaterialHydrating(currentRow)" animated>
              <template #template>
                <div class="story-detail-skeleton"></div>
              </template>
            </el-skeleton>
            <SingleImage
              v-else-if="getMaterialPreview(currentRow)"
              :src="getMaterialPreview(currentRow, 'detail')"
              :width="'100%'"
              :height="'100%'"
              fit="cover"
              :alt="getMaterialName(currentRow)"
            />
            <div v-else class="story-material-placeholder">暂无预览</div>
          </div>
          <div class="story-detail-meta">
            <div><strong>素材名称：</strong>{{ getMaterialName(currentRow) }}</div>
            <div><strong>素材ID：</strong>{{ currentRow.stickerId || '-' }}</div>
            <div><strong>场景：</strong>{{ getSceneLabel(currentRow.sceneType) }}</div>
            <div><strong>创建时间：</strong>{{ formatTimestamp(currentRow.createTime) }}</div>
          </div>
        </div>
      </el-card>

      <div class="story-detail-grid">
        <el-card shadow="never">
          <template #header>脚本信息</template>
          <div class="story-detail-section">
            <div><strong>标题：</strong>{{ currentRow.title || '-' }}</div>
            <div class="story-detail-content-block">
              <strong>正文：</strong>
              <div class="story-detail-text">{{ currentRow.content || '-' }}</div>
            </div>
            <div v-if="currentRow.subtitleContent" class="story-detail-content-block">
              <strong>字幕稿：</strong>
              <pre class="story-detail-text preformatted">{{ currentRow.subtitleContent }}</pre>
            </div>
            <div><strong>标签：</strong>{{ currentRow.hashtags || '-' }}</div>
          </div>
        </el-card>

        <el-card shadow="never">
          <template #header>生成配置</template>
          <div class="story-detail-section">
            <div><strong>风格要求：</strong>{{ currentRow.stylePrompt || '-' }}</div>
            <div><strong>语气要求：</strong>{{ currentRow.tonePrompt || '-' }}</div>
            <div><strong>长度要求：</strong>{{ currentRow.lengthPrompt || '-' }}</div>
            <div><strong>补充要求：</strong>{{ currentRow.extraPrompt || '-' }}</div>
          </div>
        </el-card>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Delete, Search, View } from '@element-plus/icons-vue'
import { useWindowSize } from '@vueuse/core'
import { formatTimestamp } from '@/common/date'
import { commonGridOptions } from '@/common/table'
import { batchDeleteStickerStoryScript, deleteStickerStoryScript, getMaterialList, getStickerStoryScriptPage } from '@/api/material'
import { getPreviewImageUrl } from '@/utils/image'
import FormItem from '@/components/Erp/formItem.vue'
import Pagination from '@/components/Pagination/index.vue'

const loading = ref(false)
const total = ref(0)
const dataSource = ref<any[]>([])
const detailVisible = ref(false)
const currentRow = ref<any>(null)
const materialMap = ref<Record<string, any>>({})
const selectedIds = ref<string[]>([])
const materialLoadingIds = ref<string[]>([])

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  keyword: '',
  sceneType: '',
  stickerId: ''
})

const sceneLabelMap: Record<string, string> = {
  social_post: '社交平台文案',
  short_video_subtitle: '短视频字幕',
  voiceover: '口播脚本'
}

const { height } = useWindowSize()
const gridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: Math.max(height.value - 250, 420),
  rowConfig: { keyField: 'id' },
  checkboxConfig: { reserve: true },
  columns: [
    { type: 'checkbox', width: 48 },
    { title: '关联素材', field: 'stickerId', minWidth: 280, slots: { default: 'materialSlot' } },
    { title: '脚本标题', field: 'title', minWidth: 220, slots: { default: 'titleSlot' } },
    { title: '正文', field: 'content', minWidth: 360, slots: { default: 'contentSlot' } },
    { title: '标签', field: 'hashtags', minWidth: 220, slots: { default: 'hashtagsSlot' } },
    { title: '创建时间', field: 'createTime', width: 180, slots: { default: 'createTimeSlot' } },
    { title: '操作', field: 'operation', width: 120, fixed: 'right', slots: { default: 'operationDefaultSlot' } }
  ]
}))

watch(
  () => dataSource.value,
  () => {
    hydrateRelatedMaterials()
  },
  { deep: true }
)

function handleKeywordChange(val: string) {
  if (!val) getList()
}

function handleStickerIdChange(val: string) {
  if (!val) getList()
}

function getSceneLabel(sceneType?: string) {
  return sceneLabelMap[sceneType || ''] || sceneType || '-'
}

function getRelatedMaterial(row: any) {
  return materialMap.value[String(row?.stickerId || '')] || null
}

function getMaterialName(row: any) {
  const material = getRelatedMaterial(row)
  return material?.name || '未命名素材'
}

function getMaterialPreview(row: any, scene: 'list' | 'detail' = 'list') {
  const material = getRelatedMaterial(row)
  if (!material?.url) return ''
  const width = scene === 'detail' ? 420 : 240
  return getPreviewImageUrl(material.url, { width, quality: 80, format: 'webp' })
}

function isMaterialHydrating(row: any) {
  const id = String(row?.stickerId || '')
  if (!id) return false
  return materialLoadingIds.value.includes(id) && !materialMap.value[id]
}

async function hydrateRelatedMaterials() {
  const ids = Array.from(new Set(dataSource.value.map((item) => String(item?.stickerId || '')).filter(Boolean)))
  if (!ids.length) {
    materialMap.value = {}
    materialLoadingIds.value = []
    return
  }

  const nextMap: Record<string, any> = { ...materialMap.value }
  const pendingIds = ids.filter((id) => !nextMap[id])
  materialLoadingIds.value = pendingIds
  await Promise.all(
    ids.map(async (id) => {
      if (nextMap[id]) return
      try {
        const result: any = await getMaterialList({ currentPage: 1, pageSize: 1, id })
        const row = result?.list?.[0] || result?.records?.[0] || null
        if (row) nextMap[id] = row
      } catch {
        nextMap[id] = { id, name: '', url: '' }
      }
    })
  )
  materialMap.value = nextMap
  materialLoadingIds.value = []
}

async function getList() {
  loading.value = true
  try {
    const result: any = await getStickerStoryScriptPage({ ...queryParams })
    dataSource.value = result?.list || result?.records || []
    total.value = result?.total || 0
    selectedIds.value = []
  } catch (error: any) {
    dataSource.value = []
    total.value = 0
    selectedIds.value = []
    ElMessage.error(error?.message || '获取故事脚本列表失败')
  } finally {
    loading.value = false
  }
}

function handleCheckboxChange({ records }: any) {
  selectedIds.value = records.map((item: any) => item.id)
}

function handleCheckboxAll({ records }: any) {
  selectedIds.value = records.map((item: any) => item.id)
}

function openDetail(row: any) {
  currentRow.value = row
  detailVisible.value = true
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除脚本「${row.title || row.id}」吗？`, '删除确认', { type: 'warning' })
    await deleteStickerStoryScript(row.id)
    ElMessage.success('删除成功')
    if (dataSource.value.length === 1 && queryParams.currentPage > 1) {
      queryParams.currentPage -= 1
    }
    await getList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除故事脚本失败')
    }
  }
}

async function handleBatchDelete() {
  if (!selectedIds.value.length) {
    ElMessage.warning('请选择要删除的故事脚本')
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 条故事脚本吗？`, '批量删除', { type: 'warning' })
    await batchDeleteStickerStoryScript(selectedIds.value)
    ElMessage.success('批量删除成功')
    if (dataSource.value.length === selectedIds.value.length && queryParams.currentPage > 1) {
      queryParams.currentPage -= 1
    }
    selectedIds.value = []
    await getList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '批量删除故事脚本失败')
    }
  }
}

function handleOperationCommand(command: string, row: any) {
  if (command === 'detail') {
    openDetail(row)
    return
  }
  if (command === 'delete') {
    handleDelete(row)
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.search-bar {
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-form-container {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  align-items: center;
  gap: 12px;
  width: 100%;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  width: 100%;
}

.search-field-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  grid-column: 1 / -1;
}

.search-label {
  width: 72px;
  min-width: 72px;
  text-align: right;
  padding-right: 8px;
  line-height: 32px;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.search-field-actions .search-label {
  display: none;
}

.search-field > :not(.search-label) {
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.search-field .el-input,
.search-field .el-select {
  width: 100%;
}

.search-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  column-gap: 6px;
  row-gap: 6px;
  align-items: center;
  width: 100%;
}

@media (max-width: 1200px) {
  .search-form-container {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@media (max-width: 900px) {
  .search-form-container {
    grid-template-columns: 1fr;
    grid-auto-flow: row;
    gap: 8px;
  }

  .search-label {
    width: auto;
    min-width: auto;
    padding-right: 0;
    text-align: left;
  }

  .search-field-actions,
  .search-actions {
    justify-content: flex-start;
  }
}
.story-material-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.story-material-thumb {
  width: 84px;
  height: 84px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  background: var(--el-fill-color-light);
}

.story-material-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
  padding: 6px;
}

.story-material-skeleton,
.story-detail-skeleton {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(110deg, #f4f6fb 25%, #e9edf5 37%, #f4f6fb 63%);
  background-size: 400% 100%;
  animation: story-material-shimmer 1.4s ease infinite;
}

.story-material-meta {
  min-width: 0;
}

.story-material-name,
.story-title-text {
  color: var(--el-text-color-primary);
  font-weight: 500;
  line-height: 1.5;
  word-break: break-word;
}

.story-material-id {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.story-title-cell,
.story-content-cell,
.story-hashtag-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.story-content-cell,
.story-hashtag-cell {
  color: var(--el-text-color-regular);
  line-height: 1.7;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.story-detail-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.story-detail-material {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.story-detail-thumb {
  width: 180px;
  height: 180px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}

.story-detail-meta,
.story-detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.7;
}

.story-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 16px;
}

.story-detail-content-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.story-detail-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.preformatted {
  margin: 0;
  font-family: inherit;
}

@media (max-width: 960px) {
  .story-detail-grid {
    grid-template-columns: 1fr;
  }

  .story-detail-material {
    flex-direction: column;
  }
}

.story-table-section {
  margin-top: 16px;
}

.story-scene-select {
  width: 176px;
}

@keyframes story-material-shimmer {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0 50%;
  }
}

:deep(.story-detail-dialog .el-dialog__body) {
  height: calc(100vh - 56px);
  padding: 16px 20px 20px;
  overflow: hidden;
}

.story-detail-fullscreen {
  height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
}

.story-detail-material-card {
  flex-shrink: 0;
}

.story-detail-grid {
  min-height: 0;
}

.story-detail-grid :deep(.el-card) {
  height: 100%;
}

.story-detail-grid :deep(.el-card__body) {
  height: calc(100% - 56px);
  overflow: auto;
}

:deep(.operation-menu-small .el-dropdown-menu__item) {
  min-height: 28px;
  padding: 4px 10px;
  font-size: 12px;
  line-height: 1.2;
}

:deep(.operation-menu-small .el-dropdown-menu__item .el-icon) {
  font-size: 12px;
  margin-right: 6px;
}
</style>




