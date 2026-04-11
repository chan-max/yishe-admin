import type {
  EcomCollectPlatformSchema,
  EcomCollectSceneSchema,
  EcomCollectTaskTypeSchema,
  EcomPlatformCollectCatalog,
  EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
import { formatDate } from "@/utils/formatTime";

export const buildDefaultTaskTypeValue = (
  platform?: string | null,
  collectScene?: string | null,
) => {
  const normalizedPlatform = String(platform || "").trim();
  const normalizedScene = String(collectScene || "").trim();
  if (!normalizedPlatform || !normalizedScene) {
    return "";
  }
  return `${normalizedPlatform}.${normalizedScene}`;
};

export const resolveTaskTypeValue = (
  _platform?: string | null,
  taskType?: string | null,
  _collectScene?: string | null,
) => {
  return String(taskType || "").trim() || "";
};

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

const buildFallbackTaskTypeSchema = (
  platform: EcomCollectPlatformSchema,
  scene: EcomCollectSceneSchema,
): EcomCollectTaskTypeSchema => {
  const value = buildDefaultTaskTypeValue(platform.value, scene.value);
  return {
    value,
    taskType: value,
    label: scene.label || value,
    description: scene.description,
    platform: platform.value,
    collectScene: scene.value,
    availability: scene.availability,
    availabilityLabel: scene.availabilityLabel,
    runnable: scene.runnable,
    verification: scene.verification,
    verificationLabel: scene.verificationLabel,
    reason: scene.reason || null,
    fields: Array.isArray(scene.fields) ? scene.fields : [],
    docs: scene.docs,
  };
};

export const getTaskTypeSchemas = (
  catalog: EcomPlatformCollectCatalog,
  platformValue?: string | null,
) => {
  const platform = getPlatformSchema(catalog, platformValue);
  if (!platform) {
    return [] as EcomCollectTaskTypeSchema[];
  }
  if (Array.isArray(platform.taskTypes) && platform.taskTypes.length) {
    return platform.taskTypes;
  }
  if (Array.isArray(platform.scenes)) {
    return platform.scenes.map((scene) => buildFallbackTaskTypeSchema(platform, scene));
  }
  return [] as EcomCollectTaskTypeSchema[];
};

export const getTaskTypeSchema = (
  catalog: EcomPlatformCollectCatalog,
  platformValue?: string | null,
  taskTypeValue?: string | null,
  _collectSceneValue?: string | null,
) => {
  const taskTypes = getTaskTypeSchemas(catalog, platformValue);
  const normalizedTaskType = resolveTaskTypeValue(platformValue, taskTypeValue);
  if (normalizedTaskType) {
    return (
      taskTypes.find((item) => item.value === normalizedTaskType) || null
    ) as EcomCollectTaskTypeSchema | null;
  }
  return null;
};

export const getTaskTypeLabel = (
  catalog: EcomPlatformCollectCatalog,
  platformValue?: string | null,
  taskTypeValue?: string | null,
  collectSceneValue?: string | null,
) => {
  const taskType = getTaskTypeSchema(
    catalog,
    platformValue,
    taskTypeValue,
    collectSceneValue,
  );
  return (
    taskType?.label ||
    resolveTaskTypeValue(platformValue, taskTypeValue) ||
    "-"
  );
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

export const getRawPackageRecords = (row: EcomPlatformRawRecord) => {
  return Array.isArray(row?.collectData?.records) ? row.collectData.records : [];
};

export const getRawRecordsCount = (row: EcomPlatformRawRecord) => {
  const explicitCount = Number(row?.recordsCount);
  if (Number.isFinite(explicitCount) && explicitCount >= 0) {
    return explicitCount;
  }
  return getRawPackageRecords(row).length;
};

export const getSnapshotCount = (value: any) => {
  const explicitCount = Number(value?.snapshotCount);
  if (Number.isFinite(explicitCount) && explicitCount >= 0) {
    return explicitCount;
  }
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value && typeof value === "object" && Array.isArray(value.snapshots)) {
    return value.snapshots.length;
  }
  return 0;
};

export const getRawSummaryMessage = (row: EcomPlatformRawRecord) => {
  return String(
    row?.summaryMessage ||
      row?.collectData?.message ||
      row?.collectData?.summary?.message ||
      row?.summaryData?.message ||
      row?.run?.summaryData?.message ||
      "-",
  );
};

export const getRawRunStatus = (row: EcomPlatformRawRecord) => {
  return String(
    row?.runStatus || row?.collectData?.status || row?.run?.status || "",
  ).trim();
};

export const getRawTitle = (row: EcomPlatformRawRecord) => {
  return String(
    row?.collectData?.title ||
      row?.collectData?.summary?.message ||
      row?.collectData?.name ||
      row?.collectData?.pageTitle ||
      row?.collectData?.descriptionText ||
      row?.collectData?.productName ||
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
    row?.collectData?.records?.[0]?.originalSourceUrl ||
      row?.collectData?.records?.[0]?.sourceUrl ||
      row?.collectData?.records?.[0]?.url ||
    row?.collectData?.originalSourceUrl ||
      row?.collectData?.sourceUrl ||
      "",
  ).trim();
};

export const parseKeywordsText = (value?: string | null) => {
  return String(value || "")
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
};
