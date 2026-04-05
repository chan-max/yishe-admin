import type {
  EcomCollectPlatformSchema,
  EcomCollectSceneSchema,
  EcomPlatformCollectCatalog,
  EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
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

export const getPlatformLabel = (
  catalog: EcomPlatformCollectCatalog,
  value?: string | null,
) => {
  return (
    catalog.platforms.find((item) => item.value === value)?.label ||
    value ||
    "-"
  );
};

export const getPlatformSchema = (
  catalog: EcomPlatformCollectCatalog,
  value?: string | null,
) => {
  return (
    catalog.platforms.find((item) => item.value === value) || null
  ) as EcomCollectPlatformSchema | null;
};

export const getSceneLabel = (
  catalog: EcomPlatformCollectCatalog,
  platformValue?: string | null,
  sceneValue?: string | null,
) => {
  const platform = getPlatformSchema(catalog, platformValue);
  return (
    platform?.scenes?.find((item) => item.value === sceneValue)?.label ||
    sceneValue ||
    "-"
  );
};

export const getSceneSchema = (
  catalog: EcomPlatformCollectCatalog,
  platformValue?: string | null,
  sceneValue?: string | null,
) => {
  const platform = getPlatformSchema(catalog, platformValue);
  if (platform?.scenes?.length) {
    return (
      platform.scenes.find((item) => item.value === sceneValue) || null
    ) as EcomCollectSceneSchema | null;
  }
  return null;
};

export const getCapabilityStatusLabel = (value?: string | null) => {
  const map: Record<string, string> = {
    available: "可用",
    partial: "部分可用",
    heuristic: "启发式可用",
    blocked: "受限",
    unsupported: "未实现",
  };
  return map[String(value || "")] || String(value || "-");
};

export const getCapabilityStatusTagType = (
  value?: string | null,
): "success" | "warning" | "danger" | "info" => {
  const map: Record<string, "success" | "warning" | "danger" | "info"> = {
    available: "success",
    partial: "warning",
    heuristic: "warning",
    blocked: "danger",
    unsupported: "info",
  };
  return map[String(value || "")] || "info";
};

export const getVerificationLabel = (value?: string | null) => {
  const map: Record<string, string> = {
    verified: "已验证",
    heuristic: "启发式",
    blocked: "受限",
    planned: "待验证",
    unsupported: "未实现",
  };
  return map[String(value || "")] || String(value || "-");
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

export const getSnapshotCount = (value: any) => {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value && typeof value === "object" && Array.isArray(value.snapshots)) {
    return value.snapshots.length;
  }
  return 0;
};

export const getRawTitle = (row: EcomPlatformRawRecord) => {
  return String(
    row?.rawPayload?.title ||
      row?.rawPayload?.name ||
      row?.rawPayload?.pageTitle ||
      row?.rawPayload?.descriptionText ||
      row?.rawPayload?.productName ||
      "-",
  );
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

export const getRawLink = (row: EcomPlatformRawRecord) => {
  return String(
    row?.rawPayload?.originalSourceUrl ||
      row?.rawPayload?.sourceUrl ||
      row?.sourceUrl ||
      "",
  ).trim();
};

export const parseKeywordsText = (value?: string | null) => {
  return String(value || "")
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
};
