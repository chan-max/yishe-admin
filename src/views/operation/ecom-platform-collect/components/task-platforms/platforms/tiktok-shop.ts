import type { EcomCollectPlatformFormSpec } from "../types";

export const tiktokShopPlatformFormSpec: EcomCollectPlatformFormSpec = {
  platform: "tiktok_shop",
  title: "TikTok Shop",
  description: "平台波动较大，适合通过独立平台模块继续维护。",
  taskNamePlaceholder: "例如：TikTok Shop 热门商品采集",
  keywordPlaceholder: "例如：pet supplies",
  keywordsPlaceholder: "可先少量关键词试跑，观察是否触发风控",
  targetUrlPlaceholder: "填写 TikTok Shop 商品或店铺链接",
  extraJsonPlaceholder: '{\n  "market": "US"\n}',
  notes: ["如遇验证码或登录校验，建议暂时跳过该任务并记录风险类型。"],
};
