<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="ecom-platform-collect-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <div class="ecom-toolbar">
            <div class="ecom-toolbar__main">
              <div class="ecom-toolbar__title">电商数据获取</div>
              <div class="ecom-toolbar__description">
                管理电商前台采集任务、执行记录与原始数据，支持按平台、场景、执行机器统一调度。
              </div>
            </div>
            <div class="list-page-search-form__actions">
              <el-button size="small" @click="refreshAll">刷新</el-button>
              <el-button size="small" type="primary" @click="openTaskDialog()">新建任务</el-button>
            </div>
          </div>

          <div class="ecom-stat-grid">
            <div class="ecom-stat-card">
              <div class="ecom-stat-card__label">任务数</div>
              <div class="ecom-stat-card__value">{{ taskTotal }}</div>
            </div>
            <div class="ecom-stat-card">
              <div class="ecom-stat-card__label">运行记录</div>
              <div class="ecom-stat-card__value">{{ runTotal }}</div>
            </div>
            <div class="ecom-stat-card">
              <div class="ecom-stat-card__label">原始记录</div>
              <div class="ecom-stat-card__value">{{ rawTotal }}</div>
            </div>
            <div class="ecom-stat-card">
              <div class="ecom-stat-card__label">可用客户端</div>
              <div class="ecom-stat-card__value">{{ clientOptions.length }}</div>
            </div>
          </div>

          <div class="ecom-tab-panel">
            <el-tabs v-model="activeTab" class="ecom-tab-panel__tabs">
              <el-tab-pane label="采集任务" name="tasks" />
              <el-tab-pane label="运行记录" name="runs" />
              <el-tab-pane label="原始数据" name="raw" />
            </el-tabs>

            <div class="ecom-tab-panel__search">
              <el-form
                v-if="activeTab === 'tasks'"
                :model="taskFilters"
                label-position="top"
                class="list-page-search-form"
              >
                <el-row :gutter="12" class="list-page-search-form__row">
                  <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="7">
                    <el-form-item label="任务名称 / 平台">
                      <el-input
                        v-model="taskFilters.keyword"
                        clearable
                        placeholder="搜索任务名 / 平台"
                        @keyup.enter="handleTaskSearch"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5">
                    <el-form-item label="平台">
                      <el-select v-model="taskFilters.platform" clearable placeholder="平台">
                        <el-option
                          v-for="item in catalog.platforms"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5">
                    <el-form-item label="场景">
                      <el-select v-model="taskFilters.collectScene" clearable placeholder="场景">
                        <el-option
                          v-for="item in catalog.scenes"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="4">
                    <el-form-item label="启用状态">
                      <el-select v-model="taskFilters.isActive" clearable placeholder="启用状态">
                        <el-option label="启用" value="true" />
                        <el-option label="停用" value="false" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <div class="list-page-search-form__actions">
                  <el-button size="small" type="primary" @click="handleTaskSearch">查询</el-button>
                  <el-button size="small" @click="resetTaskFilters">重置</el-button>
                </div>
              </el-form>

              <el-form
                v-else-if="activeTab === 'runs'"
                :model="runFilters"
                label-position="top"
                class="list-page-search-form"
              >
                <el-row :gutter="12" class="list-page-search-form__row">
                  <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5">
                    <el-form-item label="平台">
                      <el-select v-model="runFilters.platform" clearable placeholder="平台">
                        <el-option
                          v-for="item in catalog.platforms"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5">
                    <el-form-item label="运行状态">
                      <el-select v-model="runFilters.status" clearable placeholder="运行状态">
                        <el-option label="排队中" value="queued" />
                        <el-option label="已分配" value="assigned" />
                        <el-option label="运行中" value="running" />
                        <el-option label="成功" value="success" />
                        <el-option label="失败" value="failed" />
                        <el-option label="跳过" value="skipped" />
                        <el-option label="终止" value="terminated" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5">
                    <el-form-item label="触发方式">
                      <el-select v-model="runFilters.triggerMode" clearable placeholder="触发方式">
                        <el-option label="手动" value="manual" />
                        <el-option label="调度" value="schedule" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <div class="list-page-search-form__actions">
                  <el-button size="small" type="primary" @click="handleRunSearch">查询</el-button>
                  <el-button size="small" @click="resetRunFilters">重置</el-button>
                </div>
              </el-form>

              <el-form
                v-else
                :model="rawFilters"
                label-position="top"
                class="list-page-search-form"
              >
                <el-row :gutter="12" class="list-page-search-form__row">
                  <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="7">
                    <el-form-item label="记录标识 / 来源链接">
                      <el-input
                        v-model="rawFilters.keyword"
                        clearable
                        placeholder="搜索 recordKey / 来源链接"
                        @keyup.enter="handleRawSearch"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5">
                    <el-form-item label="平台">
                      <el-select v-model="rawFilters.platform" clearable placeholder="平台">
                        <el-option
                          v-for="item in catalog.platforms"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <div class="list-page-search-form__actions">
                  <el-button size="small" type="primary" @click="handleRawSearch">查询</el-button>
                  <el-button size="small" @click="resetRawFilters">重置</el-button>
                </div>
              </el-form>
            </div>
          </div>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                v-if="activeTab === 'tasks'"
                v-bind="taskGridOptions"
                :data="taskList"
                :loading="taskLoading"
              >
                <template #taskPlatformSceneSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ getPlatformLabel(row.platform) }}</span>
                    <span class="table-meta-text">{{ getSceneLabel(row.collectScene) }}</span>
                  </div>
                </template>

                <template #taskMachineSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ row.targetMachineCode || "-" }}</span>
                    <span class="table-meta-text">{{ row.targetClientId || "-" }}</span>
                  </div>
                </template>

                <template #taskStatusSlot="{ row }">
                  <el-tag size="small" :type="getRunStatusTagType(row.lastStatus)">
                    {{ getRunStatusLabel(row.lastStatus) }}
                  </el-tag>
                </template>

                <template #taskActiveSlot="{ row }">
                  <div class="table-switch-cell">
                    <el-switch
                      :model-value="!!row.isActive"
                      :loading="taskToggleLoadingId === row.id"
                      inline-prompt
                      active-text="开"
                      inactive-text="关"
                      @change="(value) => handleToggleTask(row, value === true)"
                    />
                    <span class="table-meta-text">{{ row.isActive ? "启用" : "停用" }}</span>
                  </div>
                </template>

                <template #taskOperationSlot="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      @command="(command) => handleTaskOperationCommand(String(command), row)"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button">
                        操作
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="trigger">
                            <span>立即执行</span>
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

              <vxe-grid
                v-else-if="activeTab === 'runs'"
                v-bind="runGridOptions"
                :data="runList"
                :loading="runLoading"
              >
                <template #runPlatformSceneSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ getPlatformLabel(row.platform) }}</span>
                    <span class="table-meta-text">{{ getSceneLabel(row.collectScene) }}</span>
                  </div>
                </template>

                <template #runStatusSlot="{ row }">
                  <el-tag size="small" :type="getRunStatusTagType(row.status)">
                    {{ getRunStatusLabel(row.status) }}
                  </el-tag>
                </template>

                <template #runSummarySlot="{ row }">
                  <span class="table-meta-text">{{ row.summaryData?.message || row.errorMessage || "-" }}</span>
                </template>

                <template #runOperationSlot="{ row }">
                  <el-button link type="primary" size="small" @click="openRunDetail(row)">详情</el-button>
                </template>
              </vxe-grid>

              <vxe-grid
                v-else
                v-bind="rawGridOptions"
                :data="rawList"
                :loading="rawLoading"
              >
                <template #rawPlatformSceneSlot="{ row }">
                  <div class="table-stack">
                    <span>{{ getPlatformLabel(row.platform) }}</span>
                    <span class="table-meta-text">{{ getSceneLabel(row.collectScene) }}</span>
                  </div>
                </template>

                <template #rawRecordKeySlot="{ row }">
                  <span class="table-code-text">{{ row.recordKey || "-" }}</span>
                </template>

                <template #rawTitleSlot="{ row }">
                  <span class="table-meta-text">{{ getRawTitle(row) }}</span>
                </template>

                <template #rawSourceUrlSlot="{ row }">
                  <el-link
                    v-if="getRawLink(row)"
                    :href="getRawLink(row)"
                    target="_blank"
                    type="primary"
                    class="table-link-text"
                  >
                    {{ getShortUrl(row.sourceUrl || "") }}
                  </el-link>
                  <span v-else class="table-meta-text">-</span>
                </template>

                <template #rawOperationSlot="{ row }">
                  <el-button link type="primary" size="small" @click="openRawDetail(row)">详情</el-button>
                </template>
              </vxe-grid>
            </div>
          </div>

          <div class="list-page-table-panel__pagination--flat ecom-pagination">
            <el-pagination
              background
              layout="total, prev, pager, next"
              :total="currentTotal"
              :page-size="currentPageSize"
              :current-page="currentPageNo"
              @current-change="handleCurrentPageChange"
            />
          </div>
        </div>
      </template>
    </ListPageLayout>

    <el-dialog
      v-model="taskDialogVisible"
      :title="taskForm.id ? '编辑采集任务' : '新建采集任务'"
      width="760px"
      destroy-on-close
    >
      <el-form label-width="110px">
        <el-form-item label="任务名称" required>
          <el-input v-model="taskForm.name" placeholder="例如：Amazon 热门耳机抓取" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="平台" required>
              <el-select
                v-model="taskForm.platform"
                placeholder="请选择平台"
                style="width: 100%"
                @change="handlePlatformChange"
              >
                <el-option
                  v-for="item in catalog.platforms"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采集场景" required>
              <el-select v-model="taskForm.collectScene" placeholder="请选择场景" style="width: 100%">
                <el-option
                  v-for="item in availableSceneOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <div v-if="selectedSceneMeta?.description" class="form-hint">
                {{ selectedSceneMeta.description }}
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="执行客户端">
              <el-select
                v-model="taskForm.targetClientId"
                clearable
                filterable
                placeholder="选择客户端"
                style="width: 100%"
                @change="handleClientChange"
              >
                <el-option
                  v-for="item in clientOptions"
                  :key="item.clientId"
                  :label="item.label"
                  :value="item.clientId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="机器编码">
              <el-input v-model="taskForm.targetMachineCode" placeholder="自动回填，可手动调整" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="轮询间隔">
              <el-input-number
                v-model="taskForm.intervalMinutes"
                :min="catalog.defaults.minIntervalMinutes || 10"
                :max="720"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下次执行时间">
              <el-date-picker
                v-model="taskForm.nextRunAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
                placeholder="立即执行可留空"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col v-if="showKeywordConfig" :span="12">
            <el-form-item label="关键词">
              <el-input v-model="taskForm.keyword" placeholder="search 场景优先使用" />
            </el-form-item>
          </el-col>
          <el-col v-if="showTargetUrlConfig" :span="12">
            <el-form-item label="目标链接">
              <el-input v-model="taskForm.targetUrl" placeholder="详情页 / 店铺页链接" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col v-if="showKeywordConfig" :span="12">
            <el-form-item label="关键词列表">
              <el-input
                v-model="taskForm.keywordsText"
                type="textarea"
                :rows="3"
                placeholder="一行一个或逗号分隔"
              />
            </el-form-item>
          </el-col>
          <el-col v-if="showPaginationConfig" :span="6">
            <el-form-item label="最大页数">
              <el-input-number
                v-model="taskForm.maxPages"
                :min="1"
                :max="20"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="showKeywordConfig ? 6 : 12">
            <el-form-item label="最大记录数">
              <el-input-number
                v-model="taskForm.maxItems"
                :min="1"
                :max="500"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="附加配置 JSON">
          <el-input
            v-model="taskForm.extraJson"
            type="textarea"
            :rows="5"
            placeholder='例如：{"sort":"sales","shopId":"xxx"}'
          />
        </el-form-item>
        <el-form-item label="启用任务">
          <el-switch v-model="taskForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="taskSubmitting" @click="handleSubmitTask">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" :title="detailDialogTitle" width="760px">
      <pre class="json-preview">{{ detailDialogContent }}</pre>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { formatDate } from "@/utils/formatTime";
