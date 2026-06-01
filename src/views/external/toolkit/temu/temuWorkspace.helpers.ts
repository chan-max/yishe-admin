import type { TemuActionResponse, TemuCatalogAction } from "@/api/external/toolkit/temu";
import type {
  TemuActionField,
  TemuFeedbackNotice,
  TemuFormSeedAction,
  TemuInsightCard,
} from "./temuWorkspace.shared";

export const asPlainObject = (value: any): Record<string, any> =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const asArray = <T = any>(value: any): T[] => (Array.isArray(value) ? value : []);

export const countObjectKeys = (value: any) => Object.keys(asPlainObject(value)).length;

export const stringifyJson = (value: any) => {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value ?? "");
  }
};

export type TemuWorkspaceAvailabilityState =
  | "missing"
  | "checking"
  | "expired"
  | "incomplete"
  | "pending"
  | "limited"
  | "ready";

export interface TemuWorkspaceAvailabilitySummary {
  state: TemuWorkspaceAvailabilityState;
  tone: "success" | "warning" | "danger" | "muted";
  label: string;
  detail: string;
  accountText: string;
  mallText: string;
  mallId: string;
  identityText: string;
  cookieSummary: string;
  validationStatus: string;
  validationLabel: string;
  userInfoStatus: string;
  userInfoLabel: string;
  hasUsableSession: boolean;
  hasGlobalCookie: boolean;
  hasRegionalCookies: boolean;
  hasIdentity: boolean;
  hasMall: boolean;
  canUse: boolean;
  shouldAutoValidate: boolean;
}

export const resolveTemuValidationLabel = (validation?: Record<string, any>) => {
  const status = String(validation?.status || "").trim();
  if (status === "valid") return "有效";
  if (status === "invalid") return "失效";
  if (status === "incomplete") return "不完整";
  if (status === "fresh") return "待校验";
  if (status === "unsupported") return "暂不支持";
  return "未校验";
};

export const resolveTemuValidationTagType = (validation?: Record<string, any>) => {
  const status = String(validation?.status || "").trim();
  if (status === "valid") return "success";
  if (status === "invalid") return "danger";
  if (status === "incomplete") return "warning";
  if (status === "fresh") return "warning";
  return "info";
};

export const resolveTemuUserInfoLabel = (userInfoValue?: Record<string, any>) => {
  const status = String(userInfoValue?.status || "").trim();
  if (status === "success") return "已获取";
  if (status === "failed") return "获取失败";
  return "未获取";
};

const buildTemuAccountText = (
  userInfo: Record<string, any>,
  record: Record<string, any>,
  fallbackAccountText = "",
) => {
  const accountId = String(
    userInfo.accountId || record.accountId || fallbackAccountText || "",
  ).trim();
  const accountType = String(userInfo.accountType || record.accountType || "").trim();
  return [accountId, accountType].filter(Boolean).join(" / ") || "-";
};

const buildTemuIdentityText = (accountText: string, mallText: string) => {
  const parts = [
    accountText && accountText !== "-" ? accountText : "",
    mallText && mallText !== "未设置" ? mallText : "",
  ].filter(Boolean);

  return parts.join(" · ") || "身份信息待补全";
};

