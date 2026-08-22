<template>
  <div class="wf-exec-history">
    <!-- 顶部操作栏 -->
    <div class="wf-exec-history__toolbar">
      <div class="wf-exec-history__toolbar-left">
        <el-radio-group v-model="statusFilter" size="small">
          <el-radio-button label="all">全部 ({{ executions.length }})</el-radio-button>
          <el-radio-button label="success">
            成功 ({{ countByStatus('success') }})
          </el-radio-button>
          <el-radio-button label="failed">
            失败 ({{ countByStatus('failed') }})
          </el-radio-button>
          <el-radio-button label="running" v-if="countByStatus('running') > 0">
            运行中 ({{ countByStatus('running') }})
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="wf-exec-history__toolbar-right">
        <el-button
          v-if="showDelete"
          size="small"
          type="danger"
          plain
          :disabled="executions.length === 0"
          @click="emit('clear')"
        >
          清空记录
        </el-button>
        <el-button size="small" type="primary" plain :loading="loading" @click="emit('refresh')">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <!-- 表格列表 -->
    <div class="wf-exec-history__table-wrap">
      <el-table
        :data="filteredExecutions"
        v-loading="loading"
        stripe
        border
        size="small"
        style="width: 100%"
        max-height="460"
        empty-text="暂无执行记录"
      >
        <!-- 状态列 -->
        <el-table-column label="状态" width="105" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              size="small"
              effect="light"
              class="wf-exec-status-tag"
            >
              <span
                v-if="row.status === 'running'"
                class="wf-exec-status-dot wf-exec-status-dot--running"
              />
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 触发来源 -->
        <el-table-column label="触发方式" width="120" align="center">
          <template #default="{ row }">
            <span class="wf-exec-trigger">
              <el-icon class="wf-exec-trigger__icon">
                <Clock v-if="row.triggerType === 'cron'" />
                <Promotion v-else-if="row.triggerType === 'webhook'" />
                <Mouse v-else />
              </el-icon>
              {{ getTriggerLabel(row.triggerType) }}
            </span>
          </template>
        </el-table-column>

        <!-- 执行进度 / 节点数 -->
        <el-table-column label="节点进度" width="105" align="center">
          <template #default="{ row }">
            <span class="wf-exec-progress">
              {{ row.completedNodes ?? 0 }} / {{ row.totalNodes ?? '-' }}
            </span>
          </template>
        </el-table-column>

        <!-- 运行耗时 -->
        <el-table-column label="耗时" width="95" align="center">
          <template #default="{ row }">
            <span class="wf-exec-duration">
              {{ row.durationMs ? formatDuration(row.durationMs) : '-' }}
            </span>
          </template>
        </el-table-column>

        <!-- 触发时间 -->
        <el-table-column label="触发时间" width="165" align="center">
          <template #default="{ row }">
            <span class="wf-exec-time">{{ formatDate(row.createTime) }}</span>
          </template>
        </el-table-column>

        <!-- 结果摘要 / 异常信息 -->
        <el-table-column label="执行信息 / 异常日志" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.errorText" class="wf-exec-error-text">
              <el-icon><WarningFilled /></el-icon>
              {{ row.errorText }}
            </span>
            <span v-else-if="row.status === 'success'" class="wf-exec-success-text">
              执行完成
            </span>
            <span v-else-if="row.status === 'running'" class="wf-exec-running-text">
              正在执行节点 {{ row.currentNodeId || '' }}...
            </span>
            <span v-else class="wf-exec-muted-text">-</span>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="showDelete"
              type="danger"
              link
              size="small"
              @click="emit('delete', row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 单条执行详情抽屉/弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="执行记录详情"
      width="680px"
      append-to-body
      class="wf-detail-dialog"
    >
      <div v-if="selectedRow" class="wf-detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="记录 ID">
            <span class="wf-mono-text">{{ selectedRow.id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="执行状态">
            <el-tag :type="getStatusTagType(selectedRow.status)" size="small">
              {{ getStatusLabel(selectedRow.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="触发方式">
            {{ getTriggerLabel(selectedRow.triggerType) }}
          </el-descriptions-item>
          <el-descriptions-item label="执行耗时">
            {{ selectedRow.durationMs ? formatDuration(selectedRow.durationMs) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="触发时间">
            {{ formatDate(selectedRow.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="完成节点数">
            {{ selectedRow.completedNodes ?? 0 }} / {{ selectedRow.totalNodes ?? 0 }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 异常提示 -->
        <div v-if="selectedRow.errorText" class="wf-detail-section wf-detail-section--error">
          <div class="wf-detail-section__title">
            <el-icon><WarningFilled /></el-icon> 异常原因
          </div>
          <pre class="wf-code-block wf-code-block--error">{{ selectedRow.errorText }}</pre>
        </div>

        <!-- 输入数据 -->
        <div v-if="selectedRow.input" class="wf-detail-section">
          <div class="wf-detail-section__title">输入参数 (Input)</div>
          <pre class="wf-code-block">{{ formatJson(selectedRow.input) }}</pre>
        </div>

        <!-- 输出数据 -->
        <div v-if="selectedRow.output" class="wf-detail-section">
          <div class="wf-detail-section__title">执行输出 (Output)</div>
          <pre class="wf-code-block">{{ formatJson(selectedRow.output) }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Clock,
  Promotion,
  Mouse,
  WarningFilled,
  Refresh,
} from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    executions: any[]
    loading?: boolean
    showDelete?: boolean
  }>(),
  { loading: false, showDelete: false }
)

const emit = defineEmits(['refresh', 'delete', 'clear'])

const statusFilter = ref<string>('all')
const detailVisible = ref(false)
const selectedRow = ref<any>(null)

const countByStatus = (status: string) => {
  return props.executions.filter((e) => e.status === status).length
}

const filteredExecutions = computed(() => {
  if (statusFilter.value === 'all') return props.executions
  return props.executions.filter((e) => e.status === statusFilter.value)
})

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'running':
      return '运行中'
    case 'queued':
      return '排队中'
    case 'cancelled':
      return '已取消'
    case 'paused':
      return '已暂停'
    default:
      return status || '未知'
  }
}

const getStatusTagType = (status: string): any => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'running':
      return 'primary'
    case 'queued':
      return 'warning'
    case 'paused':
      return 'warning'
    case 'cancelled':
      return 'info'
    default:
      return 'info'
  }
}

const getTriggerLabel = (type: string) => {
  switch (type) {
    case 'cron':
      return '定时触发'
    case 'webhook':
      return 'Webhook'
    case 'manual':
      return '手动触发'
    default:
      return type || '手动触发'
  }
}

const formatDate = (val: string) => {
  if (!val) return '-'
  const d = new Date(val)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const formatDuration = (ms: number) => {
  if (!ms || ms <= 0) return '-'
  if (ms < 1000) return `${ms}ms`
  const s = (ms / 1000).toFixed(1)
  if (Number(s) < 60) return `${s}s`
  const m = Math.floor(Number(s) / 60)
  const sec = Math.round(Number(s) % 60)
  return `${m}m ${sec}s`
}

const formatJson = (data: any) => {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

const handleViewDetail = (row: any) => {
  selectedRow.value = row
  detailVisible.value = true
}
</script>

<style scoped lang="scss">
.wf-exec-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 240px;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__table-wrap {
    border-radius: 6px;
    overflow: hidden;
  }
}

.wf-exec-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.wf-exec-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;

  &--running {
    animation: wf-exec-pulse 1.2s ease-in-out infinite;
  }
}

.wf-exec-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);

  &__icon {
    font-size: 13px;
    color: var(--el-color-primary);
  }
}

.wf-exec-progress {
  font-size: 12px;
  font-weight: 500;
  font-family: var(--el-font-family-mono, monospace);
  color: var(--el-text-color-regular);
}

.wf-exec-duration {
  font-size: 12px;
  font-family: var(--el-font-family-mono, monospace);
  color: var(--el-text-color-secondary);
}

.wf-exec-time {
  font-size: 12px;
  font-family: var(--el-font-family-mono, monospace);
  color: var(--el-text-color-secondary);
}

.wf-exec-error-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-color-danger);
}

.wf-exec-success-text {
  font-size: 12px;
  color: var(--el-color-success);
}

.wf-exec-running-text {
  font-size: 12px;
  color: var(--el-color-primary);
}

.wf-exec-muted-text {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.wf-mono-text {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 11px;
}

.wf-detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wf-detail-section {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &--error &__title {
    color: var(--el-color-danger);
  }
}

.wf-code-block {
  margin: 0;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  max-height: 220px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;

  &--error {
    background: color-mix(in srgb, var(--el-color-danger) 6%, transparent);
    border-color: color-mix(in srgb, var(--el-color-danger) 25%, transparent);
    color: var(--el-color-danger);
  }
}

@keyframes wf-exec-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.7); }
}
</style>