import { getBrowserAutomationClients } from "@/api/external/browserAutomation";
import type { BrowserAutomationClientVO } from "@/api/external/browserAutomation";
import {
  createEcomPlatformCollectTask,
  deleteEcomPlatformCollectTask,
  getEcomPlatformCollectCatalog,
  getEcomPlatformCollectRunDetail,
  getEcomPlatformCollectRunList,
  getEcomPlatformCollectTaskList,
  getEcomPlatformRawRecordDetail,
  getEcomPlatformRawRecordList,
  triggerEcomPlatformCollectTask,
  updateEcomPlatformCollectTask,
  type EcomPlatformCollectCatalog,
  type EcomPlatformCollectRun,
  type EcomPlatformCollectTask,
  type EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
import ListPageLayout from "@/components/ListPageLayout/index.vue";

const activeTab = ref("tasks");

const catalog = reactive<EcomPlatformCollectCatalog>({
  platforms: [],
  scenes: [],
  defaults: {
    intervalMinutes: 30,
    minIntervalMinutes: 10,
  },
});

const taskLoading = ref(false);
const runLoading = ref(false);
const rawLoading = ref(false);
const taskSubmitting = ref(false);
const taskToggleLoadingId = ref("");

const taskList = ref<EcomPlatformCollectTask[]>([]);
const runList = ref<EcomPlatformCollectRun[]>([]);
const rawList = ref<EcomPlatformRawRecord[]>([]);

const taskTotal = ref(0);
const runTotal = ref(0);
const rawTotal = ref(0);

const clientList = ref<BrowserAutomationClientVO[]>([]);

const clientOptions = computed(() =>
  clientList.value.map((item) => ({
    clientId: item.clientId,
    machineCode: item.machine?.code || "",
    label: `${item.machine?.code || item.clientId}${item.location?.city ? ` / ${item.location.city}` : ""}`,
  })),
);

const taskFilters = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: "",
  platform: "",
  collectScene: "",
  isActive: "",
});

