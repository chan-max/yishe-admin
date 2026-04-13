import { io, type Socket } from "socket.io-client";
import { reactive } from "vue";
import mitt from "mitt";
import type { WebsocketConnectionVO } from "@/api/system/websocket";
import { getAccessToken } from "@/utils/auth";

type WsStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

const CLIENT_SOURCE = "管理后台";
const HEARTBEAT_INTERVAL = 15_000;
const HEARTBEAT_TIMEOUT = 30_000;
const WS_CLIENT_INFO_REFRESH_MS = 60_000;
const WS_FINGERPRINT_VOLATILE_KEYS = new Set([
  "timestamp",
  "reportedAt",
  "fetchedAt",
  "updatedAt",
  "lastCheckedAt",
  "lastHeartbeatAt",
  "lastActivity",
  "lastPingAt",
  "lastPongAt",
]);

// 获取 WebSocket 地址
const getDefaultWsUrl = () => {
  const explicitUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicitUrl) {
    return explicitUrl;
  }

  const baseUrl = (import.meta.env.VITE_BASE_URL as string | undefined) ?? "";
  if (baseUrl) {
    const normalizedBase = baseUrl.replace(/\/$/, "");
    const sanitizedBase = normalizedBase.replace(/\/api$/i, "");
    return `${sanitizedBase.replace(/^http/i, "ws")}/ws`;
  }

  if (typeof window === "undefined") {
    return "";
  }

  const { protocol, host } = window.location;
  const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${host}/ws`;
};

const DEFAULT_WS_ENDPOINT = getDefaultWsUrl();

interface WsState {
  endpoint: string;
  status: WsStatus;
  connectedAt: string | null;
  lastPingAt: string | null;
  lastPongAt: string | null;
  lastLatencyMs: number | null;
  lastError: string | null;
  retryCount: number;
  connectionId: string | null;
}

interface ClientInfoPayload {
  clientId: string;
  source: string;
  timestamp?: string;
  app?: {
    name?: string;
    version?: string;
    mode?: string;
  };
  language?: string;
  uiLanguage?: string;
  timeZone?: string;
  userAgent?: string;
  browser?: {
    name?: string;
    version?: string;
  };
  os?: {
    name?: string;
    version?: string;
  };
  device?: {
    memory?: number;
    hardwareConcurrency?: number;
    touchPoints?: number;
  };
  machine?: {
    code?: string;
    platform?: string;
  };
  screen?: {
    width?: number;
    height?: number;
    availWidth?: number;
    availHeight?: number;
    pixelRatio?: number;
    colorDepth?: number;
  };
  page?: {
    title?: string;
    href?: string;
    origin?: string;
    path?: string;
    visibilityState?: string;
  };
  location?: {
    ip?: string;
    city?: string;
    region?: string;
    country?: string;
    org?: string;
    timeZone?: string;
  };
}

export interface ServiceRuntimeEvent {
  clientId: string;
  service: string;
  pluginKey?: string;
  runtime: Record<string, any>;
  reportedAt?: string;
}

export interface ServiceCommandResultEvent {
  clientId: string;
  commandId: string;
  service: string;
  pluginKey?: string;
  action: string;
  success: boolean;
  message?: string;
  data?: any;
  error?: string | null;
  errorDetail?: Record<string, any> | null;
  finishedAt?: string;
}

export interface PsAutomationStatusEvent {
  clientId: string;
  enabled?: boolean;
  autoDispatchEnabled?: boolean;
  autoSchedulingEnabled?: boolean;
  running?: boolean;
  queueCount?: number;
  currentPsSetId?: string | null;
  currentPsSetName?: string | null;
  progress?: number | null;
  lastError?: string | null;
  lastHeartbeatAt?: string | null;
  updatedAt?: string | null;
}

export interface PublishTaskRuntimeEvent {
  clientId: string;
  machineCode?: string | null;
  taskId: string;
  taskType?: string;
  queue?: string;
  profileId?: string | null;
  status?: string;
  message?: string;
  currentStep?: string | null;
  progress?: number | null;
  runtime?: Record<string, any> | null;
  error?: string | null;
  errorDetail?: Record<string, any> | null;
  reportedAt?: string;
}

export interface GlobalNotificationEvent {
  id: string;
  title: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
  category: "system" | "task" | "sync" | "client" | "queue" | "message" | "custom";
  source: string;
  sticky: boolean;
  durationMs?: number | null;
  progress?: number | null;
  status?: "pending" | "running" | "success" | "warning" | "error" | "done";
  actions?: Array<{
    key: string;
    label: string;
    type?: "primary" | "success" | "warning" | "danger" | "info";
    route?: string;
    url?: string;
  }>;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientConnectionChangedEvent {
  action: "connected" | "updated" | "removed";
  client: {
    clientId: string;
    connectedAt?: string;
    appVersion?: string | null;
    machine?: Record<string, any> | null;
    location?: Record<string, any> | null;
    services?: Record<string, any> | null;
    uploader?: Record<string, any> | null;
    psAutomation?: Record<string, any> | null;
  };
  reportedAt?: string;
}

export interface RuntimeConnectionChangedEvent {
  action: "connected" | "updated" | "removed";
  connection: WebsocketConnectionVO;
  reportedAt?: string;
}

export interface ImageProcessingRecordChangedEvent {
  action: "updated";
  recordId: string;
  title?: string;
  taskType?: string;
  status?: string;
  errorMessage?: string | null;
  updatedAt?: string;
}

const wsState = reactive<WsState>({
  endpoint: DEFAULT_WS_ENDPOINT,
  status: "idle",
  connectedAt: null,
  lastPingAt: null,
  lastPongAt: null,
  lastLatencyMs: null,
  lastError: null,
  retryCount: 0,
  connectionId: null,
});

// 生成客户端 ID
function generateClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `admin_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

