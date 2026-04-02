<template>
  <ContentWrap :plain="true">
    <div class="page">
      <div class="topbar">
        <div class="title">浏览器自动化控制台</div>
        <div class="actions">
          <el-button @click="handleRefreshClients">刷新节点</el-button>
          <el-button
            type="primary"
            :disabled="!selectedClientId"
            :loading="loadingMap.checkStatus"
            @click="sendSimple('checkStatus')"
            >刷新状态</el-button
          >
        </div>
      </div>

      <div class="layout" v-loading="loading">
        <ExternalClientSidebar
          :items="clientNodeItems"
          :loading="loading"
          :selected-client-id="selectedClientId"
          section-title="客户端节点"
          empty-text="暂无可用客户端"
          @select="selectedClientId = $event"
        />

        <section v-if="selectedClient" class="main">
          <div class="summary">
            <div class="card item">
              <div class="label">自动化服务</div>
              <div class="value">{{ getBrowserAutomationServiceText(selectedService) }}</div>
            </div>
            <div class="card item">
              <div class="label">浏览器实例</div>
              <div class="value">{{ getBrowserAutomationBrowserText(selectedService) }}</div>
            </div>
            <div class="card item">
              <div class="label">页面数</div>
              <div class="value">{{ selectedDetails.pageCount ?? 0 }}</div>
            </div>
            <div class="card item">
              <div class="label">最近检测</div>
              <div class="value">{{ dateText(selectedService?.lastCheckedAt) }}</div>
            </div>
          </div>

          <div class="card panel supported-task-panel" v-loading="capabilityLoading">
            <div class="supported-task-panel__head">
              <div>
                <div class="section-title">支持任务类型</div>
                <div class="muted">仅显示当前已接入浏览器自动化执行链路的任务类型。</div>
              </div>
            </div>
            <div v-if="supportedTaskTypeItems.length" class="supported-task-list">
              <span
                v-for="item in supportedTaskTypeItems"
                :key="item.taskType"
                class="supported-task-chip"
              >
                <span class="supported-task-chip__label">{{ item.label }}</span>
                <span class="supported-task-chip__key">{{ item.taskType }}</span>
              </span>
            </div>
            <div v-else class="muted">当前还没有可展示的任务类型。</div>
          </div>

          <div class="card panel console-entry">
            <div class="console-entry__content">
              <div class="section-title">集中操作台</div>
              <div class="muted">
                将连接控制、链接调试和任务中心统一收口到全屏面板中，方便集中管理当前节点。
              </div>
            </div>
            <el-button
              type="primary"
              :disabled="!selectedClientId"
              @click="operationDialogVisible = true"
              >打开操作面板</el-button
            >
          </div>
        </section>

        <section v-else class="main-empty card">
          <el-empty description="请选择客户端节点" />
        </section>
      </div>

      <el-dialog
        v-model="operationDialogVisible"
        fullscreen
        append-to-body
        :destroy-on-close="false"
        class="browser-automation-dialog"
        :title="operationDialogTitle"
      >
        <div class="operation-shell">
          <el-tabs v-model="activeTab" class="operation-tabs">
            <el-tab-pane label="连接控制" name="browser">
              <div class="grid">
                <div class="card panel">
                  <div class="section-title">浏览器控制</div>
                  <div class="row">
                    <el-input-number
                      v-model="browserForm.port"
                      :min="1"
                      :max="65535"
                      controls-position="right"
                      :disabled="!serviceEnabled"
                    />
                    <el-switch
                      v-model="browserForm.headless"
                      active-text="无头"
                      inactive-text="普通"
                      :disabled="!serviceEnabled"
                    />
                  </div>
                  <div class="row wrap">
                    <el-button
                      type="primary"
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.connect"
                      @click="sendConnect"
                      >连接</el-button
                    >
                    <el-button
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.close"
                      @click="sendSimple('close')"
                      >关闭</el-button
                    >
                    <el-button
                      type="danger"
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.forceClose"
                      @click="sendForceClose"
                      >强制关闭</el-button
                    >
                    <el-button
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.pages"
                      @click="sendSimple('pages')"
                      >获取页面</el-button
                    >
                  </div>
                  <div v-if="!serviceEnabled" class="muted">
                    自动化服务未启动，当前节点不可执行相关操作。
                  </div>
                </div>
                <div class="card panel">
                  <div class="section-title">链接调试入口</div>
                  <div class="row">
                    <el-input
                      v-model="openForm.url"
                      placeholder="https://..."
                      :disabled="!serviceEnabled"
                    />
                    <el-button
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.openLink"
                      @click="sendOpenLink"
                      >打开链接</el-button
                    >
                  </div>
                </div>
              </div>
              <div class="card panel">
                <div class="section-title">页面列表</div>
                <el-table
                  :data="pageOptions"
                  border
                  stripe
                  :row-class-name="getPageRowClassName"
                  @row-click="handlePageRowClick"
                >
                  <el-table-column prop="index" label="#" width="60" />
                  <el-table-column
                    prop="title"
                    label="标题"
                    min-width="220"
                    show-overflow-tooltip
                  />
                  <el-table-column prop="url" label="链接" min-width="320" show-overflow-tooltip />
                  <el-table-column label="操作" width="140">
                    <template #default="{ row }">
                      <el-button link type="primary" @click.stop="selectDebugPage(row)">
                        {{ debugForm.pageIndex === row.index ? "当前调试页" : "调试此页" }}
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="链接调试" name="debug">
              <div class="grid">
                <div class="card panel">
                  <div class="section-title">快速操作</div>
                  <div class="stack">
                    <el-select
                      v-model="debugForm.pageIndex"
                      placeholder="选择调试页面"
                      :disabled="!serviceEnabled || !pageOptions.length"
                    >
                      <el-option
                        v-for="page in pageOptions"
                        :key="page.optionKey"
                        :label="page.optionLabel"
                        :value="page.index"
                      />
                    </el-select>
                    <div class="debug-page-meta">
                      <div class="debug-page-meta__title">
                        当前调试页：
                        <span>{{ selectedDebugPage?.title || "未选择页面" }}</span>
                      </div>
                      <div class="debug-page-meta__url">
                        {{ selectedDebugPage?.url || "请先在页面列表或这里选择一个 tab" }}
                      </div>
                    </div>
                    <el-input-number
                      v-model="debugForm.pageIndex"
                      :min="0"
                      controls-position="right"
                      :disabled="!serviceEnabled"
                    />
                    <el-input
                      v-model="debugForm.url"
                      placeholder="URL"
                      :disabled="!serviceEnabled"
                    />
                    <el-input
                      v-model="debugForm.selector"
                      placeholder="Selector"
                      :disabled="!serviceEnabled"
                    />
                    <el-input
                      v-model="debugForm.text"
                      placeholder="Text"
                      :disabled="!serviceEnabled"
                    />
                    <el-input
                      v-model="debugForm.key"
                      placeholder="Key"
                      :disabled="!serviceEnabled"
                    />
                    <el-input-number
                      v-model="debugForm.ms"
                      :min="1"
                      controls-position="right"
                      :disabled="!serviceEnabled"
                    />
                    <el-input-number
                      v-model="debugForm.timeout"
                      :min="1000"
                      controls-position="right"
                      :disabled="!serviceEnabled"
                    />
                  </div>
                  <div class="action-grid">
                    <el-button
                      v-for="item in debugActions"
                      :key="item"
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.debug"
                      @click="sendDebug(item)"
                      >{{ item }}</el-button
                    >
                  </div>
                </div>
                <div class="card panel">
                  <div class="section-title">脚本</div>
                  <el-input
                    v-model="debugForm.expression"
                    type="textarea"
                    :rows="14"
                    placeholder="页面内 JS 或 Playwright 脚本"
                    :disabled="!serviceEnabled"
                  />
                  <div class="row">
                    <el-button
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.debug"
                      @click="sendDebug('eval')"
                      >执行页面内 JS</el-button
                    >
                    <el-button
                      :disabled="!serviceEnabled"
                      :loading="loadingMap.debug"
                      @click="sendDebug('playwright')"
                      >执行 Playwright</el-button
                    >
                  </div>
                </div>
              </div>
              <div class="card panel">
                <div class="section-title">结果</div>
                <div
                  v-if="debugFeedback"
                  class="debug-feedback"
                  :data-success="debugFeedback.success"
                >
                  <div class="debug-feedback__header">
                    <el-tag
                      :type="debugFeedback.success ? 'success' : 'danger'"
                      size="small"
                      effect="plain"
                    >
                      {{ debugFeedback.success ? "成功" : "失败" }}
                    </el-tag>
                    <span class="debug-feedback__message">{{ debugFeedback.message }}</span>
                  </div>
                  <div
                    v-if="
                      debugFeedback.step || debugFeedback.code || debugFeedback.pageIndex !== null
                    "
                    class="debug-feedback__meta"
                  >
                    <span v-if="debugFeedback.step">步骤：{{ debugFeedback.step }}</span>
                    <span v-if="debugFeedback.code">代码：{{ debugFeedback.code }}</span>
                    <span v-if="debugFeedback.pageIndex !== null"
                      >页面：#{{ debugFeedback.pageIndex }}</span
                    >
                  </div>
                  <div
                    v-if="debugFeedback.selector || debugFeedback.url"
                    class="debug-feedback__meta"
                  >
                    <span v-if="debugFeedback.selector"
                      >Selector：{{ debugFeedback.selector }}</span
                    >
                    <span v-if="debugFeedback.url">URL：{{ debugFeedback.url }}</span>
                  </div>
                  <div v-if="debugFeedback.suggestion" class="debug-feedback__hint">
                    建议：{{ debugFeedback.suggestion }}
                  </div>
                  <div
                    v-if="debugFeedback.detail && debugFeedback.detail !== debugFeedback.message"
                    class="debug-feedback__detail"
                  >
                    原始信息：{{ debugFeedback.detail }}
                  </div>
                </div>
                <pre class="result">{{ debugResult || "暂无结果" }}</pre>
              </div>
            </el-tab-pane>

            <el-tab-pane label="任务中心" name="tasks">
              <div class="card panel">
                <div class="row wrap">
                  <el-select
                    v-model="taskFilters.status"
                    clearable
                    placeholder="状态"
                    :disabled="!serviceEnabled"
                    ><el-option label="queued" value="queued" /><el-option
                      label="running"
                      value="running" /><el-option label="success" value="success" /><el-option
                      label="failed"
                      value="failed"
                  /></el-select>
                  <el-input
                    v-model="taskFilters.kind"
                    placeholder="任务类型"
                    :disabled="!serviceEnabled"
                  />
                  <el-input
                    v-model="taskFilters.sourceId"
                    placeholder="来源 ID"
                    :disabled="!serviceEnabled"
                  />
                  <el-button
                    type="primary"
                    :disabled="!serviceEnabled"
                    :loading="loadingMap.tasks"
                    @click="sendTasks"
                    >查询任务</el-button
                  >
                </div>
                <el-table :data="taskList" border stripe>
                  <el-table-column prop="status" label="状态" width="100" />
                  <el-table-column prop="kind" label="类型" width="120" />
                  <el-table-column prop="action" label="动作" width="120" />
                  <el-table-column prop="step" label="步骤" min-width="140" />
                  <el-table-column
                    prop="id"
                    label="任务 ID"
                    min-width="240"
                    show-overflow-tooltip
                  />
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button
                        link
                        type="primary"
                        :disabled="!serviceEnabled"
                        @click="sendTaskDetail(row.id)"
                        >详情</el-button
                      >
                      <el-button
                        link
                        type="primary"
                        :disabled="!serviceEnabled"
                        @click="sendTaskLogs(row.id)"
                        >日志</el-button
                      >
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-dialog>

      <el-dialog v-model="detailVisible" title="任务详情" width="900px">
        <pre class="result">{{ detailText }}</pre>
      </el-dialog>
      <el-dialog v-model="logsVisible" title="任务日志" width="900px">
        <pre class="result">{{ logsText }}</pre>
      </el-dialog>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  checkBrowserAutomationStatus,
  closeBrowserAutomation,
  connectBrowserAutomation,
  executeBrowserAutomationDebug,
  fetchBrowserAutomationPages,
  forceCloseBrowserAutomation,
  getBrowserAutomationCapabilities,
  getBrowserAutomationTaskDetail,
  getBrowserAutomationTaskLogs,
  openBrowserAutomationLink,
  queryBrowserAutomationTasks,
  type BrowserAutomationCapabilityCatalogResponse,
  type BrowserAutomationClientVO,
  type BrowserAutomationCommandResponse,
  type BrowserAutomationServiceStatus,
} from "@/api/external/browserAutomation";
import {
  extractBrowserAutomationSupportedTaskTypes,
  getBrowserAutomationBrowserText,
  getBrowserAutomationBrowserTone,
  getBrowserAutomationServiceText,
  getBrowserAutomationServiceTone,
} from "@/services/browserAutomationRuntime";
import { websocketClient, type ServiceCommandResultEvent } from "@/services/websocketClient";
import { usePluginClientNodes } from "@/services/clientNodeState";
import { formatDate } from "@/utils/formatTime";
import ExternalClientSidebar, {
  type ClientNodeItem,
} from "../components/ExternalClientSidebar.vue";

