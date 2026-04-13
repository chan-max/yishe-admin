import type { Component } from "vue";
import { TEMU_PLATFORM_KEY, TEMU_TOOLKIT_PLATFORM } from "./temu/platform";

export interface ToolkitPlatformDefinition {
  key: string;
  label: string;
  description: string;
  workspaceTitle?: string;
  workspaceDescription?: string;
  workspaceContextComponent?: Component | null;
  supportsStoredSessions?: boolean;
  workspaceComponent?: Component | null;
}

export const TOOLKIT_PLATFORM_REGISTRY: ToolkitPlatformDefinition[] = [TEMU_TOOLKIT_PLATFORM];

export const DEFAULT_TOOLKIT_PLATFORM_KEY = TEMU_PLATFORM_KEY;
