<template>
  <div class="ps-console" v-loading="loading">
    <div class="ops-header">
      <div>
        <div class="ops-header__title">PS 服务控制台</div>
      </div>
      <div class="ops-header__actions">
        <div class="inline-status-group">
          <div class="inline-status" :class="`is-${serviceStatus.level}`">
            <span class="inline-status__dot" />
            <span class="inline-status__label">PS 服务</span>
            <span class="inline-status__text">{{ serviceStatus.text }}</span>
          </div>
        </div>
        <el-button type="primary" :disabled="!selectedClient" @click="operationDialogVisible = true"
          >打开操作面板</el-button
        >
        <el-button
          :disabled="!selectedClient"
          @click="handleSelectedClientCommand('refreshRuntime')"
          >刷新服务</el-button
        >
        <el-button
          :disabled="!selectedClient"
          @click="handleSelectedClientCommand('health', {}, 'maintenance')"
          >检测服务</el-button
        >
        <el-button type="primary" @click="refreshClients">刷新节点</el-button>
      </div>
    </div>

    <div class="tab-layout">
      <ExternalClientSidebar
        class="ops-sidebar"
        :items="clientNodeItems"
        :loading="loading"
        :selected-client-id="selectedClientId"
        section-title="客户端节点"
        empty-text="暂无可用客户端"
        @select="selectedClientId = $event"
      />

      <section class="ops-main">
        <div class="ops-panel">
          <div class="ops-panel__head">
            <div>
              <div class="ops-panel__title">节点 PS 服务状态</div>
              <div class="ops-panel__sub" v-if="selectedClient">
                {{ selectedClientDisplayName }}
              </div>
            </div>
            <div class="ops-panel__actions" v-if="selectedClient">
              <el-button @click="handleSelectedClientCommand('refreshRuntime')">刷新状态</el-button>
              <el-button @click="handleSelectedClientCommand('health', {}, 'maintenance')"
                >健康检测</el-button
              >
            </div>
          </div>

          <template v-if="selectedClient">
            <div class="compact-info compact-info--grid">
              <div class="compact-info__item">
                <span class="compact-info__label">客户端</span>
                <span class="compact-info__value">{{ selectedClientDisplayName }}</span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">整体</span>
                <span class="compact-info__value">
                  <span class="status-chip" :class="`is-${serviceStatus.level}`">
                    <span class="status-chip__dot" />
                    <span>{{ serviceStatus.text }}</span>
                  </span>
                </span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">服务状态</span>
                <span class="compact-info__value">
                  <span class="status-chip" :class="`is-${selectedPsServiceConnectionStatus.tone}`">
                    <span class="status-chip__dot" />
                    <span>{{ selectedPsServiceConnectionStatus.text }}</span>
                  </span>
                </span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">Photoshop</span>
                <span class="compact-info__value">
                  <span class="status-chip" :class="`is-${selectedPsApplicationStatus.tone}`">
                    <span class="status-chip__dot" />
                    <span>{{ selectedPsApplicationStatus.text }}</span>
                  </span>
                </span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">运行态</span>
                <span class="compact-info__value">{{
                  resolvePsStateText(selectedPsBridgeService?.state)
                }}</span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">版本</span>
                <span class="compact-info__value">{{
                  selectedPsBridgeService?.version || "-"
                }}</span>
              </div>
              <div class="compact-info__item compact-info__item--full">
                <span class="compact-info__label">说明</span>
                <span class="compact-info__value">{{
                  selectedPsBridgeService?.message || "-"
                }}</span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">服务地址</span>
                <span class="compact-info__value">{{
                  selectedPsBridgeService?.endpoint || "-"
                }}</span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">当前任务</span>
                <span class="compact-info__value">{{
                  selectedPsBridgeService?.currentTaskId || "-"
                }}</span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">最近检测</span>
                <span class="compact-info__value">{{
                  formatDateSafe(selectedPsBridgeService?.lastCheckedAt)
                }}</span>
              </div>
              <div class="compact-info__item">
                <span class="compact-info__label">支持命令</span>
                <span class="compact-info__value">{{
                  formatListSafe(selectedPsBridgeService?.supportedCommands)
                }}</span>
              </div>
              <div class="compact-info__item compact-info__item--full">
                <span class="compact-info__label">最后错误</span>
                <span class="compact-info__value">{{
                  selectedPsBridgeService?.lastError || "-"
                }}</span>
              </div>
            </div>
          </template>

          <el-empty v-else description="请选择客户端节点" />
        </div>
      </section>
    </div>

    <el-dialog
      v-model="operationDialogVisible"
      fullscreen
      append-to-body
      :destroy-on-close="false"
      class="ps-operation-dialog"
      :title="operationDialogTitle"
    >
      <div v-if="selectedClient" class="operation-shell">
        <el-tabs v-model="activeTab" class="operation-tabs">
          <el-tab-pane label="服务" name="service">
            <div class="operation-grid operation-grid--service">
              <div class="ops-panel">
                <div class="ops-panel__head">
                  <div>
                    <div class="ops-panel__title">服务控制</div>
                    <div class="ops-panel__sub">通过 ws 链路触发当前节点的 Photoshop 服务</div>
                  </div>
                </div>

                <div class="form-grid form-grid--service">
                  <div class="field-block">
                    <label>启动超时（秒）</label>
                    <el-input-number
                      v-model="serviceForm.startTimeout"
                      :min="5"
                      :max="120"
                      controls-position="right"
                    />
                  </div>
                  <div class="field-block field-block--switch">
                    <label>关闭策略</label>
                    <el-switch
                      v-model="serviceForm.forceStop"
                      active-text="强制关闭"
                      inactive-text="优雅关闭"
                    />
                  </div>
                </div>

                <div class="button-row button-row--service-grid">
                  <el-button
                    :loading="loadingMap.refreshRuntime"
                    @click="dispatchPsCommand('refreshRuntime')"
                    >刷新状态</el-button
                  >
                  <el-button
                    :loading="loadingMap.health"
                    @click="dispatchPsCommand('health', {}, 'maintenance')"
                    >健康检测</el-button
                  >
                  <el-button
                    type="primary"
                    :loading="loadingMap.startPhotoshop"
                    @click="
                      dispatchPsCommand(
                        'startPhotoshop',
                        { timeout: serviceForm.startTimeout },
                        'maintenance',
                      )
                    "
                    >启动 Photoshop</el-button
                  >
                  <el-button
                    :loading="loadingMap.restartPhotoshop"
                    @click="
                      dispatchPsCommand(
                        'restartPhotoshop',
                        { timeout: serviceForm.startTimeout },
                        'maintenance',
                      )
                    "
                    >重启 Photoshop</el-button
                  >
                  <el-button
                    type="danger"
                    :loading="loadingMap.stopPhotoshop"
                    @click="
                      dispatchPsCommand(
                        'stopPhotoshop',
                        { force: serviceForm.forceStop },
                        'maintenance',
                      )
                    "
                    >关闭 Photoshop</el-button
                  >
                </div>
              </div>

              <div class="ops-panel">
                <div class="ops-panel__head">
                  <div>
                    <div class="ops-panel__title">服务详情</div>
                    <div class="ops-panel__sub">当前节点最新上报的运行状态</div>
                  </div>
                </div>

                <div class="compact-info compact-info--grid">
                  <div class="compact-info__item">
                    <span class="compact-info__label">整体</span>
                    <span class="compact-info__value">
                      <span class="status-chip" :class="`is-${serviceStatus.level}`">
                        <span class="status-chip__dot" />
                        <span>{{ serviceStatus.text }}</span>
                      </span>
                    </span>
                  </div>
                  <div class="compact-info__item">
                    <span class="compact-info__label">服务状态</span>
                    <span class="compact-info__value">
                      <span class="status-chip" :class="`is-${selectedPsServiceConnectionStatus.tone}`">
                        <span class="status-chip__dot" />
                        <span>{{ selectedPsServiceConnectionStatus.text }}</span>
                      </span>
                    </span>
                  </div>
                  <div class="compact-info__item">
                    <span class="compact-info__label">Photoshop</span>
                    <span class="compact-info__value">
                      <span class="status-chip" :class="`is-${selectedPsApplicationStatus.tone}`">
                        <span class="status-chip__dot" />
                        <span>{{ selectedPsApplicationStatus.text }}</span>
                      </span>
                    </span>
                  </div>
                  <div class="compact-info__item">
                    <span class="compact-info__label">运行态</span>
                    <span class="compact-info__value">{{
                      resolvePsStateText(selectedPsBridgeService?.state)
                    }}</span>
                  </div>
                  <div class="compact-info__item">
                    <span class="compact-info__label">版本</span>
                    <span class="compact-info__value">{{
                      selectedPsBridgeService?.version || "-"
                    }}</span>
                  </div>
                  <div class="compact-info__item">
                    <span class="compact-info__label">最近检测</span>
                    <span class="compact-info__value">{{
                      formatDateSafe(selectedPsBridgeService?.lastCheckedAt)
                    }}</span>
                  </div>
                  <div class="compact-info__item compact-info__item--full">
                    <span class="compact-info__label">说明</span>
                    <span class="compact-info__value">{{
                      selectedPsBridgeService?.message || "-"
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="PSD 分析" name="analyze">
            <div class="operation-grid">
              <div class="ops-panel">
                <div class="ops-panel__head">
                  <div>
                    <div class="ops-panel__title">分析参数</div>
                    <div class="ops-panel__sub">
                      分析当前节点可访问的 PSD 文件结构和智能对象信息
                    </div>
                  </div>
                </div>

                <div class="form-stack">
                  <div class="field-block">
                    <label>PSD 文件路径</label>
                    <el-input v-model="analyzeForm.psdPath" placeholder="D:\\path\\to\\file.psd" />
                  </div>

                  <div class="button-row wrap">
                    <el-button
                      type="primary"
                      :loading="loadingMap.analyzePsd"
                      @click="handleAnalyzePsd"
                      >开始分析</el-button
                    >
                    <el-button
                      :disabled="!analysisResult"
                      @click="copyJson(analysisResult, '分析结果已复制')"
                      >复制 JSON</el-button
                    >
                  </div>
                </div>

                <div class="compact-info compact-info--grid" v-if="analysisResult">
                  <div class="compact-info__item">
                    <span class="compact-info__label">文档尺寸</span>
                    <span class="compact-info__value">{{
                      formatDocumentSize(analysisDocumentInfo)
                    }}</span>
                  </div>
                  <div class="compact-info__item">
                    <span class="compact-info__label">画板数</span>
                    <span class="compact-info__value">{{
                      analysisStatistics.artboard_count ?? 0
                    }}</span>
                  </div>
                  <div class="compact-info__item">
                    <span class="compact-info__label">智能对象</span>
                    <span class="compact-info__value">{{
                      analysisStatistics.total_smart_objects ?? 0
                    }}</span>
                  </div>
                  <div class="compact-info__item">
                    <span class="compact-info__label">图层数</span>
                    <span class="compact-info__value">{{
                      analysisStatistics.total_layers ?? 0
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="ops-panel">
                <div class="ops-panel__head">
                  <div>
                    <div class="ops-panel__title">分析结果</div>
                    <div class="ops-panel__sub">保留完整 JSON，便于和 yishe-ps 输出对齐</div>
                  </div>
                </div>
                <pre class="result">{{
                  analysisResult ? jsonText(analysisResult) : "暂无分析结果"
                }}</pre>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="调试处理" name="process">
            <div class="operation-grid">
              <div class="ops-panel">
                <div class="ops-panel__head">
                  <div>
                    <div class="ops-panel__title">处理参数</div>
                    <div class="ops-panel__sub">通过 debugProcess 调用当前节点的 /processPsd</div>
                  </div>
                </div>

                <div class="form-stack">
                  <div class="field-block">
                    <label>PSD 路径 *</label>
                    <el-input
                      v-model="processForm.psdPath"
                      placeholder="D:\\templates\\template.psd"
                    />
                  </div>
                  <div class="field-block">
                    <label>导出目录</label>
                    <el-input v-model="processForm.exportDir" placeholder="留空则使用默认 output" />
                  </div>
                  <div class="form-grid">
                    <div class="field-block">
                      <label>导出文件名</label>
                      <el-input
                        v-model="processForm.outputFilename"
                        placeholder="可选，自动加时间戳"
                      />
                    </div>
                    <div class="field-block">
                      <label>verbose</label>
                      <el-switch
                        v-model="processForm.verbose"
                        active-text="开启"
                        inactive-text="关闭"
                      />
                    </div>
                  </div>
                  <div class="subsection-head">
                    <div class="subsection-title">智能对象配置</div>
                    <el-button size="small" @click="addSmartObject">添加智能对象</el-button>
                  </div>
                  <div class="smart-object-list">
                    <div
                      v-for="(item, index) in processForm.smartObjects"
                      :key="`smart-object-${index}`"
                      class="smart-object-card"
                    >
                      <div class="smart-object-card__head">
                        <div class="smart-object-card__title">智能对象 #{{ index + 1 }}</div>
                        <el-button
                          link
                          type="danger"
                          :disabled="processForm.smartObjects.length <= 1"
                          @click="removeSmartObject(index)"
                          >删除</el-button
                        >
                      </div>
                      <div class="form-grid">
                        <div class="field-block">
                          <label>智能对象名称</label>
                          <el-input
                            v-model="item.smartObjectName"
                            placeholder="可选，不指定则按顺序匹配"
                          />
                        </div>
                        <div class="field-block">
                          <label>素材图片路径 *</label>
                          <el-input v-model="item.imagePath" placeholder="D:\\images\\image.jpg" />
                        </div>
                      </div>
                      <div class="form-grid">
                        <div class="field-block">
                          <label>缩放模式</label>
                          <el-select v-model="item.resizeMode">
                            <el-option label="contain" value="contain" />
                            <el-option label="cover" value="cover" />
                            <el-option label="stretch" value="stretch" />
                            <el-option label="custom" value="custom" />
                          </el-select>
                        </div>
                        <div class="field-block">
                          <label>tile_size</label>
                          <el-input-number
                            v-model="item.tileSize"
                            :min="64"
                            :max="2048"
                            controls-position="right"
                          />
                        </div>
                      </div>
                      <div v-if="item.resizeMode === 'custom'" class="field-block">
                        <label>custom_options</label>
                        <div class="button-row wrap">
                          <el-button
                            v-for="template in customTemplateOptions"
                            :key="template.key"
                            size="small"
                            @click="applyCustomOptionsTemplate(index, template.key)"
                            >{{ template.label }}</el-button
                          >
                        </div>
                        <el-input
                          v-model="item.customOptionsText"
                          type="textarea"
                          :rows="7"
                          placeholder='{\"position\":{\"x\":0,\"y\":0,\"unit\":\"px\"},\"size\":{\"width\":800,\"height\":600,\"unit\":\"px\"},\"child_resize_mode\":\"contain\"}'
                        />
                      </div>
                    </div>
                  </div>
                  <div class="button-row wrap">
                    <el-button
                      type="primary"
                      :loading="loadingMap.debugProcess"
                      @click="handleDebugProcess"
                      >开始处理</el-button
                    >
                    <el-button @click="copyText(processPayloadPreview, '处理参数已复制')"
                      >复制参数</el-button
                    >
                  </div>
                </div>
              </div>

              <div class="ops-panel">
                <div class="ops-panel__head">
                  <div>
                    <div class="ops-panel__title">后端参数与结果</div>
                    <div class="ops-panel__sub">同时查看 processPsd 请求体和返回结果</div>
                  </div>
                </div>
                <pre class="result">{{ processPayloadPreview }}</pre>
                <pre class="result result--secondary">{{
                  processResult ? jsonText(processResult) : "暂无处理结果"
                }}</pre>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="日志" name="logs">
            <div class="operation-grid">
              <div class="ops-panel">
                <div class="ops-panel__head">
                  <div>
                    <div class="ops-panel__title">最新命令结果</div>
                    <div class="ops-panel__sub">最近一次 service-command-result 返回值</div>
                  </div>
                  <div class="ops-panel__actions">
                    <el-button
                      :disabled="!latestCommandResult"
                      @click="copyJson(latestCommandResult, '命令结果已复制')"
                      >复制结果</el-button
                    >
                  </div>
                </div>
                <pre class="result">{{
                  latestCommandResult ? jsonText(latestCommandResult) : "暂无命令结果"
                }}</pre>
              </div>

              <div class="ops-panel">
                <div class="ops-panel__head">
                  <div>
                    <div class="ops-panel__title">调试日志</div>
                    <div class="ops-panel__sub">记录命令发送、回包和错误信息</div>
                  </div>
                  <div class="ops-panel__actions">
                    <el-button @click="clearCommandLogs">清空日志</el-button>
                  </div>
                </div>
                <div class="log-list">
                  <div v-if="!commandLogs.length" class="log-empty">暂无调试日志</div>
                  <div
                    v-for="item in commandLogs"
                    :key="item.id"
                    class="log-item"
                    :class="`is-${item.level}`"
                  >
                    <div class="log-item__meta">
                      <span>{{ item.time }}</span>
                      <span>{{ resolveActionText(item.action) }}</span>
                    </div>
                    <div class="log-item__message">{{ item.message }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <el-empty v-else description="请选择客户端节点" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { formatDate } from "@/utils/formatTime";
import { sendServiceCommand } from "@/api/system/websocket";
import ExternalClientSidebar, {
  type ClientNodeItem,
} from "@/views/external/components/ExternalClientSidebar.vue";
import {
  websocketClient,
  type ServiceCommandResultEvent,
  type ServiceRuntimeEvent,
} from "@/services/websocketClient";
import { usePluginClientNodes } from "@/services/clientNodeState";

defineOptions({ name: "PsConsolePanel" });

type PsCommandAction =
  | "refreshRuntime"
  | "health"
  | "startPhotoshop"
  | "stopPhotoshop"
  | "restartPhotoshop"
  | "analyzePsd"
  | "debugProcess";

type CommandMode = "production" | "debug" | "maintenance";

interface SmartObjectForm {
  smartObjectName: string;
  imagePath: string;
  resizeMode: "contain" | "cover" | "stretch" | "custom";
  tileSize: number;
  customOptionsText: string;
}

interface CommandLogItem {
  id: string;
  time: string;
  action: string;
  level: "info" | "success" | "error";
  message: string;
}

interface ServiceCommandDispatchResponse {
  success: boolean;
  message?: string;
  data?: {
    commandId?: string;
    clientId?: string;
    pluginKey?: string;
    service?: string;
    action?: string;
    payload?: Record<string, any>;
    createdAt?: string;
  };
}

const {
  clients: psClients,
  loading,
  refresh: refreshClientNodes,
} = usePluginClientNodes("ps-automation");
const selectedClientId = ref("");
const activeTab = ref("service");
const operationDialogVisible = ref(false);
const latestCommandResult = ref<ServiceCommandResultEvent | Record<string, any> | null>(null);
const analysisResult = ref<Record<string, any> | null>(null);
const processResult = ref<Record<string, any> | null>(null);
const commandLogs = ref<CommandLogItem[]>([]);

const loadingMap = reactive<Record<PsCommandAction, boolean>>({
  refreshRuntime: false,
  health: false,
  startPhotoshop: false,
  stopPhotoshop: false,
  restartPhotoshop: false,
  analyzePsd: false,
  debugProcess: false,
});

const pendingActions = reactive<Record<string, PsCommandAction>>({});

const serviceForm = reactive({
  startTimeout: 30,
  forceStop: false,
});

const analyzeForm = reactive({
  psdPath: "",
});

const createSmartObject = (): SmartObjectForm => ({
  smartObjectName: "",
  imagePath: "",
  resizeMode: "contain",
  tileSize: 512,
  customOptionsText: "",
});

const processForm = reactive({
  psdPath: "",
  exportDir: "",
  outputFilename: "",
  verbose: true,
  smartObjects: [createSmartObject()],
});

const customTemplateOptions = [
  { key: "px-contain", label: "像素 contain" },
  { key: "px-cover", label: "像素 cover" },
  { key: "percent-contain", label: "百分比 contain" },
  { key: "percent-cover", label: "百分比 cover" },
];

const customOptionsTemplates: Record<string, Record<string, any>> = {
  "px-contain": {
    position: { x: 0, y: 0, unit: "px" },
    size: { width: 800, height: 600, unit: "px" },
    child_resize_mode: "contain",
  },
  "px-cover": {
    position: { x: 0, y: 0, unit: "px" },
    size: { width: 800, height: 600, unit: "px" },
    child_resize_mode: "cover",
  },
  "percent-contain": {
    position: { x: 10, y: 10, unit: "%" },
    size: { width: 80, height: 80, unit: "%" },
    child_resize_mode: "contain",
  },
  "percent-cover": {
    position: { x: 10, y: 10, unit: "%" },
    size: { width: 80, height: 80, unit: "%" },
    child_resize_mode: "cover",
  },
};

const getPhotoshopService = (client: any) =>
  client.clientInfo?.services?.["ps-automation"] || client.clientInfo?.services?.photoshop || null;

const isPsServiceBusy = (client: any, service?: any) => {
  const runtime = service || getPhotoshopService(client);
  const psAutomation = client?.clientInfo?.psAutomation || {};
  return !!(
    psAutomation?.running ||
    psAutomation?.currentPsSetId ||
    psAutomation?.currentPsSetName ||
    runtime?.busy ||
    runtime?.state === "busy" ||
    runtime?.currentTaskId
  );
};

const hasPsServiceError = (service?: any) =>
  !!(service?.status === "error" || service?.state === "error");

const resolvePsRuntimeDisplay = (service?: any) => {
  if (!service) {
    return {
      summary: { text: "未上报", tone: "info" as ClientNodeBadge["tone"] },
      service: { text: "未上报", tone: "info" as ClientNodeBadge["tone"] },
      application: { text: "-", tone: "info" as ClientNodeBadge["tone"] },
      hasError: false,
    };
  }

  const details = service?.details || {};
  const connected = !!service.connected;
  const available = !!service.available;
  const busy = !!service.busy;
  const hasError = hasPsServiceError(service);
  const photoshopRunning = !!(
    details?.photoshopRunning ?? (available || busy)
  );
  const photoshopStatus = String(
    details?.photoshopStatus ||
      (busy
        ? "busy"
        : available
          ? "ready"
          : photoshopRunning
            ? "starting"
            : connected
              ? "stopped"
              : "unknown"),
  );

  const serviceStatus = hasError
    ? { text: "服务异常", tone: "danger" as ClientNodeBadge["tone"] }
    : connected
      ? { text: "服务在线", tone: "success" as ClientNodeBadge["tone"] }
      : service?.status === "disconnected" || service?.state === "offline"
        ? { text: "服务未启动", tone: "info" as ClientNodeBadge["tone"] }
        : { text: "未就绪", tone: "info" as ClientNodeBadge["tone"] };

  const applicationStatus = busy
    ? { text: "执行中", tone: "warning" as ClientNodeBadge["tone"] }
    : available || photoshopStatus === "ready"
      ? { text: "可用", tone: "success" as ClientNodeBadge["tone"] }
      : connected && (photoshopStatus === "starting" || photoshopRunning)
        ? { text: "启动中", tone: "warning" as ClientNodeBadge["tone"] }
        : connected
          ? { text: "未启动", tone: "info" as ClientNodeBadge["tone"] }
          : { text: "不可用", tone: "info" as ClientNodeBadge["tone"] };

  const summary = busy
    ? { text: "执行中", tone: "warning" as ClientNodeBadge["tone"] }
    : available
      ? { text: "可用", tone: "success" as ClientNodeBadge["tone"] }
      : hasError
        ? { text: "服务异常", tone: "danger" as ClientNodeBadge["tone"] }
        : connected && applicationStatus.text === "启动中"
          ? { text: "等待就绪", tone: "warning" as ClientNodeBadge["tone"] }
          : connected
            ? { text: "服务在线", tone: "info" as ClientNodeBadge["tone"] }
            : service?.status === "disconnected" || service?.state === "offline"
              ? { text: "服务未启动", tone: "info" as ClientNodeBadge["tone"] }
              : { text: "未就绪", tone: "info" as ClientNodeBadge["tone"] };

  return {
    summary,
    service: serviceStatus,
    application: applicationStatus,
    hasError,
  };
};

const selectedClient = computed(() => {
  if (!psClients.value.length) {
    return null;
  }
  return (
    psClients.value.find((client) => client.id === selectedClientId.value) || psClients.value[0]
  );
});
const selectedClientDisplayName = computed(
  () => selectedClient.value?.clientInfo?.machine?.code || selectedClient.value?.id || "-",
);
const operationDialogTitle = computed(() => `PS 服务操作 · ${selectedClientDisplayName.value}`);

const normalizePluginKey = (value?: string | null) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (normalized === "photoshop") return "ps-automation";
  return normalized;
};

const getPsBridgeService = (client: any) => {
  const service = getPhotoshopService(client);
  if (!service) {
    return null;
  }

  const busy = isPsServiceBusy(client, service);
  const display = resolvePsRuntimeDisplay({
    ...service,
    busy,
  });

  return {
    ...service,
    busy,
    hasError: display.hasError,
    level: display.summary.tone,
    text: display.summary.text,
    serviceStatus: display.service,
    applicationStatus: display.application,
  };
};

const selectedPsBridgeService = computed(() =>
  selectedClient.value ? getPsBridgeService(selectedClient.value) : null,
);
const clientNodeItems = computed<ClientNodeItem[]>(() =>
  psClients.value.map((client) => {
    return {
      connectionId: client.id,
      name: client.clientInfo?.machine?.code || client.id,
      time: formatDateSafe(client.connectedAt || undefined),
      metaLeft: client.clientInfo?.appVersion || "未知版本",
      metaRight: client.clientInfo?.machine?.platform || "未知平台",
      detail: client.clientInfo?.workspaceDirectory
        ? `工作目录: ${client.clientInfo.workspaceDirectory}`
        : "工作目录: 未上报",
    };
  }),
);

const analysisDocumentInfo = computed<Record<string, any>>(
  () => analysisResult.value?.document_info || {},
);
const analysisStatistics = computed<Record<string, any>>(
  () => analysisResult.value?.statistics || {},
);
const processPayloadPreview = computed(() => jsonText(buildProcessRequest(false)));

const jsonText = (value: any) => {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value ?? "");
  }
};

const stripQuotes = (value?: string | null) =>
  String(value || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "");

const normalizeWindowsPath = (value?: string | null) => stripQuotes(value).replace(/\//g, "\\");

const formatDateSafe = (value?: string) => {
  if (!value) return "-";
  try {
    return formatDate(new Date(value));
  } catch {
    return value;
  }
};

const formatListSafe = (value?: Array<string | number> | null) => {
  if (!Array.isArray(value) || !value.length) {
    return "-";
  }
  return value.join(", ");
};

const findClientDisplayName = (clientId?: string | null) => {
  const client = psClients.value.find((item) => item.id === clientId);
  return client?.clientInfo?.machine?.code || client?.id || clientId || "-";
};

const resolvePsStateText = (value?: string | null) => {
  if (!value) return "-";
  const stateMap: Record<string, string> = {
    idle: "空闲",
    busy: "执行中",
    error: "异常",
    offline: "离线",
    connected: "服务在线",
  };
  return stateMap[value] || value;
};

const formatDocumentSize = (value?: Record<string, any> | null) => {
  const width = Number(value?.width || 0);
  const height = Number(value?.height || 0);
  if (!width || !height) {
    return "-";
  }
  return `${width} x ${height}px`;
};

const resolveActionText = (value?: string | null) => {
  const actionMap: Record<string, string> = {
    refreshRuntime: "刷新状态",
    health: "健康检测",
    startPhotoshop: "启动 Photoshop",
    stopPhotoshop: "关闭 Photoshop",
    restartPhotoshop: "重启 Photoshop",
    analyzePsd: "分析 PSD",
    debugProcess: "调试处理",
  };
  return actionMap[String(value || "").trim()] || String(value || "-");
};

const pushCommandLog = (
  action: string,
  level: CommandLogItem["level"],
  message: string,
  clientId?: string | null,
) => {
  const prefix = clientId ? `[${findClientDisplayName(clientId)}] ` : "";
  commandLogs.value = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      time: formatDate(new Date(), "HH:mm:ss"),
      action,
      level,
      message: `${prefix}${message}`.trim(),
    },
    ...commandLogs.value,
  ].slice(0, 80);
};

const clearCommandLogs = () => {
  commandLogs.value = [];
};

const serviceStatus = computed(() => {
  if (!psClients.value.length) {
    return {
      level: "danger",
      text: "无可用节点",
    };
  }

  if (selectedPsBridgeService.value) {
    return {
      level: selectedPsBridgeService.value.level,
      text: selectedPsBridgeService.value.text,
    };
  }

  return {
    level: "info",
    text: "未就绪",
  };
});

const selectedPsServiceConnectionStatus = computed(
  () =>
    selectedPsBridgeService.value?.serviceStatus || {
      text: "未上报",
      tone: "info" as ClientNodeBadge["tone"],
    },
);

const selectedPsApplicationStatus = computed(
  () =>
    selectedPsBridgeService.value?.applicationStatus || {
      text: "-",
      tone: "info" as ClientNodeBadge["tone"],
    },
);

const finishAction = (action?: string | null) => {
  if (!action) {
    return;
  }
  if (action in loadingMap) {
    loadingMap[action as PsCommandAction] = false;
  }
};

const clearPendingState = () => {
  Object.keys(pendingActions).forEach((key) => {
    delete pendingActions[key];
  });
  (Object.keys(loadingMap) as PsCommandAction[]).forEach((key) => {
    loadingMap[key] = false;
  });
};

const refreshClients = async () => {
  await refreshClientNodes();
};

watch(
  psClients,
  (list) => {
    if (!list.length) {
      selectedClientId.value = "";
      return;
    }
    if (!selectedClientId.value || !list.some((item) => item.id === selectedClientId.value)) {
      selectedClientId.value = list[0].id;
    }
  },
  { immediate: true },
);

watch(selectedClientId, (value, previousValue) => {
  if (!value) {
    operationDialogVisible.value = false;
  }
  if (value === previousValue) {
    return;
  }
  activeTab.value = "service";
  analysisResult.value = null;
  processResult.value = null;
  latestCommandResult.value = null;
  clearCommandLogs();
  clearPendingState();
});

const copyText = async (text: string, successMessage = "已复制") => {
  if (!text) {
    ElMessage.warning("没有可复制的内容");
    return;
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    ElMessage.success(successMessage);
  } catch (error: any) {
    ElMessage.error(error?.message || "复制失败");
  }
};

const copyJson = async (value: any, successMessage = "JSON 已复制") => {
  await copyText(jsonText(value), successMessage);
};

const dispatchPsCommand = async (
  action: PsCommandAction,
  payload: Record<string, any> = {},
  mode: CommandMode = "production",
) => {
  const client = selectedClient.value;
  if (!client) {
    ElMessage.warning("请选择客户端节点");
    return;
  }

  if (loadingMap[action]) {
    return;
  }

  loadingMap[action] = true;
  pushCommandLog(action, "info", `已发送${resolveActionText(action)}命令`, client.id);

  try {
    const response = (await sendServiceCommand({
      target: {
        clientId: client.id,
        pluginKey: "ps-automation",
      },
      command: {
        name: action,
        payload,
      },
      mode,
    })) as ServiceCommandDispatchResponse;

    if (!response?.success) {
      finishAction(action);
      const message = response?.message || "命令发送失败";
      pushCommandLog(action, "error", message, client.id);
      ElMessage.error(message);
      return;
    }

    const commandId = response.data?.commandId;
    if (commandId) {
      pendingActions[commandId] = action;
    } else {
      finishAction(action);
    }

    ElMessage.success(response.message || "命令已发送");
  } catch (error: any) {
    finishAction(action);
    const message = error?.message || "命令发送失败";
    pushCommandLog(action, "error", message, client.id);
    ElMessage.error(message);
  }
};

const handleSelectedClientCommand = async (
  action: "refreshRuntime" | "health",
  payload: Record<string, any> = {},
  mode: CommandMode = "production",
) => {
  await dispatchPsCommand(action, payload, mode);
};

const addSmartObject = () => {
  processForm.smartObjects.push(createSmartObject());
};

const removeSmartObject = (index: number) => {
  if (processForm.smartObjects.length <= 1) {
    return;
  }
  processForm.smartObjects.splice(index, 1);
};

const applyCustomOptionsTemplate = (index: number, templateKey: string) => {
  const target = processForm.smartObjects[index];
  if (!target) {
    return;
  }
  target.resizeMode = "custom";
  target.customOptionsText = jsonText(customOptionsTemplates[templateKey] || {});
};

const buildProcessRequest = (strict = true) => {
  const psdPath = normalizeWindowsPath(processForm.psdPath);
  if (strict && !psdPath) {
    throw new Error("请填写 PSD 路径");
  }

  const smartObjects = processForm.smartObjects.map((item, index) => {
    const imagePath = normalizeWindowsPath(item.imagePath);
    if (strict && !imagePath) {
      throw new Error(`智能对象 #${index + 1} 的素材图片路径不能为空`);
    }

    const payload: Record<string, any> = {
      image_path: imagePath,
      resize_mode: item.resizeMode || "contain",
      tile_size: Math.max(64, Number(item.tileSize) || 512),
    };

    const smartObjectName = stripQuotes(item.smartObjectName);
    if (smartObjectName) {
      payload.smart_object_name = smartObjectName;
    }

    if (payload.resize_mode === "custom") {
      const customOptionsText = item.customOptionsText.trim();
      if (strict && !customOptionsText) {
        throw new Error(`智能对象 #${index + 1} 使用 custom 模式时必须填写 custom_options`);
      }
      if (customOptionsText) {
        try {
          payload.custom_options = JSON.parse(customOptionsText);
        } catch (error: any) {
          if (strict) {
            throw new Error(
              `智能对象 #${index + 1} 的 custom_options 不是有效 JSON: ${error?.message || error}`,
            );
          }
        }
      }
    }

    return payload;
  });

  if (strict && !smartObjects.length) {
    throw new Error("至少需要配置一个智能对象");
  }

  const request: Record<string, any> = {
    psd_path: psdPath,
    smart_objects: smartObjects,
    verbose: !!processForm.verbose,
  };

  const exportDir = normalizeWindowsPath(processForm.exportDir);
  if (exportDir) {
    request.export_dir = exportDir;
  }

  const outputFilename = stripQuotes(processForm.outputFilename);
  if (outputFilename) {
    request.output_filename = outputFilename;
  }

  return request;
};

const handleAnalyzePsd = async () => {
  const psdPath = normalizeWindowsPath(analyzeForm.psdPath);
  if (!psdPath) {
    ElMessage.warning("请填写 PSD 文件路径");
    return;
  }

  analyzeForm.psdPath = psdPath;
  analysisResult.value = null;
  await dispatchPsCommand("analyzePsd", { psdPath }, "debug");
};

const handleDebugProcess = async () => {
  try {
    const request = buildProcessRequest(true);
    processResult.value = null;
    await dispatchPsCommand("debugProcess", { request }, "debug");
  } catch (error: any) {
    const message = error?.message || "处理参数校验失败";
    pushCommandLog("debugProcess", "error", message, selectedClient.value?.id);
    ElMessage.warning(message);
  }
};

const handleServiceRuntime = (event: ServiceRuntimeEvent) => {
  if (normalizePluginKey(event.pluginKey || event.service) !== "ps-automation") {
    return;
  }
  if (event.clientId !== selectedClientId.value) {
    return;
  }
};

const handleServiceCommandResult = async (event: ServiceCommandResultEvent) => {
  if (normalizePluginKey(event.pluginKey || event.service) !== "ps-automation") {
    return;
  }

  const pendingAction = pendingActions[event.commandId];
  const isSelectedClient = event.clientId === selectedClientId.value;

  if (!pendingAction && !isSelectedClient) {
    return;
  }

  if (pendingAction) {
    delete pendingActions[event.commandId];
    finishAction(pendingAction);
  }

  const action = pendingAction || event.action || "refreshRuntime";
  const message = event.message || event.error || (event.success ? "执行成功" : "执行失败");

  latestCommandResult.value = event;
  pushCommandLog(action, event.success ? "success" : "error", message, event.clientId);

  if (action === "analyzePsd") {
    analysisResult.value = event.success && event.data ? event.data : null;
  }

  if (action === "debugProcess") {
    processResult.value = event.data || {
      success: event.success,
      message,
      error: event.error || null,
    };
  }

  (event.success ? ElMessage.success : ElMessage.error)(message);
  await refreshClients();
};

onMounted(() => {
  websocketClient.events.on("serviceRuntime", handleServiceRuntime);
  websocketClient.events.on("serviceCommandResult", handleServiceCommandResult);
  void refreshClients();
});

onUnmounted(() => {
  websocketClient.events.off("serviceRuntime", handleServiceRuntime);
  websocketClient.events.off("serviceCommandResult", handleServiceCommandResult);
});
</script>

<style scoped lang="scss">
.ps-console {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ops-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.ops-header__title {
  font-size: 16px;
  font-weight: 600;
}

.ops-header__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
}

.tab-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.inline-status-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.inline-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-bg-color);
  font-size: 11px;
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
}