const clientId = generateClientId();

function parseBrowserInfo(userAgent?: string) {
  const source = userAgent || "";
  const browserMatchers = [
    { name: "Edge", regex: /Edg\/([\d.]+)/ },
    { name: "Chrome", regex: /Chrome\/([\d.]+)/ },
    { name: "Safari", regex: /Version\/([\d.]+).*Safari/ },
    { name: "Firefox", regex: /Firefox\/([\d.]+)/ },
  ];

  for (const matcher of browserMatchers) {
    const match = source.match(matcher.regex);
    if (match) {
      return {
        name: matcher.name,
        version: match[1],
      };
    }
  }

  return {
    name: "Unknown",
  };
}

function parseOsInfo(userAgent?: string) {
  const source = userAgent || "";
  const osMatchers = [
    { name: "Windows", regex: /Windows NT ([\d.]+)/ },
    { name: "macOS", regex: /Mac OS X ([\d_]+)/ },
    { name: "iOS", regex: /iPhone OS ([\d_]+)/ },
    { name: "Android", regex: /Android ([\d.]+)/ },
    { name: "Linux", regex: /Linux/ },
  ];

  for (const matcher of osMatchers) {
    const match = source.match(matcher.regex);
    if (match) {
      return {
        name: matcher.name,
        version: match[1]?.replace(/_/g, "."),
      };
    }
  }

  return {
    name: "Unknown",
  };
}

function buildScreenInfo() {
  if (typeof window === "undefined" || !window.screen) {
    return undefined;
  }

  return {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    pixelRatio: window.devicePixelRatio,
    colorDepth: window.screen.colorDepth,
  };
}

function buildPageInfo() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return {
    title: typeof document !== "undefined" ? document.title || undefined : undefined,
    href: window.location.href,
    origin: window.location.origin,
    path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    visibilityState:
      typeof document !== "undefined" ? document.visibilityState || undefined : undefined,
  };
}

const clientInfo = reactive<ClientInfoPayload>({
  clientId,
  source: CLIENT_SOURCE,
  timestamp: new Date().toISOString(),
  app: {
    name: "yishe-admin",
    version: (import.meta.env.VITE_APP_VERSION as string | undefined) || undefined,
    mode: import.meta.env.MODE,
  },
  language: typeof navigator !== "undefined" ? navigator.language : "unknown",
  uiLanguage: typeof navigator !== "undefined" ? navigator.language : "unknown",
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  browser:
    typeof navigator !== "undefined" ? parseBrowserInfo(navigator.userAgent) : { name: "Unknown" },
  os: typeof navigator !== "undefined" ? parseOsInfo(navigator.userAgent) : { name: "Unknown" },
  device: {
    memory: typeof navigator !== "undefined" ? (navigator as any).deviceMemory : undefined,
    hardwareConcurrency:
      typeof navigator !== "undefined" ? navigator.hardwareConcurrency : undefined,
    touchPoints: typeof navigator !== "undefined" ? navigator.maxTouchPoints : undefined,
  },
  machine: {
    code: `ADMIN-${clientId.slice(-12).toUpperCase()}`,
    platform: typeof navigator !== "undefined" ? navigator.platform : undefined,
  },
  screen: buildScreenInfo(),
  page: buildPageInfo(),
});