defineOptions({ name: "ExternalBrowserAutomation" });

interface BrowserDebugFeedback {
  success: boolean;
  action: string | null;
  message: string;
  detail: string | null;
  step: string | null;
  code: string | null;
  suggestion: string | null;
  pageIndex: number | null;
  selector: string | null;
  url: string | null;
  timeout: boolean;
  updatedAt: string | null;
}

interface BrowserSupportedTaskTypeItem {
  taskType: string;
  label: string;
}

const {
  clients: rawClients,
  loading,
  refresh: refreshClientNodes,
  getServiceRuntime,
} = usePluginClientNodes("browser-automation");
const selectedClientId = ref("");
const activeTab = ref("browser");
const pageList = ref<Record<string, any>[]>([]);
const taskList = ref<Record<string, any>[]>([]);
const debugResult = ref("");
const debugFeedback = ref<BrowserDebugFeedback | null>(null);
const detailText = ref("");
const logsText = ref("");
const detailVisible = ref(false);
const logsVisible = ref(false);
const operationDialogVisible = ref(false);
const capabilityLoading = ref(false);
const capabilityCatalog = ref<BrowserAutomationCapabilityCatalogResponse["data"] | null>(null);

const loadingMap = reactive<Record<string, boolean>>({
  checkStatus: false,
  connect: false,
  close: false,
  forceClose: false,
  pages: false,
  debug: false,
  tasks: false,
  taskDetail: false,
  taskLogs: false,
  openLink: false,
});
const pending = reactive<Record<string, string>>({});

