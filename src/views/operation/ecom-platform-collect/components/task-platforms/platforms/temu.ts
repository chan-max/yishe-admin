import type { EcomCollectPlatformFormSpec } from "../types";

export const temuPlatformFormSpec: EcomCollectPlatformFormSpec = {
  platform: "temu",
  title: "Temu",
  description: "页面风控较重，建议先保留平台入口，后续逐步补自动化细节。",
  taskNamePlaceholder: "例如：Temu 搜索采集",
  keywordPlaceholder: "例如：home decor",
  keywordsPlaceholder: "按关键词拆分任务，便于失败时回溯",
  targetUrlPlaceholder: "填写商品或店铺目标链接",
  extraJsonPlaceholder: '{\n  "region": "us"\n}',
  notes: ["遇到登录或风控拦截时，优先记录问题并切换到下个平台。"],
};
