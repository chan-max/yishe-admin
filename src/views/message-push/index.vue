<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="message-push-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="list-page-filter__row message-push-toolbar">
            <div class="list-page-search-form__actions message-push-toolbar__actions">
              <el-button
                size="small"
                :disabled="loading || deleteLoading"
                @click="openDefaultDialog"
              >
                通知设置
              </el-button>
              <el-button
                size="small"
                type="primary"
                :disabled="loading || deleteLoading"
                @click="openDialog()"
                >新增渠道</el-button
              >
            </div>
          </div>
        </div>
      </template>

      <template #table>
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat"
        >
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid v-bind="gridOptions" :data="list" :loading="loading">
                <template #nameSlot="{ row }">
                  <div class="message-push-name-cell">
                    <span>{{ row.name }}</span>
                    <el-tag
                      v-if="Number(row.id) === Number(messagePushSetting.defaultChannelId)"
                      size="small"
                      type="primary"
                      effect="light"
                    >
                      默认通知
                    </el-tag>
                  </div>
                </template>

                <template #platformSlot="{ row }">
                  <el-tag size="small">
                    {{ platformLabelMap[row.platform] || row.platform }}
                  </el-tag>
                </template>

                <template #enabledSlot="{ row }">
                  <el-tag size="small" :type="row.enabled ? 'success' : 'info'">
                    {{ row.enabled ? "启用" : "停用" }}
                  </el-tag>
                </template>

                <template #webhookSlot="{ row }">
                  <div class="message-push-url">{{ maskWebhook(row.webhookUrl) }}</div>
                </template>

                <template #remarkSlot="{ row }">
                  <span class="table-meta-text">{{ row.remark || "-" }}</span>
                </template>

                <template #operationDefaultSlot="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      @command="(command) => handleOperationCommand(String(command), row)"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button"
                        >操作</el-button
                      >
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="test">
                            <span>测试发送</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="edit">
                            <span>编辑</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            command="delete"
                            divided
                            class="operation-menu-item--danger"
                          >
                            <span>删除</span>
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>
    </ListPageLayout>

    <MessagePushDialog ref="dialogRef" @success="refreshPageData" />
    <MessagePushDefaultDialog
      ref="defaultDialogRef"
      :channels="list"
      @saved="handleMessagePushSettingSaved"
    />
    <MessagePushTestDialog ref="testDialogRef" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  deleteMessagePush,
  getMessagePushList,
  type MessagePushConfig,
  type MessagePushPlatform,
} from "@/api/messagePush";
import { getMessagePushSetting, type UserMessagePushSetting } from "@/api/user";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import { syncMessagePushMenuState } from "@/services/messagePushState";
import MessagePushDialog from "./components/MessagePushDialog.vue";
import MessagePushDefaultDialog from "./components/MessagePushDefaultDialog.vue";
import MessagePushTestDialog from "./components/MessagePushTestDialog.vue";

const loading = ref(false);
const deleteLoading = ref(false);
const list = ref<MessagePushConfig[]>([]);
const dialogRef = ref();
const defaultDialogRef = ref();
const testDialogRef = ref();
const messagePushSetting = ref<UserMessagePushSetting>({
  enabled: true,
  defaultChannelId: null,
  defaultMessagePush: null,
});

const platformLabelMap: Record<MessagePushPlatform, string> = {
  feishu: "飞书",
  wecom: "企业微信",
};

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { title: "ID", field: "id", width: 80 },
    { title: "渠道名称", field: "name", minWidth: 200, slots: { default: "nameSlot" } },
    {
      title: "创建人",
      field: "uploader",
      width: 140,
      showOverflow: "tooltip",
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    { title: "平台", field: "platform", width: 120, slots: { default: "platformSlot" } },
    { title: "状态", field: "enabled", width: 100, slots: { default: "enabledSlot" } },
    { title: "Webhook", field: "webhookUrl", minWidth: 360, slots: { default: "webhookSlot" } },
    {
      title: "备注",
      field: "remark",
      minWidth: 220,
      showOverflow: "tooltip",
      slots: { default: "remarkSlot" },
    },
    buildTimeColumn("创建时间", "createTime"),
    buildOperationColumn("operationDefaultSlot"),
  ],
});

const maskWebhook = (url?: string) => {
  const value = String(url || "").trim();
  if (!value) return "-";
  if (value.length <= 36) return value;
  return `${value.slice(0, 20)}...${value.slice(-12)}`;
};

const getList = async () => {
  loading.value = true;
  try {
    const data = await getMessagePushList();
    list.value = Array.isArray(data) ? data : [];
  } finally {
    loading.value = false;
  }
};

const loadMessagePushSetting = async () => {
  const data = await getMessagePushSetting();
  messagePushSetting.value = data || {
    enabled: true,
    defaultChannelId: null,
    defaultMessagePush: null,
  };
  syncMessagePushMenuState(messagePushSetting.value);
};

const refreshPageData = async () => {
  await Promise.all([getList(), loadMessagePushSetting()]);
};

const openDialog = (id?: number) => {
  dialogRef.value?.open(id);
};

const openDefaultDialog = () => {
  defaultDialogRef.value?.open();
};

const openTestDialog = (row: MessagePushConfig) => {
  testDialogRef.value?.open({
    id: Number(row.id),
    name: row.name,
  });
};

const handleMessagePushSettingSaved = async (payload: UserMessagePushSetting) => {
  messagePushSetting.value = payload || {
    enabled: true,
    defaultChannelId: null,
    defaultMessagePush: null,
  };
  syncMessagePushMenuState(messagePushSetting.value);
  await getList();
};

const handleOperationCommand = (command: string, row: MessagePushConfig) => {
  if (command === "test") {
    openTestDialog(row);
    return;
  }
  if (command === "edit") {
    openDialog(row.id);
    return;
  }
  if (command === "delete") {
    handleDelete(row.id as number);
  }
};

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      "确认删除该推送渠道吗？删除后按该渠道 ID 的开放发送调用将失效。",
      "提示",
      {
        type: "warning",
      },
    );
    deleteLoading.value = true;
    await deleteMessagePush(id);
    ElMessage.success("删除成功");
    await refreshPageData();
  } catch {
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(() => {
  refreshPageData();
});
</script>

<style scoped lang="scss">
:deep(.message-push-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.message-push-page .list-page-layout__main) {
  gap: 10px;
}

.message-push-url {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.message-push-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.message-push-name-cell span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-push-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 32px;
}

.message-push-toolbar__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}

.message-push-toolbar__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

:deep(.message-push-page .list-page-filter--flat) {
  gap: 12px;
  padding-bottom: 12px;
}

:deep(.message-push-page .list-page-filter__row) {
  width: 100%;
}

:deep(.message-push-page .list-page-table-panel__body) {
  padding-top: 0;
}

:deep(.message-push-page .list-page-table-panel__pagination--flat) {
  padding-top: 12px;
}
</style>