const runFilters = reactive({
  pageNo: 1,
  pageSize: 10,
  platform: "",
  status: "",
  triggerMode: "",
});

const rawFilters = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: "",
  platform: "",
});

const taskDialogVisible = ref(false);
const taskForm = reactive({
  id: "",
  name: "",
  platform: "",
  collectScene: "search",
  targetClientId: "",
  targetMachineCode: "",
  intervalMinutes: 30,
  nextRunAt: "",
  keyword: "",
  keywordsText: "",
  targetUrl: "",
  maxPages: 2,
  maxItems: 60,
  extraJson: "",
  isActive: true,
});

const detailDialogVisible = ref(false);
const detailDialogTitle = ref("");
const detailDialogContent = ref("");

const selectedPlatformMeta = computed(() =>
  catalog.platforms.find((item) => item.value === taskForm.platform),
);

const availableSceneOptions = computed(() => {
  const supportedScenes = selectedPlatformMeta.value?.supportedScenes;
  if (!Array.isArray(supportedScenes) || supportedScenes.length === 0) {
    return catalog.scenes;
  }
  return catalog.scenes.filter((item) => supportedScenes.includes(item.value));
});

const selectedSceneMeta = computed(() =>
  catalog.scenes.find((item) => item.value === taskForm.collectScene),
);

