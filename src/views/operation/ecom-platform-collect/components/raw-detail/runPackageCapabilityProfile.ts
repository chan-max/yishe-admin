import type { EcomCollectTaskTypeSchema } from "@/api/operation/ecomPlatformCollect";
import {
  getCapabilityAccessLabel,
  getCapabilityAccessTagType,
  getCapabilityStatusLabel,
  getCapabilityStatusTagType,
  getVerificationLabel,
} from "../../shared";
import type { RunPackageSchemaReview } from "./runPackageSchemaReview";

export interface RunPackageCapabilityTag {
  label: string;
  type: "success" | "warning" | "danger" | "info";
}

export interface RunPackageCapabilityProfile {
  summary: string;
  availabilityTag: RunPackageCapabilityTag;
  verificationTag: RunPackageCapabilityTag;
  accessTags: RunPackageCapabilityTag[];
  outputTags: string[];
  analysisHints: string[];
  podTag: RunPackageCapabilityTag | null;
  notes: string[];
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

export function buildRunPackageCapabilityProfile(params: {
  taskTypeSchema?: EcomCollectTaskTypeSchema | null;
  schemaReview: RunPackageSchemaReview;
}): RunPackageCapabilityProfile {
  const taskTypeSchema = params.taskTypeSchema || null;
  const schemaReview = params.schemaReview;
  const foundKeys = new Set(
    schemaReview.recordFields
      .filter((item) => item.found)
      .map((item) => normalizeKey(item.key)),
  );
  const coreFields = schemaReview.recordFields.filter(
    (item) => normalizeText(item.stability) === "core",
  );
  const coreHits = coreFields.filter((item) => item.found).length;
  const totalFields = schemaReview.recordFields.length;

  const hasAny = (...keys: string[]) =>
    keys.some((key) => foundKeys.has(normalizeKey(key)));

  const accessTags: RunPackageCapabilityTag[] = [];
  const access = taskTypeSchema?.access;
  if (access?.login) {
    accessTags.push({
      label: getCapabilityAccessLabel("login", access.login),
      type: getCapabilityAccessTagType("login", access.login),
    });
  }
  if (access?.captcha) {
    accessTags.push({
      label: getCapabilityAccessLabel("captcha", access.captcha),
      type: getCapabilityAccessTagType("captcha", access.captcha),
    });
  }
  if (access?.antiBot) {
    accessTags.push({
      label: getCapabilityAccessLabel("antiBot", access.antiBot),
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
    !taskTypeSchema || taskTypeSchema.runnable === false
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

  const notes = uniqueTexts([
    taskTypeSchema?.docs?.overview,
    ...(Array.isArray(taskTypeSchema?.docs?.notes) ? taskTypeSchema.docs.notes : []),
    ...(Array.isArray(taskTypeSchema?.access?.notes) ? taskTypeSchema.access.notes : []),
    taskTypeSchema?.reason,
  ]);

  const summaryParts = [
    totalFields ? `已声明 ${totalFields} 个 records 字段` : "",
    coreFields.length ? `核心字段 ${coreHits}/${coreFields.length}` : "",
    schemaReview.undocumentedRecordFields.length
      ? `实际新增字段 ${schemaReview.undocumentedRecordFields.length} 个`
      : "",
  ].filter(Boolean);

  return {
    summary: summaryParts.join("，") || "当前 taskType 未声明稳定字段。",
    availabilityTag: {
      label:
        taskTypeSchema?.availabilityLabel ||
        getCapabilityStatusLabel(taskTypeSchema?.availability),
      type: getCapabilityStatusTagType(taskTypeSchema?.availability),
    },
    verificationTag: {
      label:
        taskTypeSchema?.verificationLabel ||
        getVerificationLabel(taskTypeSchema?.verification),
      type: getVerificationTagType(taskTypeSchema?.verification),
    },
    accessTags,
    outputTags,
    analysisHints,
    podTag,
    notes,
  };
}