.inline-status.is-success {
  border-color: rgb(103 194 58 / 28%);
  color: #67c23a;
}

.inline-status.is-warning {
  border-color: rgb(249 115 22 / 28%);
  color: #f97316;
}

.inline-status.is-danger {
  border-color: rgb(245 108 108 / 28%);
  color: #f56c6c;
}

.inline-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--el-text-color-secondary);
}

.inline-status.is-success .inline-status__dot {
  background: #67c23a;
  box-shadow: 0 0 0 0 rgb(103 194 58 / 34%);
  animation: status-breath-success 1.8s infinite ease-in-out;
}

.inline-status.is-warning .inline-status__dot {
  background: #f97316;
  box-shadow: 0 0 0 0 rgb(249 115 22 / 34%);
  animation: status-breath-warning 1.8s infinite ease-in-out;
}

.inline-status.is-danger .inline-status__dot {
  background: #f56c6c;
  box-shadow: 0 0 0 0 rgb(245 108 108 / 34%);
  animation: status-breath-danger 1.8s infinite ease-in-out;
}

.inline-status__label {
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}

.inline-status__text {
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.compact-info--grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.compact-info__item {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.compact-info__item--full {
  grid-column: 1 / -1;
}

.compact-info__label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.compact-info__value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  line-height: 1.45;
  word-break: break-word;
}

.ops-sidebar,
.ops-main {
  min-width: 0;
}

.ops-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ops-panel {
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.ops-panel,
.ops-sidebar:deep(.external-sidebar) {
  padding: 12px;
}

.ops-sidebar:deep(.external-sidebar) {
  position: sticky;
  top: 0;
}

.ops-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 12px;
}

.ops-panel__title {
  font-size: 14px;
  font-weight: 600;
}

.ops-panel__sub {
  margin-top: 2px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.ops-panel__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.ops-panel__actions :deep(.el-button),
.button-row :deep(.el-button) {
  margin-left: 0;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  max-width: 100%;
  min-width: 0;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}

.status-chip > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #909399;
}

.status-chip.is-success {
  color: #67c23a;
}

.status-chip.is-warning {
  color: #f97316;
}

.status-chip.is-danger {
  color: #f56c6c;
}

.status-chip.is-info {
  color: #909399;
}

.status-chip.is-success .status-chip__dot {
  background: #67c23a;
  box-shadow: 0 0 0 0 rgb(103 194 58 / 34%);
  animation: status-breath-success 1.8s infinite ease-in-out;
}

.status-chip.is-warning .status-chip__dot {
  background: #f97316;
  box-shadow: 0 0 0 0 rgb(249 115 22 / 34%);
  animation: status-breath-warning 1.8s infinite ease-in-out;
}

.status-chip.is-danger .status-chip__dot {
  background: #f56c6c;
  box-shadow: 0 0 0 0 rgb(245 108 108 / 34%);
  animation: status-breath-danger 1.8s infinite ease-in-out;
}

.ps-operation-dialog :deep(.el-dialog__header) {
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ps-operation-dialog :deep(.el-dialog) {
  display: flex;
  flex-direction: column;
}

.ps-operation-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: var(--el-bg-color-page);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.operation-shell {
  height: calc(100vh - 64px);
  min-height: 0;
  padding: 16px 20px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.operation-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.operation-tabs:deep(.el-tabs__header) {
  order: 0;
  flex: 0 0 auto;
  margin: 0 0 12px;
}

.operation-tabs:deep(.el-tabs__content) {
  order: 1;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.operation-grid {
  display: grid;
  grid-template-columns: minmax(360px, 520px) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.operation-grid--service {
  grid-template-columns: minmax(420px, 560px) minmax(320px, 1fr);
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-grid--service {
  grid-template-columns: minmax(0, 170px) minmax(0, 1fr);
  gap: 14px 16px;
  margin-bottom: 14px;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field-block label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.field-block--switch {
  align-self: end;
}

.field-block--switch :deep(.el-switch) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-height: 40px;
}

.field-block--switch :deep(.el-switch__label) {
  white-space: normal;
  line-height: 1.35;
}

.field-block :deep(.el-input),
.field-block :deep(.el-input-number),
.field-block :deep(.el-select) {
  width: 100%;
}

.button-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.button-row.wrap {
  flex-wrap: wrap;
}

.button-row--service-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.button-row--service-grid :deep(.el-button) {
  width: 100%;
  min-height: 36px;
  justify-content: center;
}

.subsection-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.subsection-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.smart-object-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.smart-object-card {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.smart-object-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.smart-object-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.result {
  margin: 0;
  padding: 12px;
  min-height: 220px;
  max-height: calc(100vh - 280px);
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  box-sizing: border-box;
}

.result--secondary {
  margin-top: 12px;
  min-height: 160px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 220px;
  max-height: calc(100vh - 280px);
  overflow: auto;
}

.log-empty {
  padding: 32px 16px;
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
  color: var(--el-text-color-secondary);
  text-align: center;
  background: var(--el-bg-color);
}

.log-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.log-item.is-success {
  border-color: rgb(103 194 58 / 26%);
}

.log-item.is-error {
  border-color: rgb(245 108 108 / 26%);
}

.log-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.log-item__message {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

@keyframes status-breath-success {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgb(103 194 58 / 16%);
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 0 6px rgb(103 194 58 / 0%);
    transform: scale(1.04);
  }
}

@keyframes status-breath-warning {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgb(249 115 22 / 16%);
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 0 6px rgb(249 115 22 / 0%);
    transform: scale(1.04);
  }
}

@keyframes status-breath-danger {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgb(245 108 108 / 16%);
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 0 6px rgb(245 108 108 / 0%);
    transform: scale(1.04);
  }
}

@media (max-width: 1024px) {
  .tab-layout,
  .compact-info--grid,
  .operation-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .ops-sidebar:deep(.external-sidebar) {
    position: static;
  }
}

@media (max-width: 1280px) {
  .operation-grid--service {
    grid-template-columns: 1fr;
  }

  .form-grid--service {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .ops-header,
  .ops-panel__head,
  .subsection-head,
  .smart-object-card__head,
  .log-item__meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .ops-header__actions,
  .button-row {
    width: 100%;
  }

  .button-row--service-grid {
    grid-template-columns: 1fr;
  }

  .operation-shell {
    padding: 12px;
  }
}
</style>
