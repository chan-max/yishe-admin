import { markRaw } from "vue";
import TemuWorkspace from "./TemuWorkspace.vue";
import TemuWorkspaceContext from "./TemuWorkspaceContext.vue";

export const TEMU_PLATFORM_KEY = "temu";
export const TEMU_SESSION_TOOL_KEY = "temu-session-acquire";
export const TEMU_SESSION_RESTORE_TOOL_KEY = "temu-session-restore";

export const TEMU_TOOLKIT_PLATFORM = {
  key: TEMU_PLATFORM_KEY,
  label: "Temu",
  description: "Temu 业务工具、会话管理与后续服务端能力入口",
  routePath: "/operation/toolkit/temu",
  workspaceDescription: "",
  workspaceContextComponent: markRaw(TemuWorkspaceContext),
  supportsStoredSessions: true,
  workspaceComponent: markRaw(TemuWorkspace),
} as const;