export const resolveTemuWorkspaceAvailability = (
  sessionRecord?: Record<string, any> | null,
  options: {
    platformAccountText?: string;
    isValidating?: boolean;
  } = {},
): TemuWorkspaceAvailabilitySummary => {
  const record = asPlainObject(sessionRecord);
  const session = asPlainObject(record.session);
  const validation = asPlainObject(record.validation);
  const userInfo = asPlainObject(record.userInfo);
  const globalCookieCount = countObjectKeys(session?.global?.cookies);
  const usCookieCount = countObjectKeys(session?.us?.cookies);
  const euCookieCount = countObjectKeys(session?.eu?.cookies);
  const hasGlobalCookie = globalCookieCount > 0;
  const hasRegionalCookies = usCookieCount > 0 && euCookieCount > 0;
  const hasUsableSession = hasGlobalCookie;
  const validationStatus = String(validation.status || "").trim();
  const validationLabel = resolveTemuValidationLabel(validation);
  const userInfoStatus = String(userInfo.status || "").trim() || "missing";
  const userInfoLabel = resolveTemuUserInfoLabel(userInfo);
  const accountText = buildTemuAccountText(
    userInfo,
    record,
    String(options.platformAccountText || "").trim(),
  );
  const mallId = String(userInfo.mallId || record.mallId || "").trim();
  const mallName = String(userInfo.mallName || record.mallName || "").trim();
  const mallText = mallName || mallId || "未设置";
  const identityText = buildTemuIdentityText(accountText, mallText);
  const cookieSummary = `G${globalCookieCount} / U${usCookieCount} / E${euCookieCount}`;
  const hasIdentity = userInfoStatus === "success" || accountText !== "-";
  const hasMall = !!mallId;
  const missingInfoTexts = [
    hasIdentity ? "" : "账号",
    hasMall ? "" : "店铺",
    userInfoStatus === "failed" ? "身份同步" : "",
  ].filter(Boolean);
  const missingRegions = [usCookieCount ? "" : "美区", euCookieCount ? "" : "欧区"].filter(Boolean);
  const shouldAutoValidate =
    hasUsableSession &&
    !options.isValidating &&
    !["valid", "invalid", "unsupported"].includes(validationStatus);

  if (options.isValidating && hasUsableSession) {
    return {
      state: "checking",
      tone: "warning",
      label: "校验中",
      detail: "正在确认当前环境是否可用，请稍候。",
      accountText,
      mallText,
      mallId,
      identityText,
      cookieSummary,
      validationStatus,
      validationLabel,
      userInfoStatus,
      userInfoLabel,
      hasUsableSession,
      hasGlobalCookie,
      hasRegionalCookies,
      hasIdentity,
      hasMall,
      canUse: false,
      shouldAutoValidate,
    };
  }

  if (!hasUsableSession) {
    return {
      state: "missing",
      tone: "danger",
      label: "不可用",
      detail: "当前环境还没有可用会话，请先采集 Temu 会话。",
      accountText,
      mallText,
      mallId,
      identityText,
      cookieSummary,
      validationStatus,
      validationLabel,
      userInfoStatus,
      userInfoLabel,
      hasUsableSession,
      hasGlobalCookie,
      hasRegionalCookies,
      hasIdentity,
      hasMall,
      canUse: false,
      shouldAutoValidate,
    };
  }

  if (validationStatus === "invalid") {
    return {
      state: "expired",
      tone: "danger",
      label: "已过期",
      detail: String(validation.message || "当前会话已失效，建议重新采集。"),
      accountText,
      mallText,
      mallId,
      identityText,
      cookieSummary,
      validationStatus,
      validationLabel,
      userInfoStatus,
      userInfoLabel,
      hasUsableSession,
      hasGlobalCookie,
      hasRegionalCookies,
      hasIdentity,
      hasMall,
      canUse: false,
      shouldAutoValidate,
    };
  }

  if (validationStatus === "incomplete") {
    return {
      state: "incomplete",
      tone: "warning",
      label: "需重采",
      detail: String(
        validation.message || "当前会话不是完整采集结果，请重新执行 Temu 全量采集。",
      ),
      accountText,
      mallText,
      mallId,
      identityText,
      cookieSummary,
      validationStatus,
      validationLabel,
      userInfoStatus,
      userInfoLabel,
      hasUsableSession,
      hasGlobalCookie,
      hasRegionalCookies,
      hasIdentity,
      hasMall,
      canUse: false,
      shouldAutoValidate,
    };
  }

  if (userInfoStatus === "failed" || missingInfoTexts.length) {
    return {
      state: "incomplete",
      tone: "warning",
      label: "信息待补全",
      detail: missingInfoTexts.length
        ? `当前还缺少 ${missingInfoTexts.join(" / ")} 信息，建议同步身份信息后再使用。`
        : String(userInfo.message || "身份信息还未同步成功，请重新获取。"),
      accountText,
      mallText,
      mallId,
      identityText,
      cookieSummary,
      validationStatus,
      validationLabel,
      userInfoStatus,
      userInfoLabel,
      hasUsableSession,
      hasGlobalCookie,
      hasRegionalCookies,
      hasIdentity,
      hasMall,
      canUse: false,
      shouldAutoValidate,
    };
  }

  if (!validationStatus || validationStatus === "fresh") {
    return {
      state: "pending",
      tone: "warning",
      label: "待确认",
      detail: String(validation.message || "会话已获取，正在等待可用性校验。"),
      accountText,
      mallText,
      mallId,
      identityText,
      cookieSummary,
      validationStatus,
      validationLabel,
      userInfoStatus,
      userInfoLabel,
      hasUsableSession,
      hasGlobalCookie,
      hasRegionalCookies,
      hasIdentity,
      hasMall,
      canUse: false,
      shouldAutoValidate,
    };
  }

  if (validationStatus === "unsupported") {
    return {
      state: "limited",
      tone: "warning",
      label: "待人工确认",
      detail: "当前环境暂不支持自动校验，请以实际执行结果为准。",
      accountText,
      mallText,
      mallId,
      identityText,
      cookieSummary,
      validationStatus,
      validationLabel,
      userInfoStatus,
      userInfoLabel,
      hasUsableSession,
      hasGlobalCookie,
      hasRegionalCookies,
      hasIdentity,
      hasMall,
      canUse: false,
      shouldAutoValidate,
    };
  }

  if (!hasRegionalCookies) {
    return {
      state: "incomplete",
      tone: "warning",
      label: "需重采",
      detail: `${missingRegions.join(" / ")} 会话缺失，当前环境不是完整采集结果，请重新执行 Temu 全量采集。`,
      accountText,
      mallText,
      mallId,
      identityText,
      cookieSummary,
      validationStatus,
      validationLabel,
      userInfoStatus,
      userInfoLabel,
      hasUsableSession,
      hasGlobalCookie,
      hasRegionalCookies,
      hasIdentity,
      hasMall,
      canUse: false,
      shouldAutoValidate,
    };
  }

  return {
    state: "ready",
    tone: "success",
    label: "可用",
    detail: "当前环境会话、身份与店铺信息完整，可直接使用。",
    accountText,
    mallText,
    mallId,
    identityText,
    cookieSummary,
    validationStatus,
    validationLabel,
    userInfoStatus,
    userInfoLabel,
    hasUsableSession,
    hasGlobalCookie,
    hasRegionalCookies,
    hasIdentity,
    hasMall,
    canUse: true,
    shouldAutoValidate,
  };
};

const toDisplayText = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return String(value);
};

const dedupeNumberArray = (value: any[]) =>
  Array.from(
    new Set(value.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0)),
  );

const buildInsightCard = (
  key: string,
  label: string,
  value: any,
  tone: TemuInsightCard["tone"] = "default",
): TemuInsightCard | null => {
  const text = toDisplayText(value);
  if (!text) {
    return null;
  }

  return {
    key,
    label,
    value: text,
    tone,
  };
};