export type WebsocketEvents = {
  log: { level: "info" | "warn" | "error"; message: string };
  myClientStatus: { hasClient: boolean };
  "start-psd-set-production-response": {
    success: boolean;
    message?: string;
    sentTo?: number;
    totalClients?: number;
    psdSetId?: string;
    data?: Record<string, any>;
  };
  "production-status": {
    status: string;
    message: string;
    psdSetId?: string;
    progress?: number;
    total?: number;
  };
  serviceRuntime: ServiceRuntimeEvent;
  serviceCommandResult: ServiceCommandResultEvent;
  clientConnectionChanged: ClientConnectionChangedEvent;
  runtimeConnectionChanged: RuntimeConnectionChangedEvent;
  imageProcessingRecordChanged: ImageProcessingRecordChangedEvent;
  psAutomationStatus: PsAutomationStatusEvent;
  publishTaskRuntime: PublishTaskRuntimeEvent;
  globalNotification: GlobalNotificationEvent;
};

const emitter = mitt<WebsocketEvents>();

let socket: Socket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
let lastPingTimestamp: number | null = null;
let intentionalDisconnect = false;
let lastClientInfoFingerprint = "";
let lastClientInfoEmittedAt = 0;

function updateState(patch: Partial<WsState>) {
  Object.assign(wsState, patch);
  emitter.emit("log", { level: "info", message: `[ws] state updated ${JSON.stringify(patch)}` });
}

function clearHeartbeatInterval() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

function clearHeartbeatTimeout() {
  if (heartbeatTimeout) {
    clearTimeout(heartbeatTimeout);
    heartbeatTimeout = null;
  }
}

function stopHeartbeat() {
  clearHeartbeatInterval();
  clearHeartbeatTimeout();
  lastPingTimestamp = null;
}

function stableStringifyForWs(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringifyForWs(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const source = value as Record<string, any>;
    const keys = Object.keys(source).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringifyForWs(source[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function stripVolatileWsFieldsForFingerprint(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripVolatileWsFieldsForFingerprint(item));
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, any>;
    return Object.keys(source).reduce<Record<string, unknown>>((result, key) => {
      if (WS_FINGERPRINT_VOLATILE_KEYS.has(key)) {
        return result;
      }
      result[key] = stripVolatileWsFieldsForFingerprint(source[key]);
      return result;
    }, {});
  }

  return value;
}

function buildWsFingerprint(value: unknown) {
  return stableStringifyForWs(stripVolatileWsFieldsForFingerprint(value));
}

function scheduleHeartbeatTimeout() {
  clearHeartbeatTimeout();
  heartbeatTimeout = setTimeout(() => {
    emitter.emit("log", { level: "warn", message: "[ws] heartbeat timeout" });

    if (!socket || !socket.connected) {
      updateState({
        status: "error",
        lastError: "Heartbeat timeout",
      });
      reconnect();
      return;
    }

    updateState({
      lastError: "Heartbeat timeout",
    });
  }, HEARTBEAT_TIMEOUT);
}

function emitHeartbeat() {
  if (!socket || !socket.connected) return;
  lastPingTimestamp = Date.now();
  updateState({
    lastPingAt: new Date(lastPingTimestamp).toISOString(),
  });
  socket.emit("ping");
  scheduleHeartbeatTimeout();
}

function startHeartbeatLoop() {
  stopHeartbeat();
  heartbeatInterval = setInterval(emitHeartbeat, HEARTBEAT_INTERVAL);
  emitHeartbeat();
}

function cleanupSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.io.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  lastClientInfoFingerprint = "";
  lastClientInfoEmittedAt = 0;
  stopHeartbeat();
}

function buildQuery() {
  const payload: Record<string, string> = {
    clientSource: CLIENT_SOURCE,
    clientId: clientId,
    machineCode: clientInfo.machine?.code || "",
  };

  return payload;
}

function syncClientInfoSnapshot() {
  Object.assign(clientInfo, {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    browser:
      typeof navigator !== "undefined"
        ? parseBrowserInfo(navigator.userAgent)
        : { name: "Unknown" },
    os: typeof navigator !== "undefined" ? parseOsInfo(navigator.userAgent) : { name: "Unknown" },
    screen: buildScreenInfo(),
    page: buildPageInfo(),
  });
}

let clientInfoSyncTimer: ReturnType<typeof setTimeout> | null = null;
let clientInfoListenersBound = false;

function scheduleClientInfoSync() {
  if (clientInfoSyncTimer) {
    clearTimeout(clientInfoSyncTimer);
  }

  clientInfoSyncTimer = setTimeout(() => {
    clientInfoSyncTimer = null;
    syncClientInfoSnapshot();
    emitClientInfo();
  }, 120);
}

function bindClientInfoListeners() {
  if (clientInfoListenersBound || typeof window === "undefined") {
    return;
  }

  clientInfoListenersBound = true;

  window.addEventListener("hashchange", scheduleClientInfoSync);
  window.addEventListener("popstate", scheduleClientInfoSync);
  window.addEventListener("resize", scheduleClientInfoSync);
  window.addEventListener("focus", scheduleClientInfoSync);

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", scheduleClientInfoSync);
  }
}

