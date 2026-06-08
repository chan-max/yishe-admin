export const DOUDIAN_PLATFORM_KEY = "doudian";
export const DOUDIAN_SESSION_TOOL_KEY = "doudian-session-acquire";

export const DOUDIAN_TOOLKIT_PLATFORM = {
  key: DOUDIAN_PLATFORM_KEY,
  label: "抖店",
  description: "抖店登录检测、会话采集与商家工作台入口",
  routePath: "/operation/toolkit/doudian",
  workspaceDescription: "抖店工具集",
  supportsStoredSessions: true,
  workspaceComponent: null,
} as const;