const browserForm = reactive({ port: 9222, headless: false });
const openForm = reactive({ url: "" });
const debugForm = reactive({
  pageIndex: 0,
  url: "",
  selector: "",
  text: "",
  key: "",
  expression: "",
  ms: 1000,
  timeout: 30000,
});
const taskFilters = reactive({ status: "", kind: "", sourceId: "" });
const debugActions = [
  "newPage",
  "goto",
  "bringToFront",
  "reload",
  "closePage",
  "click",
  "fill",
  "type",
  "press",
  "text",
  "html",
  "count",
  "wait",
  "screenshot",
];

const mapBrowserAutomationClient = (client: any): BrowserAutomationClientVO => ({
  clientId: client.id,
  isOnline: client.isOnline,
  nodeStatus: client.nodeStatus,
  connectedAt: client.connectedAt,
  lastOnlineAt: client.lastOnlineAt,
  lastOfflineAt: client.lastOfflineAt,
  appVersion: client.clientInfo?.appVersion || null,
  machine: client.clientInfo?.machine || null,
  location: client.clientInfo?.location || null,
  uploader: (getServiceRuntime(client) as BrowserAutomationServiceStatus | null) || null,
});

const clients = computed<BrowserAutomationClientVO[]>(() =>
  rawClients.value.map((client) => mapBrowserAutomationClient(client)),
);

