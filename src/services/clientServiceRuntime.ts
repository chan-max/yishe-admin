import type { WebsocketConnectionVO } from "@/api/system/websocket";

export type ClientServiceRuntimeLike = Record<string, any> | null | undefined;

export type ClientServiceSummary = "available" | "offline";

export function getClientServiceRuntimeSafe(
  runtime?: ClientServiceRuntimeLike,
): Record<string, any> {
  return (runtime || {}) as Record<string, any>;
}

export function hasClientServiceRuntime(runtime?: ClientServiceRuntimeLike): boolean {
  return Object.keys(getClientServiceRuntimeSafe(runtime)).length > 0;
}

export function isClientServiceRuntimeAvailable(runtime?: ClientServiceRuntimeLike): boolean {
  return !!getClientServiceRuntimeSafe(runtime).available;
}

export function isClientServiceRuntimeBusy(runtime?: ClientServiceRuntimeLike): boolean {
  const safeRuntime = getClientServiceRuntimeSafe(runtime);
  const activeJobsCount = Number(
    safeRuntime.details?.activeJobsCount ?? safeRuntime.details?.queueCount ?? 0,
  );
  return !!(
    safeRuntime.busy ||
    safeRuntime.state === "busy" ||
    safeRuntime.currentTaskId ||
    safeRuntime.details?.currentExecution?.running ||
    (Number.isFinite(activeJobsCount) && activeJobsCount > 0)
  );
}

export function isClientServiceNodeAvailable(
  client?: Pick<WebsocketConnectionVO, "isOnline"> | null,
  runtime?: ClientServiceRuntimeLike,
): boolean {
  return !!(
    client?.isOnline &&
    isClientServiceRuntimeAvailable(runtime) &&
    !isClientServiceRuntimeBusy(runtime)
  );
}

export function resolveClientServiceSummary(
  runtime?: ClientServiceRuntimeLike,
): ClientServiceSummary {
  const safeRuntime = getClientServiceRuntimeSafe(runtime);

  if (isClientServiceRuntimeAvailable(safeRuntime)) {
    return "available";
  }

  return "offline";
}