export const buildDefaultFormState = (fields: TemuActionField[] = []) => {
  return fields.reduce(
    (result, field) => {
      if (field.defaultValue !== undefined) {
        result[field.key] = field.defaultValue;
        return result;
      }

      result[field.key] = field.type === "number" ? undefined : "";
      return result;
    },
    {} as Record<string, any>,
  );
};

export const formatFieldValueForForm = (field: TemuActionField, value: any) => {
  if (value === undefined || value === null || value === "") {
    if (field.type === "number") {
      return undefined;
    }
    if (field.type === "select" && field.multiple) {
      return [];
    }
    return "";
  }

  if (field.type === "json") {
    return stringifyJson(value);
  }

  if (field.type === "array-number" || field.type === "array-string") {
    return Array.isArray(value) ? value.join("\n") : String(value);
  }

  if (field.type === "select" && field.multiple) {
    return Array.isArray(value) ? value : [value];
  }

  return value;
};

export const buildFormPatchState = (fields: TemuActionField[], patch: Record<string, any> = {}) => {
  return fields.reduce(
    (result, field) => {
      if (Object.prototype.hasOwnProperty.call(patch, field.key)) {
        result[field.key] = formatFieldValueForForm(field, patch[field.key]);
      }
      return result;
    },
    {} as Record<string, any>,
  );
};

export const validateAndNormalizeField = (field: TemuActionField, value: any) => {
  const rawText = typeof value === "string" ? value.trim() : value;
  const isEmpty =
    rawText === undefined ||
    rawText === null ||
    rawText === "" ||
    (Array.isArray(rawText) && !rawText.length);

  if (field.required && isEmpty) {
    throw new Error(`请填写${field.label}`);
  }

  if (isEmpty) {
    return undefined;
  }

  if (field.type === "number") {
    const numericValue = Number(rawText);
    if (!Number.isFinite(numericValue)) {
      throw new Error(`${field.label} 需要是数字`);
    }
    if (field.min !== undefined && numericValue < field.min) {
      throw new Error(`${field.label} 不能小于 ${field.min}`);
    }
    if (field.max !== undefined && numericValue > field.max) {
      throw new Error(`${field.label} 不能大于 ${field.max}`);
    }
    return numericValue;
  }

  if (field.type === "json") {
    try {
      return typeof rawText === "string" ? JSON.parse(rawText) : rawText;
    } catch {
      throw new Error(`${field.label} 不是合法 JSON`);
    }
  }

  if (field.type === "array-number") {
    const values = String(rawText)
      .split(/\r?\n|,|，/)
      .map((item) => item.trim())
      .filter(Boolean);

    const numbers = values.map((item) => Number(item));
    if (numbers.some((item) => !Number.isFinite(item))) {
      throw new Error(`${field.label} 需要是数字列表`);
    }
    return numbers;
  }

  if (field.type === "array-string") {
    return String(rawText)
      .split(/\r?\n|,|，/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (field.type === "select" && field.multiple) {
    const values = Array.isArray(value) ? value : [value];
    return values
      .map((item) => {
        if (item === undefined || item === null || item === "") {
          return null;
        }
        const normalized =
          typeof item === "string" && /^-?\d+(\.\d+)?$/.test(item.trim())
            ? Number(item)
            : item;
        return normalized;
      })
      .filter((item) => item !== null);
  }

  return rawText;
};

const findFirstHttpUrl = (value: any, depth = 0, visited = new WeakSet<object>()): string => {
  if (depth > 5 || value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : "";
  }

  if (typeof value !== "object") {
    return "";
  }

  if (visited.has(value)) {
    return "";
  }
  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const matched = findFirstHttpUrl(item, depth + 1, visited);
      if (matched) {
        return matched;
      }
    }
    return "";
  }

  for (const child of Object.values(value)) {
    const matched = findFirstHttpUrl(child, depth + 1, visited);
    if (matched) {
      return matched;
    }
  }

  return "";
};

export const detectResultUrl = (response?: TemuActionResponse | null) =>
  findFirstHttpUrl(response?.result) || findFirstHttpUrl(response?.raw);

