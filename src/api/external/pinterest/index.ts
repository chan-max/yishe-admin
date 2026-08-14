import {
  getMyOnlineRuntimeConnectionViews,
  sendServiceCommand,
  type ServiceCommandDTO,
  type WebsocketConnectionVO,
} from "@/api/system/websocket";
import { websocketClient } from "@/services/websocketClient";

// ─── 类型定义 ──────────────────────────────────────────────

export type PinterestScope = "pins";

export interface PinterestServiceStatus {
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

export interface PinterestClientVO {
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
  pinterest?: PinterestServiceStatus | null
}

export interface PinterestCommandResponse {
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

export interface PinterestPin {
  id: string
  title: string
  link: string | null
  image: string | null
  width?: number | null
  height?: number | null
  description?: string | null
  boardName?: string | null
  pinner?: string | null
  pinnerUrl?: string | null
  isVideo?: boolean
  videoPoster?: string | null
}

export interface PinterestSearchResult {
  query: string
  scope: PinterestScope
  total: number
  count: number
  items: PinterestPin[]
  bookmark: string | null
  hasMore: boolean
  error?: string | null
}

// ─── 客户端节点管理 ────────────────────────────────────────

function mapConnectionToPinterestClient(connection: WebsocketConnectionVO): PinterestClientVO {
  const services = connection.clientInfo?.services || {};
  const pinterest = services["pinterest"] || services.pinterest || null;

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
    pinterest,
  };
}

export async function getPinterestClients() {
  const list = await getMyOnlineRuntimeConnectionViews();
  return (Array.isArray(list) ? list : [])
    .map(mapConnectionToPinterestClient)
    .filter((item) => {
      if (!item.isOnline || !item.pinterest) {
        return false;
      }
      const service = item.pinterest;
      return !!(service.available || service.connected || service.status === "error");
    });
}

// ─── 客户端命令（Pinterest 采集）───────────────────────────

function sendPinterestCommand(clientId: string, commandName: string, payload?: Record<string, any>) {
  const data: ServiceCommandDTO = {
    target: {
      clientId,
      pluginKey: "pinterest",
    },
    command: {
      name: commandName,
      payload: payload || {},
    },
    mode: "production",
  };

  return sendServiceCommand(data) as Promise<PinterestCommandResponse>;
}

export function refreshPinterestStatus(clientId: string) {
  return sendPinterestCommand(clientId, "refreshRuntime");
}

export function searchPinterest(
  clientId: string,
  keyword: string,
  options: {
    scope?: PinterestScope;
    limit?: number;
    imageOnly?: boolean;
    bookmark?: string | null;
  } = {},
) {
  return sendPinterestCommand(clientId, "search", {
    keyword,
    scope: options.scope || "pins",
    limit: options.limit ?? 25,
    imageOnly: options.imageOnly ?? true,
    bookmark: options.bookmark || null,
  });
}

export function downloadPinterestImage(
  clientId: string,
  imageUrl: string,
  filename?: string,
) {
  return sendPinterestCommand(clientId, "download", { imageUrl, filename });
}

export function syncPinterestToMaterialLibrary(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
) {
  return sendPinterestCommand(clientId, "sync", data);
}

export function collectPinterest(
  clientId: string,
  keyword: string,
  options: {
    maxCount?: number;
    imageOnly?: boolean;
    syncToMaterial?: boolean;
  } = {},
) {
  return sendPinterestCommand(clientId, "collect", {
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

export async function searchPinterestAndWait(
  clientId: string,
  keyword: string,
  options: {
    scope?: PinterestScope;
    limit?: number;
    imageOnly?: boolean;
    bookmark?: string | null;
  } = {},
): Promise<PinterestSearchResult> {
  const response = await searchPinterest(clientId, keyword, options);
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || "搜索命令发送失败");
  }
  const result = await waitForServiceCommandResult(response.data.commandId, 60000);
  if (!result.success) {
    throw new Error(result.message || "搜索失败");
  }
  return result.data as PinterestSearchResult;
}

export async function syncPinterestToMaterialLibraryAndWait(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await syncPinterestToMaterialLibrary(clientId, data);
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || "同步命令发送失败");
  }
  return waitForServiceCommandResult(response.data.commandId, 60000);
}