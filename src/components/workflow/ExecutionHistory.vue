<template>
  <div class="wf-exec-history">
    <div class="wf-exec-history__toolbar">
      <span class="wf-exec-history__count">共 {{ executions.length }} 条记录</span>
      <div class="wf-exec-history__actions">
        <el-button
          v-if="showDelete"
          size="small"
          type="danger"
          plain
          :disabled="executions.length === 0"
          @click="emit('clear')"
        >
          清空
        </el-button>
        <el-button size="small" type="primary" text :loading="loading" @click="emit('refresh')">
          刷新
        </el-button>
      </div>
    </div>

    <div class="wf-exec-history__list" v-loading="loading">
      <div v-if="!loading && executions.length === 0" class="wf-exec-history__empty">
        <el-icon class="wf-exec-history__empty-icon"><DocumentDelete /></el-icon>
        <span>暂无执行记录</span>
      </div>

      <div
        v-for="item in executions"
        :key="item.id"
        class="wf-exec-item"
        :class="'wf-exec-item--' + item.status"
      >
        <div class="wf-exec-item__indicator">
          <span class="wf-exec-item__dot" :class="'wf-exec-item__dot--' + item.status" />
          <span v-if="executions.indexOf(item) < executions.length - 1" class="wf-exec-item__line" />
        </div>
        <div class="wf-exec-item__content">
          <div class="wf-exec-item__header">
            <div class="wf-exec-item__meta">
              <span
                class="wf-exec-item__status"
                :class="'wf-exec-item__status--' + item.status"
              >
                {{ item.status === 'success' ? '成功' : item.status === 'failed' ? '失败' : '运行中' }}
              </span>
              <span class="wf-exec-item__trigger">
                <el-icon><Clock v-if="item.triggerType === 'cron'" /><Promotion v-else-if="item.triggerType === 'webhook'" /><Mouse v-else /></el-icon>
                {{ item.triggerType === 'cron' ? '定时触发' : item.triggerType === 'webhook' ? 'Webhook' : '手动触发' }}
              </span>
              <span class="wf-exec-item__duration" v-if="item.durationMs">
                <el-icon><Timer /></el-icon>{{ formatDuration(item.durationMs) }}
              </span>
            </div>
            <div class="wf-exec-item__time">
              {{ formatDate(item.createTime) }}
              <el-button
                v-if="showDelete"
                class="wf-exec-item__delete"
                size="small"
                type="danger"
                text
                @click="emit('delete', item.id)"
              >
                删除
              </el-button>
            </div>
          </div>
          <div class="wf-exec-item__error" v-if="item.errorText">
            <el-icon><WarningFilled /></el-icon>
            <span>{{ item.errorText }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock, Promotion, Mouse, Timer, DocumentDelete, WarningFilled } from '@element-plus/icons-vue'

withDefaults(
  defineProps<{
    executions: any[]
    loading?: boolean
    showDelete?: boolean
  }>(),
  { loading: false, showDelete: false }
)

const emit = defineEmits(['refresh', 'delete', 'clear'])

const formatDate = (val: string) => {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return ms + 'ms'
  const s = Math.round(ms / 1000)
  if (s < 60) return s + 's'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}m${sec}s`
}
</script>

<style scoped lang="scss">
.wf-exec-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__count {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
    min-height: 0;
    max-height: calc(100vh - 140px);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 0;
    color: var(--el-text-color-placeholder);
    font-size: 14px;
  }

  &__empty-icon {
    font-size: 48px;
    opacity: 0.4;
  }
}

.wf-exec-item {
  display: flex;
  gap: 12px;
  position: relative;

  &__indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 14px;
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;

    &--success { background: var(--el-color-success); }
    &--failed { background: var(--el-color-danger); }
    &--running { background: var(--el-color-warning); animation: wf-exec-pulse 1.4s ease-in-out infinite; }
  }

  &__line {
    flex: 1;
    width: 2px;
    background: var(--app-content-border-color);
    margin-top: 4px;
  }

  &__content {
    flex: 1;
    min-width: 0;
    padding-bottom: 16px;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__status {
    font-size: 13px;
    font-weight: 600;

    &--success { color: var(--el-color-success); }
    &--failed { color: var(--el-color-danger); }
    &--running { color: var(--el-color-warning); }
  }

  &__trigger,
  &__duration {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__time {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
  }

  &__delete {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover &__delete {
    opacity: 1;
  }

  &__error {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 6px;
    padding: 6px 10px;
    background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
    border-radius: 4px;
    font-size: 12px;
    color: var(--el-color-danger);
    line-height: 1.5;

    .el-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }
  }
}

@keyframes wf-exec-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}
</style>