export const buildResultInsightCards = (
  response?: TemuActionResponse | null,
): TemuInsightCard[] => {
  if (!response) {
    return [];
  }

  const action = String(response.action || "").trim();
  const result = asPlainObject(response.result);
  const items = asArray(result.items);
  const cards: Array<TemuInsightCard | null> = [
    buildInsightCard("http-status", "HTTP", response.request?.status, "accent"),
  ];

  switch (action) {
    case "goods.list":
      const skuCount = items.reduce((count, item: any) => count + asArray(item?.skuList).length, 0);
      cards.push(
        buildInsightCard("total", "总商品数", result.total, "success"),
        buildInsightCard("items", "本页返回", items.length, "accent"),
        buildInsightCard("sku-count", "SKU 汇总", skuCount),
        buildInsightCard("page", "当前页", result.page),
      );
      break;
    case "goods.lifecycle":
    case "goods.price-review.list":
      cards.push(
        buildInsightCard(
          "mode",
          action === "goods.price-review.list" ? "列表类型" : "查询模式",
          action === "goods.price-review.list" ? "待核价" : result.mode,
          "accent",
        ),
        buildInsightCard(
          "total",
          action === "goods.price-review.list" ? "待核价总数" : "总条数",
          result.total,
          "success",
        ),
        buildInsightCard("items", "本页返回", items.length),
        buildInsightCard("pairs", "SKC/SPU 对", asArray(result.skcSpuList).length, "accent"),
      );
      break;
    case "activity.list":
    case "activity.filter":
      cards.push(
        buildInsightCard("total", "活动总数", result.totalCount, "success"),
        buildInsightCard("big", "大活动", asArray(result.bigActivities).length),
        buildInsightCard("small", "专题活动", asArray(result.smallActivities).length, "accent"),
      );
      break;
    case "activity.match":
      cards.push(
        buildInsightCard("products", "可报商品", result.productCount, "success"),
        buildInsightCard(
          "first-product",
          "首个商品",
          asArray(result.products)[0]?.productId || "",
          "accent",
        ),
        buildInsightCard(
          "scroll-context",
          "滚动上下文",
          result.searchScrollContext ? "已返回" : "",
        ),
      );
      break;
    case "activity.generate-payload":
    case "activity.merge-payloads": {
      const productList = asArray(result.productList);
      const skcCount = productList.reduce((count, item: any) => {
        return count + asArray(item?.skcList).length;
      }, 0);
      cards.push(
        buildInsightCard("activity-type", "活动类型", result.activityType, "accent"),
        buildInsightCard("products", "报名商品", productList.length, "success"),
        buildInsightCard("skc-count", "SKC 数", skcCount),
      );
      break;
    }
    case "activity.submit":
      cards.push(
        buildInsightCard(
          "submitted",
          "提交商品",
          asArray(result.submittedProductIds).length,
          "success",
        ),
        buildInsightCard("failures", "失败条数", asArray(result.failSummary).length, "warning"),
      );
      break;
    case "finance.history":
      cards.push(
        buildInsightCard("total", "历史任务", result.total, "success"),
        buildInsightCard("completed", "已完成", asArray(result.completedItems).length, "accent"),
        buildInsightCard(
          "download-id",
          "最近任务",
          asArray(result.completedItems)[0]?.downloadId || "",
        ),
      );
      break;
    case "finance.export":
      cards.push(buildInsightCard("task-type", "任务类型", result.taskType, "accent"));
      break;
    case "finance.download":
      cards.push(
        buildInsightCard("download-id", "导出任务", result.downloadId, "success"),
        buildInsightCard("task-type", "任务类型", result.taskType),
        buildInsightCard("download-url", "下载链接", detectResultUrl(response) ? "已返回" : ""),
      );
      break;
    case "finance.direct-url":
      cards.push(buildInsightCard("direct-url", "账单直链", result.url ? "已生成" : "", "success"));
      break;
    case "compliance.page-query":
      cards.push(
        buildInsightCard("total", "待处理条数", result.total, "success"),
        buildInsightCard("items", "本页返回", items.length, "accent"),
      );
      break;
    case "compliance.detail":
      cards.push(buildInsightCard("detail-type", "返回类型", result.detailType, "accent"));
      break;
    case "compliance.submit":
      cards.push(buildInsightCard("submitted", "提交状态", response.success ? "已提交" : "失败"));
      break;
    case "jit.list":
    case "jit.list-all":
      cards.push(
        buildInsightCard("total", "JIT 总数", result.total, "success"),
        buildInsightCard("items", "返回条数", items.length, "accent"),
        buildInsightCard("pairs", "SKC/SPU 对", asArray(result.skcSpuList).length),
        buildInsightCard("warnings", "警告", asArray(result.warnings).length, "warning"),
      );
      break;
    case "jit.open":
      cards.push(
        buildInsightCard("failed", "失败 SKC", asArray(result.failedSkcList).length, "warning"),
      );
      break;
    case "jit.open-maintain":
      cards.push(
        buildInsightCard("total", "处理 SKC", result.total, "accent"),
        buildInsightCard("success", "成功", result.successCount, "success"),
        buildInsightCard("failed", "失败", result.failedCount, result.failedCount ? "warning" : "neutral"),
        buildInsightCard("final-num", "目标库存", result.finalNum, "success"),
      );
      break;
    case "jit.stock.update":
      cards.push(
        buildInsightCard("skc-id", "SKC", result.skcId, "accent"),
        buildInsightCard("final-num", "目标库存", result.finalNum, "success"),
        buildInsightCard(
          "skipped",
          "是否跳过",
          result.skipped ? "是" : response.success ? "否" : "",
        ),
      );
      break;
    case "goods.category-search":
      cards.push(
        buildInsightCard("categories", "匹配类目", asArray(result.categoryPaths).length, "success"),
      );
      break;
    case "goods.expected-place.list":
      cards.push(
        buildInsightCard("total", "配置条数", result.total, "success"),
        buildInsightCard("items", "本页返回", items.length),
        buildInsightCard("skc-list", "SKC 数", asArray(result.skcIdList).length, "accent"),
      );
      break;
    case "goods.expected-place.update":
      cards.push(
        buildInsightCard("skc-list", "更新 SKC", asArray(result.skcIdList).length, "success"),
        buildInsightCard("area-type", "目标配置", result.exceptReceiveAreaConfigType),
      );
      break;
    case "goods.adjust-price.list":
      cards.push(
        buildInsightCard("total", "待处理单数", result.total, "success"),
        buildInsightCard("items", "本页返回", items.length, "accent"),
      );
      break;
    case "goods.adjust-price.reject":
      cards.push(
        buildInsightCard(
          "adjust-count",
          "已处理单数",
          asArray(result.adjustIdList).length,
          "success",
        ),
      );
      break;
    default: {
      const resultKeys = Object.keys(result);
      cards.push(
        buildInsightCard("keys", "结果字段", resultKeys.length, "accent"),
        buildInsightCard("url", "结果链接", detectResultUrl(response) ? "已返回" : ""),
      );
      break;
    }
  }

  return cards.filter(Boolean) as TemuInsightCard[];
};

