import type { EcomCollectPlatformFormSpec } from "../types";

export const sheinPlatformFormSpec: EcomCollectPlatformFormSpec = {
  platform: "shein",
  title: "SHEIN",
  description: "当前更适合商品详情场景，搜索和店铺页存在验证码风险。",
  taskNamePlaceholder: "例如：SHEIN 商品详情采集",
  keywordPlaceholder: "例如：phone case",
  keywordsPlaceholder: "如需搜索场景可先少量关键词试跑",
  targetUrlPlaceholder: "填写 SHEIN 商品详情页链接",
  extraJsonPlaceholder: '{\n  "captureMode": "detail-first"\n}',
  notes: [
    "如果出现验证码或风控页，建议先跳过，不要长期卡住单个平台。",
    "详情页通常能拿到更多图片和页面标题信息。",
  ],
  sceneNotes: {
    search: ["搜索页存在验证码风险，适合作为试验能力，不建议当前主推。"],
    product_detail: ["详情页是当前优先推荐场景。"],
    shop_hot_products: ["店铺热门商品页容易受到风控，建议后续单独调优。"],
  },
};
