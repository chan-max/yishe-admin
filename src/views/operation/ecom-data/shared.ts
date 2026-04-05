import type { EcomPlatformCollectCatalog } from "@/api/operation/ecomPlatformCollect";
import { formatDate } from "@/utils/formatTime";

export const createEmptyEcomCollectCatalog = (): EcomPlatformCollectCatalog => ({
  platforms: [],
  meta: {
    capabilityClientCount: 0,
    onlineCapabilityClientCount: 0,
    generatedAt: null,
    source: "browser-automation-runtime",
  },
});

export const formatDateTime = (value?: string | Date | null) => {
  return value ? formatDate(new Date(value)) : "-";
};

export const formatJson = (value: any) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value ?? "");
  }
};

export const getPlatformLabel = (catalog: EcomPlatformCollectCatalog, value?: string | null) => {
  return catalog.platforms.find((item) => item.value === value)?.label || value || "-";
};

export const getRunStatusLabel = (value?: string | null) => {
  const map: Record<string, string> = {
    queued: "排队中",
    assigned: "已分配",
    running: "运行中",
    success: "成功",
    failed: "失败",
    skipped: "跳过",
    terminated: "终止",
  };
  return map[String(value || "")] || "-";
};

export const getRunStatusTagType = (value?: string | null) => {
  const map: Record<string, "success" | "warning" | "danger" | "info"> = {
    queued: "info",
    assigned: "info",
    running: "warning",
    success: "success",
    failed: "danger",
    skipped: "info",
    terminated: "danger",
  };
  return map[String(value || "")] || "info";
};

export const getAnalysisTypeLabel = (value?: string | null) => {
  const map: Record<string, string> = {
    hot_selling_selection: "热门选品",
  };
  return map[String(value || "")] || value || "-";
};

export const getSupplyMatchTypeLabel = (value?: string | null) => {
  const map: Record<string, string> = {
    supply_match: "找同款",
  };
  return map[String(value || "")] || value || "-";
};

export const getConfidenceLabel = (value?: string | null) => {
  const map: Record<string, string> = {
    high: "高",
    medium: "中",
    low: "低",
  };
  return map[String(value || "").toLowerCase()] || value || "-";
};

export const getConfidenceTagType = (value?: string | null) => {
  const map: Record<string, "success" | "warning" | "info"> = {
    high: "success",
    medium: "warning",
    low: "info",
  };
  return map[String(value || "").toLowerCase()] || "info";
};

export const parseTextareaList = (value?: string | null) => {
  return Array.from(
    new Set(
      String(value || "")
        .split(/[\n,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
};

export const formatTextareaList = (value?: unknown) => {
  return Array.isArray(value) ? value.filter(Boolean).join("\n") : "";
};

export const getShortUrl = (value?: string | null) => {
  const text = String(value || "").trim();
  if (!text) {
    return "-";
  }
  if (text.length <= 56) {
    return text;
  }
  return `${text.slice(0, 36)}...${text.slice(-16)}`;
};

export const normalizeSnapshotList = (value: any): Array<Record<string, any>> => {
  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === "object");
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const candidates = [
    ...(Array.isArray(value.snapshots) ? value.snapshots : []),
    ...(Array.isArray(value.listing) ? value.listing : []),
    ...(Array.isArray(value.detail) ? value.detail : []),
  ];

  return candidates.filter((item) => item && typeof item === "object");
};

export const getSnapshotUrl = (value: any) => {
  const candidate = [
    value?.url,
    value?.href,
    value?.src,
    value?.cosUrl,
    value?.fileUrl,
    value?.snapshotUrl,
    value?.previewUrl,
    value?.imageUrl,
  ].find((item) => String(item || "").trim());

  return String(candidate || "").trim();
};

export const getSnapshotLabel = (value: any, index = 0) => {
  const candidate = [
    value?.label,
    value?.title,
    value?.name,
    value?.type,
    value?.scene,
    value?.snapshotType,
  ].find((item) => String(item || "").trim());

  return String(candidate || `截图 ${index + 1}`).trim();
};

export const formatListPreview = (value: unknown, limit = 3) => {
  if (!Array.isArray(value)) {
    return "-";
  }

  const items = value.map((item) => String(item || "").trim()).filter(Boolean);
  if (!items.length) {
    return "-";
  }
  if (items.length <= limit) {
    return items.join(" / ");
  }
  return `${items.slice(0, limit).join(" / ")} 等 ${items.length} 项`;
};
