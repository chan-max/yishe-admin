import { defineStore } from 'pinia'
import type { GlobalNotificationEvent } from '@/services/websocketClient'

export interface GlobalNotificationItem extends GlobalNotificationEvent {
  read: boolean
}

export interface GlobalNotificationToastItem extends GlobalNotificationItem {
  visible: boolean
}

const MAX_NOTIFICATIONS = 80
const MAX_TOASTS = 3
const DEFAULT_TOAST_DURATION = 4500
const STICKY_TOAST_DURATION = 7000
const toastTimerMap = new Map<string, ReturnType<typeof setTimeout>>()

export const useGlobalNotificationStore = defineStore('globalNotification', {
  state: () => ({
    items: [] as GlobalNotificationItem[],
    toastItems: [] as GlobalNotificationToastItem[],
    initialized: false
  }),
  getters: {
    unreadCount: (state) => state.items.filter((item) => !item.read).length,
    latestItems: (state) => state.items.slice(0, 20),
    activeToasts: (state) => state.toastItems.filter((item) => item.visible)
  },
  actions: {
    upsertNotification(payload: GlobalNotificationEvent) {
      const existingIndex = this.items.findIndex((item) => item.id === payload.id)
      const nextItem: GlobalNotificationItem = {
        ...payload,
        read: existingIndex >= 0 ? this.items[existingIndex].read : false
      }

      if (existingIndex >= 0) {
        this.items.splice(existingIndex, 1, nextItem)
      } else {
        this.items.unshift(nextItem)
      }

      if (this.items.length > MAX_NOTIFICATIONS) {
        this.items.length = MAX_NOTIFICATIONS
      }

      this.showToast(nextItem)
    },
    showToast(item: GlobalNotificationItem) {
      const existingIndex = this.toastItems.findIndex((toast) => toast.id === item.id)
      const nextToast: GlobalNotificationToastItem = {
        ...item,
        visible: true
      }

      if (existingIndex >= 0) {
        this.toastItems.splice(existingIndex, 1, nextToast)
      } else {
        this.toastItems.unshift(nextToast)
      }

      if (this.toastItems.length > MAX_TOASTS) {
        const removed = this.toastItems.splice(MAX_TOASTS)
        removed.forEach((toast) => {
          const timer = toastTimerMap.get(toast.id)
          if (timer) {
            clearTimeout(timer)
            toastTimerMap.delete(toast.id)
          }
        })
      }

      const oldTimer = toastTimerMap.get(item.id)
      if (oldTimer) {
        clearTimeout(oldTimer)
      }

      const timer = setTimeout(() => {
        this.dismissToast(item.id)
      }, item.sticky ? STICKY_TOAST_DURATION : item.durationMs ?? DEFAULT_TOAST_DURATION)
      toastTimerMap.set(item.id, timer)
    },
    dismissToast(id: string) {
      const timer = toastTimerMap.get(id)
      if (timer) {
        clearTimeout(timer)
        toastTimerMap.delete(id)
      }

      const target = this.toastItems.find((item) => item.id === id)
      if (!target) {
        return
      }
      target.visible = false

      setTimeout(() => {
        this.toastItems = this.toastItems.filter((item) => item.id !== id)
      }, 160)
    },
    markRead(id: string) {
      const target = this.items.find((item) => item.id === id)
      if (target) {
        target.read = true
      }
    },
    markAllRead() {
      this.items.forEach((item) => {
        item.read = true
      })
    },
    remove(id: string) {
      this.items = this.items.filter((item) => item.id !== id)
      this.dismissToast(id)
    },
    clear() {
      this.items = []
      this.toastItems = []
      toastTimerMap.forEach((timer) => clearTimeout(timer))
      toastTimerMap.clear()
    }
  },
  persist: {
    paths: ['items']
  }
})
