<template>
  <ContentWrap title="AI 文字转语音记录">
    <div class="list-page-layout">
      <div class="filter-section">
        <div class="search-bar">
          <div class="search-form-container">
            <div class="search-field search-field-wide">
              <label class="search-label">搜索</label>
              <el-input
                v-model="queryParams.search"
                placeholder="文案 / 返回URL"
                clearable
                @keyup.enter="getList"
                @clear="getList"
              />
            </div>
            <div class="search-field">
              <label class="search-label"></label>
              <div class="search-actions">
                <el-button type="primary" @click="getList">搜索</el-button>
                <el-button type="primary" :icon="Plus" @click="handleAdd">创建</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-container">
        <div class="table-section">
          <div class="common-table">
            <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading">
            <template #textSlot="{ row }">
              <div class="clamp-3">{{ row.text || '-' }}</div>
            </template>
            <template #configSlot="{ row }">
              <div class="config-cell">{{ formatConfig(row.configParams) }}</div>
            </template>
            <template #previewSlot="{ row }">
              <audio v-if="row.resultUrl" :src="row.resultUrl" controls preload="none" class="audio-preview" />
              <span v-else>-</span>
            </template>
            <template #statusSlot="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
                {{ row.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </template>
            <template #operationSlot="{ row }">
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
            </vxe-grid>
          </div>
        </div>

        <div class="pagination-section">
          <pagination
            :total="total"
            v-model:page="queryParams.page"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" fullscreen class="tts-create-dialog" :destroy-on-close="true">
      <div class="tts-create-body">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
          <el-form-item label="文案" prop="text">
            <el-input v-model="form.text" type="textarea" :rows="6" maxlength="1000" show-word-limit />
          </el-form-item>

          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item label="音色" prop="voice">
                <el-select v-model="form.voice" class="w-full">
                  <el-option label="Cherry" value="Cherry" />
                  <el-option label="Serena" value="Serena" />
                  <el-option label="Ethan" value="Ethan" />
                  <el-option label="Vivian" value="Vivian" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="模型" prop="model">
                <el-select v-model="form.model" class="w-full">
                  <el-option label="qwen3-tts-flash" value="qwen3-tts-flash" />
                  <el-option label="qwen3-tts-instruct-flash" value="qwen3-tts-instruct-flash" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :md="8">
              <el-form-item label="格式" prop="format">
                <el-select v-model="form.format" class="w-full">
                  <el-option label="mp3" value="mp3" />
                  <el-option label="wav" value="wav" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item label="语速" prop="speed">
                <el-input-number v-model="form.speed" :min="0.5" :max="2" :step="0.1" class="w-full" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item label="语调" prop="pitch">
                <el-input-number v-model="form.pitch" :min="0.5" :max="2" :step="0.1" class="w-full" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">创建并生成</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watchEffect } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createTtsRecord, deleteTtsRecord, getTtsRecordPage } from '@/api/ai/tts'
import { commonGridOptions } from '@/common/table'
import { useWindowSize } from '@vueuse/core'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('创建语音')
const total = ref(0)
const dataSource = ref<any[]>([])
const formRef = ref()

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  search: ''
})

const { height } = useWindowSize()
const gridOptions = ref<any>({
  ...commonGridOptions,
  columns: [
    { type: 'seq', title: '#', width: 58 },
    { title: '文案', field: 'text', minWidth: 220, slots: { default: 'textSlot' } },
    { title: '配置参数', field: 'configParams', minWidth: 260, slots: { default: 'configSlot' } },
    { title: '试听', field: 'preview', width: 200, slots: { default: 'previewSlot' } },
    { title: '时长(秒)', field: 'duration', width: 96 },
    { title: '状态', field: 'status', width: 88, slots: { default: 'statusSlot' } },
    { title: '创建时间', field: 'createTime', width: 170 },
    { title: '操作', fixed: 'right', width: 90, slots: { default: 'operationSlot' } }
  ]
})

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 255
})

const form = reactive({
  id: '',
  text: '',
  voice: 'Cherry',
  model: 'qwen3-tts-flash',
  format: 'mp3',
  sample_rate: 24000,
  speed: 1,
  pitch: 1
})

const rules = {
  text: [{ required: true, message: '请输入文案', trigger: 'blur' }],
  voice: [{ required: true, message: '请选择音色', trigger: 'change' }],
  model: [{ required: true, message: '请选择模型', trigger: 'change' }]
}

const resetForm = () => {
  form.id = ''
  form.text = ''
  form.voice = 'Cherry'
  form.model = 'qwen3-tts-flash'
  form.format = 'mp3'
  form.sample_rate = 24000
  form.speed = 1
  form.pitch = 1
}

const formatConfig = (configParams: any) => {
  if (!configParams) return '-'
  const parts = [
    `voice:${configParams.voice || '-'}`,
    `model:${configParams.model || '-'}`,
    `format:${configParams.format || '-'}`,
    `speed:${configParams.speed ?? '-'}`,
    `pitch:${configParams.pitch ?? '-'}`
  ]
  return parts.join(' | ')
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getTtsRecordPage({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      search: queryParams.search
    })
    const payload = res?.data ?? res
    dataSource.value = payload?.list || []
    total.value = payload?.total || 0
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '创建语音'
  resetForm()
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()

  submitLoading.value = true
  try {
    const res = await createTtsRecord({
      text: form.text,
      voice: form.voice,
      model: form.model,
      format: form.format,
      sample_rate: form.sample_rate,
      speed: form.speed,
      pitch: form.pitch
    })
    const payload = res?.data ?? res

    if (payload?.status === 'failed') {
      ElMessage.warning(`创建成功，但生成失败：${payload?.errorMessage || '未知错误'}`)
    } else {
      ElMessage.success('创建并生成成功')
    }

    dialogVisible.value = false
    await getList()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm('确认删除该记录吗？', '提示', { type: 'warning' })
  await deleteTtsRecord(row.id)
  ElMessage.success('删除成功')
  await getList()
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.list-page-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}

.filter-section {
  margin: 0;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.table-section {
  flex: 1;
  min-height: 0;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-top: 16px;
  margin-bottom: 24px;
}

.content-container {
  padding: 0 4px;
}

.common-table {
  overflow-x: auto;
}

.search-bar {
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-form-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 10px 12px;
  margin-bottom: 12px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  width: 240px;
  flex-shrink: 0;
}

.search-field-wide {
  width: 320px;
}

.search-label {
  width: 48px;
  min-width: 48px;
  text-align: right;
  padding-right: 4px;
  line-height: 32px;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
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

.search-field .el-button {
  white-space: nowrap;
}

.search-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  column-gap: 6px;
  row-gap: 6px;
  align-items: center;
}


.audio-preview {
  width: 180px;
  height: 28px;
}

.clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  word-break: break-all;
}

.config-cell {
  white-space: normal;
  line-height: 1.4;
  word-break: break-all;
}

.tts-create-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.tts-create-body {
  height: calc(100vh - 124px);
  overflow-y: auto;
  padding: 24px;
}

@media (max-width: 768px) {
  .tts-create-body {
    padding: 16px;
    height: calc(100vh - 116px);
  }
}
</style>