const selectedClient = computed(
  () => clients.value.find((item) => item.clientId === selectedClientId.value) || null,
);
const selectedClientName = computed(
  () => selectedClient.value?.machine?.code || selectedClient.value?.clientId || "未选择节点",
);
const operationDialogTitle = computed(() => `集中操作台 · ${selectedClientName.value}`);
const selectedService = computed<BrowserAutomationServiceStatus | null>(
  () => selectedClient.value?.uploader || null,
);
const selectedDetails = computed(() => selectedService.value?.details || {});
const serviceEnabled = computed(() =>
  Boolean(selectedClient.value?.isOnline && selectedService.value?.connected),
);
const capabilityLabelMap = computed(() => {
  const items = capabilityCatalog.value?.declaredCapabilities || [];
  return new Map(items.map((item) => [item.taskType, item.label]));
});
const supportedTaskTypeItems = computed<BrowserSupportedTaskTypeItem[]>(() => {
  const normalized = new Map<string, string>();
  const runtimeCapabilities = Array.isArray(selectedDetails.value?.capabilities)
    ? selectedDetails.value.capabilities
    : [];

  runtimeCapabilities.forEach((item: any) => {
    const taskType = String(item?.taskType || "").trim();
    if (!taskType) {
      return;
    }
    normalized.set(
      taskType,
      String(item?.label || capabilityLabelMap.value.get(taskType) || taskType),
    );
  });

  if (!normalized.size) {
    extractBrowserAutomationSupportedTaskTypes(selectedService.value).forEach((taskType) => {
      normalized.set(taskType, capabilityLabelMap.value.get(taskType) || taskType);
    });
  }

  if (!normalized.size) {
    (capabilityCatalog.value?.declaredCapabilities || []).forEach((item) => {
      const taskType = String(item?.taskType || "").trim();
      if (!taskType) {
        return;
      }
      normalized.set(taskType, String(item?.label || taskType));
    });
  }

  return Array.from(normalized.entries())
    .map(([taskType, label]) => ({ taskType, label }))
    .sort((left, right) => left.label.localeCompare(right.label, "zh-CN"));
});
const clientNodeItems = computed<ClientNodeItem[]>(() =>
  clients.value.map((client) => ({
    connectionId: client.clientId,
    name: client.machine?.code || client.clientId,
    time: dateText(client.lastOnlineAt || client.connectedAt || client.lastOfflineAt),
    metaLeft: client.appVersion || "未知版本",
    metaRight: client.location?.ip || client.location?.city || "未知位置",
    badges: [
      { text: client.isOnline ? "在线" : "离线", tone: client.isOnline ? "success" : "muted" },
      {
        text: getBrowserAutomationServiceText(client.uploader),
        tone: getBrowserAutomationServiceTone(client.uploader),
      },
      {
        text: getBrowserAutomationBrowserText(client.uploader),
        tone: getBrowserAutomationBrowserTone(client.uploader),
      },
    ],
  })),
);