const selectedSceneRequirements = computed(
  () => selectedSceneMeta.value?.requirements || {},
);

const showKeywordConfig = computed(
  () => selectedSceneRequirements.value.keyword === true,
);

const showTargetUrlConfig = computed(
  () => selectedSceneRequirements.value.targetUrl === true,
);

const showPaginationConfig = computed(
  () => selectedSceneRequirements.value.pagination === true,
);

const getPlatformLabel = (value?: string) => {
  return catalog.platforms.find((item) => item.value === value)?.label || value || "-";
};

const getSceneLabel = (value?: string) => {
  return catalog.scenes.find((item) => item.value === value)?.label || value || "-";
};

const getRunStatusLabel = (value?: string | null) => {
  const map: Record<string, string> = {
    queued: "排队中",
    assigned: "已分配",
    running: "运行中",
    success: "成功",
    failed: "失败",
    skipped: "跳过",
    terminated: "终止",
  };
  return map[String(value || "")] || "-";
};

const getRunStatusTagType = (value?: string | null) => {
  const map: Record<string, "success" | "warning" | "danger" | "info"> = {
    queued: "info",
    assigned: "info",
    running: "warning",
    success: "success",
    failed: "danger",
    skipped: "info",
    terminated: "danger",
  };
  return map[String(value || "")] || "info";
};

const getTriggerModeLabel = (value?: string | null) => {
  return value === "schedule" ? "调度" : "手动";
};

const formatDateTime = (value?: string | null) => {
  return value ? formatDate(new Date(value)) : "-";
};

const formatJson = (value: any) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value ?? "");
  }
};

const getSnapshotCount = (value: any) => {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value && typeof value === "object" && Array.isArray(value.snapshots)) {
    return value.snapshots.length;
  }
  return 0;
};

const getRawTitle = (row: EcomPlatformRawRecord) => {
  return String(
    row?.rawPayload?.title ||
      row?.rawPayload?.pageTitle ||
      row?.rawPayload?.descriptionText ||
      "-",
  );
};

