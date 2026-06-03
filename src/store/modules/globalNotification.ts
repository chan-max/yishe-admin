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
const RUNNING_STICKY_RESTORE_TTL_MS = 10 * 60 * 1000
const toastTimerMap = new Map<string, ReturnType<typeof setTimeout>>()

const getNotificationTime = (item: GlobalNotificationItem) => {
  const value = Date.parse(String(item.updatedAt || item.createdAt || ''))
  return Number.isFinite(value) ? value : 0
}

const isStaleRunningStickyToast = (item: GlobalNotificationItem) => {
  if (!item.sticky || (item.status && item.status !== 'running' && item.status !== 'pending')) {
    return false
  }
  const time = getNotificationTime(item)
  return !time || Date.now() - time > RUNNING_STICKY_RESTORE_TTL_MS
}

const isRunningStickyToast = (item: GlobalNotificationItem) =>
  item.sticky &&
  (!item.status || item.status === 'running' || item.status === 'pending') &&
  !isStaleRunningStickyToast(item)

export const useGlobalNotificationStore = defineStore('globalNotification', {
  state: () => ({
    items: [] as GlobalNotificationItem[],
    toastItems: [] as GlobalNotificationToastItem[],
    initialized: false
  }),
  getters: {
    unreadCount: (state) => state.items.filter((item) => !item.read).length,
    latestItems: (state) => state.items.slice(0, 20),
    activeToasts: (state) => {
      const visibleToasts = state.toastItems.filter((item) => item.visible)
      const visibleToastIds = new Set(visibleToasts.map((item) => item.id))
      const pinnedToasts = state.items
        .filter((item) => isRunningStickyToast(item) && !visibleToastIds.has(item.id))
        .map((item) => ({
          ...item,
          visible: true
        }))
      return [...pinnedToasts, ...visibleToasts]
    }
  },
  actions: {
    upsertNotification(payload: GlobalNotificationEvent) {
      this.pruneStaleRunningToasts()
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
      if (isStaleRunningStickyToast(item)) {
        this.remove(item.id)
        return
      }

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
        const stickyToasts = this.toastItems.filter((toast) => toast.sticky)
        const normalToasts = this.toastItems.filter((toast) => !toast.sticky)
        this.toastItems = [...stickyToasts, ...normalToasts.slice(0, Math.max(MAX_TOASTS - stickyToasts.length, 0))]
        const activeIds = new Set(this.toastItems.map((toast) => toast.id))
        const removed = [...stickyToasts, ...normalToasts].filter((toast) => !activeIds.has(toast.id))
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

      if (!item.sticky) {
        const timer = setTimeout(() => {
          this.dismissToast(item.id)
        }, item.durationMs ?? DEFAULT_TOAST_DURATION)
        toastTimerMap.set(item.id, timer)
      } else {
        toastTimerMap.delete(item.id)
      }
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
    removeBySource(source: string, exceptId = '') {
      const normalizedSource = String(source || '').trim()
      if (!normalizedSource) return
      const normalizedExceptId = String(exceptId || '').trim()
      const removedIds = this.items
        .filter((item) => item.source === normalizedSource && item.id !== normalizedExceptId)
        .map((item) => item.id)
      this.items = this.items.filter((item) => item.source !== normalizedSource || item.id === normalizedExceptId)
      removedIds.forEach((id) => this.dismissToast(id))
    },
    pruneStaleRunningToasts(source = '') {
      const normalizedSource = String(source || '').trim()
      const removedIds = this.items
        .filter((item) => (!normalizedSource || item.source === normalizedSource) && isStaleRunningStickyToast(item))
        .map((item) => item.id)
      if (!removedIds.length) return
      const removedIdSet = new Set(removedIds)
      this.items = this.items.filter((item) => !removedIdSet.has(item.id))
      removedIds.forEach((id) => this.dismissToast(id))
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