const dateText = (value?: string | null) =>
  value ? formatDate(new Date(value), "YYYY-MM-DD HH:mm:ss") : "-";
const normalizeBrowserAutomationKey = (value?: string | null) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (
    normalized === "uploader" ||
    normalized === "browser" ||
    normalized === "browser-automation"
  ) {
    return "browser-automation";
  }
  return normalized;
};
const jsonText = (value: any) => {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
};
const toNullableText = (value: any) => {
  const normalized = String(value || "").trim();
  return normalized || null;
};
const normalizeCapabilityCatalogPayload = (response: any) => {
  const payload =
    response?.data && typeof response.data === "object" && !Array.isArray(response.data)
      ? response.data
      : response;

  if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data as BrowserAutomationCapabilityCatalogResponse["data"];
  }

  return payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    Array.isArray(payload.declaredCapabilities)
    ? (payload as BrowserAutomationCapabilityCatalogResponse["data"])
    : null;
};
const getCommandErrorDetail = (event: ServiceCommandResultEvent) => {
  if (
    event.errorDetail &&
    typeof event.errorDetail === "object" &&
    !Array.isArray(event.errorDetail)
  ) {
    return event.errorDetail as Record<string, any>;
  }

  const dataDetail = event.data?.errorDetail;
  if (dataDetail && typeof dataDetail === "object" && !Array.isArray(dataDetail)) {
    return dataDetail as Record<string, any>;
  }

  return null;
};
const buildDebugFeedback = (event: ServiceCommandResultEvent, action?: string) => {
  const errorDetail = getCommandErrorDetail(event);
  const pageIndexValue =
    typeof errorDetail?.pageIndex === "number"
      ? errorDetail.pageIndex
      : typeof event.data?.pageIndex === "number"
        ? event.data.pageIndex
        : null;

  return {
    success: !!event.success,
    action: toNullableText(action || event.action),
    message:
      toNullableText(errorDetail?.userMessage) ||
      toNullableText(event.message) ||
      toNullableText(event.error) ||
      (event.success ? "执行成功" : "执行失败"),
    detail:
      toNullableText(errorDetail?.rawMessage) ||
      (event.success ? null : toNullableText(event.error || event.message)),
    step: toNullableText(errorDetail?.step),
    code: toNullableText(errorDetail?.code),
    suggestion: toNullableText(errorDetail?.suggestion),
    pageIndex: pageIndexValue,
    selector: toNullableText(errorDetail?.selector),
    url: toNullableText(errorDetail?.url || event.data?.url),
    timeout: errorDetail?.timeout === true,
    updatedAt: toNullableText(event.finishedAt),
  } satisfies BrowserDebugFeedback;
};
const buildDebugResultText = (feedback: BrowserDebugFeedback, data: Record<string, any>) => {
  if (feedback.action === "pages") {
    return jsonText({
      action: feedback.action,
      success: feedback.success,
      message: feedback.message,
      step: feedback.step,
      code: feedback.code,
      suggestion: feedback.suggestion,
      pageCount: Array.isArray(data?.pages) ? data.pages.length : 0,
      pages: Array.isArray(data?.pages) ? data.pages : [],
      runtime: data?.runtime || null,
      updatedAt: feedback.updatedAt,
    });
  }

  return jsonText({
    action: feedback.action,
    success: feedback.success,
    message: feedback.message,
    step: feedback.step,
    code: feedback.code,
    suggestion: feedback.suggestion,
    pageIndex: feedback.pageIndex,
    selector: feedback.selector,
    url: feedback.url,
    timeout: feedback.timeout,
    result: data || null,
    updatedAt: feedback.updatedAt,
  });
};
const resetDebugOutput = () => {
  debugFeedback.value = null;
  debugResult.value = "";
};
const normalizePageOption = (page: Record<string, any>, fallbackIndex: number) => {
  const rawIndex =
    typeof page?.index === "number"
      ? page.index
      : typeof page?.pageIndex === "number"
        ? page.pageIndex
        : fallbackIndex;
  const title = String(page?.title || page?.name || `页面 ${rawIndex}`);
  const url = String(page?.url || "");

  return {
    ...page,
    index: rawIndex,
    title,
    url,
    isActive:
      page?.isActive === true ||
      page?.active === true ||
      page?.current === true ||
      page?.selected === true,
    optionKey: `${rawIndex}-${title}-${url}`,
    optionLabel: `#${rawIndex} ${title}${url ? ` · ${url}` : ""}`,
  };
};
const getPagesFromClient = (client?: BrowserAutomationClientVO | null) => {
  const pages = client?.uploader?.details?.pages;
  return Array.isArray(pages) ? pages : [];
};
const pageOptions = computed(() =>
  pageList.value.map((page, index) => normalizePageOption(page, index)),
);
const selectedDebugPage = computed(
  () => pageOptions.value.find((page) => page.index === debugForm.pageIndex) || null,
);
const syncSelectedPages = () => {
  pageList.value = getPagesFromClient(selectedClient.value);
};
const syncDebugPageIndex = () => {
  if (!pageOptions.value.length) {
    debugForm.pageIndex = 0;
    return;
  }

  const exists = pageOptions.value.some((page) => page.index === debugForm.pageIndex);
  if (exists) {
    return;
  }

  const preferredPage =
    pageOptions.value.find((page) => page.isActive) || pageOptions.value[0] || null;
  if (preferredPage) {
    debugForm.pageIndex = preferredPage.index;
  }
};
const selectDebugPage = (page: Record<string, any>) => {
  const normalizedPage = normalizePageOption(page, 0);
  debugForm.pageIndex = normalizedPage.index;
  if (activeTab.value !== "debug") {
    activeTab.value = "debug";
  }
};
const handlePageRowClick = (row: Record<string, any>) => {
  selectDebugPage(row);
};
const getPageRowClassName = ({ row }: { row: Record<string, any> }) => {
  return row?.index === debugForm.pageIndex ? "page-row-is-active" : "";
};

