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

        <p class="uiverse-toast__text">
          {{ levelLabelMap[item.level] || 'Info' }} - {{ item.title || item.message || '收到一条新消息' }}
        </p>

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
  align-items: center;
  width: fit-content;
  max-width: min(560px, calc(100vw - 36px));
  padding: 6px 8px;
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
  margin-right: 6px;
}

.uiverse-toast__text {
  margin: 0;
  flex: 0 1 auto;
  min-width: 0;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  font-family: inherit;
  color: inherit;
  white-space: nowrap;
}

.uiverse-toast__close {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 6px;
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
  background: #3b82f6;
  border-left-color: #3b82f6;
  color: #ffffff;
}

.uiverse-toast.is-info .uiverse-toast__icon {
  color: #ffffff;
}

.uiverse-toast.is-info:hover {
  background: #2563eb;
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
  background: #3b82f6;
  border-left-color: #1d4ed8;
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-info .uiverse-toast__icon {
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-info:hover {
  background: #2563eb;
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
  background: #ef4444;
  border-left-color: #b91c1c;
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-error .uiverse-toast__icon {
  color: #ffffff;
}

:global(html.dark) .uiverse-toast.is-error:hover {
  background: #dc2626;
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
