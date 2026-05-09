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

const schedulerStageLabels: Record<string, string> = {
  "timeout-scan": "扫描超时任务",
  "load-online-users": "读取在线客户端用户",
  "load-auto-users": "读取自动调度用户",
};

const formatSchedulerStage = (value?: string | null) => {
  const stage = String(value || "").trim();
  if (!stage) return "";
  if (schedulerStageLabels[stage]) return schedulerStageLabels[stage];
  if (stage.startsWith("dispatch-user:")) {
    const [, userId, step] = stage.split(":");
    const stepLabels: Record<string, string> = {
      clients: "筛选客户端",
      "clients-live": "读取在线客户端",
      "clients-records": "读取运行锁",
      "clients-requeue": "释放离线锁",
      "clients-recover": "恢复客户端状态",
      "clients-filter": "过滤可用客户端",
      pending: "读取待调度套图",
      send: "发送任务",
    };
    return `调度用户 ${userId || ""}${step ? ` ${stepLabels[step] || step}` : ""}`.trim();
  }
  return stage;
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

  if ((runtime.dbCooldownRemainingMs || 0) > 0) {
    return { text: "数据库重试中", tone: "warning" };
  }

  if ((runtime.schedulerCooldownRemainingMs || 0) > 0) {
    return { text: "调度超时重试中", tone: "warning" };
  }

  if (runtime.online) {
    return {
      text: runtime.running
        ? `检测中${formatSchedulerStage(runtime.currentCycleStage) ? `：${formatSchedulerStage(runtime.currentCycleStage)}` : ""}`
        : "调度器在线",
      tone: runtime.running ? "warning" : "success",
    };
  }

  if (runtime.lastError) {
    const message = String(runtime.lastError || "").trim();
    return { text: message ? `调度器异常：${message}` : "调度器异常", tone: "danger" };
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

  if ((runtime.dbCooldownRemainingMs || 0) > 0) {
    parts.push(`数据库 ${Math.ceil((runtime.dbCooldownRemainingMs || 0) / 1000)} 秒后重试`);
  }

  if ((runtime.schedulerCooldownRemainingMs || 0) > 0) {
    parts.push(`调度 ${Math.ceil((runtime.schedulerCooldownRemainingMs || 0) / 1000)} 秒后重试`);
  }

  const stageText = formatSchedulerStage(runtime.currentCycleStage);
  if (stageText) {
    const stageTime = formatRuntimeTime(runtime.currentCycleStageStartedAt);
    const elapsedText =
      runtime.cycleElapsedMs && runtime.cycleElapsedMs > 0
        ? `，已 ${Math.round(runtime.cycleElapsedMs / 1000)} 秒`
        : "";
    parts.push(stageTime ? `当前 ${stageText} ${stageTime}${elapsedText}` : `当前 ${stageText}${elapsedText}`);
  }

  const lastError = String(runtime.lastError || "").trim();
  if (lastError) {
    parts.push(`错误 ${lastError}`);
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