const buildNotice = (
  key: string,
  type: TemuFeedbackNotice["type"],
  title: string,
  message: string,
): TemuFeedbackNotice | null => {
  const normalizedTitle = String(title || "").trim();
  const normalizedMessage = String(message || "").trim();
  if (!normalizedTitle || !normalizedMessage) {
    return null;
  }

  return {
    key,
    type,
    title: normalizedTitle,
    message: normalizedMessage,
  };
};

const containsText = (value: string, patterns: string[]) =>
  patterns.some((pattern) => value.includes(pattern));

const resolveResultArrayLength = (result: Record<string, any>) => {
  if (Array.isArray(result.items)) return result.items.length;
  if (Array.isArray(result.products)) return result.products.length;
  if (Array.isArray(result.completedItems)) return result.completedItems.length;
  if (Array.isArray(result.categoryPaths)) return result.categoryPaths.length;
  if (Array.isArray(result.mallList)) return result.mallList.length;
  return null;
};

export const buildSessionFeedbackNotices = (
  sessionRecord?: Record<string, any> | null,
): TemuFeedbackNotice[] => {
  const record = asPlainObject(sessionRecord);
  const session = asPlainObject(record.session);
  const validation = asPlainObject(record.validation);
  const userInfo = asPlainObject(record.userInfo);
  const notices: Array<TemuFeedbackNotice | null> = [];

  const globalCookieCount = countObjectKeys(session?.global?.cookies);
  const usCookieCount = countObjectKeys(session?.us?.cookies);
  const euCookieCount = countObjectKeys(session?.eu?.cookies);
  const mallId = String(userInfo.mallId || record.mallId || "").trim();
  const mallCount = Array.isArray(userInfo.mallList)
    ? userInfo.mallList.length
    : Array.isArray(record.mallList)
      ? record.mallList.length
      : 0;
  const validationStatus = String(validation.status || "").trim();
  const userInfoStatus = String(userInfo.status || "").trim();

  if (!globalCookieCount) {
    notices.push(
      buildNotice(
        "session-missing-global",
        "error",
        "当前会话不完整",
        "全球站 Cookie 为空，服务端业务动作大概率无法执行，建议重新获取会话。",
      ),
    );
  }

  if (globalCookieCount && (!usCookieCount || !euCookieCount)) {
    const missingRegions = [usCookieCount ? "" : "美区", euCookieCount ? "" : "欧区"].filter(
      Boolean,
    );
    notices.push(
      buildNotice(
        "session-missing-region",
        "warning",
        "区域会话不完整",
        `${missingRegions.join(" / ")} Cookie 还不完整，涉及这些区域的动作可能回退到全球站或直接失败。`,
      ),
    );
  }

  if (!mallId) {
    notices.push(
      buildNotice(
        "session-missing-mall",
        "warning",
        "当前店铺还未绑定",
        "部分 Temu 接口依赖 mallId，建议先获取用户信息并设定当前店铺。",
      ),
    );
  }

  if (mallId && !mallCount) {
    notices.push(
      buildNotice(
        "session-no-mall-list",
        "info",
        "店铺列表还未刷新",
        "当前已经有 mallId，但还没有拿到完整 mallList。可点击“获取信息”同步店铺列表。",
      ),
    );
  }

  if (validationStatus === "invalid") {
    notices.push(
      buildNotice(
        "session-invalid",
        "error",
        "会话校验未通过",
        String(validation.message || "当前会话可能已失效，建议重新获取。"),
      ),
    );
  } else if (validationStatus === "fresh") {
    notices.push(
      buildNotice(
        "session-fresh",
        "info",
        "会话刚更新，尚未校验",
        String(validation.message || "建议执行一次校验，确认服务端接口可以正常使用。"),
      ),
    );
  }

  if (userInfoStatus === "failed") {
    notices.push(
      buildNotice(
        "session-userinfo-failed",
        "warning",
        "身份信息获取失败",
        String(userInfo.message || "当前会话存在，但账号 / 店铺信息还未同步成功。"),
      ),
    );
  }

  return notices.filter(Boolean) as TemuFeedbackNotice[];
};

export const buildActionFeedbackNotices = (options: {
  action?: TemuCatalogAction | null;
  sessionRecord?: Record<string, any> | null;
  jsonFieldCount?: number;
  hasFormSeeds?: boolean;
}): TemuFeedbackNotice[] => {
  const action = options.action;
  if (!action) {
    return [];
  }

  const record = asPlainObject(options.sessionRecord);
  const session = asPlainObject(record.session);
  const notices: Array<TemuFeedbackNotice | null> = [];
  const hasJsonField = Number(options.jsonFieldCount || 0) > 0;

  if (action.status !== "available") {
    notices.push(
      buildNotice(
        "action-planned",
        "info",
        "当前动作还在规划中",
        "接口目录已经预留，但前后端交互还没有完全打通。",
      ),
    );
  }

  if (action.regionHints.includes("us") && !countObjectKeys(session?.us?.cookies)) {
    notices.push(
      buildNotice(
        "action-missing-us",
        "warning",
        "美区会话可能不足",
        "如果切到美区执行，该动作可能因 Cookie 不完整而失败。",
      ),
    );
  }

  if (action.regionHints.includes("eu") && !countObjectKeys(session?.eu?.cookies)) {
    notices.push(
      buildNotice(
        "action-missing-eu",
        "warning",
        "欧区会话可能不足",
        "如果切到欧区执行，该动作可能因 Cookie 不完整而失败。",
      ),
    );
  }

  if (hasJsonField && !options.hasFormSeeds) {
    notices.push(
      buildNotice(
        "action-json-manual",
        "info",
        "当前动作需要手工 JSON 参数",
        "这类动作更适合配合上一步结果使用；如果你刚跑过相关动作，先看看是否出现了“快捷填充”。",
      ),
    );
  }

  return notices.filter(Boolean) as TemuFeedbackNotice[];
};