const getShortUrl = (value?: string | null) => {
  const text = String(value || "").trim();
  if (!text) {
    return "-";
  }
  if (text.length <= 52) {
    return text;
  }
  return `${text.slice(0, 32)}...${text.slice(-16)}`;
};

const getRawLink = (row: EcomPlatformRawRecord) => {
  return String(
    row?.rawPayload?.originalSourceUrl ||
      row?.rawPayload?.sourceUrl ||
      row?.sourceUrl ||
      "",
  ).trim();
};

const taskGridOptions = ref({
  ...commonGridOptions,
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  columns: [
    { title: "任务名称", field: "name", minWidth: 220, showOverflow: "tooltip" },
    {
      title: "平台 / 场景",
      field: "platform",
      width: 170,
      slots: { default: "taskPlatformSceneSlot" },
    },
    {
      title: "执行机器",
      field: "targetMachineCode",
      minWidth: 200,
      slots: { default: "taskMachineSlot" },
    },
    {
      title: "轮询间隔",
      field: "intervalMinutes",
      width: 110,
      formatter: ({ row }: { row: EcomPlatformCollectTask }) =>
        `${row.intervalMinutes || 0} 分钟`,
    },
    {
      title: "下次执行",
      field: "nextRunAt",
      width: 180,
      formatter: ({ cellValue }: { cellValue: string }) => formatDateTime(cellValue),
    },
    {
      title: "最近状态",
      field: "lastStatus",
      width: 110,
      slots: { default: "taskStatusSlot" },
    },
    {
      title: "最近执行",
      field: "lastRunAt",
      width: 180,
      formatter: ({ cellValue }: { cellValue: string }) => formatDateTime(cellValue),
    },
    {
      title: "启用",
      field: "isActive",
      width: 120,
      slots: { default: "taskActiveSlot" },
    },
    buildOperationColumn("taskOperationSlot", 110),
  ],
});

const runGridOptions = ref({
  ...commonGridOptions,
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  columns: [
    { title: "任务名称", field: "taskName", minWidth: 180, showOverflow: "tooltip" },
    {
      title: "平台 / 场景",
      field: "platform",
      width: 160,
      slots: { default: "runPlatformSceneSlot" },
    },
    {
      title: "状态",
      field: "status",
      width: 100,
      slots: { default: "runStatusSlot" },
    },
    {
      title: "触发方式",
      field: "triggerMode",
      width: 100,
      formatter: ({ row }: { row: EcomPlatformCollectRun }) =>
        getTriggerModeLabel(row.triggerMode),
    },
    {
      title: "机器编码",
      field: "assignedMachineCode",
      minWidth: 160,
      showOverflow: "tooltip",
      formatter: ({ row }: { row: EcomPlatformCollectRun }) =>
        row.assignedMachineCode || "-",
    },
    {
      title: "记录数",
      field: "summaryData",
      width: 90,
      formatter: ({ row }: { row: EcomPlatformCollectRun }) =>
        Number(row.summaryData?.recordsCount || 0),
    },
    {
      title: "创建时间",
      field: "createTime",
      width: 180,
      formatter: ({ cellValue }: { cellValue: string }) => formatDateTime(cellValue),
    },
    {
      title: "开始时间",
      field: "startedAt",
      width: 180,
      formatter: ({ cellValue }: { cellValue: string }) => formatDateTime(cellValue),
    },
    {
      title: "结束时间",
      field: "finishedAt",
      width: 180,
      formatter: ({ cellValue }: { cellValue: string }) => formatDateTime(cellValue),
    },
    {
      title: "摘要",
      field: "summaryText",
      minWidth: 260,
      showOverflow: "tooltip",
      slots: { default: "runSummarySlot" },
    },
    buildOperationColumn("runOperationSlot", 96),
  ],
});

