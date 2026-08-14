import {
  sendServiceCommand,
  type ServiceCommandDTO,
} from "@/api/system/websocket";
import { websocketClient } from "@/services/websocketClient";

// ─── 类型定义 ──────────────────────────────────────────────

export interface PixabayServiceStatus {
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
}

export interface PixabayClientVO {
  clientId: string;
  isOnline: boolean;
  nodeStatus?: string;
  connectedAt?: string;
  lastOnlineAt?: string;
  appVersion?: string | null;
  workspaceDirectory?: string | null;
  machine?: any;
  location?: any;
  pixabay?: PixabayServiceStatus | null;
}

export interface PixabayPhoto {
  id: string;
  title: string;
  description: string;
  image: string;
  thumbnail: string;
  link: string;
  url: string;
  width?: number;
  height?: number;
  author?: string;
  tags?: string;
}

export interface PixabaySearchResult {
  success: boolean;
  query: string;
  count: number;
  total?: number;
  items: PixabayPhoto[];
  links: string[];
  page: number;
  nextPage: number | null;
  error?: string;
}

export interface PixabayCommandResponse {
  success: boolean;
  message: string;
  data?: {
    commandId?: string;
    targetId?: string;
  };
}

// ─── 帮助方法 ──────────────────────────────────────────────

function sendPixabayCommand(clientId: string, commandName: string, payload?: Record<string, any>) {
  const data: ServiceCommandDTO = {
    target: {
      clientId,
      pluginKey: "pixabay",
    },
    command: {
      name: commandName,
      payload: payload || {},
    },
    mode: "production",
  };

  return sendServiceCommand(data) as Promise<PixabayCommandResponse>;
}

export function refreshPixabayStatus(clientId: string) {
  return sendPixabayCommand(clientId, "refreshRuntime");
}

export function searchPixabay(
  clientId: string,
  keyword: string,
  options: {
    limit?: number;
    page?: number;
  } = {},
) {
  return sendPixabayCommand(clientId, "search", {
    keyword,
    limit: options.limit ?? 20,
    page: options.page ?? 1,
  });
}

export function downloadPixabayImage(
  clientId: string,
  imageUrl: string,
  filename?: string,
) {
  return sendPixabayCommand(clientId, "download", { imageUrl, filename });
}

export function syncPixabayToMaterialLibrary(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
) {
  return sendPixabayCommand(clientId, "sync", data);
}

export function collectPixabay(
  clientId: string,
  keyword: string,
  options: {
    maxCount?: number;
    syncToMaterial?: boolean;
  } = {},
) {
  return sendPixabayCommand(clientId, "collect", {
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

export async function searchPixabayAndWait(
  clientId: string,
  keyword: string,
  options: {
    limit?: number;
    page?: number;
  } = {},
): Promise<PixabaySearchResult> {
  const response = await searchPixabay(clientId, keyword, options);
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || "搜索命令发送失败");
  }
  const result = await waitForServiceCommandResult(response.data.commandId, 60000);
  if (!result.success) {
    throw new Error(result.message || "搜索失败");
  }
  const realData = (result.data && result.data.data ? result.data.data : result.data) || {};
  return realData as PixabaySearchResult;
}

export async function syncPixabayToMaterialLibraryAndWait(
  clientId: string,
  data: { imageUrl: string; metadata?: Record<string, any> },
): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await syncPixabayToMaterialLibrary(clientId, data);
  if (!response.success || !response.data?.commandId) {
    throw new Error(response.message || "同步命令发送失败");
  }
  return waitForServiceCommandResult(response.data.commandId, 60000);
}
