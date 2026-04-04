import type { EcomCollectPlatformFormSpec } from "../types";

export const taobaoPlatformFormSpec: EcomCollectPlatformFormSpec = {
  platform: "taobao",
  title: "淘宝",
  description: "页面结构经常调整，建议单独维护选择器和场景规则。",
  taskNamePlaceholder: "例如：淘宝搜索采集",
  keywordPlaceholder: "例如：耳机",
  keywordsPlaceholder: "建议按类目词拆分，避免单次任务过大",
  targetUrlPlaceholder: "填写淘宝商品详情页或店铺页链接",
  extraJsonPlaceholder: '{\n  "sort": "sale-desc"\n}',
  notes: ["如页面跳登录或出现异常跳转，可直接标记该任务为跳过。"],
};
