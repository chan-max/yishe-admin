<template>
  <el-dialog
    v-model="visible"
    title="定时调度高级配置与预设模板"
    width="680px"
    destroy-on-close
    append-to-body
    class="wf-advanced-cron-dialog"
  >
    <div class="wf-cron-dialog-body" v-loading="loading">
      <el-form label-position="top" size="small" class="wf-cron-dialog-form">
        <!-- 基础信息 -->
        <div class="wf-form-section">
          <div class="wf-section-title">基础信息</div>
          <div class="grid grid-cols-2 gap-3">
            <el-form-item label="调度名称">
              <el-input v-model="form.name" placeholder="请输入调度名称" maxlength="200" show-word-limit />
            </el-form-item>
            <el-form-item label="是否启用">
              <el-switch v-model="form.enabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </div>
        </div>

        <!-- 执行配置 -->
        <div class="wf-form-section mt-3">
          <div class="wf-section-title">执行配置</div>
          <div class="grid grid-cols-2 gap-3">
            <el-form-item label="Cron 表达式">
              <el-input
                v-model="form.expression"
                placeholder="例如: */10 * * * *"
                @input="handleExpressionInput"
              />
              <span v-if="nextRunPreview" class="text-xs text-[var(--el-color-success)] mt-1">
                下次预计: {{ nextRunPreview }}
              </span>
            </el-form-item>

            <el-form-item label="时间选择器">
              <el-time-picker
                v-model="timePickerValue"
                format="HH:mm"
                size="small"
                placeholder="选择时间点"
                style="width: 100%"
                @change="handleTimePickerChange"
              />
            </el-form-item>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-2">
            <el-form-item label="超时覆盖 (ms)">
              <el-input-number
                v-model="form.timeoutMs"
                :min="0"
                :step="1000"
                controls-position="right"
                placeholder="例如: 60000"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="参数覆盖 (JSON)">
              <el-input
                v-model="form.paramsOverride"
                type="textarea"
                :rows="2"
                placeholder='请输入 JSON，例如 { "shopId": 1 }'
              />
            </el-form-item>
          </div>
        </div>

        <!-- Cron 快捷模板 -->
        <div class="wf-form-section mt-3">
          <div class="wf-section-title">Cron 快捷模板</div>
          <div class="flex flex-wrap gap-1.5 mt-1">
            <el-button
              v-for="item in cronTemplates"
              :key="item.expr"
              size="small"
              :type="form.expression === item.expr ? 'primary' : 'default'"
              plain
              @click="applyTemplate(item.expr)"
            >
              {{ item.label }}
            </el-button>
          </div>
        </div>

        <!-- Cron 参考 -->
        <div class="wf-form-section mt-3">
          <div class="wf-section-title">Cron 参考说明</div>
          <div class="wf-ref-grid">
            <div v-for="item in cronTemplates" :key="`${item.expr}-ref`" class="wf-ref-cell">
              <span class="font-600 text-[var(--el-text-color-primary)]">{{ item.label }}:</span>
              <code class="wf-ref-code">{{ item.expr }}</code>
              <span class="text-[var(--el-text-color-secondary)]">{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <el-button size="small" @click="visible = false">取消</el-button>
      <el-button size="small" type="primary" :loading="saving" @click="handleSave">保存预设配置</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getWorkflowTriggersApi, saveWorkflowTriggerApi } from '@/api/workflow'

const props = defineProps<{
  modelValue: boolean
  workflowId: string
}>()

const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const loading = ref(false)
const saving = ref(false)
const nextRunPreview = ref<string | null>(null)
const timePickerValue = ref<Date | null>(new Date(2026, 0, 1, 8, 0))

const form = ref({
  name: '工作流定时调度',
  enabled: true,
  expression: '0 8 * * *',
  timeoutMs: 60000,
  paramsOverride: '{}',
})