bindClientInfoListeners();

function bindSocketEvents(currentSocket: Socket) {
  currentSocket.on("connect", () => {
    const socketId = currentSocket.id;
    updateState({
      status: "connected",
      connectedAt: new Date().toISOString(),
      lastError: null,
      retryCount: 0,
      connectionId: socketId,
    });
    emitter.emit("log", { level: "info", message: `[ws] connected (id: ${socketId})` });
    emitClientInfo();
    startHeartbeatLoop();
  });

  currentSocket.on("disconnect", (reason) => {
    emitter.emit("log", { level: "warn", message: `[ws] disconnected: ${reason}` });
    stopHeartbeat();
    updateState({
      status: intentionalDisconnect ? "disconnected" : "error",
      lastError: reason || null,
      connectedAt: null,
      connectionId: null,
    });
  });

  currentSocket.on("pong", () => {
    clearHeartbeatTimeout();
    const now = Date.now();
    updateState({
      status: "connected",
      lastPongAt: new Date(now).toISOString(),
      lastLatencyMs: lastPingTimestamp ? now - lastPingTimestamp : null,
      lastError: null,
    });
    lastPingTimestamp = null;
  });

  currentSocket.on("connect_error", (error) => {
    emitter.emit("log", {
      level: "error",
      message: `[ws] connect_error: ${serializeError(error)}`,
    });
    updateState({
      status: "error",
      lastError: serializeError(error),
    });
  });

  currentSocket.on("error", (error) => {
    emitter.emit("log", { level: "error", message: `[ws] error: ${serializeError(error)}` });
    updateState({
      status: "error",
      lastError: serializeError(error),
    });
  });

  currentSocket.io.on("reconnect_attempt", (attempt) => {
    emitter.emit("log", { level: "info", message: `[ws] reconnect attempt #${attempt}` });
    updateState({
      status: "reconnecting",
      retryCount: attempt,
    });
  });

  currentSocket.io.on("reconnect_failed", () => {
    emitter.emit("log", { level: "error", message: "[ws] reconnect failed" });
    updateState({
      status: "error",
      lastError: "Reconnect failed",
    });
  });

  currentSocket.io.on("reconnect_error", (error) => {
    emitter.emit("log", {
      level: "error",
      message: `[ws] reconnect_error: ${serializeError(error)}`,
    });
    updateState({
      status: "error",
      lastError: serializeError(error),
    });
  });

  // 监听客户端连接状态响应
  currentSocket.on("my-client-status", (data: { hasClient: boolean }) => {
    emitter.emit("myClientStatus", { hasClient: data.hasClient });
  });

  // 监听开始制作套图的响应
  currentSocket.on("start-psd-set-production-response", (data: any) => {
    console.log("[ws] 收到 start-psd-set-production-response:", data);
    emitter.emit("start-psd-set-production-response", data);
  });

  // 监听制作状态消息（客户端正在制作中时返回的消息）
  currentSocket.on(
    "production-status",
    (data: { status: string; message: string; psdSetId?: string }) => {
      emitter.emit("production-status", data);
    },
  );

  currentSocket.on("service-runtime", (data: ServiceRuntimeEvent) => {
    emitter.emit("serviceRuntime", data);
  });

  currentSocket.on("service-command-result", (data: ServiceCommandResultEvent) => {
    emitter.emit("serviceCommandResult", data);
  });

  currentSocket.on("client-connection-changed", (data: ClientConnectionChangedEvent) => {
    emitter.emit("clientConnectionChanged", data);
  });

  currentSocket.on("runtime-connection-changed", (data: RuntimeConnectionChangedEvent) => {
    emitter.emit("runtimeConnectionChanged", data);
  });

  currentSocket.on("image-processing-record-changed", (data: ImageProcessingRecordChangedEvent) => {
    emitter.emit("imageProcessingRecordChanged", data);
  });

  currentSocket.on("ps-automation-status", (data: PsAutomationStatusEvent) => {
    emitter.emit("psAutomationStatus", data);
  });

  currentSocket.on("publish-task-runtime", (data: PublishTaskRuntimeEvent) => {
    emitter.emit("publishTaskRuntime", data);
  });

  currentSocket.on("global-notification", (data: GlobalNotificationEvent) => {
    emitter.emit("globalNotification", data);
  });
}