const finish = (action?: string) => {
  if (action && action in loadingMap) loadingMap[action] = false;
};

const dispatch = async (
  action: string,
  requestor: () => Promise<BrowserAutomationCommandResponse>,
  okText: string,
) => {
  if (loadingMap[action]) return;
  loadingMap[action] = true;
  try {
    const response = await requestor();
    if (!response?.success) {
      finish(action);
      ElMessage.error(response?.message || "命令发送失败");
      return;
    }
    const commandId = response.data?.commandId;
    if (!commandId) {
      finish(action);
      return;
    }
    pending[commandId] = action;
    ElMessage.success(okText);
  } catch (error: any) {
    finish(action);
    ElMessage.error(error?.message || "命令发送失败");
  }
};

const loadClients = async () => {
  await refreshClientNodes();
  if (
    !selectedClientId.value ||
    !clients.value.some((item) => item.clientId === selectedClientId.value)
  ) {
    selectedClientId.value = clients.value[0]?.clientId || "";
  }
  syncSelectedPages();
};

const loadCapabilityCatalog = async () => {
  capabilityLoading.value = true;
  try {
    const response = await getBrowserAutomationCapabilities();
    capabilityCatalog.value = normalizeCapabilityCatalogPayload(response);
  } catch (error) {
    console.warn("[browser-automation] 加载能力目录失败", error);
  } finally {
    capabilityLoading.value = false;
  }
};