const rawGridOptions = ref({
  ...commonGridOptions,
  rowConfig: {
    ...(commonGridOptions as any).rowConfig,
    keyField: "id",
  },
  columns: [
    { title: "任务名称", field: "taskName", minWidth: 160, showOverflow: "tooltip" },
    {
      title: "平台 / 场景",
      field: "platform",
      width: 160,
      slots: { default: "rawPlatformSceneSlot" },
    },
    {
      title: "记录标识",
      field: "recordKey",
      minWidth: 180,
      showOverflow: "tooltip",
      slots: { default: "rawRecordKeySlot" },
    },
    {
      title: "原始摘要",
      field: "rawTitle",
      minWidth: 260,
      showOverflow: "tooltip",
      slots: { default: "rawTitleSlot" },
    },
    {
      title: "来源链接",
      field: "sourceUrl",
      minWidth: 260,
      showOverflow: "tooltip",
      slots: { default: "rawSourceUrlSlot" },
    },
    {
      title: "采集时间",
      field: "capturedAt",
      width: 180,
      formatter: ({ cellValue }: { cellValue: string }) => formatDateTime(cellValue),
    },
    {
      title: "截图数",
      field: "snapshotData",
      width: 80,
      formatter: ({ row }: { row: EcomPlatformRawRecord }) =>
        getSnapshotCount(row.snapshotData),
    },
    buildOperationColumn("rawOperationSlot", 96),
  ],
});

const currentPageNo = computed(() => {
  if (activeTab.value === "runs") return runFilters.pageNo;
  if (activeTab.value === "raw") return rawFilters.pageNo;
  return taskFilters.pageNo;
});

const currentPageSize = computed(() => {
  if (activeTab.value === "runs") return runFilters.pageSize;
  if (activeTab.value === "raw") return rawFilters.pageSize;
  return taskFilters.pageSize;
});

const currentTotal = computed(() => {
  if (activeTab.value === "runs") return runTotal.value;
  if (activeTab.value === "raw") return rawTotal.value;
  return taskTotal.value;
});

const resetTaskForm = () => {
  taskForm.id = "";
  taskForm.name = "";
  taskForm.platform = "";
  taskForm.collectScene = "search";
  taskForm.targetClientId = "";
  taskForm.targetMachineCode = "";
  taskForm.intervalMinutes = catalog.defaults.intervalMinutes || 30;
  taskForm.nextRunAt = "";
  taskForm.keyword = "";
  taskForm.keywordsText = "";
  taskForm.targetUrl = "";
  taskForm.maxPages = 2;
  taskForm.maxItems = 60;
  taskForm.extraJson = "";
  taskForm.isActive = true;
};

const resetTaskFilters = async () => {
  taskFilters.pageNo = 1;
  taskFilters.keyword = "";
  taskFilters.platform = "";
  taskFilters.collectScene = "";
  taskFilters.isActive = "";
  await loadTasks();
};

const handleTaskSearch = async () => {
  taskFilters.pageNo = 1;
  await loadTasks();
};

const resetRunFilters = async () => {
  runFilters.pageNo = 1;
  runFilters.platform = "";
  runFilters.status = "";
  runFilters.triggerMode = "";
  await loadRuns();
};

const handleRunSearch = async () => {
  runFilters.pageNo = 1;
  await loadRuns();
};

const resetRawFilters = async () => {
  rawFilters.pageNo = 1;
  rawFilters.keyword = "";
  rawFilters.platform = "";
  await loadRawRecords();
};

const handleRawSearch = async () => {
  rawFilters.pageNo = 1;
  await loadRawRecords();
};

const handleClientChange = (clientId: string) => {
  const matched = clientOptions.value.find((item) => item.clientId === clientId);
  taskForm.targetMachineCode = matched?.machineCode || "";
};

const handlePlatformChange = (platform: string) => {
  const matchedPlatform = catalog.platforms.find((item) => item.value === platform);
  const supportedScenes = matchedPlatform?.supportedScenes || [];
  if (
    supportedScenes.length > 0 &&
    taskForm.collectScene &&
    !supportedScenes.includes(taskForm.collectScene)
  ) {
    taskForm.collectScene = supportedScenes[0] || "";
  }
};

const buildConfigData = () => {
  let extraConfig = {};
  if (taskForm.extraJson.trim()) {
    try {
      extraConfig = JSON.parse(taskForm.extraJson.trim());
    } catch {
      throw new Error("附加配置 JSON 格式不正确");
    }
  }

  const keywords = taskForm.keywordsText
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    ...extraConfig,
    keyword: showKeywordConfig.value ? taskForm.keyword.trim() || undefined : undefined,
    keywords: showKeywordConfig.value ? keywords : undefined,
    targetUrl: showTargetUrlConfig.value ? taskForm.targetUrl.trim() || undefined : undefined,
    maxPages: showPaginationConfig.value ? taskForm.maxPages || undefined : undefined,
    maxItems: taskForm.maxItems || undefined,
  };
};

