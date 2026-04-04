<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-collect-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="resource-toolbar">
            <div class="resource-toolbar__meta">
              <div class="resource-toolbar__title">电商采集任务</div>
              <div class="resource-toolbar__desc">
                管理按平台分发的采集任务，指定在线可用客户端执行，并保留平台扩展配置入口。
              </div>
            </div>
            <div class="resource-toolbar__actions">
              <el-button size="small" @click="loadData">刷新</el-button>
              <el-button
                size="small"
                type="danger"
                plain
                :disabled="!selectedIds.length"
                @click="handleBatchDelete"
              >
                批量删除 ({{ selectedIds.length }})
              </el-button>
              <el-button size="small" type="primary" @click="openTaskDialog()">新建任务</el-button>
            </div>
          </div>

          <div class="ecom-collect-page__stats">
            <div class="ecom-collect-page__stat-card">
              <div class="label">任务数</div>
              <div class="value">{{ total }}</div>
            </div>
            <div class="ecom-collect-page__stat-card">
              <div class="label">在线可用客户端</div>
              <div class="value">{{ clientOptions.length }}</div>
            </div>
            <div class="ecom-collect-page__stat-card">
              <div class="label">平台数</div>
              <div class="value">{{ catalog.platforms.length }}</div>
            </div>
          </div>

          <el-form :model="filters" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col :xs="24" :sm="12" :md="8" :lg="7">
                <el-form-item label="任务名称 / 平台">
                  <el-input
                    v-model="filters.keyword"
                    clearable
                    placeholder="搜索任务名称 / 平台"
                    @keyup.enter="handleSearch"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="平台">
                  <el-select v-model="filters.platform" clearable placeholder="平台">
                    <el-option
                      v-for="item in catalog.platforms"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="场景">
                  <el-select v-model="filters.collectScene" clearable placeholder="场景">
                    <el-option
                      v-for="item in catalog.scenes"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="启用状态">
                  <el-select v-model="filters.isActive" clearable placeholder="启用状态">
                    <el-option label="启用" value="true" />
                    <el-option label="停用" value="false" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
              <el-button size="small" @click="handleReset">重置</el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                v-bind="gridOptions"
                :data="list"
                :loading="loading"
                @checkbox-change="handleCheckboxChange"
                @checkbox-all="handleCheckboxAll"
              >
                <template #platformSceneSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ getPlatformLabel(catalog, row.platform) }}</span>
                    <span class="table-meta-text">
                      {{ getSceneLabel(catalog, row.collectScene) }}
                    </span>
                  </div>
                </template>

                <template #clientSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ row.targetMachineCode || "-" }}</span>
                    <span class="table-meta-text">{{ row.targetClientId || "-" }}</span>
                  </div>
                </template>

                <template #statusSlot="{ row }">
                  <el-tag size="small" :type="getRunStatusTagType(row.lastStatus)">
                    {{ getRunStatusLabel(row.lastStatus) }}
                  </el-tag>
                </template>

                <template #activeSlot="{ row }">
                  <div class="table-switch-cell">
                    <el-switch
                      :model-value="!!row.isActive"
                      :loading="toggleLoadingId === row.id"
                      inline-prompt
                      active-text="开"
                      inactive-text="关"
                      @change="(value) => handleToggleTask(row, value === true)"
                    />
                  </div>
                </template>

                <template #operationSlot="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      @command="(command) => handleOperationCommand(String(command), row)"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button">
                        操作
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="trigger">立即执行</el-dropdown-item>
                          <el-dropdown-item command="edit">编辑</el-dropdown-item>
                          <el-dropdown-item
                            command="delete"
                            divided
                            class="operation-menu-item--danger"
                          >
                            删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>

          <div class="list-page-table-panel__pagination--flat">
            <el-pagination
              background
              layout="total, prev, pager, next"
              :total="total"
              :page-size="filters.pageSize"
              :current-page="filters.pageNo"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </template>
    </ListPageLayout>

    <EcomCollectTaskDialog
      v-model="dialogVisible"
      :catalog="catalog"
      :client-options="clientOptions"
      :task="currentTask"
      @success="handleDialogSuccess"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import type { VxeGridProps } from "vxe-table";