const handleRefreshClients = async () => {
  await Promise.all([loadClients(), loadCapabilityCatalog()]);
};

const sendSimple = async (kind: "checkStatus" | "close" | "pages") => {
  if (!selectedClientId.value) return;
  if (kind === "pages") {
    resetDebugOutput();
  }
  if (kind === "checkStatus")
    return dispatch(
      "checkStatus",
      () => checkBrowserAutomationStatus(selectedClientId.value),
      "状态刷新命令已发送",
    );
  if (kind === "close")
    return dispatch(
      "close",
      () => closeBrowserAutomation(selectedClientId.value),
      "关闭命令已发送",
    );
  return dispatch(
    "pages",
    () => fetchBrowserAutomationPages(selectedClientId.value),
    "获取页面命令已发送",
  );
};

const sendConnect = async () =>
  selectedClientId.value &&
  dispatch(
    "connect",
    () => connectBrowserAutomation(selectedClientId.value, browserForm),
    "连接命令已发送",
  );
const sendForceClose = async () =>
  selectedClientId.value &&
  dispatch(
    "forceClose",
    () => forceCloseBrowserAutomation(selectedClientId.value, { port: browserForm.port }),
    "强制关闭命令已发送",
  );
const sendOpenLink = async () =>
  selectedClientId.value &&
  openForm.url.trim() &&
  dispatch(
    "openLink",
    () => openBrowserAutomationLink(selectedClientId.value, { url: openForm.url.trim() }),
    "打开链接命令已发送",
  );
const sendDebug = async (action: string) =>
  selectedClientId.value &&
  (resetDebugOutput(),
  dispatch(
    "debug",
    () => executeBrowserAutomationDebug(selectedClientId.value, { action, ...debugForm }),
    "调试命令已发送",
  ));
const sendTasks = async () =>
  selectedClientId.value &&
  dispatch(
    "tasks",
    () => queryBrowserAutomationTasks(selectedClientId.value, taskFilters),
    "任务查询命令已发送",
  );
const sendTaskDetail = async (taskId: string) =>
  selectedClientId.value &&
  dispatch(
    "taskDetail",
    () => getBrowserAutomationTaskDetail(selectedClientId.value, taskId),
    "任务详情命令已发送",
  );
const sendTaskLogs = async (taskId: string) =>
  selectedClientId.value &&
  dispatch(
    "taskLogs",
    () => getBrowserAutomationTaskLogs(selectedClientId.value, taskId),
    "任务日志命令已发送",
  );

