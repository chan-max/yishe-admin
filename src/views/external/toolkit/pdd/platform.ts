export const PDD_PLATFORM_KEY = "pdd";
export const PDD_SESSION_TOOL_KEY = "pdd-session-acquire";

export const PDD_TOOLKIT_PLATFORM = {
  key: PDD_PLATFORM_KEY,
  label: "拼多多",
  description: "拼多多登录检测、会话采集与商家后台入口",
  routePath: "/operation/toolkit/pdd",
  workspaceDescription: "拼多多工具集",
  supportsStoredSessions: true,
  workspaceComponent: null,
} as const;
