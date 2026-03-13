<template>
  <div class="list-page-layout">
    <div class="filter-section">
      <CollapsibleFilterForm :show-expand-button="false" :show-collapse-button="false">
        <template #collapsed>
          <form-item label="关键词">
            <el-input
              v-model="queryParams.keyword"
              placeholder="标题"
              class="w-60"
              clearable
              @keyup.enter="getList"
              @change="handleKeywordChange"
            />
          </form-item>
          <form-item label="状态">
            <el-select
              v-model="queryParams.status"
              class="remotion-filter-select"
              clearable
              placeholder="全部状态"
              @change="getList"
            >
              <el-option label="处理中" value="processing" />
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>
          </form-item>
          <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
          <el-button type="primary" plain @click="openCreateDialog()">新增</el-button>
        </template>
        <template #expanded>
          <form-item label="关键词">
            <el-input
              v-model="queryParams.keyword"
              placeholder="标题"
              class="w-60"
              clearable
              @keyup.enter="getList"
              @change="handleKeywordChange"
            />
          </form-item>
          <form-item label="状态">
            <el-select
              v-model="queryParams.status"
              class="remotion-filter-select"
              clearable
              placeholder="全部状态"
              @change="getList"
            >
              <el-option label="处理中" value="processing" />
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>
          </form-item>
          <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
          <el-button type="primary" plain @click="openCreateDialog()">新增</el-button>
        </template>
      </CollapsibleFilterForm>
    </div>

    <div class="table-section remotion-table-section">
      <div class="common-table">
        <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading">
          <template #titleSlot="{ row }">
            <div class="record-title-cell">
              <div class="record-title-text">{{ row.title || '-' }}</div>
              <div class="record-title-sub">ID: {{ row.id }}</div>
            </div>
          </template>
          <template #templateSlot="{ row }">
            <div class="record-template-cell">
              <div class="record-template-name">{{ row.templateName || row.templateId }}</div>
              <div class="record-template-id">{{ row.templateId }}</div>
            </div>
          </template>
          <template #statusSlot="{ row }">
            <el-tag :type="getStatusTagType(row.status)" effect="plain">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
          <template #videoSlot="{ row }">
            <div class="record-video-cell">
              <el-button v-if="row.url" link type="primary" @click="previewVideo(row)">查看视频</el-button>
              <el-button v-if="row.url" link @click="copyLink(row.url, '视频链接')">复制链接</el-button>
              <span v-if="!row.url" class="text-xs opacity-60">-</span>
            </div>
          </template>
          <template #createTimeSlot="{ row }">
            <span>{{ formatTimestamp(row.createTime) }}</span>
          </template>
          <template #operationDefaultSlot="{ row }">
            <div class="flex items-center">
              <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)" size="small">
                <el-button type="primary" link size="small">
                  操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu class="operation-menu-small">
                    <el-dropdown-item command="detail">
                      <el-icon><View /></el-icon>
                      <span>查看详情</span>
                    </el-dropdown-item>
                    <el-dropdown-item command="regenerate">
                      <el-icon><RefreshRight /></el-icon>
                      <span>再次生成</span>
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

  <el-dialog v-model="createVisible" title="新增视频制作" fullscreen destroy-on-close class="remotion-create-dialog">
    <div class="remotion-create-layout">
      <div class="remotion-create-banner">
        <div class="remotion-create-banner__title">选择模板并填写参数后开始制作</div>
        <div class="remotion-create-banner__desc">先选择 Remotion 模板，再填写该模板对应的参数，确认无误后提交生成视频。</div>
      </div>
      <el-card shadow="never">
        <template #header>第 1 步 · 选择模板</template>
        <div class="template-info-panel">
          <el-form label-position="top" class="space-y-1">
            <el-form-item label="模板">
              <el-select v-model="form.templateId" class="w-full" filterable placeholder="请选择模板" @change="handleTemplateChange">
                <el-option v-for="item in templateOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="记录标题">
              <el-input v-model="form.title" placeholder="用于后台记录展示" />
            </el-form-item>
            <el-form-item label="等待时长(ms)">
              <el-input-number v-model="form.timeoutMs" :min="1000" :max="900000" :step="1000" class="w-full" />
            </el-form-item>
          </el-form>

          <div v-if="selectedTemplate" class="template-summary">
            <div class="template-summary-name">{{ selectedTemplate.name }}</div>
            <div class="template-summary-desc">{{ selectedTemplate.description || '暂无模板说明' }}</div>
            <div class="template-summary-meta">
              <span>{{ selectedTemplate.width }} x {{ selectedTemplate.height }}</span>
              <span>{{ selectedTemplate.fps }}fps</span>
              <span>{{ selectedTemplate.durationInFrames }}帧</span>
            </div>
          </div>
          <el-empty v-else description="请选择模板后再填写参数" :image-size="88" />
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>第 2 步 · 填写参数</template>
        <div class="remotion-form-panel">
          <el-form v-if="templateFields.length" label-position="top" class="space-y-1">
            <el-form-item v-for="field in templateFields" :key="field.key" :label="field.label">
              <el-input-number
                v-if="field.type === 'number'"
                v-model="form.inputProps[field.key]"
                class="w-full"
                :controls="true"
              />
              <el-input
                v-else-if="isTextareaField(field)"
                v-model="form.inputProps[field.key]"
                type="textarea"
                :rows="4"
                resize="vertical"
              />
              <el-input v-else v-model="form.inputProps[field.key]" :placeholder="field.label" />
            </el-form-item>
          </el-form>
          <el-empty v-else description="当前模板暂无可编辑参数" :image-size="88" />
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>第 3 步 · 确认制作</template>
        <div class="remotion-preview-panel">
          <pre>{{ formattedInputProps }}</pre>
          <div class="mt-4 flex flex-col gap-3">
            <el-button type="primary" :loading="submitLoading" @click="submitGenerate">开始制作</el-button>
            <el-button @click="createVisible = false">关闭</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </el-dialog>

  <el-dialog v-model="detailVisible" title="视频生成详情" fullscreen destroy-on-close class="remotion-detail-dialog">
    <div v-if="currentRow" class="remotion-detail-layout">
      <el-card shadow="never">
        <template #header>结果预览</template>
        <div class="remotion-video-preview">
          <video v-if="currentRow.url" :src="currentRow.url" controls class="remotion-video-player"></video>
          <el-empty v-else description="当前记录暂无视频结果" :image-size="96" />
        </div>
      </el-card>
      <div class="remotion-detail-grid">
        <el-card shadow="never">
          <template #header>基础信息</template>
          <div class="detail-section">
            <div><strong>标题：</strong>{{ currentRow.title || '-' }}</div>
            <div><strong>模板：</strong>{{ currentRow.templateName || currentRow.templateId }}</div>
            <div><strong>状态：</strong>{{ getStatusLabel(currentRow.status) }}</div>
            <div><strong>创建时间：</strong>{{ formatTimestamp(currentRow.createTime) }}</div>
            <div v-if="currentRow.url"><strong>COS地址：</strong>{{ currentRow.url }}</div>
            <div v-if="currentRow.remotionVideoUrl"><strong>Remotion地址：</strong>{{ currentRow.remotionVideoUrl }}</div>
            <div v-if="currentRow.errorMessage"><strong>失败信息：</strong>{{ currentRow.errorMessage }}</div>
          </div>
        </el-card>
        <el-card shadow="never">
          <template #header>输入参数</template>
          <div class="detail-json-panel">
            <pre>{{ formatJson(currentRow.inputProps) }}</pre>
          </div>
        </el-card>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Delete, RefreshRight, Search, View } from '@element-plus/icons-vue'