export const buildResultFeedbackNotices = (
  response?: TemuActionResponse | null,
): TemuFeedbackNotice[] => {
  if (!response) {
    return [];
  }

  const action = String(response.action || "").trim();
  const result = asPlainObject(response.result);
  const raw = asPlainObject(response.raw);
  const message = String(response.message || "").trim();
  const rawMessage = String(
    raw.message || raw.msg || raw.errorMsg || raw.error_msg || raw?.result?.message || "",
  ).trim();
  const joinedMessage = `${message} ${rawMessage}`.toLowerCase();
  const notices: Array<TemuFeedbackNotice | null> = [];

  if (!response.success) {
    if (
      containsText(joinedMessage, ["login", "invalid login state", "登录", "会话失效", "session"])
    ) {
      notices.push(
        buildNotice(
          "result-login-invalid",
          "error",
          "身份状态异常",
          "服务端判断当前登录态不可用，建议先校验会话，必要时重新获取。",
        ),
      );
    } else if (containsText(joinedMessage, ["risk", "风控", "验证"])) {
      notices.push(
        buildNotice(
          "result-risk",
          "error",
          "触发风控或验证",
          "Temu 侧可能要求人工验证，这类情况通常需要回到浏览器环境处理。",
        ),
      );
    } else if (containsText(joinedMessage, ["mall", "店铺"])) {
      notices.push(
        buildNotice(
          "result-mall",
          "warning",
          "店铺上下文可能不对",
          "当前 mallId 或店铺上下文可能不匹配，建议先获取用户信息并确认当前店铺。",
        ),
      );
    } else {
      notices.push(
        buildNotice(
          "result-failed",
          "error",
          "动作执行失败",
          rawMessage || message || "服务端返回失败，请检查当前会话、区域和参数。",
        ),
      );
    }
    return notices.filter(Boolean) as TemuFeedbackNotice[];
  }

  const arrayLength = resolveResultArrayLength(result);
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];
  const failSummary = Array.isArray(result.failSummary) ? result.failSummary : [];

  if (warnings.length) {
    notices.push(
      buildNotice("result-warnings", "warning", "动作执行完成，但存在警告", warnings.join("；")),
    );
  }

  if (failSummary.length) {
    notices.push(
      buildNotice(
        "result-fail-summary",
        "warning",
        "存在部分失败项",
        `共有 ${failSummary.length} 组失败原因，建议先看结果摘要再决定是否重试。`,
      ),
    );
  }

  if (arrayLength === 0) {
    notices.push(
      buildNotice(
        `result-empty-${action || "default"}`,
        "info",
        "接口执行成功，但当前没有数据",
        "这通常意味着筛选条件较严、当前店铺暂无数据，或者该状态下确实没有待处理记录。",
      ),
    );
  }

  if (action === "finance.download" && detectResultUrl(response)) {
    notices.push(
      buildNotice(
        "result-download-url",
        "success",
        "已拿到可用下载链接",
        "可以直接复制结果链接，或继续把它接到后续下载流程里。",
      ),
    );
  }

  if (action === "finance.direct-url" && String(result.url || "").trim()) {
    notices.push(
      buildNotice(
        "result-direct-url",
        "success",
        "账单直链已生成",
        "你可以直接复制这条直链，用于后续跳转或系统集成。",
      ),
    );
  }

  if (action === "activity.submit" && !failSummary.length) {
    notices.push(
      buildNotice(
        "result-activity-submit-success",
        "success",
        "活动报名已提交",
        "如果后续需要继续报名其他商品，可以直接复用这次的 payload 结构。",
      ),
    );
  }

  return notices.filter(Boolean) as TemuFeedbackNotice[];
};

export const extractRequestErrorMessage = (error: any, fallback: string) => {
  const candidates = [
    error?.response?.data?.message,
    error?.response?.data?.msg,
    error?.response?.data?.error,
    error?.message,
  ];

  return candidates.map((item) => String(item || "").trim()).find(Boolean) || fallback;
};

const buildSampleActivityProduct = () => ({
  productId: 123456789,
  suggestEnrollSessionIdList: [100000001],
  skus: [
    {
      skcId: 60920034417,
      skcExtCode: "EXAMPLE-SKC",
      skuId: 60920034418,
      skuExtCode: "EXAMPLE-SKU",
      suggestActivityPrice: 29.9,
      suggestActivityDiscount: 80,
      dailyPrice: 39.9,
      size: "默认",
    },
  ],
});

const buildSampleActivityPayload = () => ({
  activityType: 5,
  productList: [
    {
      productId: 123456789,
      activityStock: 50,
      sessionIds: [100000001],
      skcList: [
        {
          skcId: 60920034417,
          skuList: [
            {
              skuId: 60920034418,
              activityPrice: 29.9,
              activityDiscount: 80,
            },
          ],
        },
      ],
    },
  ],
});

const extractSpuIdsFromLastResult = (action: string, result: Record<string, any>) => {
  if (action === "goods.list") {
    return dedupeNumberArray(asArray(result.items).map((item: any) => item?.spuId));
  }

  if (action === "goods.lifecycle" || action === "goods.price-review.list") {
    return dedupeNumberArray(asArray(result.items).map((item: any) => item?.productId));
  }

  return [];
};