import {
  batchDeleteEcomPlatformCollectTask,
  deleteEcomPlatformCollectTask,
  getEcomPlatformCollectCatalog,
  getEcomPlatformCollectTaskList,
  triggerEcomPlatformCollectTask,
  updateEcomPlatformCollectTask,
  type EcomPlatformCollectTask,
} from "@/api/operation/ecomPlatformCollect";
import {
  getBrowserAutomationCapabilities,
  type BrowserAutomationCapabilityClient,
} from "@/api/external/browserAutomation";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import EcomCollectTaskDialog from "./components/EcomCollectTaskDialog.vue";
import {
  buildAvailableClientOptions,
  createEmptyEcomCollectCatalog,
  formatDateTime,
  getPlatformLabel,
  getRunStatusLabel,
  getRunStatusTagType,
  getSceneLabel,
  type EcomCollectClientOption,
} from "./shared";

defineOptions({ name: "EcomPlatformCollectTaskPage" });

const router = useRouter();

const loading = ref(false);
const toggleLoadingId = ref("");
const dialogVisible = ref(false);
const currentTask = ref<EcomPlatformCollectTask | null>(null);
const list = ref<EcomPlatformCollectTask[]>([]);
const total = ref(0);
const selectedIds = ref<string[]>([]);
const capabilityClients = ref<BrowserAutomationCapabilityClient[]>([]);

const catalog = reactive(createEmptyEcomCollectCatalog());

const clientOptions = computed<EcomCollectClientOption[]>(() =>
  buildAvailableClientOptions(capabilityClients.value),
);

const filters = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: "",
  platform: "",
  collectScene: "",
  isActive: "",
});

const updateSelectedIds = (records: EcomPlatformCollectTask[] = []) => {
  selectedIds.value = Array.from(
    new Set(records.map((item) => String(item.id || "").trim()).filter(Boolean)),
  );
};

const gridOptions = ref<VxeGridProps<EcomPlatformCollectTask>>({
  ...(commonGridOptions as VxeGridProps<EcomPlatformCollectTask>),
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 48 },
    { title: "任务名称", field: "name", minWidth: 220, showOverflow: "tooltip" },
    {
      title: "平台 / 场景",
      field: "platform",
      width: 170,
      slots: { default: "platformSceneSlot" },
    },
    {
      title: "执行机器",
      field: "targetMachineCode",
      minWidth: 200,
      slots: { default: "clientSlot" },
    },
    {
      title: "轮询间隔",
      field: "intervalMinutes",
      width: 110,
      formatter: ({ row }) => `${row.intervalMinutes || 0} 分钟`,
    },
    {
      title: "下次执行",
      field: "nextRunAt",
      width: 180,
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
    },
    {
      title: "最近状态",
      field: "lastStatus",
      width: 110,
      slots: { default: "statusSlot" },
    },
    {
      ...buildTimeColumn("最近执行", "lastRunAt", 180),
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
    },
    {
      ...buildTimeColumn("最近成功", "lastSuccessAt", 180),
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
    },
    {
      title: "启用",
      field: "isActive",
      width: 100,
      slots: { default: "activeSlot" },
    },
    buildOperationColumn("operationSlot", 110),
  ],
});

const loadCatalog = async () => {
  const data = await getEcomPlatformCollectCatalog();
  catalog.platforms = Array.isArray(data?.platforms) ? data.platforms : [];
  catalog.scenes = Array.isArray(data?.scenes) ? data.scenes : [];
  catalog.defaults = data?.defaults || catalog.defaults;
};

const loadClients = async () => {
  const response = await getBrowserAutomationCapabilities();
  capabilityClients.value = Array.isArray(response?.data?.clients) ? response.data.clients : [];
};

