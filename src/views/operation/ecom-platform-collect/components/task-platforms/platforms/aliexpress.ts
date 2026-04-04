import type { EcomCollectPlatformFormSpec } from "../types";

export const aliexpressPlatformFormSpec: EcomCollectPlatformFormSpec = {
  platform: "aliexpress",
  title: "AliExpress",
  description: "搜索场景已有真实样本，可先作为跨境平台的稳定入口。",
  taskNamePlaceholder: "例如：AliExpress 手机壳搜索采集",
  keywordPlaceholder: "例如：phone case",
  keywordsPlaceholder: "一行一个关键词，可按细分类目拆分",
  targetUrlPlaceholder: "填写商品详情页或店铺页链接",
  extraJsonPlaceholder: '{\n  "sort": "orders"\n}',
  notes: [
    "当前数据库已经有 AliExpress 搜索样本，可直接对照原始数据。",
    "搜索场景比详情/店铺场景更适合作为第一批对外能力。",
  ],
  sceneNotes: {
    search: ["常见字段有标题、价格、原始来源链接、卡片摘要。"],
    product_detail: ["若页面频繁跳国家站点，可在后续单独补平台逻辑。"],
    shop_hot_products: ["店铺页建议手动确认目标链接是否能稳定打开。"],
  },
};
