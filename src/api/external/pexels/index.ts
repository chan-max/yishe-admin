import {
  getMyOnlineRuntimeConnectionViews,
  sendServiceCommand,
  type ServiceCommandDTO,
  type WebsocketConnectionVO,
} from "@/api/system/websocket";
import { websocketClient } from "@/services/websocketClient";

// ─── 类型定义 ──────────────────────────────────────────────

export interface PexelsServiceStatus {
  key?: string;
  pluginKey?: string;
  label?: string;
  connected?: boolean;
  available?: boolean;
  status?: "connected" | "disconnected" | "error" | "unknown";
  state?: "idle" | "busy" | "offline" | "error";
  busy?: boolean;
  message?: string;
  version?: string;
  endpoint?: string;
  lastCheckedAt?: string;
  currentTaskId?: string | null;
  lastError?: string | null;
  supportedCommands?: string[];
  details?: Record<string, any>;
}

export interface PexelsClientVO {
  clientId: string;
  isOnline?: boolean;
  nodeStatus?: string | null;
  connectedAt?: string | null;
  lastOnlineAt?: string | null;
  appVersion?: string | null;
  workspaceDirectory?: string | null;
  machine?: {
    code?: string;
    platform?: string;
    createdAt?: string;
  } | null;
  location?: {
    ip?: string;
    city?: string;
    region?: string;
    country?: string;
    org?: string;
    fetchedAt?: string;
    source?: string;
  } | null;
  pexels?: PexelsServiceStatus | null;
}

export interface PexelsCommandResponse {
  success: boolean;
  message: string;
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

export interface PexelsPhoto {
  id: string;
  title: string;
  description?: string | null;
  image: string | null;
  thumbnail: string | null;
  link: string | null;
  url: string | null;
  width?: number | null;
  height?: number | null;
  photographer?: string | null;
  photographerUrl?: string | null;
  alt?: string | null;
  avgColor?: string | null;
}

export interface PexelsSearchResult {
  query: string;
  total: number;
  count: number;
  items: PexelsPhoto[];
  page: number;
  nextPage: number | null;
  hasMore: boolean;
  error?: string | null;
}

// ─── 客户端节点管理 ────────────────────────────────────────

function mapConnectionToPexelsClient(connection: WebsocketConnectionVO): PexelsClientVO {
  const services = connection.clientInfo?.services || {};
  const pexels = services["pexels"] || null;

  return {
    clientId: connection.id,
    isOnline: connection.isOnline,
    nodeStatus: connection.nodeStatus,
    connectedAt: connection.connectedAt,
    lastOnlineAt: connection.lastOnlineAt,
    appVersion: connection.clientInfo?.appVersion || null,
    workspaceDirectory: connection.clientInfo?.workspaceDirectory || null,
    machine: connection.clientInfo?.machine || null,
    location: connection.clientInfo?.location || null,
    pexels,
  };
}

export async function getPexelsClients() {
  const list = await getMyOnlineRuntimeConnectionViews();
  return (Array.isArray(list) ? list : [])
    .map(mapConnectionToPexelsClient)
    .filter((item) => {
      if (!item.isOnline || !item.pexels) {
        return false;
      }
      const service = item.pexels;
      return !!(service.available || service.connected || service.status === "error");
    });
}

// ─── 客户端命令（Pexels 采集）───────────────────────────

function sendPexelsCommand(clientId: string, commandName: string, payload?: Record<string, any>) {
  const data: ServiceCommandDTO = {
    target: {
      clientId,
      pluginKey: "pexels",
    },
    command: {
      name: commandName,
      payload: payload || {},
    },
    mode: "production",
  };

  return sendServiceCommand(data) as Promise<PexelsCommandResponse>;
}

export function refreshPexelsStatus(clientId: string) {
  return sendPexelsCommand(clientId, "refreshRuntime");
}

export function searchPexels(
  clientId: string,
  keyword: string,
  options: {
    limit?: number;
    page?: number;
    orientation?: string;
    size?: string;
  } = {},
) {
  return sendPexelsCommand(clientId, "search", {
    keyword,
    limit: options.limit ?? 20,
    page: options.page ?? 1,
    orientation: options.orientation || "all",
    size: options.size || "all",
  });
}

export function downloadPexelsImage(
  clientId: string,
  imageUrl: string,
  filename?: string,
) {
  return sendPexelsCommand(clientId, "download", { imageUrl, filename });
}

export function syncPexelsToMaterialLibrary(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
) {
  return sendPexelsCommand(clientId, "sync", data);
}

export function collectPexels(
  clientId: string,
  keyword: string,
  options: {
    maxCount?: number;
    syncToMaterial?: boolean;
  } = {},
) {
  return sendPexelsCommand(clientId, "collect", {
    keyword,
    maxCount: options.maxCount ?? 5,
    syncToMaterial: options.syncToMaterial ?? true,
  });
}

// ─── 等待服务命令结果 ──────────────────────────────────────

function waitForServiceCommandResult(
  commandId: string,
  timeoutMs = 30000,
): Promise<{ success: boolean; message: string; data?: any }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      websocketClient.events.off("serviceCommandResult", handler);
      reject(new Error(`命令执行超时 (${timeoutMs / 1000}s)`));
    }, timeoutMs);

    const handler = (event: any) => {
      if (event.commandId === commandId) {
        clearTimeout(timer);
        websocketClient.events.off("serviceCommandResult", handler);
        resolve({
          success: event.success,
          message: event.message,
          data: event.data,
        });
      }
    };

    websocketClient.events.on("serviceCommandResult", handler);
  });
}

// ─── 等待版命令（用于前端直接交互）─────────────────────────

export async function searchPexelsAndWait(
  clientId: string,
  keyword: string,
  options: {
    limit?: number;
    page?: number;
    orientation?: string;
    size?: string;
  } = {},
): Promise<PexelsSearchResult> {
  const response = await searchPexels(clientId, keyword, options);
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || "搜索命令发送失败");
  }
  const result = await waitForServiceCommandResult(response.data.commandId, 60000);
  if (!result.success) {
    throw new Error(result.message || "搜索失败");
  }
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {};
  return realData as PexelsSearchResult;
}

export async function syncPexelsToMaterialLibraryAndWait(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await syncPexelsToMaterialLibrary(clientId, data);
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || "同步命令发送失败");
  }
  return waitForServiceCommandResult(response.data.commandId, 60000);
}
