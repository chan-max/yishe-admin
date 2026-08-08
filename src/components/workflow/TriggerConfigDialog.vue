<template>
  <el-dialog
    v-model="visible"
    title="工作流设置与触发器"
    width="540px"
    destroy-on-close
    append-to-body
    class="wf-trigger-dialog"
  >
    <el-tabs v-model="activeTab" class="wf-trigger-tabs" @tab-change="handleTabChange">
      <!-- 1. 手动触发 -->
      <el-tab-pane label="手动触发" name="manual">
        <div class="wf-pane-content">
          <div class="wf-setting-item">
            <div class="wf-setting-label">
              <span>启用手动触发</span>
              <span class="wf-setting-desc">允许在编辑器控制台或通过 API 点击直接运行</span>
            </div>
            <el-switch v-model="manualEnabled" size="small" @change="saveManualTrigger" />
          </div>

          <div class="wf-code-box">
            <div class="wf-code-title">API 手动触发格式：</div>
            <code>POST /api/workflow/{{ props.workflowId }}/run</code>
          </div>
        </div>
      </el-tab-pane>

      <!-- 2. 定时 Cron 触发器 -->
      <el-tab-pane label="定时调度" name="cron">
        <div class="wf-pane-content">
          <div class="wf-setting-item">
            <div class="wf-setting-label">
              <span>启用定时调度</span>
              <span class="wf-setting-desc">基于 Redis ZSET 定时调度引擎自动按周期触发</span>
            </div>
            <el-switch v-model="cronEnabled" size="small" @change="saveCronTrigger" />
          </div>

          <div class="wf-cron-form">
            <div class="flex items-center justify-between mb-3">
              <div class="flex flex-col">
                <span class="text-xs font-500 text-[var(--el-text-color-regular)]">当前 Cron 表达式：</span>
                <span class="text-sm font-mono text-[var(--el-color-primary)] font-600 mt-0.5">
                  {{ cronExpression || '未设置' }}
                </span>
              </div>
              <el-button size="small" type="primary" plain @click="advancedCronVisible = true">
                配置 Cron 与快捷预设
              </el-button>
            </div>

            <div v-if="cronNextRunTime" class="text-xs text-[var(--el-color-success)] pt-2 border-t border-[var(--app-content-border-color)]">
              下次预计触发时间：{{ formatDate(cronNextRunTime) }}
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 3. 运行日志列表 -->
      <el-tab-pane label="运行历史" name="executions">
        <div class="wf-pane-content flex flex-col">
          <!-- 工具栏 (刷新按钮 + 数量统计) -->
          <div class="flex items-center justify-between mb-2 px-1">
            <span class="text-xs text-[var(--el-text-color-secondary)]">
              共 {{ executions.length }} 条运行记录
            </span>
            <el-button
              size="small"
              type="primary"
              text
              bg
              :loading="loadingExecutions"
              @click="loadExecutions"
            >
              刷新日志
            </el-button>
          </div>

          <!-- 列表或空状态 -->
          <div v-loading="loadingExecutions" class="wf-exec-container">
            <div v-if="executions.length === 0" class="wf-exec-empty flex flex-col items-center justify-center py-10">
              <span class="text-xs text-[var(--el-text-color-placeholder)]">暂无运行历史记录</span>
            </div>

            <div v-else class="flex flex-col gap-2">
              <div
                v-for="item in executions"
                :key="item.id"
                class="wf-exec-card"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="wf-exec-dot"
                      :class="'wf-exec-dot--' + item.status"
                    />
                    <span class="text-xs font-600 text-[var(--el-text-color-primary)]">
                      {{ item.status === 'success' ? '执行成功' : item.status === 'failed' ? '执行失败' : '正在运行' }}
                    </span>

                    <span
                      class="wf-exec-source-tag"
                      :class="'wf-exec-source-tag--' + item.triggerType"
                    >
                      {{ item.triggerType === 'cron' ? '定时调度' : '手动触发' }}
                    </span>
                  </div>

                  <div class="flex items-center gap-3 text-xs text-[var(--el-text-color-secondary)]">
                    <span v-if="item.durationMs" class="font-mono text-11px">
                      {{ item.durationMs }} ms
                    </span>
                    <span>{{ formatDate(item.createTime) }}</span>
                  </div>
                </div>

                <!-- 错误日志信息 -->
                <div v-if="item.errorText" class="wf-exec-error-box mt-2 text-xs font-mono">
                  {{ item.errorText }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <AdvancedCronDialog v-model="advancedCronVisible" :workflow-id="props.workflowId" @saved="loadTriggers" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AdvancedCronDialog from './AdvancedCronDialog.vue'
import {
  getWorkflowTriggersApi,
  saveWorkflowTriggerApi,
  getWorkflowExecutionsApi,
} from '@/api/workflow'

const props = defineProps<{
  modelValue: boolean
  workflowId: string
}>()

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const activeTab = ref('manual')
const advancedCronVisible = ref(false)

// 触发器状态
const manualEnabled = ref(true)

const cronEnabled = ref(false)
const cronExpression = ref('0 8 * * *')
const cronNextRunTime = ref<string | null>(null)

// 时间选择器
const timePickerValue = ref<Date | null>(new Date(2026, 0, 1, 8, 0))

// 快捷 Cron 模板
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

// 运行日志状态
const executions = ref<any[]>([])
const loadingExecutions = ref(false)

const handleTimePickerChange = (val: Date | null) => {
  if (val) {
    const d = new Date(val)
    const h = d.getHours()
    const m = d.getMinutes()
    cronExpression.value = `${m} ${h} * * *`
  }
}

const applyCronTemplate = (expr: string) => {
  cronExpression.value = expr
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

const loadTriggers = async () => {
  if (!props.workflowId) return
  try {
    const res = await getWorkflowTriggersApi(props.workflowId)
    const list = res || []

    const manual = list.find((t: any) => t.type === 'manual')
    manualEnabled.value = manual ? manual.enabled : true

    const cron = list.find((t: any) => t.type === 'cron')
    if (cron) {
      cronEnabled.value = cron.enabled
      cronExpression.value = cron.config?.expression || '0 8 * * *'
      cronNextRunTime.value = cron.nextRunTime || null
      parseCronToTimePicker(cronExpression.value)
    } else {
      cronEnabled.value = false
    }
  } catch (error) {
    console.error('加载触发器配置失败', error)
  }
}

const loadExecutions = async () => {
  if (!props.workflowId) return
  loadingExecutions.value = true
  try {
    const res = await getWorkflowExecutionsApi(props.workflowId, { currentPage: 1, pageSize: 20 })
    executions.value = res?.list || []
  } catch (err) {
    console.error('获取运行日志失败', err)
  } finally {
    loadingExecutions.value = false
  }
}

const handleTabChange = (name: any) => {
  if (name === 'executions') {
    loadExecutions()
  }
}

const saveManualTrigger = async () => {
  try {
    await saveWorkflowTriggerApi(props.workflowId, {
      type: 'manual',
      enabled: manualEnabled.value,
    })
    ElMessage.success('手动触发配置已更新')
  } catch (err: any) {
    ElMessage.error(err.message || '更新失败')
  }
}

const saveCronTrigger = async () => {
  try {
    const res = await saveWorkflowTriggerApi(props.workflowId, {
      type: 'cron',
      enabled: cronEnabled.value,
      config: { expression: cronExpression.value },
    })
    if (res?.nextRunTime) {
      cronNextRunTime.value = res.nextRunTime
    }
    ElMessage.success('定时调度配置已保存')
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败，请检查 Cron 表达式')
  }
}

const formatDate = (val: string) => {
  if (!val) return '-'
  return new Date(val).toLocaleString()
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      loadTriggers()
      if (activeTab.value === 'executions') {
        loadExecutions()
      }
    }
  }
)
</script>

