import type {
  QueueMessage,
  TaskExecutionReadinessSnapshot,
} from "@/api/system/queue";

export type TaskExecutionReadinessTagType =
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface TaskExecutionReadinessIndicator {
  text: string;
  type?: TaskExecutionReadinessTagType;
  reason?: string | null;
  ready: boolean;
  manual: boolean;
}

export function getTaskExecutionReadiness(
  row?: QueueMessage | null,
): TaskExecutionReadinessSnapshot | null {
  const snapshot = row?.executionReadiness;
  return snapshot && typeof snapshot === "object" ? snapshot : null;
}

export function resolveTaskExecutionReadinessIndicator(
  row?: QueueMessage | null,
): TaskExecutionReadinessIndicator {
  const readiness = getTaskExecutionReadiness(row);
  if (!readiness) {
    return {
      text: "-",
      ready: false,
      manual: false,
      reason: null,
    };
  }

  switch (readiness.status) {
    case "ready":
    case "manual_ready":
      return {
        text: readiness.label || "可执行",
        type: "success",
        ready: true,
        manual: !!readiness.manual,
        reason: readiness.reason || null,
      };
    case "waiting":
      return {
        text: readiness.label || "待准备",
        type: "warning",
        ready: false,
        manual: false,
        reason: readiness.reason || null,
      };
    case "blocked":
    case "manual_blocked":
      return {
        text: readiness.label || "不可执行",
        type: "danger",
        ready: false,
        manual: !!readiness.manual,
        reason: readiness.reason || null,
      };
    default:
      return {
        text: readiness.label || "-",
        type: readiness.reason ? "info" : undefined,
        ready: false,
        manual: !!readiness.manual,
        reason: readiness.reason || null,
      };
  }
}