const onCommand = async (event: ServiceCommandResultEvent) => {
  if (normalizeBrowserAutomationKey(event.pluginKey || event.service) !== "browser-automation")
    return;
  const action = pending[event.commandId];
  delete pending[event.commandId];
  finish(action);
  const data = event.data || {};
  const feedback = buildDebugFeedback(event, action);
  if (event.clientId === selectedClientId.value) {
    if (Array.isArray(data.pages)) pageList.value = data.pages;
    if (action === "debug" || action === "pages") {
      debugFeedback.value = feedback;
      debugResult.value = buildDebugResultText(feedback, data);
    }
    if (action === "tasks") taskList.value = Array.isArray(data.items) ? data.items : [];
    if (action === "taskDetail") {
      detailText.value = jsonText(data.task || null);
      detailVisible.value = true;
    }
    if (action === "taskLogs") {
      logsText.value = jsonText(data.logs || []);
      logsVisible.value = true;
    }
  }
  (event.success ? ElMessage.success : ElMessage.error)(feedback.message);
  await loadClients();
};

watch(clients, (list) => {
  if (!selectedClientId.value || !list.some((item) => item.clientId === selectedClientId.value)) {
    selectedClientId.value = list[0]?.clientId || "";
  }
});

watch(
  selectedDetails,
  () => {
    syncSelectedPages();
    syncDebugPageIndex();
  },
  { deep: true },
);

watch(selectedClientId, (value) => {
  syncSelectedPages();
  syncDebugPageIndex();
  resetDebugOutput();
  if (!value) operationDialogVisible.value = false;
});

watch(
  pageOptions,
  () => {
    syncDebugPageIndex();
  },
  { deep: true, immediate: true },
);

watch([operationDialogVisible, activeTab, serviceEnabled], ([visible, tab, enabled]) => {
  if (!visible || !enabled) return;
  if ((tab === "browser" || tab === "debug") && !pageOptions.value.length && !loadingMap.pages) {
    void sendSimple("pages");
  }
});

onMounted(async () => {
  await Promise.all([loadClients(), loadCapabilityCatalog()]);
  websocketClient.events.on("serviceCommandResult", onCommand);
});

onUnmounted(() => {
  websocketClient.events.off("serviceCommandResult", onCommand);
});
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.actions,
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wrap {
  flex-wrap: wrap;
}

.layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 12px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.console-entry {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 16px;
}

.supported-task-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.supported-task-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.supported-task-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.supported-task-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 180px;
  min-height: 48px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
}

.supported-task-chip__label {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.supported-task-chip__key {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
  font-family: Consolas, Monaco, "Courier New", monospace;
  word-break: break-all;
}

.console-entry__content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  text-align: left;
}

.console-entry :deep(.el-button) {
  align-self: flex-start;
}

.card {
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.panel,
.item,
.main-empty {
  padding: 12px;
}

.panel,
.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 560px;
}

.summary,
.grid,
.action-grid {
  display: grid;
  gap: 12px;
}

.summary {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.label,
.muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.value,
.section-title {
  font-weight: 600;
}

.value {
  margin-top: 4px;
  font-size: 15px;
  line-height: 1.4;
}

.section-title {
  font-size: 13px;
  line-height: 1.2;
}

.row :deep(.el-input),
.row :deep(.el-select),
.row :deep(.el-input-number) {
  flex: 1;
  min-width: 0;
}

.stack :deep(.el-input),
.stack :deep(.el-input-number),
.stack :deep(.el-date-editor) {
  width: 100%;
}

.debug-feedback {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.debug-feedback[data-success="false"] {
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
}

.debug-feedback__header,
.debug-feedback__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.debug-feedback__message {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.debug-feedback__meta,
.debug-feedback__detail,
.debug-feedback__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.result {
  margin: 0;
  padding: 12px;
  min-height: 180px;
  max-height: 420px;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.operation-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.browser-automation-dialog :deep(.el-dialog__body) {
  padding-top: 12px;
}

.debug-page-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.debug-page-meta__title {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  span {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }
}

.debug-page-meta__url {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.browser-automation-dialog :deep(.page-row-is-active) {
  --el-table-tr-bg-color: var(--el-color-primary-light-9);
}

@media (max-width: 1200px) {
  .layout,
  .summary,
  .grid,
  .action-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .console-entry {
    flex-direction: column;
    align-items: stretch;
  }

  .actions {
    flex-wrap: wrap;
  }
}
</style>