// 检查当前用户的客户端连接状态（通过 WebSocket）
export function checkMyClientStatus() {
  if (!socket || !socket.connected) {
    return false;
  }
  socket.emit("check-my-client");
  return true;
}

function serializeError(error: unknown) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function emitClientInfo() {
  if (!socket || !socket.connected) return;
  const payload = JSON.parse(JSON.stringify(clientInfo));
  const fingerprint = buildWsFingerprint(payload);
  const now = Date.now();
  if (
    fingerprint === lastClientInfoFingerprint &&
    now - lastClientInfoEmittedAt < WS_CLIENT_INFO_REFRESH_MS
  ) {
    return;
  }
  socket.emit("client-info", payload);
  lastClientInfoFingerprint = fingerprint;
  lastClientInfoEmittedAt = now;
}

function connect(endpoint?: string) {
  const targetEndpoint = endpoint || wsState.endpoint || DEFAULT_WS_ENDPOINT;
  wsState.endpoint = targetEndpoint;

  if (socket && socket.connected) {
    return;
  }

  cleanupSocket();
  intentionalDisconnect = false;

  updateState({
    status: "connecting",
    lastError: null,
    retryCount: 0,
  });

  syncClientInfoSnapshot();

  socket = io(targetEndpoint, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 12_000,
    timeout: 8000,
    query: buildQuery(),
    auth: {
      token: getAccessToken() || undefined,
    },
  });

  bindSocketEvents(socket);
}

function disconnect() {
  intentionalDisconnect = true;
  cleanupSocket();
  updateState({
    status: "disconnected",
    lastError: null,
    retryCount: 0,
    connectedAt: null,
    connectionId: null,
  });
}

function reconnect() {
  intentionalDisconnect = false;
  cleanupSocket();
  connect();
}

function setEndpoint(endpoint: string) {
  wsState.endpoint = endpoint || DEFAULT_WS_ENDPOINT;
  reconnect();
}

function updateClientInfo(payload: Partial<ClientInfoPayload>) {
  Object.assign(clientInfo, payload);
  syncClientInfoSnapshot();
  emitClientInfo();
}

// 发送消息到服务器
export function sendMessage(event: string, data: any) {
  if (!socket || !socket.connected) {
    throw new Error("WebSocket未连接");
  }
  socket.emit(event, data);
}

export const websocketClient = {
  state: wsState,
  profile: clientInfo,
  connect,
  disconnect,
  reconnect,
  setEndpoint,
  updateClientInfo,
  checkMyClientStatus,
  sendMessage,
  events: emitter,
};
