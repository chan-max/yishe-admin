import type { WebsocketConnectionVO } from "@/api/system/websocket";
import { useI18n } from "@/hooks/web/useI18n";
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

export const BROWSER_AUTOMATION_EXECUTABLE_TASK_TYPES = [
  "publish-product-douyin",
  "publish-product-youtube",
  "publish-product-xianyu",
  "publish-product-tiktok",
  "publish-product-kuaishou",
  "publish-product-doudian",
  "publish-product-kuaishou_shop",
  "publish-product-temu",
  "publish-product-taobao",
  "publish-product-pdd",
  "publish-product-xiaohongshu",
  "publish-product-weibo",
] as const;

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
    ...BROWSER_AUTOMATION_EXECUTABLE_TASK_TYPES,
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
  const { t } = useI18n();
  const safeRuntime = getBrowserAutomationRuntimeSafe(runtime);
  const details = safeRuntime.details || {};
  const currentExecution = details.currentExecution || {};

  if (safeRuntime.lastError) {
    return t("layout.menu.lastError", { error: safeRuntime.lastError });
  }

  if (currentExecution.currentStep) {
    return String(currentExecution.currentStep);
  }

  if (safeRuntime.message) {
    return String(safeRuntime.message);
  }

  if (details.browserConnected && safeRuntime.available) {
    return t("layout.menu.automationServiceIdle");
  }

  if (details.hasInstance) {
    return t("layout.menu.browserInstanceExists");
  }

  if (safeRuntime.connected) {
    return t("layout.menu.automationServiceWaiting");
  }

  if (safeRuntime.status === "error") {
    return t("layout.menu.automationServiceError");
  }

  return t("layout.menu.automationServiceNotStarted");
}