const validateTaskForm = () => {
  const configData = buildConfigData();
  const keyword = String(configData.keyword || "").trim();
  const keywords = Array.isArray(configData.keywords) ? configData.keywords : [];
  const targetUrl = String(configData.targetUrl || "").trim();

  if (taskForm.collectScene === "search" && !keyword && keywords.length === 0) {
    throw new Error("关键词搜索场景至少需要填写一个关键词");
  }

  if (
    ["product_detail", "shop_hot_products"].includes(taskForm.collectScene) &&
    !targetUrl
  ) {
    throw new Error("当前采集场景需要填写目标链接");
  }

  return configData;
};

const loadCatalog = async () => {
  const data = await getEcomPlatformCollectCatalog();
  catalog.platforms = Array.isArray(data?.platforms) ? data.platforms : [];
  catalog.scenes = Array.isArray(data?.scenes) ? data.scenes : [];
  catalog.defaults = data?.defaults || catalog.defaults;
};

const loadClients = async () => {
  const data = await getBrowserAutomationClients();
  clientList.value = Array.isArray(data) ? data : [];
};

const loadTasks = async () => {
  taskLoading.value = true;
  try {
    const data = await getEcomPlatformCollectTaskList(taskFilters);
    taskList.value = Array.isArray(data?.list) ? data.list : [];
    taskTotal.value = Number(data?.total || 0);
  } finally {
    taskLoading.value = false;
  }
};

const loadRuns = async () => {
  runLoading.value = true;
  try {
    const data = await getEcomPlatformCollectRunList(runFilters);
    runList.value = Array.isArray(data?.list) ? data.list : [];
    runTotal.value = Number(data?.total || 0);
  } finally {
    runLoading.value = false;
  }
};

const loadRawRecords = async () => {
  rawLoading.value = true;
  try {
    const data = await getEcomPlatformRawRecordList(rawFilters);
    rawList.value = Array.isArray(data?.list) ? data.list : [];
    rawTotal.value = Number(data?.total || 0);
  } finally {
    rawLoading.value = false;
  }
};

const refreshAll = async () => {
  await Promise.all([loadCatalog(), loadClients()]);
  await Promise.all([loadTasks(), loadRuns(), loadRawRecords()]);
};

const openTaskDialog = (task?: EcomPlatformCollectTask) => {
  resetTaskForm();
  if (task) {
    taskForm.id = task.id;
    taskForm.name = task.name;
    taskForm.platform = task.platform;
    taskForm.collectScene = task.collectScene;
    taskForm.targetClientId = task.targetClientId || "";
    taskForm.targetMachineCode = task.targetMachineCode || "";
    taskForm.intervalMinutes = task.intervalMinutes || catalog.defaults.intervalMinutes || 30;
    taskForm.nextRunAt = task.nextRunAt || "";
    taskForm.keyword = String(task.configData?.keyword || "");
    taskForm.keywordsText = Array.isArray(task.configData?.keywords)
      ? task.configData.keywords.join("\n")
      : "";
    taskForm.targetUrl = String(task.configData?.targetUrl || "");
    taskForm.maxPages = Number(task.configData?.maxPages || 2);
    taskForm.maxItems = Number(task.configData?.maxItems || 60);
    const { keyword, keywords, targetUrl, maxPages, maxItems, ...extraConfig } =
      task.configData || {};
    taskForm.extraJson =
      extraConfig && Object.keys(extraConfig).length
        ? JSON.stringify(extraConfig, null, 2)
        : "";
    taskForm.isActive = task.isActive !== false;
  }
  taskDialogVisible.value = true;
};

const handleSubmitTask = async () => {
  if (!taskForm.name.trim()) {
    ElMessage.warning("请填写任务名称");
    return;
  }
  if (!taskForm.platform) {
    ElMessage.warning("请选择平台");
    return;
  }
  if (!taskForm.collectScene) {
    ElMessage.warning("请选择采集场景");
    return;
  }

  taskSubmitting.value = true;
  try {
    const configData = validateTaskForm();
    const payload = {
      name: taskForm.name.trim(),
      platform: taskForm.platform,
      collectScene: taskForm.collectScene,
      targetClientId: taskForm.targetClientId || undefined,
      targetMachineCode: taskForm.targetMachineCode || undefined,
      intervalMinutes: taskForm.intervalMinutes,
      nextRunAt: taskForm.nextRunAt || undefined,
      isActive: taskForm.isActive,
      configData,
    };

    if (taskForm.id) {
      await updateEcomPlatformCollectTask(taskForm.id, payload);
      ElMessage.success("任务已更新");
    } else {
      await createEcomPlatformCollectTask(payload);
      ElMessage.success("任务已创建");
    }

    taskDialogVisible.value = false;
    await loadTasks();
  } catch (error: any) {
    ElMessage.error(error?.message || "保存任务失败");
  } finally {
    taskSubmitting.value = false;
  }
};

