import type { WebsocketConnectionVO } from "@/api/system/websocket";

export type RuntimeConnectionSourceKey = "extension" | "admin" | "client" | "unknown";

export const resolveRuntimeConnectionSourceKey = (
  row?: Partial<WebsocketConnectionVO> | null,
): RuntimeConnectionSourceKey => {
  const source = String(row?.clientSource || row?.clientInfo?.source || "").trim();
  if (source === "yishe-extension") return "extension";
  if (source === "管理后台") return "admin";
  if (source === "客户端") return "client";
  return "unknown";
};

export const formatRuntimeConnectionSourceLabel = (row?: Partial<WebsocketConnectionVO> | null) => {
  switch (resolveRuntimeConnectionSourceKey(row)) {
    case "extension":
      return "浏览器插件";
    case "admin":
      return "管理后台";
    case "client":
      return "客户端";
    default:
      return row?.clientSource || row?.clientInfo?.source || "未知";
  }
};

export const getRuntimeConnectionSourceTagType = (row?: Partial<WebsocketConnectionVO> | null) => {
  switch (resolveRuntimeConnectionSourceKey(row)) {
    case "extension":
      return "success";
    case "admin":
      return "primary";
    case "client":
      return "warning";
    default:
      return "info";
  }
};

export const compareRuntimeConnections = (a: WebsocketConnectionVO, b: WebsocketConnectionVO) => {
  const aTime = a.connectedAt || a.lastOnlineAt || "";
  const bTime = b.connectedAt || b.lastOnlineAt || "";
  if (aTime !== bTime) {
    return aTime > bTime ? -1 : 1;
  }
  return String(a.id || "").localeCompare(String(b.id || ""));
};
