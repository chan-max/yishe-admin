import { reactive, watch } from "vue";
import {
  getMyOnlineRuntimeConnectionViews,
  type WebsocketConnectionVO,
} from "@/api/system/websocket";
import {
  websocketClient,
  type RemoteResultEvent,
  type RuntimeConnectionChangedEvent,
} from "@/services/websocketClient";

export type DesignToolRuntimeTone = "checking" | "available" | "running" | "offline";

interface DesignToolRuntimeSnapshot {
  initialized: boolean;
  loading: boolean;
  onlineCount: number;
  runningCount: number;
  updatedAt: string;
}

const DESIGN_TOOL_SOURCES = new Set(["设计工具", "设计端"]);
const FALLBACK_REFRESH_INTERVAL_MS = 60_000;

export const designToolRuntimeState = reactive<DesignToolRuntimeSnapshot>({
  initialized: false,
  loading: false,
  onlineCount: 0,
  runningCount: 0,
  updatedAt: "",
});

const connections = new Map<string, WebsocketConnectionVO>();
let initializationStarted = false;
let eventListenerBound = false;
let remoteResultListenerBound = false;
let visibilityListenerBound = false;
let websocketStatusWatcherBound = false;
let fallbackTimer: number | null = null;
let pendingRefresh: Promise<void> | null = null;

const isDesignToolConnection = (connection?: WebsocketConnectionVO | null) => {
  const rawSource = connection?.clientSource || connection?.query?.clientSource;
  const source = Array.isArray(rawSource) ? rawSource[0] : rawSource || "";
  return (
    DESIGN_TOOL_SOURCES.has(String(source).trim()) ||
    String(connection?.clientInfo?.app?.name || "").trim() === "yishe-tool" ||
    String(connection?.id || "").trim().startsWith("designtool-")
  );
};

const ACTIVE_BATCH_STATES = new Set(["preparing", "running", "paused"]);
const TERMINAL_BATCH_STATES = new Set(["done", "stopped"]);
const ACTIVE_AGENT_STATES = new Set(["thinking", "executing", "waiting_user"]);

const parseTimestamp = (value: unknown) => {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const isDesignToolConnectionRunning = (
  connection: WebsocketConnectionVO,
) => {
  const workerState = String(connection.clientInfo?.designWorker?.state || "").trim();
  const agentState = String((connection.clientInfo as any)?.agent?.agentState || "").trim();
  const batch = connection.clientInfo?.designWorker?.batch as
    | Record<string, any>
    | null
    | undefined;
  const batchStatus = String(batch?.status || "").trim();
  const agentIsActive = ACTIVE_AGENT_STATES.has(agentState);
  const workerIsActive = workerState === "busy" || workerState === "cancelling";

  if (ACTIVE_BATCH_STATES.has(batchStatus)) return true;

  if (TERMINAL_BATCH_STATES.has(batchStatus)) {
    const batchUpdatedAt = parseTimestamp(batch?.updatedAt);
    const workerUpdatedAt = parseTimestamp(
      connection.clientInfo?.designWorker?.updatedAt,
    );
    const agentUpdatedAt = parseTimestamp(
      (connection.clientInfo as any)?.agent?.updatedAt,
    );
    if (batchUpdatedAt) {
      if (workerIsActive && workerUpdatedAt > batchUpdatedAt) return true;
      if (agentIsActive && agentUpdatedAt > batchUpdatedAt) return true;
      return false;
    }
    if (!agentIsActive) return false;
  }

  return workerIsActive || agentIsActive;
};

const normalizeRows = (payload: unknown): WebsocketConnectionVO[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray((payload as any).data)) {
    return (payload as any).data;
  }
  return [];
};

const syncSnapshot = () => {
  const onlineConnections = Array.from(connections.values()).filter(
    (connection) => connection.isOnline !== false,
  );
  designToolRuntimeState.onlineCount = onlineConnections.length;
  designToolRuntimeState.runningCount = onlineConnections.filter(
    isDesignToolConnectionRunning,
  ).length;
  designToolRuntimeState.initialized = true;
  designToolRuntimeState.updatedAt = new Date().toISOString();
};

const replaceConnections = (rows: WebsocketConnectionVO[]) => {
  connections.clear();
  rows.forEach((connection) => {
    if (connection?.id && connection.isOnline !== false && isDesignToolConnection(connection)) {
      connections.set(connection.id, connection);
    }
  });
  syncSnapshot();
};