<style scoped>
.wf-pane-content {
  padding: 4px 0;
}
.wf-setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--app-content-surface-muted-color);
  border-radius: 6px;
  margin-bottom: 10px;
}
.wf-setting-label {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  font-weight: 500;
}
.wf-setting-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.wf-code-box {
  background: #1e1e1e;
  color: #4ec9b0;
  padding: 10px 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
}
.wf-cron-form {
  background: var(--app-content-surface-muted-color);
  padding: 10px 12px;
  border-radius: 6px;
}
.wf-template-card {
  border: 1px solid var(--el-border-color-light);
  background: var(--app-content-surface-color);
  padding: 8px 10px;
  border-radius: 6px;
}
.wf-reference-card {
  border: 1px solid var(--el-border-color-light);
  background: var(--app-content-surface-color);
  padding: 8px 10px;
  border-radius: 6px;
}
.wf-reference-list {
  max-height: 120px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.wf-reference-item {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}
.wf-ref-label {
  font-weight: 500;
  color: var(--el-text-color-regular);
}
.wf-ref-expr {
  font-family: monospace;
  color: var(--el-color-primary);
  background: var(--app-content-surface-muted-color);
  padding: 0 4px;
  border-radius: 3px;
}
.wf-ref-desc {
  opacity: 0.85;
}
.wf-exec-container {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 2px;
}
.wf-exec-card {
  background: var(--app-content-surface-muted-color);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s ease;
}
.wf-exec-card:hover {
  border-color: var(--el-border-color);
}
.wf-exec-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}
.wf-exec-dot--success {
  background: var(--el-color-success);
}
.wf-exec-dot--failed {
  background: var(--el-color-danger);
}
.wf-exec-dot--running {
  background: var(--el-color-warning);
}
.wf-exec-source-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}
.wf-exec-source-tag--cron {
  color: var(--el-color-warning);
  background: rgba(230, 162, 60, 0.12);
}
.wf-exec-source-tag--manual {
  color: var(--el-color-primary);
  background: rgba(64, 158, 255, 0.12);
}
.wf-exec-error-box {
  background: rgba(245, 108, 108, 0.08);
  color: var(--el-color-danger);
  padding: 6px 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
