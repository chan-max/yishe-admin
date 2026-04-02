import type { WebsocketConnectionVO } from "@/api/system/websocket";
import type { BrowserAutomationServiceStatus } from "@/api/external/browserAutomation";
import {
  getClientServiceRuntimeSafe,
  isClientServiceNodeAvailable,
  isClientServiceRuntimeBusy,
} from "@/services/clientServiceRuntime";

export type BrowserAutomationRuntimeLike =
  | (Partial<BrowserAutomationServiceStatus> & Record<string, any>)
  | null
  | undefined;

export type BrowserAutomationRuntimeTone = "success" | "warning" | "muted";

export function getBrowserAutomationRuntimeSafe(
  runtime?: BrowserAutomationRuntimeLike,
): Record<string, any> {
  return getClientServiceRuntimeSafe(runtime);
}

export function extractBrowserAutomationSupportedTaskTypes(
  runtime?: BrowserAutomationRuntimeLike,
): string[] {
  const safeRuntime = getBrowserAutomationRuntimeSafe(runtime);
  const list = [
    ...(Array.isArray(safeRuntime.supportedTaskTypes) ? safeRuntime.supportedTaskTypes : []),
    ...(Array.isArray(safeRuntime.details?.supportedTaskTypes)
      ? safeRuntime.details.supportedTaskTypes
      : []),
    ...(Array.isArray(safeRuntime.details?.executableTaskTypes)
      ? safeRuntime.details.executableTaskTypes
      : []),
    ...(Array.isArray(safeRuntime.details?.capabilities)
      ? safeRuntime.details.capabilities.map((item: any) => item?.taskType)
      : []),
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return Array.from(new Set(list));
}

export function supportsBrowserAutomationTaskType(
  runtime?: BrowserAutomationRuntimeLike,
  taskType?: string,
): boolean {
  const normalizedTaskType = String(taskType || "").trim();
  if (!normalizedTaskType) {
    return false;
  }

  return extractBrowserAutomationSupportedTaskTypes(runtime).includes(normalizedTaskType);
}

export function isBrowserAutomationRuntimeBusy(runtime?: BrowserAutomationRuntimeLike): boolean {
  return isClientServiceRuntimeBusy(runtime);
}

export function isBrowserAutomationClientAvailable(
  client?: Pick<WebsocketConnectionVO, "isOnline"> | null,
  runtime?: BrowserAutomationRuntimeLike,
): boolean {
  return isClientServiceNodeAvailable(client, runtime);
}

export function getBrowserAutomationServiceText(runtime?: BrowserAutomationRuntimeLike): string {
  const safeRuntime = getBrowserAutomationRuntimeSafe(runtime);
  if (!runtime) return "未知";
  if (safeRuntime.connected) return "已启动";
  if (safeRuntime.status === "error") return "异常";
  return "未启动";
}

export function getBrowserAutomationBrowserText(runtime?: BrowserAutomationRuntimeLike): string {
  const safeRuntime = getBrowserAutomationRuntimeSafe(runtime);
  const details = safeRuntime.details || {};

  if (details.browserConnected) return "已连接";
  if (details.hasInstance) return "实例未就绪";
  if (safeRuntime.connected) return "未连接";
  return safeRuntime.status === "error" ? "异常" : "未启动";
}

export function getBrowserAutomationServiceTone(
  runtime?: BrowserAutomationRuntimeLike,
): BrowserAutomationRuntimeTone {
  const safeRuntime = getBrowserAutomationRuntimeSafe(runtime);
  if (safeRuntime.available) return "success";
  if (safeRuntime.connected) return "warning";
  return "muted";
}

export function getBrowserAutomationBrowserTone(
  runtime?: BrowserAutomationRuntimeLike,
): BrowserAutomationRuntimeTone {
  const safeRuntime = getBrowserAutomationRuntimeSafe(runtime);
  const details = safeRuntime.details || {};

  if (details.browserConnected) return "success";
  if (details.hasInstance || safeRuntime.connected) return "warning";
  return "muted";
}

export function getBrowserAutomationCurrentTaskText(
  runtime?: BrowserAutomationRuntimeLike,
): string {
  const safeRuntime = getBrowserAutomationRuntimeSafe(runtime);
  return safeRuntime.currentTaskId || safeRuntime.details?.currentExecution?.taskId || "空闲";
}

export function getBrowserAutomationRuntimeHint(runtime?: BrowserAutomationRuntimeLike): string {
  const safeRuntime = getBrowserAutomationRuntimeSafe(runtime);
  const details = safeRuntime.details || {};
  const currentExecution = details.currentExecution || {};

  if (safeRuntime.lastError) {
    return `最近错误：${safeRuntime.lastError}`;
  }

  if (currentExecution.currentStep) {
    return String(currentExecution.currentStep);
  }

  if (safeRuntime.message) {
    return String(safeRuntime.message);
  }

  if (details.browserConnected && safeRuntime.available) {
    return "空闲，可立即执行";
  }

  if (details.hasInstance) {
    return "浏览器实例存在，但连接尚未完成";
  }

  if (safeRuntime.connected) {
    return "自动化服务已连接，等待浏览器实例就绪";
  }

  if (safeRuntime.status === "error") {
    return "自动化服务异常";
  }

  return "自动化服务未启动";
}
