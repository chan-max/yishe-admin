<script setup lang="ts">
import { computed } from 'vue'
import { useGlobalNotificationStore } from '@/store/modules/globalNotification'

defineOptions({ name: 'GlobalNotificationToastStack' })

const notificationStore = useGlobalNotificationStore()
const toasts = computed(() => notificationStore.activeToasts)

const levelLabelMap = {
  success: 'Success',
  info: 'Info',
  warning: 'Warning',
  error: 'Error'
} as const

const getToastTitle = (item: { level?: string; title?: string; message?: string }) => {
  const title = String(item.title || '').trim()
  if (title) {
    return title
  }
  const message = String(item.message || '').trim()
  if (message) {
    return message
  }
  const level = item.level as keyof typeof levelLabelMap
  return levelLabelMap[level] || 'Info'
}

const getToastMessage = (item: { title?: string; message?: string }) => {
  const title = String(item.title || '').trim()
  const message = String(item.message || '').trim()
  if (!message || message === title) {
    return ''
  }
  return message
}

const hasProgress = (item: { progress?: number | null }) => typeof item.progress === 'number'

const normalizeProgress = (item: { progress?: number | null }) => {
  if (!hasProgress(item)) {
    return 0
  }
  return Math.min(100, Math.max(0, Number(item.progress || 0)))
}

const getProgressMeta = (item: { metadata?: Record<string, any> }) => {
  const metadata = item.metadata || {}
  const total = Number(metadata.total || 0)
  const completed = Number(metadata.completed || 0)
  const failed = Number(metadata.failed || 0)
  if (!total) {
    return ''
  }
  return `成功 ${completed} / 失败 ${failed} / 总数 ${total}`
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup name="global-toast" tag="div" class="uiverse-toast-stack">
      <div
        v-for="item in toasts"
        :key="item.id"
        role="alert"
        class="uiverse-toast"
        :class="`is-${item.level}`"
      >
        <svg
          stroke="currentColor"
          viewBox="0 0 24 24"
          fill="none"
          class="uiverse-toast__icon"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        </svg>

        <div class="uiverse-toast__content">
          <p class="uiverse-toast__title">
            {{ getToastTitle(item) }}
          </p>
          <p v-if="getToastMessage(item)" class="uiverse-toast__message">
            {{ getToastMessage(item) }}
          </p>
          <div v-if="hasProgress(item)" class="uiverse-toast__progress">
            <div class="uiverse-toast__progress-track">
              <div
                class="uiverse-toast__progress-bar"
                :style="{ width: `${normalizeProgress(item)}%` }"
              />
            </div>
            <div class="uiverse-toast__progress-row">
              <span>{{ normalizeProgress(item) }}%</span>
              <span v-if="getProgressMeta(item)">{{ getProgressMeta(item) }}</span>
            </div>
          </div>
        </div>

        <button class="uiverse-toast__close" type="button" @click="notificationStore.dismissToast(item.id)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M6 6l12 12M18 6l-12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped lang="scss">
.uiverse-toast-stack {
  position: fixed;
  top: 12px;
  left: 50%;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: auto;
  max-width: calc(100vw - 20px);
  padding: 8px;
  transform: translateX(-50%);
  pointer-events: none;
}

.uiverse-toast {
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  width: fit-content;
  min-width: min(420px, calc(100vw - 36px));
  max-width: min(560px, calc(100vw - 36px));
  padding: 8px 10px;
  border-left: 4px solid;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
  pointer-events: auto;
  transition:
    background-color 300ms ease-in-out,
    transform 300ms ease-in-out,
    opacity 300ms ease-in-out,
    box-shadow 300ms ease-in-out;
  font-family: inherit;
}

.uiverse-toast:hover {
  transform: translateY(1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.14);
}

.uiverse-toast__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
  margin-right: 8px;
}

.uiverse-toast__content {
  min-width: 0;
  flex: 1;
}

.uiverse-toast__title,
.uiverse-toast__message {
  margin: 0;
  min-width: 0;
  color: inherit;
}

.uiverse-toast__title {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  font-family: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.uiverse-toast__message {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
  opacity: 0.92;
}

.uiverse-toast__progress {
  margin-top: 7px;
}

.uiverse-toast__progress-track {
  width: 100%;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.26);
}

.uiverse-toast__progress-bar {
  height: 100%;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.92);
  transition: width 260ms ease;
}

.uiverse-toast__progress-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
  font-size: 10px;
  line-height: 1.3;
  opacity: 0.92;
}

.uiverse-toast__close {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-top: 0;
  margin-left: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.72;
  border-radius: 4px;
}

.uiverse-toast__close:hover {
  opacity: 1;
}

.uiverse-toast__close svg {
  width: 12px;
  height: 12px;
}

.uiverse-toast.is-success {
  background: #22c55e;
  border-left-color: #22c55e;
  color: #ffffff;
}

.uiverse-toast.is-success .uiverse-toast__icon {
  color: #ffffff;
}

.uiverse-toast.is-success:hover {
  background: #16a34a;
}

.uiverse-toast.is-info {
  background: var(--el-color-primary);
  border-left-color: var(--el-color-primary);
  color: #ffffff;
}

.uiverse-toast.is-info .uiverse-toast__icon {
  color: #ffffff;
}

.uiverse-toast.is-info:hover {
  background: var(--el-color-primary-dark-2);
}

.uiverse-toast.is-warning {
  background: #f59e0b;
  border-left-color: #f59e0b;
  color: #ffffff;
}

.uiverse-toast.is-warning .uiverse-toast__icon {
  color: #ffffff;
}

.uiverse-toast.is-warning:hover {
  background: #d97706;
}

.uiverse-toast.is-error {
  background: #ef4444;
  border-left-color: #ef4444;
  color: #ffffff;
}

.uiverse-toast.is-error .uiverse-toast__icon {
  color: #ffffff;
}

.uiverse-toast.is-error:hover {
  background: #dc2626;
}

:global(html.dark) .uiverse-toast.is-success {
  background: #22c55e;
  border-left-color: #15803d;
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-success .uiverse-toast__icon {
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-success:hover {
  background: #16a34a;
}

:global(html.dark) .uiverse-toast.is-info {
  background: var(--el-color-primary);
  border-left-color: var(--el-color-primary);
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-info .uiverse-toast__icon {
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-info:hover {
  background: var(--el-color-primary-dark-2);
}

:global(html.dark) .uiverse-toast.is-warning {
  background: #f59e0b;
  border-left-color: #b45309;
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-warning .uiverse-toast__icon {
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-warning:hover {
  background: #d97706;
}

:global(html.dark) .uiverse-toast.is-error {
  background: #000;
  border-left-color: #444;
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-error .uiverse-toast__icon {
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-error:hover {
  background: #000;
}

.global-toast-enter-active,
.global-toast-leave-active {
  transition:
    opacity 300ms ease-in-out,
    transform 300ms ease-in-out;
}

.global-toast-enter-from,
.global-toast-leave-to {
  opacity: 0;
  transform: translateY(-18px) scale(0.98);
}

.global-toast-enter-to,
.global-toast-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@media (max-width: 768px) {
  .uiverse-toast-stack {
    padding: 8px;
  }

  .uiverse-toast {
    max-width: calc(100vw - 28px);
  }
}
</style>
