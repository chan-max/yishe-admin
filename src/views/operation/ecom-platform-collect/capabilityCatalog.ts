import type {
  EcomCollectOutputFieldSchema,
  EcomCollectTaskTypeSchema,
} from "@/api/operation/ecomPlatformCollect";
import {
  getCapabilityAccessLabel,
  getCapabilityAccessTagType,
  getCapabilityStatusLabel,
  getCapabilityStatusTagType,
  getVerificationLabel,
} from "./shared";

export interface CapabilityTag {
  label: string;
  type: "success" | "warning" | "danger" | "info";
}

export interface TaskTypeCapabilityDigest {
  availabilityTag: CapabilityTag;
  verificationTag: CapabilityTag;
  accessTags: CapabilityTag[];
  outputTags: string[];
  analysisHints: string[];
  podTag: CapabilityTag;
  notes: string[];
  useSuggestion: string;
  parameterCount: number;
  recordFieldCount: number;
  packageFieldCount: number;
}

const normalizeText = (value: unknown) => String(value || "").trim();
const normalizeKey = (value: unknown) =>
  normalizeText(value)
    .replace(/\[\]/g, "")
    .toLowerCase();

const uniqueTexts = (values: unknown[]) =>
  Array.from(
    new Set(
      values
        .map((item) => normalizeText(item))
        .filter(Boolean),
    ),
  );

const dedupeFields = (fields?: EcomCollectOutputFieldSchema[] | null) =>
  Array.from(
    new Map(
      (Array.isArray(fields) ? fields : [])
        .filter((field) => normalizeText(field?.key))
        .map((field) => [normalizeText(field.key), field]),
    ).values(),
  );

const getVerificationTagType = (
  value?: string | null,
): "success" | "warning" | "danger" | "info" => {
  const map: Record<string, "success" | "warning" | "danger" | "info"> = {
    verified: "success",
    heuristic: "warning",
    blocked: "danger",
    planned: "info",
    unsupported: "info",
  };
  return map[normalizeText(value)] || "info";
};

export const getTaskTypeUseSuggestion = (taskType?: EcomCollectTaskTypeSchema | null) => {
  if (!taskType || taskType.runnable === false) {
    return "当前不建议直接投入生产使用。";
  }

  const availability = normalizeText(taskType.availability).toLowerCase();
  const accessText = [
    taskType.access?.loginLabel || getCapabilityAccessLabel("login", taskType.access?.login),
    taskType.access?.captchaLabel ||
      getCapabilityAccessLabel("captcha", taskType.access?.captcha),
    taskType.access?.antiBotLabel ||
      getCapabilityAccessLabel("antiBot", taskType.access?.antiBot),
  ]
    .filter(Boolean)
    .join(" / ");

  if (
    availability === "available" &&
    !accessText.includes("验证码") &&
    !accessText.includes("需要登录")
  ) {
    return "适合直接进入回归和业务联调。";
  }

  if (
    availability === "partial" ||
    availability === "heuristic" ||
    accessText.includes("验证码") ||
    accessText.includes("建议登录")
  ) {
    return "建议小批量验证后使用，更适合人工值守。";
  }

  return "可继续迭代，但需要结合真实环境反复验证。";
};

