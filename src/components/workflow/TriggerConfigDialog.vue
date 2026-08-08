<template>
  <el-dialog
    v-model="visible"
    title="工作流设置与触发器"
    width="500px"
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
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xs text-[var(--el-text-color-regular)] w-16">执行周期:</span>
              <el-select v-model="scheduleMode" size="small" style="width: 120px" @change="updateCronFromUI">
                <el-option label="每天" value="daily" />
                <el-option label="每小时" value="hourly" />
                <el-option label="固定间隔" value="interval" />
                <el-option label="自定义 Cron" value="custom" />
              </el-select>

              <!-- 每天：选择时间点 -->
              <el-time-picker
                v-if="scheduleMode === 'daily'"
                v-model="timePickerValue"
                format="HH:mm"
                size="small"
                placeholder="选择时间"
                style="width: 130px"
                @change="updateCronFromUI"
              />

              <!-- 间隔：选择分钟数 -->
              <div v-else-if="scheduleMode === 'interval'" class="flex items-center gap-1">
                <el-input-number
                  v-model="intervalMinutes"
                  :min="1"
                  :max="1440"
                  size="small"
                  controls-position="right"
                  style="width: 90px"
                  @change="updateCronFromUI"
                />
                <span class="text-xs text-[var(--el-text-color-secondary)]">分钟</span>
              </div>
            </div>

            <!-- 自定义 Cron 输入 -->
            <div v-if="scheduleMode === 'custom'" class="flex items-center gap-2 mb-3">
              <span class="text-xs text-[var(--el-text-color-regular)] w-16">Cron 表达式:</span>
              <el-input v-model="cronExpression" size="small" placeholder="例如: 0 8 * * *" style="width: 180px" />
            </div>

            <div class="flex items-center justify-between mt-2 pt-2 border-t border-[var(--app-content-border-color)]">
              <span v-if="cronNextRunTime" class="text-xs text-[var(--el-color-success)]">
                下次预计：{{ formatDate(cronNextRunTime) }}
              </span>
              <span v-else class="text-xs text-[var(--el-text-color-placeholder)]">
                表达式: {{ cronExpression }}
              </span>
              <el-button size="small" type="primary" @click="saveCronTrigger">保存定时设置</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 3. 运行日志列表 -->
      <el-tab-pane label="运行历史" name="executions">
        <div class="wf-pane-content">
          <el-table :data="executions" size="small" border height="240px" v-loading="loadingExecutions">
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
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
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

// 触发器状态
const manualEnabled = ref(true)

const cronEnabled = ref(false)
const cronExpression = ref('0 8 * * *')
const cronNextRunTime = ref<string | null>(null)

// 交互式时间选择状态
const scheduleMode = ref<'daily' | 'hourly' | 'interval' | 'custom'>('daily')
const timePickerValue = ref<Date | null>(new Date(2026, 0, 1, 8, 0))
const intervalMinutes = ref(5)

// 运行日志状态
const executions = ref<any[]>([])
const loadingExecutions = ref(false)

const updateCronFromUI = () => {
  if (scheduleMode.value === 'daily') {
    if (timePickerValue.value) {
      const date = new Date(timePickerValue.value)
      const h = date.getHours()
      const m = date.getMinutes()
      cronExpression.value = `${m} ${h} * * *`
    } else {
      cronExpression.value = '0 8 * * *'
    }
  } else if (scheduleMode.value === 'hourly') {
    const m = timePickerValue.value ? new Date(timePickerValue.value).getMinutes() : 0
    cronExpression.value = `${m} * * * *`
  } else if (scheduleMode.value === 'interval') {
    cronExpression.value = `*/${intervalMinutes.value || 5} * * * *`
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

      // 反解析 cron 填回 UI
      parseCronToUI(cronExpression.value)
    } else {
      cronEnabled.value = false
    }
  } catch (error) {
    console.error('加载触发器配置失败', error)
  }
}

const parseCronToUI = (cron: string) => {
  if (!cron) return
  if (cron.startsWith('*/')) {
    scheduleMode.value = 'interval'
    const match = cron.match(/\*\/(\d+)/)
    if (match) intervalMinutes.value = parseInt(match[1], 10)
  } else {
    const parts = cron.trim().split(/\s+/)
    if (parts.length === 5 && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
      if (parts[1] === '*') {
        scheduleMode.value = 'hourly'
        const m = parseInt(parts[0], 10) || 0
        timePickerValue.value = new Date(2026, 0, 1, 0, m)
      } else {
        scheduleMode.value = 'daily'
        const m = parseInt(parts[0], 10) || 0
        const h = parseInt(parts[1], 10) || 0
        timePickerValue.value = new Date(2026, 0, 1, h, m)
      }
    } else {
      scheduleMode.value = 'custom'
    }
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
  updateCronFromUI()
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
  padding: 8px 0;
}
.wf-setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--app-content-surface-muted-color);
  border-radius: 6px;
  margin-bottom: 12px;
}
.wf-setting-label {
  display: flex;
  flex-direction: column;
  font-size: 13px;
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
  padding: 12px;
  border-radius: 6px;
}
</style>
