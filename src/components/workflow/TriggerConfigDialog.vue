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
        <div class="wf-pane-content">
          <el-table :data="executions" size="small" border height="280px" v-loading="loadingExecutions">
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">
                  {{ row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : '进行中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="triggerType" label="来源" width="80" />
            <el-table-column prop="durationMs" label="耗时(ms)" width="80">
              <template #default="{ row }">{{ row.durationMs || '-' }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间">
              <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
            </el-table-column>
          </el-table>
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
</style>
