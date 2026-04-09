<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { VxeGridProps } from "vxe-table";
import { websocketClient, type GlobalNotificationEvent } from "@/services/websocketClient";
import { useGlobalNotificationStore } from "@/store/modules/globalNotification";
import { formatDate } from "@/utils/formatTime";

defineOptions({ name: "GlobalNotificationCenter" });

const notificationStore = useGlobalNotificationStore();

const dialogVisible = ref(false);

const unreadCount = computed(() => notificationStore.unreadCount);
const notifications = computed(() => notificationStore.items);

const levelLabelMap = {
  info: "通知",
  success: "成功",
  warning: "警告",
  error: "异常",
} as const;

const handleNotification = (payload: GlobalNotificationEvent) => {
  notificationStore.upsertNotification(payload);
};

const openDialog = () => {
  dialogVisible.value = true;
};

const markRowRead = (row: any) => {
  if (row?.id) {
    notificationStore.markRead(row.id);
  }
};

const removeRow = (row: any) => {
  if (row?.id) {
    notificationStore.remove(row.id);
  }
};

const gridOptions = computed<VxeGridProps<any>>(() => ({
  border: false,
  stripe: true,
  round: false,
  size: "medium",
  showHeaderOverflow: false,
  showOverflow: "tooltip",
  headerCellClassName: "common-table__header-cell",
  cellClassName: "common-table__body-cell",
  columnConfig: {
    resizable: true,
  },
  rowConfig: {
    isHover: true,
    keyField: "id",
  },
  columns: [
    { field: "level", title: "类型", width: 90, slots: { default: "level" } },
    { field: "title", title: "标题", minWidth: 180, slots: { default: "title" } },
    { field: "message", title: "内容", minWidth: 320, slots: { default: "message" } },
    { field: "updatedAt", title: "时间", width: 180, slots: { default: "time" } },
    { field: "status", title: "状态", width: 110, slots: { default: "status" } },
    { field: "read", title: "已读", width: 90, slots: { default: "read" } },
    { field: "actions", title: "操作", width: 140, fixed: "right", slots: { default: "actions" } },
  ],
}));

onMounted(() => {
  websocketClient.events.on("globalNotification", handleNotification);
});

onUnmounted(() => {
  websocketClient.events.off("globalNotification", handleNotification);
});
</script>

<template>
  <button
    class="notification-trigger"
    type="button"
    :class="{ 'has-unread': unreadCount > 0 }"
    @click="openDialog"
  >
    <Icon icon="ep:bell" :size="16" />
    <span v-if="unreadCount > 0" class="notification-trigger__badge">{{
      unreadCount > 99 ? "99+" : unreadCount
    }}</span>
  </button>

  <el-dialog
    v-model="dialogVisible"
    fullscreen
    append-to-body
    class="notification-dialog"
    destroy-on-close
  >
    <template #header>
      <div class="notification-dialog__header">
        <div class="notification-dialog__toolbar">
          <div class="notification-dialog__header-main">
            <div class="notification-dialog__title">消息中心</div>
            <div class="notification-dialog__desc">集中查看系统通知、任务结果和实时状态更新。</div>
          </div>
          <div class="notification-dialog__header-side">
            <div class="notification-dialog__summary">
              <span>共 {{ notifications.length }} 条消息</span>
              <span>未读 {{ unreadCount }} 条</span>
            </div>
            <div class="notification-dialog__actions">
              <el-button size="small" @click="notificationStore.markAllRead()">全部已读</el-button>
              <el-button size="small" @click="notificationStore.clear()">清空消息</el-button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="notification-dialog__body">
      <div class="notification-dialog__panel">
        <div class="common-table common-table--full notification-dialog__table">
          <vxe-grid
            v-bind="gridOptions"
            :data="notifications"
            auto-resize
            height="100%"
            class="notification-grid"
          >
            <template #level="{ row }">
              <el-tag
                size="small"
                effect="plain"
                :type="
                  row.level === 'success'
                    ? 'success'
                    : row.level === 'warning'
                      ? 'warning'
                      : row.level === 'error'
                        ? 'danger'
                        : 'info'
                "
              >
                {{ levelLabelMap[row.level] || row.level }}
              </el-tag>
            </template>

            <template #title="{ row }">
              <span class="notification-cell-title" @click="markRowRead(row)">{{
                row.title || "-"
              }}</span>
            </template>

            <template #message="{ row }">
              <div class="notification-cell-message" @click="markRowRead(row)">
                <div>{{ row.message || "-" }}</div>
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
              <span>{{ formatDate(row.updatedAt || row.createdAt || "") }}</span>
            </template>

            <template #status="{ row }">
              <span>{{ row.status || "-" }}</span>
            </template>

            <template #read="{ row }">
              <el-tag size="small" effect="plain" :type="row.read ? 'info' : 'primary'">
                {{ row.read ? "已读" : "未读" }}
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
      </div>
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
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
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

.notification-dialog__header {
  padding-bottom: 2px;
}

.notification-dialog__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px 18px;
}

.notification-dialog__header-main {
  min-width: 0;
  flex: 1 1 320px;
}

.notification-dialog__title {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.notification-dialog__desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.notification-dialog__header-side {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px 12px;
}

.notification-dialog__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.notification-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.notification-dialog__body {
  display: flex;
  height: calc(100vh - 118px);
  min-height: 0;
}

.notification-dialog__panel {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 12px;
  background: var(--app-content-surface-color);
  box-shadow: inset 0 0 0 1px var(--app-content-border-color);
}

.notification-dialog__table {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden !important;
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

:deep(.notification-dialog.el-dialog.is-fullscreen .el-dialog__header) {
  padding: 18px 20px 12px;
}

:deep(.notification-dialog.el-dialog.is-fullscreen .el-dialog__body) {
  padding: 0 20px 20px;
}

:deep(.notification-dialog .vxe-table--header-wrapper .vxe-cell) {
  font-size: 13px;
  font-weight: 600;
}

:deep(.notification-dialog .notification-grid),
:deep(.notification-dialog .notification-grid .vxe-table),
:deep(.notification-dialog .notification-grid .vxe-table--render-wrapper),
:deep(.notification-dialog .notification-grid .vxe-table--main-wrapper) {
  width: 100%;
  height: 100%;
}

:deep(.notification-dialog .notification-grid .vxe-table--body-wrapper) {
  overflow: auto !important;
}

:deep(.notification-dialog .notification-grid .vxe-table--header-wrapper) {
  overflow: hidden !important;
}

@media (max-width: 992px) {
  .notification-dialog__actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .notification-dialog__header-side {
    width: 100%;
    justify-content: flex-start;
  }

  .notification-dialog__body {
    height: calc(100vh - 146px);
  }

  :deep(.notification-dialog.el-dialog.is-fullscreen .el-dialog__header) {
    padding: 16px 16px 12px;
  }

  :deep(.notification-dialog.el-dialog.is-fullscreen .el-dialog__body) {
    padding: 0 16px 16px;
  }
}
</style>