import { useWindowSize } from '@vueuse/core'
import { formatTimestamp } from '@/common/date'
import { commonGridOptions } from '@/common/table'
import {
  deleteRemotionVideoRecord,
  generateRemotionVideoRecord,
  getRemotionTemplateList,
  getRemotionVideoRecordDetail,
  getRemotionVideoRecordPage,
} from '@/api/remotion-video-record'
import FormItem from '@/components/Erp/formItem.vue'
import Pagination from '@/components/Pagination/index.vue'
import CollapsibleFilterForm from '@/components/CollapsibleFilterForm/index.vue'

const { height } = useWindowSize()
const loading = ref(false)
const total = ref(0)
const dataSource = ref<any[]>([])
const templateOptions = ref<any[]>([])
const createVisible = ref(false)
const detailVisible = ref(false)
const submitLoading = ref(false)
const currentRow = ref<any>(null)

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  keyword: '',
  status: '',
})

const form = reactive({
  templateId: '',
  title: '',
  timeoutMs: 300000,
  inputProps: {} as Record<string, any>,
})

const selectedTemplate = computed(() => templateOptions.value.find((item) => item.id === form.templateId) || null)
const formattedInputProps = computed(() => formatJson(form.inputProps))
const templateFields = computed(() => {
  const template = selectedTemplate.value
  if (!template) return []
  if (Array.isArray(template.assets) && template.assets.length) {
    return template.assets.map((item: any) => ({
      key: item.key,
      label: item.label || item.key,
      type: item.type || inferFieldType(item.key, template.defaultInputProps?.[item.key]),
    }))
  }
  return (template.editableFields || []).map((key: string) => ({
    key,
    label: key,
    type: inferFieldType(key, template.defaultInputProps?.[key]),
  }))
})

const gridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: Math.max(height.value - 250, 420),
  rowConfig: { keyField: 'id' },
  columns: [
    { title: '标题', field: 'title', minWidth: 260, slots: { default: 'titleSlot' } },
    { title: '模板', field: 'templateName', minWidth: 220, slots: { default: 'templateSlot' } },
    { title: '状态', field: 'status', width: 120, slots: { default: 'statusSlot' } },
    { title: '视频结果', field: 'url', minWidth: 180, slots: { default: 'videoSlot' } },
    { title: '创建时间', field: 'createTime', width: 180, slots: { default: 'createTimeSlot' } },
    { title: '操作', field: 'operation', width: 120, fixed: 'right', slots: { default: 'operationDefaultSlot' } },
  ],
}))

function handleKeywordChange(val: string) {
  if (!val) getList()
}

function inferFieldType(key: string, value: any) {
  if (typeof value === 'number') return 'number'
  if (/fontSize|width|height|duration|fps|size/i.test(key)) return 'number'
  return 'text'
}

function isTextareaField(field: { key: string; type: string }) {
  if (field.type !== 'text') return false
  return /text|content|subtitle|description|slogan|caption/i.test(field.key)
}

function getStatusLabel(status?: string) {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    success: '成功',
    failed: '失败',
  }
  return map[status || ''] || status || '-'
}

function getStatusTagType(status?: string) {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'processing') return 'warning'
  return 'info'
}

function formatJson(value: any) {
  try {
    return JSON.stringify(value || {}, null, 2)
  } catch {
    return '{}'
  }
}

async function loadTemplates() {
  const result: any = await getRemotionTemplateList()
  templateOptions.value = Array.isArray(result) ? result : []
}

function resetForm() {
  form.templateId = ''
  form.title = ''
  form.timeoutMs = 300000
  form.inputProps = {}
}

function handleTemplateChange() {
  form.inputProps = selectedTemplate.value?.defaultInputProps ? { ...selectedTemplate.value.defaultInputProps } : {}
  if (!form.title) {
    form.title = selectedTemplate.value?.name || ''
  }
}

function openCreateDialog(row?: any) {
  createVisible.value = true

  if (!row) {
    resetForm()
    return
  }

  form.templateId = row.templateId || ''
  form.title = row.title || ''
  form.timeoutMs = 300000
  form.inputProps = row.inputProps ? JSON.parse(JSON.stringify(row.inputProps)) : {}
}

