<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ai-api-key-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="list-page-filter__row">
            <div class="text-[12px] leading-[1.6] text-[var(--el-text-color-secondary)]">
              统一维护 OpenAI、Claude、Qwen 等平台的 API Key，当前只负责基础信息存储与启停管理。
            </div>
            <div class="list-page-search-form__actions">
              <el-button
                size="small"
                type="primary"
                :disabled="loading || deleteLoading"
                @click="openDialog()"
              >
                新增 Key
              </el-button>
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
                <template #platformSlot="{ row }">
                  <el-tag size="small" :type="platformTagTypeMap[row.platform] || 'info'">
                    {{ formatPlatformLabel(row.platform) }}
                  </el-tag>
                </template>

                <template #enabledSlot="{ row }">
                  <el-tag size="small" :type="row.enabled ? 'success' : 'info'">
                    {{ row.enabled ? "启用" : "停用" }}
                  </el-tag>
                </template>

                <template #apiKeySlot="{ row }">
                  <div class="ai-api-key-mask">
                    {{ row.maskedApiKey || maskApiKey(row.apiKey) }}
                  </div>
                </template>

                <template #expiresAtSlot="{ row }">
                  <span :class="['table-meta-text', { 'is-expired': isExpired(row.expiresAt) }]">
                    {{ formatExpiresAt(row.expiresAt) }}
                  </span>
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

    <AiApiKeyDialog ref="dialogRef" @success="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteAiApiKey, getAiApiKeyList, type AiApiKeyConfig } from "@/api/aiApiKey";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import AiApiKeyDialog from "./components/AiApiKeyDialog.vue";

const loading = ref(false);
const deleteLoading = ref(false);
const list = ref<AiApiKeyConfig[]>([]);
const dialogRef = ref();

const platformLabelMap: Record<string, string> = {
  openai: "OpenAI",
  claude: "Claude",
  qwen: "Qwen",
  deepseek: "DeepSeek",
  gemini: "Gemini",
  doubao: "Doubao",
  moonshot: "Moonshot",
  openrouter: "OpenRouter",
};

const platformTagTypeMap: Record<string, "success" | "warning" | "info" | "danger"> = {
  openai: "success",
  claude: "warning",
  qwen: "info",
  deepseek: "danger",
  gemini: "success",
  doubao: "warning",
  moonshot: "info",
  openrouter: "info",
};

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { title: "ID", field: "id", width: 80 },
    { title: "名称", field: "name", minWidth: 180 },
    {
      title: "创建人",
      field: "uploader",
      width: 140,
      showOverflow: "tooltip",
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    { title: "平台", field: "platform", width: 130, slots: { default: "platformSlot" } },
    { title: "状态", field: "enabled", width: 100, slots: { default: "enabledSlot" } },
    { title: "密钥", field: "maskedApiKey", minWidth: 220, slots: { default: "apiKeySlot" } },
    { title: "过期时间", field: "expiresAt", minWidth: 180, slots: { default: "expiresAtSlot" } },
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

const formatPlatformLabel = (platform?: string) => {
  const value = String(platform || "")
    .trim()
    .toLowerCase();
  if (!value) return "-";
  return platformLabelMap[value] || value;
};

const maskApiKey = (value?: string) => {
  const key = String(value || "").trim();
  if (!key) return "-";
  if (key.length <= 10) {
    return `${key.slice(0, 2)}****${key.slice(-2)}`;
  }
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
};

const isExpired = (expiresAt?: string | null) => {
  if (!expiresAt) return false;
  const timestamp = new Date(expiresAt).getTime();
  if (Number.isNaN(timestamp)) return false;
  return timestamp < Date.now();
};

const formatExpiresAt = (expiresAt?: string | null) => {
  if (!expiresAt) return "长期有效";
  return isExpired(expiresAt) ? `${expiresAt}（已过期）` : expiresAt;
};

const getList = async () => {
  loading.value = true;
  try {
    const data = await getAiApiKeyList();
    list.value = Array.isArray(data) ? data : [];
  } finally {
    loading.value = false;
  }
};

const openDialog = (id?: number) => {
  dialogRef.value?.open(id);
};

const handleOperationCommand = (command: string, row: AiApiKeyConfig) => {
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
      "确认删除这个 AI API Key 吗？删除后将无法继续在后续接入中复用。",
      "提示",
      {
        type: "warning",
      },
    );
    deleteLoading.value = true;
    await deleteAiApiKey(id);
    ElMessage.success("删除成功");
    await getList();
  } catch {
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
:deep(.ai-api-key-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.ai-api-key-page .list-page-layout__main) {
  gap: 10px;
}

.ai-api-key-mask {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.table-meta-text.is-expired {
  color: var(--el-color-danger);
}

:deep(.ai-api-key-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.ai-api-key-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}
</style>
