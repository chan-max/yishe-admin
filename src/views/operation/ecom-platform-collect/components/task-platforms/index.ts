import { aliexpressPlatformFormSpec } from "./platforms/aliexpress";
import { amazonPlatformFormSpec } from "./platforms/amazon";
import { douyinShopPlatformFormSpec } from "./platforms/douyin-shop";
import { jdPlatformFormSpec } from "./platforms/jd";
import { sheinPlatformFormSpec } from "./platforms/shein";
import { taobaoPlatformFormSpec } from "./platforms/taobao";
import { temuPlatformFormSpec } from "./platforms/temu";
import { tiktokShopPlatformFormSpec } from "./platforms/tiktok-shop";
import type { EcomCollectPlatformFormSpec } from "./types";

export const ECOM_COLLECT_PLATFORM_FORM_SPECS: Record<
  string,
  EcomCollectPlatformFormSpec
> = {
  amazon: amazonPlatformFormSpec,
  aliexpress: aliexpressPlatformFormSpec,
  shein: sheinPlatformFormSpec,
  temu: temuPlatformFormSpec,
  tiktok_shop: tiktokShopPlatformFormSpec,
  douyin_shop: douyinShopPlatformFormSpec,
  taobao: taobaoPlatformFormSpec,
  jd: jdPlatformFormSpec,
};

export const getEcomCollectPlatformFormSpec = (platform?: string | null) => {
  return ECOM_COLLECT_PLATFORM_FORM_SPECS[String(platform || "").trim()] || null;
};

export type { EcomCollectPlatformFormSpec, EcomCollectSceneKey } from "./types";
