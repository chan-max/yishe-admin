import type { AutoDispatchSchedulerRuntime } from "@/api/system/websocket";

export type AutoDispatchSchedulerTone = "success" | "warning" | "danger" | "info";

const formatRuntimeTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString();
};

export const normalizeAutoDispatchSchedulerRuntime = (
  response: any,
): AutoDispatchSchedulerRuntime | null => {
  const data =
    response?.data && typeof response.data === "object" && !Array.isArray(response.data)
      ? response.data
      : response;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  return data as AutoDispatchSchedulerRuntime;
};

export const resolveAutoDispatchSchedulerIndicator = (
  runtime?: AutoDispatchSchedulerRuntime | null,
): { text: string; tone: AutoDispatchSchedulerTone } => {
  if (!runtime) {
    return { text: "调度器状态未知", tone: "info" };
  }

  if (runtime.online) {
    return {
      text: runtime.running ? "调度器检测中" : "调度器在线",
      tone: runtime.running ? "warning" : "success",
    };
  }

  if (runtime.lastError) {
    return { text: "调度器异常", tone: "danger" };
  }

  if (!runtime.timerActive) {
    return { text: "调度器未启动", tone: "info" };
  }

  return { text: "调度器离线", tone: "warning" };
};

export const resolveAutoDispatchSchedulerMeta = (
  runtime?: AutoDispatchSchedulerRuntime | null,
) => {
  if (!runtime) return "";

  const parts: string[] = [];
  if (runtime.dispatchIntervalMs > 0) {
    parts.push(`${Math.round(runtime.dispatchIntervalMs / 1000)} 秒/轮询`);
  }

  const heartbeat =
    runtime.lastHeartbeatAt || runtime.lastCycleFinishedAt || runtime.lastCycleStartedAt || null;
  const heartbeatText = formatRuntimeTime(heartbeat);
  if (heartbeatText) {
    parts.push(`最近心跳 ${heartbeatText}`);
  }

  const lastDispatchText = formatRuntimeTime(runtime.lastDispatchAt);
  const lastDispatchMessage = String(runtime.lastDispatchMessage || "").trim();
  if (lastDispatchMessage) {
    parts.push(
      lastDispatchText
        ? `最近结果 ${lastDispatchText} ${lastDispatchMessage}`
        : `最近结果 ${lastDispatchMessage}`,
    );
  }

  return parts.join(" · ");
};