export const buildTaskTypeCapabilityDigest = (
  taskType?: EcomCollectTaskTypeSchema | null,
): TaskTypeCapabilityDigest => {
  const schema = taskType || null;
  const recordFields = dedupeFields(schema?.docs?.recordFields);
  const packageFields = dedupeFields(schema?.docs?.packageFields);
  const foundKeys = new Set(recordFields.map((item) => normalizeKey(item.key)));
  const hasAny = (...keys: string[]) =>
    keys.some((key) => foundKeys.has(normalizeKey(key)));

  const accessTags: CapabilityTag[] = [];
  const access = schema?.access;
  if (access?.login) {
    accessTags.push({
      label: access.loginLabel || getCapabilityAccessLabel("login", access.login),
      type: getCapabilityAccessTagType("login", access.login),
    });
  }
  if (access?.captcha) {
    accessTags.push({
      label: access.captchaLabel || getCapabilityAccessLabel("captcha", access.captcha),
      type: getCapabilityAccessTagType("captcha", access.captcha),
    });
  }
  if (access?.antiBot) {
    accessTags.push({
      label: access.antiBotLabel || getCapabilityAccessLabel("antiBot", access.antiBot),
      type: getCapabilityAccessTagType("antiBot", access.antiBot),
    });
  }

  const outputTags = uniqueTexts([
    hasAny("title") ? "标题" : "",
    hasAny("imageUrl", "imageUrls") ? "图片" : "",
    hasAny("priceText", "originalPriceText") ? "价格" : "",
    hasAny("shopName", "sellerName") ? "店铺/卖家" : "",
    hasAny("brand") ? "品牌" : "",
    hasAny("ratingText", "reviewCountText") ? "评分/评论" : "",
    hasAny("descriptionText", "bulletPoints", "specPairs", "detailData")
      ? "详情内容"
      : "",
    hasAny(
      "keyword",
      "seedKeyword",
      "signalType",
      "approxTraffic",
      "rank",
      "newsItems",
      "newsTitles",
    )
      ? "趋势/关键词信号"
      : "",
  ]);

  const analysisHints = uniqueTexts([
    hasAny("title", "priceText")
      ? "可做商品初筛、价格带分层和跨平台价格对比。"
      : "",
    hasAny("shopName", "brand")
      ? "可做店铺/品牌分布分析，识别头部卖家和品牌集中度。"
      : "",
    hasAny("descriptionText", "bulletPoints", "specPairs", "detailData")
      ? "可做卖点抽取、规格归一化和 AI 结构化摘要。"
      : "",
    hasAny("keyword", "seedKeyword", "signalType", "approxTraffic", "rank")
      ? "可做关键词趋势、热度信号和多平台趋势对比。"
      : "",
    hasAny("imageUrl", "imageUrls") && hasAny("title", "descriptionText", "detailData")
      ? "可作为 POD 印花/图案分析输入，后续可接图案提取、元素拆解和裂变生成。"
      : "",
    hasAny("imageUrl", "imageUrls")
      ? "可做商品主图理解、相似图聚类和图片去重。"
      : "",
  ]);

  const podTag =
    !schema || schema.runnable === false
      ? {
          label: "当前不建议做 POD 图案分析",
          type: "danger" as const,
        }
      : hasAny("imageUrl", "imageUrls") && hasAny("title", "descriptionText", "detailData")
        ? {
            label: "支持 POD 图案分析输入",
            type: "success" as const,
          }
        : hasAny("imageUrl", "imageUrls")
          ? {
              label: "仅适合图片初筛",
              type: "warning" as const,
            }
          : {
              label: "当前缺少稳定图片字段",
              type: "info" as const,
            };

  return {
    availabilityTag: {
      label:
        schema?.availabilityLabel || getCapabilityStatusLabel(schema?.availability),
      type: getCapabilityStatusTagType(schema?.availability),
    },
    verificationTag: {
      label: schema?.verificationLabel || getVerificationLabel(schema?.verification),
      type: getVerificationTagType(schema?.verification),
    },
    accessTags,
    outputTags,
    analysisHints,
    podTag,
    notes: uniqueTexts([
      schema?.docs?.overview,
      ...(Array.isArray(schema?.docs?.notes) ? schema.docs.notes : []),
      ...(Array.isArray(schema?.access?.notes) ? schema.access.notes : []),
      schema?.reason,
    ]),
    useSuggestion: getTaskTypeUseSuggestion(schema),
    parameterCount: Array.isArray(schema?.fields) ? schema.fields.length : 0,
    recordFieldCount: recordFields.length,
    packageFieldCount: packageFields.length,
  };
};

export const buildCapabilitySearchText = (taskType?: EcomCollectTaskTypeSchema | null) => {
  const schema = taskType || null;
  const fields = [
    ...(Array.isArray(schema?.fields) ? schema.fields : []),
    ...dedupeFields(schema?.docs?.recordFields),
    ...dedupeFields(schema?.docs?.packageFields),
  ];

  return [
    schema?.value,
    schema?.label,
    schema?.description,
    schema?.docs?.overview,
    schema?.reason,
    ...(Array.isArray(schema?.docs?.notes) ? schema.docs.notes : []),
    ...fields.flatMap((item) => [item.key, item.label, item.description]),
  ]
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
};
