import type { EcomCollectPlatformFormSpec } from "../types";

export const douyinShopPlatformFormSpec: EcomCollectPlatformFormSpec = {
  platform: "douyin_shop",
  title: "抖音店铺",
  description: "常见问题是登录态和风控，建议把平台逻辑独立维护。",
  taskNamePlaceholder: "例如：抖音店铺热门商品采集",
  keywordPlaceholder: "例如：手机壳",
  keywordsPlaceholder: "一行一个关键词，便于后续重放",
  targetUrlPlaceholder: "填写店铺页或商品详情页链接",
  extraJsonPlaceholder: '{\n  "entry": "shop"\n}',
  notes: ["如果当前机器没有稳定登录态，可先只保留平台配置，不强行执行。"],
};
