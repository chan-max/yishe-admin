import type {
  EcomCollectRunRecord,
  EcomCollectRunResultPackage,
  EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
import { getRawPackage, getRawPackageRecords, getRawRecordsCount } from "../../shared";
import { pickFirstValue } from "./helpers";

export interface RunPackageInsightMetric {
  label: string;
  value: string;
  hint?: string;
}

export interface RunPackageFieldCoverage {
  key: string;
  label: string;
  coveredCount: number;
  total: number;
  ratio: number;
}

export interface RunPackageInsights {
  metrics: RunPackageInsightMetric[];
  dimensionTags: string[];
  aiSuggestions: string[];
  fieldCoverage: RunPackageFieldCoverage[];
  sampleKeywords: string[];
  topShops: string[];
  topBrands: string[];
  topDomains: string[];
  aiBrief: string;
}

const FIELD_PATHS = {
  title: [
    "detailData.title",
    "title",
    "listingData.title",
    "name",
    "productName",
    "pageTitle",
  ],
  sourceUrl: [
    "detailData.sourceUrl",
    "sourceUrl",
    "url",
    "originalSourceUrl",
    "listingData.sourceUrl",
  ],
  image: [
    "detailData.imageUrl",
    "imageUrl",
    "listingData.imageUrl",
    "imageUrls[0]",
    "detailData.imageUrls[0]",
    "listingData.imageUrls[0]",
  ],
  price: [
    "detailData.priceText",
    "priceText",
    "listingData.priceText",
    "price",
  ],
  shop: [
    "detailData.shopName",
    "shopName",
    "sellerName",
    "merchantName",
    "listingData.shopName",
  ],
  brand: [
    "detailData.brand",
    "brand",
    "manufacturer",
    "listingData.brand",
  ],
  keyword: [
    "keyword",
    "seedKeyword",
    "listingData.keyword",
    "query.keyword",
  ],
  rank: [
    "rank",
    "approxTraffic",
    "badgeText",
    "listingData.rank",
    "detailData.rank",
  ],
  rating: [
    "ratingText",
    "reviewCountText",
    "detailData.ratingText",
    "detailData.reviewCountText",
    "listingData.ratingText",
    "listingData.reviewCountText",
  ],
  detail: [
    "descriptionText",
    "summaryText",
    "detailData.descriptionText",
    "detailData.bulletPoints[0]",
    "detailData.specPairs[0].value",
  ],
} as const;

const COVERAGE_FIELDS: Array<{ key: string; label: string; paths: string[] }> = [
  { key: "title", label: "标题", paths: [...FIELD_PATHS.title] },
  { key: "sourceUrl", label: "来源链接", paths: [...FIELD_PATHS.sourceUrl] },
  { key: "image", label: "图片", paths: [...FIELD_PATHS.image] },
  { key: "price", label: "价格", paths: [...FIELD_PATHS.price] },
  { key: "shop", label: "店铺", paths: [...FIELD_PATHS.shop] },
  { key: "keyword", label: "关键词", paths: [...FIELD_PATHS.keyword] },
  { key: "rank", label: "排名/热度", paths: [...FIELD_PATHS.rank] },
  { key: "rating", label: "评分/评论", paths: [...FIELD_PATHS.rating] },
  { key: "detail", label: "详情摘要", paths: [...FIELD_PATHS.detail] },
];

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function appendUnique(target: string[], value: unknown, limit = 5) {
  const normalized = normalizeText(value);
  if (!normalized || target.includes(normalized) || target.length >= limit) {
    return;
  }
  target.push(normalized);
}

function toUniqueList(values: string[], limit = values.length) {
  return Array.from(new Set(values.filter(Boolean))).slice(0, limit);
}

function pickRecordText(record: EcomCollectRunRecord, paths: string[]) {
  const value = pickFirstValue(record, paths);
  if (Array.isArray(value)) {
    return normalizeText(value[0]);
  }
  return normalizeText(value);
}

function extractPriceNumbers(value: unknown) {
  const text = normalizeText(value);
  if (!text) {
    return [] as number[];
  }

  return Array.from(
    new Set(
      (text.match(/\d[\d,.]*/g) || [])
        .map((item) => {
          const normalized = item.replace(/,/g, "");
          const numberValue = Number(normalized);
          return Number.isFinite(numberValue) ? numberValue : null;
        })
        .filter((item): item is number => item !== null && item >= 0),
    ),
  );
}

function extractHostname(value: unknown) {
  const text = normalizeText(value);
  if (!text) {
    return "";
  }

  try {
    const url = new URL(text);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function formatPriceRange(values: number[]) {
  if (!values.length) {
    return "";
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (min === max) {
    return `${min}`;
  }

  return `${min} - ${max}`;
}

function buildFieldCoverage(records: EcomCollectRunRecord[]) {
  const total = records.length;
  if (!total) {
    return [] as RunPackageFieldCoverage[];
  }

  return COVERAGE_FIELDS.map((field) => {
    const coveredCount = records.filter((record) =>
      !!pickRecordText(record, field.paths),
    ).length;

    return {
      key: field.key,
      label: field.label,
      coveredCount,
      total,
      ratio: coveredCount / total,
    };
  }).filter((item) => item.coveredCount > 0);
}

function buildAiSuggestions(input: {
  dimensions: string[];
  recordsCount: number;
  pricedCount: number;
  uniqueKeywordCount: number;
  uniqueShopCount: number;
  uniqueBrandCount: number;
  trendSignalsCount: number;
  imageCount: number;
  detailCount: number;
}) {
  const suggestions: string[] = [];

  if (input.pricedCount >= 2) {
    suggestions.push("适合做价格带分层与高性价比筛选。");
  }
  if (input.uniqueKeywordCount >= 2) {
    suggestions.push("适合按关键词聚合，比较不同词下的商品密度与价格差异。");
  }
  if (input.uniqueShopCount >= 2) {
    suggestions.push("适合做店铺分布与头部卖家识别。");
  }
  if (input.uniqueBrandCount >= 2) {
    suggestions.push("适合做品牌对比和品牌价格带分析。");
  }
  if (input.trendSignalsCount > 0) {
    suggestions.push("适合做趋势热度、排序信号和时效性分析。");
  }
  if (input.imageCount >= 2) {
    suggestions.push("适合做商品主图理解、相似图聚类和图片素材提取。");
  }
  if (input.imageCount >= 2 && input.detailCount >= 2) {
    suggestions.push("适合做 POD 印花/图案分析，后续可接图案提取与裂变生成。");
  }
  if (!suggestions.length && input.recordsCount > 0) {
    suggestions.push("适合先做标题聚类、字段清洗和样本质量评估。");
  }

  return suggestions.slice(0, 4);
}

export function buildRunPackageInsights(
  row: EcomPlatformRawRecord,
): RunPackageInsights {
  const collectPackage = getRawPackage(row) as EcomCollectRunResultPackage;
  const records = getRawPackageRecords(row);
  const recordsCount = getRawRecordsCount(row);
  const priceNumbers: number[] = [];
  const sampleKeywords: string[] = [];
  const topShops: string[] = [];
  const topBrands: string[] = [];
  const topDomains: string[] = [];
  const sourceTypes = new Set<string>();
  const signalTypes = new Set<string>();
  const keywords = new Set<string>();
  const shops = new Set<string>();
  const brands = new Set<string>();
  const domains = new Set<string>();
  let pricedCount = 0;
  let trendSignalsCount = 0;
  let imageCount = 0;
  let detailCount = 0;

  records.forEach((item) => {
    const priceText = pickRecordText(item, [...FIELD_PATHS.price]);
    const priceValues = extractPriceNumbers(priceText);
    if (priceValues.length) {
      pricedCount += 1;
      priceNumbers.push(...priceValues);
    }

    const keyword = pickRecordText(item, [...FIELD_PATHS.keyword]);
    const shop = pickRecordText(item, [...FIELD_PATHS.shop]);
    const brand = pickRecordText(item, [...FIELD_PATHS.brand]);
    const sourceUrl = pickRecordText(item, [...FIELD_PATHS.sourceUrl]);
    const sourceType = normalizeText(item?.sourceType);
    const signalType = normalizeText(item?.signalType);
    const rankValue = pickRecordText(item, [...FIELD_PATHS.rank]);
    const imageValue = pickRecordText(item, [...FIELD_PATHS.image]);
    const detailValue = pickRecordText(item, [...FIELD_PATHS.detail]);

    if (keyword) {
      keywords.add(keyword);
      appendUnique(sampleKeywords, keyword);
    }
    if (shop) {
      shops.add(shop);
      appendUnique(topShops, shop);
    }
    if (brand) {
      brands.add(brand);
      appendUnique(topBrands, brand);
    }

    const hostname = extractHostname(sourceUrl);
    if (hostname) {
      domains.add(hostname);
      appendUnique(topDomains, hostname);
    }
    if (sourceType) {
      sourceTypes.add(sourceType);
    }
    if (signalType) {
      signalTypes.add(signalType);
    }
    if (signalType || rankValue) {
      trendSignalsCount += 1;
    }
    if (imageValue) {
      imageCount += 1;
    }
    if (detailValue) {
      detailCount += 1;
    }
  });

  const uniqueKeywordCount = keywords.size;
  const uniqueShopCount = shops.size;
  const uniqueBrandCount = brands.size;
  const uniqueDomainCount = domains.size;
  const fieldCoverage = buildFieldCoverage(records);
  const dimensions = toUniqueList(
    [
      priceNumbers.length ? "价格带" : "",
      uniqueKeywordCount ? "关键词聚合" : "",
      uniqueShopCount ? "店铺分布" : "",
      uniqueBrandCount ? "品牌对比" : "",
      uniqueDomainCount ? "来源域名分布" : "",
      trendSignalsCount ? "排名/热度信号" : "",
      imageCount ? "图片素材" : "",
      detailCount ? "详情文本" : "",
      fieldCoverage.some((item) => item.key === "rating")
        ? "评分/评论信号"
        : "",
      sourceTypes.size ? Array.from(sourceTypes).join(" / ") : "",
      signalTypes.size ? Array.from(signalTypes).join(" / ") : "",
    ],
    8,
  );
  const aiSuggestions = buildAiSuggestions({
    dimensions,
    recordsCount,
    pricedCount,
    uniqueKeywordCount,
    uniqueShopCount,
    uniqueBrandCount,
    trendSignalsCount,
    imageCount,
    detailCount,
  });

  const metrics: RunPackageInsightMetric[] = [
    {
      label: "价格记录",
      value: recordsCount ? `${pricedCount}/${recordsCount}` : "0/0",
      hint: priceNumbers.length ? `价格区间 ${formatPriceRange(priceNumbers)}` : "",
    },
    {
      label: "唯一店铺",
      value: `${uniqueShopCount}`,
      hint: topShops.length ? topShops.join("、") : "",
    },
    {
      label: "唯一关键词",
      value: `${uniqueKeywordCount}`,
      hint: sampleKeywords.length ? sampleKeywords.join("、") : "",
    },
    {
      label: "来源域名",
      value: `${uniqueDomainCount}`,
      hint: topDomains.length ? topDomains.join("、") : "",
    },
    {
      label: "图片记录",
      value: recordsCount ? `${imageCount}/${recordsCount}` : "0/0",
      hint: imageCount >= 2 ? "可继续做视觉类 AI 分析" : "",
    },
  ].filter((item) => item.value !== "0");

  const aiBriefParts = [
    recordsCount ? `本次结果包包含 ${recordsCount} 条记录` : "",
    priceNumbers.length ? `可形成价格区间 ${formatPriceRange(priceNumbers)}` : "",
    uniqueKeywordCount ? `包含 ${uniqueKeywordCount} 个关键词样本` : "",
    uniqueShopCount ? `覆盖 ${uniqueShopCount} 个店铺` : "",
    uniqueBrandCount ? `涉及 ${uniqueBrandCount} 个品牌` : "",
    imageCount ? `其中 ${imageCount} 条记录带图片` : "",
    detailCount ? `其中 ${detailCount} 条记录带详情摘要` : "",
    dimensions.length ? `适合继续做 ${dimensions.join("、")} 分析` : "",
  ].filter(Boolean);

  return {
    metrics,
    dimensionTags: dimensions,
    aiSuggestions,
    fieldCoverage,
    sampleKeywords,
    topShops,
    topBrands,
    topDomains,
    aiBrief:
      aiBriefParts.join("，") ||
      normalizeText(collectPackage?.summary?.message) ||
      normalizeText(collectPackage?.message),
  };
}