const cronTemplates = [
  { label: '每 5 分钟', expr: '*/5 * * * *', desc: '适合高频轻量任务' },
  { label: '每 10 分钟', expr: '*/10 * * * *', desc: '常用轮询任务' },
  { label: '每 30 分钟', expr: '*/30 * * * *', desc: '中频同步任务' },
  { label: '每小时整点', expr: '0 * * * *', desc: '每小时执行一次' },
  { label: '每天 09:00', expr: '0 9 * * *', desc: '每天上午 9 点' },
  { label: '每天 12:00', expr: '0 12 * * *', desc: '每天中午 12 点' },
  { label: '每天 18:00', expr: '0 18 * * *', desc: '每天下午 6 点' },
  { label: '每天 00:30', expr: '30 0 * * *', desc: '适合夜间批处理' },
  { label: '工作日 09:00', expr: '0 9 * * 1-5', desc: '周一到周五上午 9 点' },
  { label: '工作日 18:00', expr: '0 18 * * 1-5', desc: '周一到周五下午 6 点' },
  { label: '每周一 09:00', expr: '0 9 * * 1', desc: '每周一上午 9 点' },
  { label: '每周日 23:00', expr: '0 23 * * 0', desc: '每周日晚上 11 点' },
  { label: '每月 1 日 09:00', expr: '0 9 1 * *', desc: '每月 1 日上午 9 点' },
  { label: '每月最后一天 23:00', expr: '0 23 28-31 * *', desc: '需脚本内自行兜底最后一天判断' },
]

const handleTimePickerChange = (val: Date | null) => {
  if (val) {
    const d = new Date(val)
    const h = d.getHours()
    const m = d.getMinutes()
    form.value.expression = `${m} ${h} * * *`
  }
}

const applyTemplate = (expr: string) => {
  form.value.expression = expr
  parseCronToTimePicker(expr)
}

const parseCronToTimePicker = (expr: string) => {
  const parts = expr.trim().split(/\s+/)
  if (parts.length === 5 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
    const m = parseInt(parts[0], 10)
    const h = parseInt(parts[1], 10)
    timePickerValue.value = new Date(2026, 0, 1, h, m)
  }
}

const handleExpressionInput = () => {
  parseCronToTimePicker(form.value.expression)
}

const loadTriggerConfig = async () => {
  if (!props.workflowId) return
  loading.value = true
  try {
    const triggers = await getWorkflowTriggersApi(props.workflowId)
    const cron = (triggers || []).find((t: any) => t.type === 'cron')
    if (cron) {
      form.value.enabled = cron.enabled
      form.value.name = cron.config?.name || '工作流定时调度'
      form.value.expression = cron.config?.expression || '0 8 * * *'
      form.value.timeoutMs = cron.config?.timeoutMs || 60000
      form.value.paramsOverride = cron.config?.paramsOverride
        ? JSON.stringify(cron.config.paramsOverride, null, 2)
        : '{}'
      parseCronToTimePicker(form.value.expression)
      if (cron.nextRunTime) {
        nextRunPreview.value = new Date(cron.nextRunTime).toLocaleString()
      }
    }
  } catch (err) {
    console.error('加载定时配置失败', err)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  let parsedParams = {}
  try {
    if (form.value.paramsOverride.trim()) {
      parsedParams = JSON.parse(form.value.paramsOverride)
    }
  } catch (err) {
    ElMessage.error('参数覆盖 JSON 格式不合法')
    return
  }

  saving.value = true
  try {
    const res = await saveWorkflowTriggerApi(props.workflowId, {
      type: 'cron',
      enabled: form.value.enabled,
      config: {
        name: form.value.name,
        expression: form.value.expression,
        timeoutMs: form.value.timeoutMs,
        paramsOverride: parsedParams,
      },
    })
    if (res?.nextRunTime) {
      nextRunPreview.value = new Date(res.nextRunTime).toLocaleString()
    }
    ElMessage.success('定时调度预设配置保存成功')
    emit('saved', res)
    visible.value = false
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) loadTriggerConfig()
  }
)
</script>

<style scoped>
.wf-form-section {
  background: var(--app-content-surface-muted-color);
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
}
.wf-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}
.wf-ref-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  max-height: 140px;
  overflow-y: auto;
}
.wf-ref-cell {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.wf-ref-code {
  font-family: monospace;
  color: var(--el-color-primary);
  background: var(--app-content-surface-color);
  padding: 0 4px;
  border-radius: 3px;
}
</style>
