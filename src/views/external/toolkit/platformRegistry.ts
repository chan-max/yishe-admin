import type { Component } from "vue";
import { ALIBABA_1688_TOOLKIT_PLATFORM } from "./alibaba-1688/platform";
import { DOUDIAN_TOOLKIT_PLATFORM } from "./doudian/platform";
import { KUAISHOU_SHOP_TOOLKIT_PLATFORM } from "./kuaishou-shop/platform";
import { PDD_TOOLKIT_PLATFORM } from "./pdd/platform";
import { QIANNIU_TOOLKIT_PLATFORM } from "./qianniu/platform";
import { TEMU_TOOLKIT_PLATFORM } from "./temu/platform";

export interface ToolkitPlatformDefinition {
  key: string;
  label: string;
  description: string;
  routePath?: string;
  workspaceTitle?: string;
  workspaceDescription?: string;
  workspaceContextComponent?: Component | null;
  supportsStoredSessions?: boolean;
  workspaceComponent?: Component | null;
}

export const TOOLKIT_PLATFORM_REGISTRY: ToolkitPlatformDefinition[] = [
  TEMU_TOOLKIT_PLATFORM,
  DOUDIAN_TOOLKIT_PLATFORM,
  PDD_TOOLKIT_PLATFORM,
  KUAISHOU_SHOP_TOOLKIT_PLATFORM,
  QIANNIU_TOOLKIT_PLATFORM,
  ALIBABA_1688_TOOLKIT_PLATFORM,
];