const handleToggleTask = async (row: EcomPlatformCollectTask, value: boolean) => {
  if (!row.id || taskToggleLoadingId.value === row.id) {
    return;
  }

  taskToggleLoadingId.value = row.id;
  try {
    await updateEcomPlatformCollectTask(row.id, {
      isActive: value,
      nextRunAt: value ? row.nextRunAt || new Date().toISOString() : row.nextRunAt || undefined,
    });
    ElMessage.success(value ? "任务已启用" : "任务已停用");
    await loadTasks();
  } catch (error: any) {
    ElMessage.error(error?.message || "更新任务状态失败");
  } finally {
    taskToggleLoadingId.value = "";
  }
};

const handleTriggerTask = async (row: EcomPlatformCollectTask) => {
  const result = await triggerEcomPlatformCollectTask(row.id);
  if (result?.success === false) {
    ElMessage.warning(result.message || "触发失败");
    return;
  }
  ElMessage.success(result?.message || "任务已触发");
  activeTab.value = "runs";
  await loadRuns();
};

const handleDeleteTask = async (row: EcomPlatformCollectTask) => {
  try {
    await ElMessageBox.confirm(`确认删除任务「${row.name}」吗？`, "提示", {
      type: "warning",
    });
    await deleteEcomPlatformCollectTask(row.id);
    ElMessage.success("任务已删除");
    await loadTasks();
  } catch {
    // ignore
  }
};

const handleTaskOperationCommand = (command: string, row: EcomPlatformCollectTask) => {
  switch (command) {
    case "trigger":
      handleTriggerTask(row);
      break;
    case "edit":
      openTaskDialog(row);
      break;
    case "delete":
      handleDeleteTask(row);
      break;
  }
};

const openRunDetail = async (row: EcomPlatformCollectRun) => {
  const detail = await getEcomPlatformCollectRunDetail(row.id);
  detailDialogTitle.value = `运行详情 · ${row.taskName || row.id}`;
  detailDialogContent.value = formatJson(detail);
  detailDialogVisible.value = true;
};

const openRawDetail = async (row: EcomPlatformRawRecord) => {
  const detail = await getEcomPlatformRawRecordDetail(row.id);
  detailDialogTitle.value = `原始数据详情 · ${row.recordKey || row.id}`;
  detailDialogContent.value = formatJson(detail);
  detailDialogVisible.value = true;
};

const handleCurrentPageChange = (page: number) => {
  if (activeTab.value === "runs") {
    runFilters.pageNo = page;
    loadRuns();
    return;
  }

  if (activeTab.value === "raw") {
    rawFilters.pageNo = page;
    loadRawRecords();
    return;
  }

  taskFilters.pageNo = page;
  loadTasks();
};

onMounted(async () => {
  await refreshAll();
});
</script>

<style scoped lang="scss">
:deep(.ecom-platform-collect-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.ecom-platform-collect-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.ecom-platform-collect-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

.ecom-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.ecom-toolbar__main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ecom-toolbar__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ecom-toolbar__description {
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.ecom-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ecom-stat-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
}

.ecom-stat-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ecom-stat-card__value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.ecom-tab-panel {
  padding: 0 14px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
}

.ecom-tab-panel__tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.ecom-tab-panel__tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: var(--el-border-color-lighter);
}

.ecom-tab-panel__search {
  padding-top: 12px;
}

.table-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-meta-text {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.table-switch-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-code-text {
  font-family: var(--el-font-family-monospace, "SFMono-Regular", Consolas, monospace);
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.table-link-text {
  max-width: 100%;
  font-size: 12px;
  line-height: 1.5;
}

.ecom-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

.form-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.json-preview {
  margin: 0;
  padding: 16px;
  max-height: 60vh;
  overflow: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.6;
  font-family: var(--el-font-family-monospace, "SFMono-Regular", Consolas, monospace);
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 960px) {
  .ecom-toolbar {
    flex-direction: column;
  }

  .ecom-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
