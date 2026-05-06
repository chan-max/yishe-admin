export const KUAISHOU_SHOP_PLATFORM_KEY = "kuaishou_shop";

export const KUAISHOU_SHOP_TOOLKIT_PLATFORM = {
  key: KUAISHOU_SHOP_PLATFORM_KEY,
  label: "快手小店",
  description: "快手小店登录检测与商家工作台入口",
  routePath: "/operation/toolkit/kuaishou-shop",
  workspaceDescription: "快手小店工具集",
  supportsStoredSessions: false,
  workspaceComponent: null,
} as const;