const extractProductIdsFromLastResult = (action: string, result: Record<string, any>) => {
  if (action === "goods.list") {
    return dedupeNumberArray(asArray(result.items).map((item: any) => item?.spuId));
  }

  if (action === "goods.lifecycle" || action === "goods.price-review.list") {
    return dedupeNumberArray(asArray(result.items).map((item: any) => item?.productId));
  }

  if (action === "activity.match") {
    return dedupeNumberArray(asArray(result.products).map((item: any) => item?.productId));
  }

  if (action === "compliance.page-query") {
    return dedupeNumberArray(asArray(result.items).map((item: any) => item?.spuId));
  }

  return [];
};

export const buildFormSeedActions = (
  actionKey?: string | null,
  response?: TemuActionResponse | null,
): TemuFormSeedAction[] => {
  const currentAction = String(actionKey || "").trim();
  const lastAction = String(response?.action || "").trim();
  const lastRegion = String(response?.region || "").trim() || "global";
  const result = asPlainObject(response?.result);
  const actions: TemuFormSeedAction[] = [];

  if (!currentAction) {
    return actions;
  }

  switch (currentAction) {
    case "goods.detail": {
      const productIdList = extractProductIdsFromLastResult(lastAction, result);
      if (productIdList.length) {
        actions.push({
          key: "goods-detail-from-last",
          label: "带入首个 SPU",
          description: `自动带入 SPU ${productIdList[0]}`,
          patch: {
            region: lastRegion,
            productId: productIdList[0],
          },
        });
      }
      break;
    }
    case "activity.match": {
      const firstSmall = asArray(result.smallActivities)[0];
      const firstBig = asArray(result.bigActivities)[0];

      if (
        (lastAction === "activity.list" || lastAction === "activity.filter") &&
        asPlainObject(firstSmall).activityThematicId
      ) {
        actions.push({
          key: "activity-match-first-small",
          label: "带入首个专题活动",
          description: `${firstSmall.activityName || "专题活动"} · type ${firstSmall.activityType || "-"}`,
          patch: {
            activityType: firstSmall.activityType,
            activityThematicId: firstSmall.activityThematicId,
          },
        });
      }

      if ((lastAction === "activity.list" || lastAction === "activity.filter") && firstBig) {
        actions.push({
          key: "activity-match-first-big",
          label: "带入首个大活动",
          description: `${firstBig.activityName || "大活动"} · type ${firstBig.activityType || "-"}`,
          patch: {
            activityType: firstBig.activityType,
          },
        });
      }
      break;
    }
    case "activity.generate-payload":
      if (lastAction === "activity.match" && asArray(result.products).length) {
        actions.push({
          key: "activity-generate-from-match",
          label: "带入首个匹配商品",
          description: `自动填入商品信息 JSON，减少手工复制`,
          patch: {
            productInfo: asArray(result.products)[0],
          },
        });
      }

      actions.push({
        key: "activity-generate-example",
        label: "载入示例商品",
        description: "填入一个最小可读示例，方便理解 payload 结构",
        patch: {
          activityType: 5,
          productInfo: buildSampleActivityProduct(),
        },
      });
      break;
    case "activity.merge-payloads":
      if (lastAction === "activity.generate-payload" && Object.keys(result).length) {
        actions.push({
          key: "activity-merge-from-generate",
          label: "使用上次生成结果",
          description: "自动把上次 payload 放入 payloadList",
          patch: {
            activityType: result.activityType,
            activityThematicId: result.activityThematicId,
            payloadList: [result],
          },
        });
      }

      actions.push({
        key: "activity-merge-example",
        label: "载入示例 payload",
        description: "填入一个最小示例，便于批量合并时参考",
        patch: {
          activityType: 5,
          payloadList: [buildSampleActivityPayload()],
        },
      });
      break;
    case "activity.submit":
      if (
        (lastAction === "activity.generate-payload" || lastAction === "activity.merge-payloads") &&
        Object.keys(result).length
      ) {
        actions.push({
          key: "activity-submit-from-last",
          label: "提交上次生成结果",
          description: "自动把上一步结果带入 payload",
          patch: {
            region: lastRegion,
            payload: result,
          },
        });
      }

      actions.push({
        key: "activity-submit-example",
        label: "载入示例提交体",
        description: "方便先看清官方提交结构",
        patch: {
          region: "global",
          payload: buildSampleActivityPayload(),
        },
      });
      break;
    case "finance.download": {
      const latestItem = asArray(result.completedItems)[0];
      if (lastAction === "finance.history" && latestItem?.downloadId) {
        actions.push({
          key: "finance-download-from-history",
          label: "使用最近导出任务",
          description: `${latestItem.fileName || "最近任务"} · ID ${latestItem.downloadId}`,
          patch: {
            region: lastRegion,
            downloadId: latestItem.downloadId,
          },
        });
      }
      break;
    }
    case "finance.export":
    case "finance.direct-url": {
      const latestItem = asArray(result.completedItems)[0];
      if (lastAction === "finance.history" && latestItem?.queryParams) {
        actions.push({
          key: `${currentAction}-from-history`,
          label: "带入最近导出参数",
          description: `${latestItem.fileName || "最近任务"} 的 queryParams`,
          patch: {
            region: lastRegion,
            queryParams: latestItem.queryParams,
          },
        });
      }

      actions.push({
        key: `${currentAction}-example`,
        label: "载入空白参数模板",
        description: "先放入 params/sign 结构，再逐步补充",
        patch: {
          region: "global",
          queryParams: {
            params: "",
            sign: "",
          },
        },
      });
      break;
    }
    case "goods.expected-place.list":
      if (lastAction === "goods.category-search" && asArray(result.categoryPaths).length) {
        actions.push({
          key: "expected-place-list-from-category",
          label: "带入当前类目路径",
          description: `使用类目搜索结果里的完整类目路径`,
          patch: {
            categoryPaths: result.categoryPaths,
          },
        });
      }

      actions.push({
        key: "expected-place-list-example",
        label: "载入示例类目路径",
        description: "用于理解类目路径 JSON 的最小结构",
        patch: {
          categoryPaths: [
            {
              cat_ids: [1, 20, 27],
              cat_names: ["宠物用品", "狗狗用品类", "狗用进食垫"],
            },
          ],
        },
      });
      break;
    case "goods.expected-place.update":
      if (lastAction === "goods.expected-place.list" && asArray(result.skcIdList).length) {
        actions.push({
          key: "expected-place-update-from-list",
          label: "带入当前 SKC 列表",
          description: `自动填入 ${asArray(result.skcIdList).length} 个 SKC`,
          patch: {
            skcIdList: result.skcIdList,
          },
        });
      }
      break;
    case "goods.adjust-price.reject":
      if (lastAction === "goods.adjust-price.list" && asArray(result.items).length) {
        const adjustIdList = dedupeNumberArray(asArray(result.items).map((item: any) => item?.id));
        if (adjustIdList.length) {
          actions.push({
            key: "adjust-price-reject-from-list",
            label: "带入当前待处理单",
            description: `自动填入 ${adjustIdList.length} 个 adjustId`,
            patch: {
              adjustIdList,
            },
          });
        }
      }
      break;
    case "goods.real-picture.submit":
      if (lastAction === "goods.real-picture.list" && asArray(result.items).length) {
        const firstItem = asArray(result.items)[0];
        if (firstItem?.spuId) {
          actions.push({
            key: "real-picture-submit-from-list",
            label: "带入首个异常单",
            description: `自动填入 SPU ${firstItem.spuId} 及关联的 goodsId / skuIdList`,
            patch: {
              region: lastRegion,
              spuId: firstItem.spuId,
              goodsId: firstItem.goodsId,
              skuIdList: firstItem.skuIdList,
              isSameSku: firstItem.isSameSku ? 1 : 0,
              existingLabelImageList: firstItem.labelImageList,
            },
          });
        }
      }

      actions.push({
        key: "real-picture-submit-example",
        label: "载入图片模板",
        description: "放入最小示例，方便直接改成你的 HTTP 图片地址",
        patch: {
          region: "global",
          imageUrls: ["https://example.com/demo-1.jpg"],
          positionImageUrls: {
            1: ["https://example.com/demo-1.jpg"],
            2: ["https://example.com/demo-2.jpg"],
          },
        },
      });
      break;
    case "jit.open":
      if (
        (lastAction === "jit.list" ||
          lastAction === "jit.list-all" ||
          lastAction === "goods.lifecycle") &&
        asArray(result.skcSpuList).length
      ) {
        actions.push({
          key: "jit-open-from-list",
          label: "带入 SKC / SPU 对应",
          description: `自动填入 ${asArray(result.skcSpuList).length} 条映射`,
          patch: {
            region: lastRegion,
            skcSpuList: result.skcSpuList,
          },
        });
      }

      actions.push({
        key: "jit-open-example",
        label: "载入示例映射",
        description: "先看清 JIT 开通需要的最小结构",
        patch: {
          region: "global",
          skcSpuList: [{ skcId: 60920034417, spuId: 6307893340 }],
        },
      });
      break;
    case "jit.open-maintain":
      if (
        (lastAction === "jit.list" ||
          lastAction === "jit.list-all" ||
          lastAction === "goods.lifecycle") &&
        asArray(result.skcSpuList).length
      ) {
        actions.push({
          key: "jit-open-maintain-from-list",
          label: "带入并维护库存",
          description: `自动填入 ${asArray(result.skcSpuList).length} 条映射`,
          patch: {
            region: lastRegion,
            skcSpuList: result.skcSpuList,
            finalNum: 500,
          },
        });
      }

      actions.push({
        key: "jit-open-maintain-example",
        label: "载入维护模板",
        description: "开通 JIT 后把 SKU 库存补到目标数量",
        patch: {
          region: "global",
          skcSpuList: [{ skcId: 60920034417, spuId: 6307893340 }],
          finalNum: 500,
        },
      });
      break;
    case "jit.stock.update":
      if (
        (lastAction === "jit.list" ||
          lastAction === "jit.list-all" ||
          lastAction === "goods.lifecycle") &&
        asArray(result.skcSpuList).length
      ) {
        const firstPair = asArray(result.skcSpuList)[0];
        if (firstPair?.skcId) {
          actions.push({
            key: "jit-stock-from-list",
            label: "使用首个 SKC",
            description: `自动填入 SKC ${firstPair.skcId}`,
            patch: {
              region: lastRegion,
              skcId: firstPair.skcId,
            },
          });
        }
      }
      break;
    case "compliance.page-query": {
      const spuIdList = extractSpuIdsFromLastResult(lastAction, result);
      if (spuIdList.length) {
        actions.push({
          key: "compliance-page-from-goods",
          label: "带入当前 SPU 列表",
          description: `自动填入 ${spuIdList.length} 个 SPU`,
          patch: {
            spuIdList,
          },
        });
      }
      break;
    }
    default:
      break;
  }

  return actions;
};
