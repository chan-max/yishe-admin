import { getUserSetting, updateUserSetting } from "@/api/user";
import { triggerPublishTaskAutoDispatch } from "@/api/system/websocket";

export interface PublishTaskAutoDispatchSetting {
  autoSchedulingEnabled: boolean;
  autoDispatchClientId: string;
  autoDispatchMachineCode: string;
  autoDispatchProfileId: string;
  autoDispatchFilter: PublishTaskAutoDispatchFilter;
}

export interface PublishTaskAutoDispatchFilter {
  taskTypes: string[];
  includeKeywords: string[];
  excludeKeywords: string[];
  createdAfter: string;
  createdBefore: string;
}

const normalizeStringArray = (value?: any): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizePublishTaskAutoDispatchFilter = (value?: any): PublishTaskAutoDispatchFilter => ({
  taskTypes: normalizeStringArray(value?.taskTypes),
  includeKeywords: normalizeStringArray(value?.includeKeywords),
  excludeKeywords: normalizeStringArray(value?.excludeKeywords),
  createdAfter: String(value?.createdAfter || "").trim(),
  createdBefore: String(value?.createdBefore || "").trim(),
});

const normalizePublishTaskAutoDispatchSetting = (value?: any): PublishTaskAutoDispatchSetting => ({
  autoSchedulingEnabled: !!value?.autoSchedulingEnabled,
  autoDispatchClientId: String(value?.autoDispatchClientId || "").trim(),
  autoDispatchMachineCode: String(value?.autoDispatchMachineCode || "").trim(),
  autoDispatchProfileId: String(value?.autoDispatchProfileId || "").trim(),
  autoDispatchFilter: normalizePublishTaskAutoDispatchFilter(value?.autoDispatchFilter),
});

export const loadPublishTaskAutoDispatchSetting = async () => {
  try {
    const response: any = await getUserSetting({ key: "browserAutomation" });
    const data = response?.data || response || {};
    return normalizePublishTaskAutoDispatchSetting(data);
  } catch {
    return normalizePublishTaskAutoDispatchSetting();
  }
};

export const enablePublishTaskAutoDispatch = async (target: {
  clientId: string;
  machineCode?: string | null;
  profileId: string;
  filter?: Partial<PublishTaskAutoDispatchFilter>;
}) => {
  const nextSetting = normalizePublishTaskAutoDispatchSetting({
    autoSchedulingEnabled: true,
    autoDispatchClientId: target.clientId,
    autoDispatchMachineCode: target.machineCode,
    autoDispatchProfileId: target.profileId,
    autoDispatchFilter: target.filter,
  });

  await updateUserSetting({
    key: "browserAutomation",
    data: {
      autoSchedulingEnabled: true,
      autoDispatchClientId: nextSetting.autoDispatchClientId,
      autoDispatchMachineCode: nextSetting.autoDispatchMachineCode || undefined,
      autoDispatchProfileId: nextSetting.autoDispatchProfileId,
      autoDispatchFilter: nextSetting.autoDispatchFilter,
    },
  });

  const triggerResult = {
    success: true,
    dispatched: false,
    reason: "trigger-scheduled",
    message: "已保存自动执行设置并开启，目标客户端会使用指定浏览器环境领取待执行任务",
  };
  void triggerPublishTaskAutoDispatch().catch(() => undefined);

  return {
    setting: nextSetting,
    triggerResult,
  };
};

export const disablePublishTaskAutoDispatch = async (currentSetting?: {
  clientId?: string | null;
  machineCode?: string | null;
  profileId?: string | null;
  filter?: Partial<PublishTaskAutoDispatchFilter> | null;
}) => {
  const nextSetting = normalizePublishTaskAutoDispatchSetting({
    autoSchedulingEnabled: false,
    autoDispatchClientId: currentSetting?.clientId,
    autoDispatchMachineCode: currentSetting?.machineCode,
    autoDispatchProfileId: currentSetting?.profileId,
    autoDispatchFilter: currentSetting?.filter,
  });

  await updateUserSetting({
    key: "browserAutomation",
    data: {
      autoSchedulingEnabled: false,
      autoDispatchClientId: nextSetting.autoDispatchClientId || undefined,
      autoDispatchMachineCode: nextSetting.autoDispatchMachineCode || undefined,
      autoDispatchProfileId: nextSetting.autoDispatchProfileId || undefined,
      autoDispatchFilter: nextSetting.autoDispatchFilter,
    },
  });

  return nextSetting;
};
