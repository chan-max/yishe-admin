import type { EcomCollectPlatformFormSpec } from "../types";

export const amazonPlatformFormSpec: EcomCollectPlatformFormSpec = {
  platform: "amazon",
  title: "Amazon",
  description: "优先支持搜索、商品详情和店铺热门商品，字段结构相对稳定。",
  taskNamePlaceholder: "例如：Amazon 无线耳机搜索采集",
  keywordPlaceholder: "例如：wireless earbuds",
  keywordsPlaceholder: "一行一个关键词，适合分批跑类目词",
  targetUrlPlaceholder:
    "填写商品详情页或 Best Sellers / 店铺热门商品页链接",
  extraJsonPlaceholder: '{\n  "sort": "sales"\n}',
  notes: [
    "推荐优先作为首批稳定平台使用。",
    "搜索场景建议配合关键词与最大记录数控制采集量。",
  ],
  sceneNotes: {
    search: ["搜索结果通常可直接拿到标题、图片、评分标签等轻结构数据。"],
    product_detail: ["详情页更适合补商品图片、规格和描述。"],
    shop_hot_products: ["店铺热门商品页建议直接提供目标页链接，减少跳转。"],
  },
};
