import type { EcomCollectPlatformFormSpec } from "../types";

export const jdPlatformFormSpec: EcomCollectPlatformFormSpec = {
  platform: "jd",
  title: "京东",
  description: "当前常见问题是验证码，适合先保留平台配置能力。",
  taskNamePlaceholder: "例如：京东搜索采集",
  keywordPlaceholder: "例如：蓝牙音箱",
  keywordsPlaceholder: "每行一个关键词，方便回放失败样本",
  targetUrlPlaceholder: "填写京东商品详情页或店铺页链接",
  extraJsonPlaceholder: '{\n  "pageStrategy": "light"\n}',
  notes: ["如果命中验证码，不要卡死当前机器，直接标记失败或跳过。"],
};
