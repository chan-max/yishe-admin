import type { BrowserAutomationCapabilityClient } from "@/api/external/browserAutomation";
import type {
  EcomPlatformCollectCatalog,
  EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
import { formatDate } from "@/utils/formatTime";

export interface EcomCollectClientOption {
  clientId: string;
  label: string;
  machineCode: string;
  location: string;
  busy: boolean;
}

export const createEmptyEcomCollectCatalog = (): EcomPlatformCollectCatalog => ({
  platforms: [],
  scenes: [],
  defaults: {
    intervalMinutes: 30,
    minIntervalMinutes: 10,
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

export const getSceneLabel = (
  catalog: EcomPlatformCollectCatalog,
  value?: string | null,
) => {
  return (
    catalog.scenes.find((item) => item.value === value)?.label ||
    value ||
    "-"
  );
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

export const getTriggerModeLabel = (value?: string | null) => {
  return value === "schedule" ? "调度" : "手动";
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

export const buildAvailableClientOptions = (
  clients: BrowserAutomationCapabilityClient[] = [],
): EcomCollectClientOption[] => {
  return clients
    .filter((item) => item.isOnline && item.available)
    .sort((left, right) => {
      const busyCompare = Number(left.busy) - Number(right.busy);
      if (busyCompare !== 0) {
        return busyCompare;
      }
      return String(left.machineCode || left.clientId).localeCompare(
        String(right.machineCode || right.clientId),
      );
    })
    .map((item) => {
      const machineCode = String(item.machineCode || "").trim();
      const location = String(item.location || "").trim();
      const busy = item.busy === true;
      return {
        clientId: item.clientId,
        machineCode,
        location,
        busy,
        label: [
          machineCode || item.clientId,
          location,
          busy ? "忙碌中" : "空闲",
        ]
          .filter(Boolean)
          .join(" / "),
      };
    });
};