const handleRuntimeConnectionChanged = (event: RuntimeConnectionChangedEvent) => {
  const connection = event?.connection;
  if (!connection?.id) return;

  if (event.action === "removed" || connection.isOnline === false) {
    if (connections.delete(connection.id)) syncSnapshot();
    return;
  }

  if (!isDesignToolConnection(connection)) return;
  connections.set(connection.id, connection);
  syncSnapshot();
};

const handleRemoteResult = (event: RemoteResultEvent) => {
  const connectionId = String(event?.connectionId || "").trim();
  const batch = event?.batch as Record<string, any> | null | undefined;
  const batchStatus = String(batch?.status || "").trim();
  if (!connectionId || !TERMINAL_BATCH_STATES.has(batchStatus)) return;

  const connection = connections.get(connectionId);
  if (!connection?.clientInfo?.designWorker) return;

  const batchUpdatedAt = parseTimestamp(batch?.updatedAt);
  const workerUpdatedAt = parseTimestamp(connection.clientInfo.designWorker.updatedAt);
  const agent = (connection.clientInfo as any)?.agent;
  const agentUpdatedAt = parseTimestamp(agent?.updatedAt);
  const now = new Date().toISOString();

  connection.clientInfo.designWorker.batch = batch;
  if (!batchUpdatedAt || workerUpdatedAt <= batchUpdatedAt) {
    Object.assign(connection.clientInfo.designWorker, {
      state: "idle",
      activeRequestId: null,
      updatedAt: now,
    });
  }
  if (agent && (!batchUpdatedAt || agentUpdatedAt <= batchUpdatedAt)) {
    Object.assign(agent, {
      available: true,
      agentState: "idle",
      updatedAt: now,
    });
  }
  syncSnapshot();
};

export const refreshDesignToolRuntimeState = async () => {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = (async () => {
    designToolRuntimeState.loading = true;
    try {
      const response = await getMyOnlineRuntimeConnectionViews({
        summary: true,
        compact: true,
      });
      replaceConnections(normalizeRows(response));
    } catch {
      if (!designToolRuntimeState.initialized) {
        designToolRuntimeState.initialized = true;
        designToolRuntimeState.onlineCount = 0;
        designToolRuntimeState.runningCount = 0;
        designToolRuntimeState.updatedAt = new Date().toISOString();
      }
    } finally {
      designToolRuntimeState.loading = false;
      pendingRefresh = null;
    }
  })();

  return pendingRefresh;
};

const refreshWhenVisible = () => {
  if (typeof document !== "undefined" && document.hidden) return;
  void refreshDesignToolRuntimeState();
};

const bindRuntimeUpdates = () => {
  if (!eventListenerBound) {
    eventListenerBound = true;
    websocketClient.events.on("runtimeConnectionChanged", handleRuntimeConnectionChanged);
  }

  if (!remoteResultListenerBound) {
    remoteResultListenerBound = true;
    websocketClient.events.on("remote-result", handleRemoteResult);
  }

  if (typeof window !== "undefined" && fallbackTimer === null) {
    fallbackTimer = window.setInterval(refreshWhenVisible, FALLBACK_REFRESH_INTERVAL_MS);
  }

  if (
    !visibilityListenerBound &&
    typeof document !== "undefined" &&
    typeof window !== "undefined"
  ) {
    visibilityListenerBound = true;
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);
  }

  if (!websocketStatusWatcherBound) {
    websocketStatusWatcherBound = true;
    watch(
      () => websocketClient.state.status,
      (status) => {
        if (status === "connected") refreshWhenVisible();
      },
    );
  }
};

export const ensureDesignToolRuntimeInitialized = () => {
  bindRuntimeUpdates();
  if (!initializationStarted) {
    initializationStarted = true;
    void refreshDesignToolRuntimeState();
  }
};

export const resolveDesignToolRuntimeTone = (): DesignToolRuntimeTone => {
  if (
    !designToolRuntimeState.initialized ||
    (designToolRuntimeState.loading && !designToolRuntimeState.updatedAt)
  ) {
    return "checking";
  }
  if (designToolRuntimeState.runningCount > 0) return "running";
  if (designToolRuntimeState.onlineCount > 0) return "available";
  return "offline";
};

export const resolveDesignToolRuntimeTooltip = () => {
  if (!designToolRuntimeState.initialized) return "正在读取设计工具状态";
  if (designToolRuntimeState.onlineCount === 0) return "当前没有在线设计工具";
  if (designToolRuntimeState.runningCount > 0) {
    return `${designToolRuntimeState.onlineCount} 个在线，${designToolRuntimeState.runningCount} 个正在制作`;
  }
  return `${designToolRuntimeState.onlineCount} 个在线，当前均为空闲状态`;
};