const loadList = async () => {
  loading.value = true;
  try {
    const data = await getEcomPlatformCollectTaskList(filters);
    list.value = Array.isArray(data?.list) ? data.list : [];
    total.value = Number(data?.total || 0);
    selectedIds.value = [];
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  await Promise.all([loadCatalog(), loadClients()]);
  await loadList();
};

const openTaskDialog = (task?: EcomPlatformCollectTask) => {
  currentTask.value = task || null;
  dialogVisible.value = true;
};

const handleDialogSuccess = async () => {
  currentTask.value = null;
  await loadData();
};

const handleSearch = async () => {
  filters.pageNo = 1;
  await loadList();
};

const handleReset = async () => {
  filters.pageNo = 1;
  filters.keyword = "";
  filters.platform = "";
  filters.collectScene = "";
  filters.isActive = "";
  await loadList();
};

const handlePageChange = (page: number) => {
  filters.pageNo = page;
  void loadList();
};

const handleCheckboxChange = ({ records }: { records: EcomPlatformCollectTask[] }) => {
  updateSelectedIds(records);
};

const handleCheckboxAll = ({ records }: { records: EcomPlatformCollectTask[] }) => {
  updateSelectedIds(records);
};

const handleToggleTask = async (row: EcomPlatformCollectTask, value: boolean) => {
  if (!row.id || toggleLoadingId.value === row.id) {
    return;
  }

  toggleLoadingId.value = row.id;
  try {
    await updateEcomPlatformCollectTask(row.id, {
      isActive: value,
      nextRunAt: value ? row.nextRunAt || new Date().toISOString() : row.nextRunAt || undefined,
    });
    ElMessage.success(value ? "任务已启用" : "任务已停用");
    await loadList();
  } catch (error: any) {
    ElMessage.error(error?.message || "更新任务状态失败");
  } finally {
    toggleLoadingId.value = "";
  }
};

const handleTriggerTask = async (row: EcomPlatformCollectTask) => {
  const result = await triggerEcomPlatformCollectTask(row.id);
  if (result?.success === false) {
    ElMessage.warning(result.message || "触发失败");
    return;
  }
  ElMessage.success(result?.message || "任务已触发");
  await router.push("/ecom-platform-collect/runs");
};

const handleDelete = async (row: EcomPlatformCollectTask) => {
  try {
    await ElMessageBox.confirm(
      `确认删除任务「${row.name}」吗？将同步删除关联运行记录、原始数据和截图文件。`,
      "提示",
      { type: "warning" },
    );
    await deleteEcomPlatformCollectTask(row.id);
    ElMessage.success("任务已删除");
    await loadList();
  } catch {}
};

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return;
  try {
    await ElMessageBox.confirm(
      `确认批量删除 ${selectedIds.value.length} 个任务吗？将同步清理关联运行记录、原始数据和截图文件。`,
      "提示",
      { type: "warning" },
    );
    await batchDeleteEcomPlatformCollectTask(selectedIds.value);
    ElMessage.success("批量删除成功");
    await loadList();
  } catch {}
};

const handleOperationCommand = (command: string, row: EcomPlatformCollectTask) => {
  switch (command) {
    case "trigger":
      void handleTriggerTask(row);
      break;
    case "edit":
      openTaskDialog(row);
      break;
    case "delete":
      void handleDelete(row);
      break;
  }
};

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.ecom-collect-page__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.ecom-collect-page__stat-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
}

.ecom-collect-page__stat-card .label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.ecom-collect-page__stat-card .value {
  margin-top: 6px;
  color: var(--el-text-color-primary);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.resource-toolbar__title {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.resource-toolbar__desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.table-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-switch-cell {
  display: flex;
  align-items: center;
}

@media (max-width: 960px) {
  .ecom-collect-page__stats {
    grid-template-columns: 1fr;
  }
}
</style>
