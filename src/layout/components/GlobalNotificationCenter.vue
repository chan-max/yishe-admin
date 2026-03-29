<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { VxeGridProps } from 'vxe-table'
import { websocketClient, type GlobalNotificationEvent } from '@/services/websocketClient'
import { useGlobalNotificationStore } from '@/store/modules/globalNotification'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'GlobalNotificationCenter' })

const notificationStore = useGlobalNotificationStore()

const dialogVisible = ref(false)

const unreadCount = computed(() => notificationStore.unreadCount)
const notifications = computed(() => notificationStore.items)

const levelLabelMap = {
  info: '通知',
  success: '成功',
  warning: '警告',
  error: '异常'
} as const

const handleNotification = (payload: GlobalNotificationEvent) => {
  notificationStore.upsertNotification(payload)
}

const openDialog = () => {
  dialogVisible.value = true
}

const markRowRead = (row: any) => {
  if (row?.id) {
    notificationStore.markRead(row.id)
  }
}

const removeRow = (row: any) => {
  if (row?.id) {
    notificationStore.remove(row.id)
  }
}

const gridOptions = computed<VxeGridProps<any>>(() => ({
  border: false,
  stripe: true,
  round: false,
  size: 'small',
  showHeaderOverflow: false,
  showOverflow: 'tooltip',
  columnConfig: {
    resizable: true
  },
  rowConfig: {
    isHover: true,
    keyField: 'id'
  },
  columns: [
    { field: 'level', title: '类型', width: 90, slots: { default: 'level' } },
    { field: 'title', title: '标题', minWidth: 180, slots: { default: 'title' } },
    { field: 'message', title: '内容', minWidth: 320, slots: { default: 'message' } },
    { field: 'updatedAt', title: '时间', width: 180, slots: { default: 'time' } },
    { field: 'status', title: '状态', width: 110, slots: { default: 'status' } },
    { field: 'read', title: '已读', width: 90, slots: { default: 'read' } },
    { field: 'actions', title: '操作', width: 140, fixed: 'right', slots: { default: 'actions' } }
  ]
}))

onMounted(() => {
  websocketClient.events.on('globalNotification', handleNotification)
})

onUnmounted(() => {
  websocketClient.events.off('globalNotification', handleNotification)
})
</script>

<template>
  <button class="notification-trigger" type="button" :class="{ 'has-unread': unreadCount > 0 }" @click="openDialog">
    <Icon icon="ep:bell" :size="16" />
    <span v-if="unreadCount > 0" class="notification-trigger__badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
  </button>

  <el-dialog
    v-model="dialogVisible"
    title="消息中心"
    fullscreen
    append-to-body
    class="notification-dialog"
    destroy-on-close
  >
    <div class="notification-dialog__toolbar">
      <div class="notification-dialog__summary">
        <span>共 {{ notifications.length }} 条消息</span>
        <span>未读 {{ unreadCount }} 条</span>
      </div>
      <div class="notification-dialog__actions">
        <el-button size="small" @click="notificationStore.markAllRead()">全部已读</el-button>
        <el-button size="small" @click="notificationStore.clear()">清空消息</el-button>
      </div>
    </div>

    <div class="notification-dialog__table">
      <vxe-grid v-bind="gridOptions" :data="notifications">
        <template #level="{ row }">
          <el-tag size="small" effect="plain" :type="row.level === 'success' ? 'success' : row.level === 'warning' ? 'warning' : row.level === 'error' ? 'danger' : 'info'">
            {{ levelLabelMap[row.level] || row.level }}
          </el-tag>
        </template>

        <template #title="{ row }">
          <span class="notification-cell-title" @click="markRowRead(row)">{{ row.title || '-' }}</span>
        </template>

        <template #message="{ row }">
          <div class="notification-cell-message" @click="markRowRead(row)">
            <div>{{ row.message || '-' }}</div>
            <el-progress
              v-if="typeof row.progress === 'number'"
              :percentage="row.progress"
              :stroke-width="6"
              :show-text="false"
              class="notification-cell-progress"
            />
          </div>
        </template>

        <template #time="{ row }">
          <span>{{ formatDate(row.updatedAt || row.createdAt || '') }}</span>
        </template>

        <template #status="{ row }">
          <span>{{ row.status || '-' }}</span>
        </template>

        <template #read="{ row }">
          <el-tag size="small" effect="plain" :type="row.read ? 'info' : 'primary'">
            {{ row.read ? '已读' : '未读' }}
          </el-tag>
        </template>

        <template #actions="{ row }">
          <div class="notification-cell-actions">
            <el-button size="small" text @click="markRowRead(row)">已读</el-button>
            <el-button size="small" text type="danger" @click="removeRow(row)">删除</el-button>
          </div>
        </template>
      </vxe-grid>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.notification-trigger {
  position: relative;
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--top-tool-border-color);
  border-radius: 10px;
  background: var(--top-header-hover-color);
  color: var(--top-header-text-color);
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.notification-trigger:hover,
.notification-trigger.has-unread {
  border-color: color-mix(in srgb, var(--top-header-text-color) 14%, transparent 86%);
  color: var(--el-text-color-primary);
}

.notification-trigger__badge {
  position: absolute;
  top: -4px;
  right: -5px;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  line-height: 15px;
  text-align: center;
}

.notification-dialog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.notification-dialog__summary {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.notification-dialog__actions {
  display: flex;
  gap: 8px;
}

.notification-dialog__table {
  height: calc(100vh - 140px);
}

.notification-cell-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.notification-cell-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  white-space: normal;
  line-height: 1.6;
}

.notification-cell-progress {
  max-width: 220px;
}

.notification-cell-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