async function submitGenerate() {
  if (!form.templateId) {
    ElMessage.warning('请先选择模板')
    return
  }
  submitLoading.value = true
  try {
    await generateRemotionVideoRecord({
      templateId: form.templateId,
      title: form.title || undefined,
      timeoutMs: Number(form.timeoutMs || 300000),
      inputProps: form.inputProps,
    })
    ElMessage.success('视频生成成功')
    createVisible.value = false
    await getList()
  } catch (error: any) {
    ElMessage.error(error?.message || '视频生成失败')
  } finally {
    submitLoading.value = false
  }
}

async function getList() {
  loading.value = true
  try {
    const result: any = await getRemotionVideoRecordPage({ ...queryParams })
    dataSource.value = result?.list || result?.records || []
    total.value = result?.total || 0
  } catch (error: any) {
    dataSource.value = []
    total.value = 0
    ElMessage.error(error?.message || '获取视频生成记录失败')
  } finally {
    loading.value = false
  }
}

async function openDetail(row: any) {
  const result: any = await getRemotionVideoRecordDetail(row.id)
  currentRow.value = result
  detailVisible.value = true
}

function previewVideo(row: any) {
  if (!row?.url) return
  window.open(row.url, '_blank')
}

async function copyLink(text: string, label: string) {
  if (!text) return
  await navigator.clipboard.writeText(text)
  ElMessage.success(`${label}已复制`)
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除记录「${row.title || row.id}」吗？`, '删除确认', { type: 'warning' })
    await deleteRemotionVideoRecord(row.id)
    ElMessage.success('删除成功')
    await getList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除视频记录失败')
    }
  }
}

function handleOperationCommand(command: string, row: any) {
  if (command === 'detail') {
    openDetail(row)
    return
  }
  if (command === 'regenerate') {
    openCreateDialog(row)
    return
  }
  if (command === 'delete') {
    handleDelete(row)
  }
}

onMounted(async () => {
  await loadTemplates()
  resetForm()
  await getList()
})
</script>

<style scoped>
.remotion-table-section {
  margin-top: 16px;
}

.record-title-cell,
.record-template-cell,
.record-video-cell,
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.record-title-text,
.record-template-name,
.template-summary-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.record-title-sub,
.record-template-id,
.template-summary-desc,
.template-summary-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.template-info-panel,
.remotion-form-panel,
.remotion-preview-panel,
.detail-section,
.detail-json-panel {
  height: 100%;
  overflow: auto;
}

.remotion-create-layout {
  height: calc(100vh - 56px);
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr) 360px;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
}

.remotion-create-banner {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 2px 0;
}

.remotion-create-banner__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.remotion-create-banner__desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.template-summary {
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  margin-top: 12px;
}

.template-summary-meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.remotion-preview-panel pre,
.detail-json-panel pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.7;
}

.remotion-detail-layout {
  height: calc(100vh - 56px);
  display: grid;
  grid-template-rows: 420px minmax(0, 1fr);
  gap: 16px;
}

.remotion-video-preview,
.remotion-video-player {
  width: 100%;
  height: 100%;
}

.remotion-video-player {
  background: #000;
  border-radius: 12px;
}

.remotion-detail-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

:deep(.remotion-create-dialog .el-dialog__body),
:deep(.remotion-detail-dialog .el-dialog__body) {
  overflow: hidden;
  padding: 16px 20px 20px;
}

:deep(.operation-menu-small .el-dropdown-menu__item) {
  min-height: 28px;
  padding: 4px 10px;
  font-size: 12px;
}

:deep(.operation-menu-small .el-dropdown-menu__item .el-icon) {
  font-size: 12px;
  margin-right: 6px;
}

@media (max-width: 1280px) {
  .remotion-create-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .remotion-detail-layout {
    grid-template-rows: 320px auto;
  }

  .remotion-detail-grid {
    grid-template-columns: 1fr;
  }
}

.remotion-filter-select {
  min-width: 132px;
}
</style>
