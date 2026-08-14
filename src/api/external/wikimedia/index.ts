import {
  getMyOnlineRuntimeConnectionViews,
  sendServiceCommand,
  type ServiceCommandDTO,
  type WebsocketConnectionVO,
} from "@/api/system/websocket";
import { websocketClient } from "@/services/websocketClient";

// ─── 类型定义 ──────────────────────────────────────────────

export interface WikimediaServiceStatus {
  key?: string
  pluginKey?: string
  label?: string
  connected?: boolean
  available?: boolean
  status?: "connected" | "disconnected" | "error" | "unknown"
  state?: "idle" | "busy" | "offline" | "error"
  busy?: boolean
  message?: string
  version?: string
  endpoint?: string
  lastCheckedAt?: string
  currentTaskId?: string | null
  lastError?: string | null
  supportedCommands?: string[]
  details?: Record<string, any>
}

export interface WikimediaClientVO {
  clientId: string
  isOnline?: boolean
  nodeStatus?: string | null
  connectedAt?: string | null
  lastOnlineAt?: string | null
  appVersion?: string | null
  workspaceDirectory?: string | null
  machine?: {
    code?: string
    platform?: string
    createdAt?: string
  } | null
  location?: {
    ip?: string
    city?: string
    region?: string
    country?: string
    org?: string
    fetchedAt?: string
    source?: string
  } | null
  wikimedia?: WikimediaServiceStatus | null
}

export interface WikimediaCommandResponse {
  success: boolean
  message: string
  data?: {
    commandId?: string
    clientId?: string
    pluginKey?: string
    service?: string
    action?: string
    payload?: Record<string, any>
    createdAt?: string
  }
}

export interface WikimediaFile {
  id: string
  title: string
  description?: string | null
  image: string | null
  thumbnail: string | null
  link: string | null
  url: string | null
  width?: number | null
  height?: number | null
  mime?: string | null
  author?: string | null
  license?: string | null
  date?: string | null
}

export interface WikimediaSearchResult {
  query: string
  total: number
  count: number
  items: WikimediaFile[]
  nextOffset: number | null
  hasMore: boolean
  error?: string | null
}

// ─── 客户端节点管理 ────────────────────────────────────────

function mapConnectionToWikimediaClient(connection: WebsocketConnectionVO): WikimediaClientVO {
  const services = connection.clientInfo?.services || {};
  const wikimedia = services["wikimedia"] || null;

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
    wikimedia,
  };
}

export async function getWikimediaClients() {
  const list = await getMyOnlineRuntimeConnectionViews();
  return (Array.isArray(list) ? list : [])
    .map(mapConnectionToWikimediaClient)
    .filter((item) => {
      if (!item.isOnline || !item.wikimedia) {
        return false;
      }
      const service = item.wikimedia;
      return !!(service.available || service.connected || service.status === "error");
    });
}

// ─── 客户端命令（Wikimedia 采集）───────────────────────────

function sendWikimediaCommand(clientId: string, commandName: string, payload?: Record<string, any>) {
  const data: ServiceCommandDTO = {
    target: {
      clientId,
      pluginKey: "wikimedia",
    },
    command: {
      name: commandName,
      payload: payload || {},
    },
    mode: "production",
  };

  return sendServiceCommand(data) as Promise<WikimediaCommandResponse>;
}

export function refreshWikimediaStatus(clientId: string) {
  return sendWikimediaCommand(clientId, "refreshRuntime");
}

export function searchWikimedia(
  clientId: string,
  keyword: string,
  options: {
    limit?: number;
    imageOnly?: boolean;
    offset?: number | null;
  } = {},
) {
  return sendWikimediaCommand(clientId, "search", {
    keyword,
    limit: options.limit ?? 25,
    imageOnly: options.imageOnly ?? true,
    offset: options.offset || null,
  });
}

export function downloadWikimediaImage(
  clientId: string,
  imageUrl: string,
  filename?: string,
) {
  return sendWikimediaCommand(clientId, "download", { imageUrl, filename });
}

export function syncWikimediaToMaterialLibrary(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
) {
  return sendWikimediaCommand(clientId, "sync", data);
}

export function collectWikimedia(
  clientId: string,
  keyword: string,
  options: {
    maxCount?: number;
    imageOnly?: boolean;
    syncToMaterial?: boolean;
  } = {},
) {
  return sendWikimediaCommand(clientId, "collect", {
    keyword,
    maxCount: options.maxCount ?? 5,
    imageOnly: options.imageOnly ?? true,
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

export async function searchWikimediaAndWait(
  clientId: string,
  keyword: string,
  options: {
    limit?: number;
    imageOnly?: boolean;
    offset?: number | null;
  } = {},
): Promise<WikimediaSearchResult> {
  const response = await searchWikimedia(clientId, keyword, options);
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || "搜索命令发送失败");
  }
  const result = await waitForServiceCommandResult(response.data.commandId, 60000);
  if (!result.success) {
    throw new Error(result.message || "搜索失败");
  }
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {};
  return realData as WikimediaSearchResult;
}

export async function syncWikimediaToMaterialLibraryAndWait(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await syncWikimediaToMaterialLibrary(clientId, data);
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || "同步命令发送失败");
  }
  return waitForServiceCommandResult(response.data.commandId, 60000);
}