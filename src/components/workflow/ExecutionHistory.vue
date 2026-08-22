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
        height="calc(100vh - 150px)"
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

    <!-- 单条执行详情全屏沉浸式弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="执行记录详情"
      fullscreen
      append-to-body
      destroy-on-close
      class="wf-fullscreen-detail-dialog"
    >
      <div v-if="selectedRow" class="wf-detail-container">
        <!-- 顶部无边框沉浸式状态与统计栏 -->
        <div class="wf-detail-meta-bar">
          <div class="wf-detail-meta-left">
            <el-tag
              :type="getStatusTagType(selectedRow.status)"
              size="default"
              effect="dark"
              class="wf-detail-tag"
            >
              {{ getStatusLabel(selectedRow.status) }}
            </el-tag>
            <div class="wf-detail-chip">
              <span class="wf-detail-chip__label">触发方式</span>
              <span class="wf-detail-chip__val">{{ getTriggerLabel(selectedRow.triggerType) }}</span>
            </div>
            <div class="wf-detail-chip">
              <span class="wf-detail-chip__label">执行耗时</span>
              <span class="wf-detail-chip__val">{{ selectedRow.durationMs ? formatDuration(selectedRow.durationMs) : '-' }}</span>
            </div>
            <div class="wf-detail-chip">
              <span class="wf-detail-chip__label">触发时间</span>
              <span class="wf-detail-chip__val">{{ formatDate(selectedRow.createTime) }}</span>
            </div>
            <div class="wf-detail-chip">
              <span class="wf-detail-chip__label">完成节点</span>
              <span class="wf-detail-chip__val">{{ selectedRow.completedNodes ?? 0 }} / {{ selectedRow.totalNodes ?? '-' }}</span>
            </div>
          </div>

          <div class="wf-detail-meta-right">
            <span class="wf-detail-id">ID: {{ selectedRow.id }}</span>
          </div>
        </div>

        <!-- 异常提示 (轻量 Alert，无多余嵌套边框) -->
        <div v-if="selectedRow.errorText" class="wf-detail-alert">
          <el-icon class="wf-detail-alert__icon"><WarningFilled /></el-icon>
          <div class="wf-detail-alert__content">
            <div class="wf-detail-alert__title">执行异常日志</div>
            <div class="wf-detail-alert__msg">{{ selectedRow.errorText }}</div>
          </div>
        </div>

        <!-- 输入与输出双栏全屏展示 -->
        <div class="wf-detail-panes">
          <!-- 输入参数 -->
          <div class="wf-detail-pane">
            <div class="wf-detail-pane__header">
              <span class="wf-detail-pane__title">输入参数 (Input)</span>
              <el-button
                v-if="selectedRow.input"
                size="small"
                text
                type="primary"
                @click="copyText(formatJson(selectedRow.input))"
              >
                复制 JSON
              </el-button>
            </div>
            <div class="wf-detail-pane__body">
              <pre v-if="selectedRow.input" class="wf-clean-code">{{ formatJson(selectedRow.input) }}</pre>
              <div v-else class="wf-detail-empty">无输入参数</div>
            </div>
          </div>

          <!-- 执行输出 -->
          <div class="wf-detail-pane">
            <div class="wf-detail-pane__header">
              <span class="wf-detail-pane__title">执行输出 (Output)</span>
              <el-button
                v-if="selectedRow.output"
                size="small"
                text
                type="primary"
                @click="copyText(formatJson(selectedRow.output))"
              >
                复制 JSON
              </el-button>
            </div>
            <div class="wf-detail-pane__body">
              <pre v-if="selectedRow.output" class="wf-clean-code">{{ formatJson(selectedRow.output) }}</pre>
              <div v-else class="wf-detail-empty">暂无输出数据</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
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

const copyText = (text: string) => {
  if (!text) return
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => ElMessage.success('已复制到剪贴板'))
      .catch(() => ElMessage.error('复制失败'))
  } else {
    ElMessage.info('当前环境不支持剪贴板操作')
  }
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

/* ─────────────────────────────────────────────────────────────
   全屏极简详情视图 (Fullscreen Minimalist Detail View)
   ───────────────────────────────────────────────────────────── */
.wf-detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 120px);
  padding: 4px 6px;
}

.wf-detail-meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 14px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.wf-detail-meta-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.wf-detail-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;

  &__label {
    color: var(--el-text-color-secondary);
  }

  &__val {
    font-weight: 500;
    color: var(--el-text-color-primary);
    font-family: var(--el-font-family-mono, monospace);
  }
}

.wf-detail-id {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.wf-detail-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  border-radius: 8px;
  color: var(--el-color-danger);
  flex-shrink: 0;

  &__icon {
    font-size: 18px;
    margin-top: 2px;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 2px;
  }

  &__msg {
    font-size: 12px;
    line-height: 1.6;
    word-break: break-all;
    font-family: var(--el-font-family-mono, monospace);
  }
}

.wf-detail-panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.wf-detail-pane {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  height: 100%;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__body {
    flex: 1;
    overflow: auto;
    padding: 14px;
  }
}

.wf-clean-code {
  margin: 0;
  padding: 0;
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

.wf-detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

@keyframes wf-exec-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.7); }
}
</style>
