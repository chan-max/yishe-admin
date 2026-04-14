import { getUserSetting, updateUserSetting } from "@/api/user";
import { triggerPublishTaskAutoDispatch } from "@/api/system/websocket";

export interface PublishTaskAutoDispatchSetting {
  autoSchedulingEnabled: boolean;
  autoDispatchClientId: string;
  autoDispatchProfileId: string;
}

const normalizePublishTaskAutoDispatchSetting = (value?: any): PublishTaskAutoDispatchSetting => ({
  autoSchedulingEnabled: !!value?.autoSchedulingEnabled,
  autoDispatchClientId: String(value?.autoDispatchClientId || "").trim(),
  autoDispatchProfileId: String(value?.autoDispatchProfileId || "").trim(),
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
  profileId: string;
}) => {
  const nextSetting = normalizePublishTaskAutoDispatchSetting({
    autoSchedulingEnabled: true,
    autoDispatchClientId: target.clientId,
    autoDispatchProfileId: target.profileId,
  });

  await updateUserSetting({
    key: "browserAutomation",
    data: {
      autoSchedulingEnabled: true,
      autoDispatchClientId: nextSetting.autoDispatchClientId,
      autoDispatchProfileId: nextSetting.autoDispatchProfileId,
    },
  });

  let triggerResult: any;
  try {
    triggerResult = await triggerPublishTaskAutoDispatch();
  } catch (error: any) {
    triggerResult = {
      success: false,
      dispatched: false,
      reason: "trigger-failed",
      message: error?.message || "自动调度已开启，但立即触发失败",
    };
  }

  return {
    setting: nextSetting,
    triggerResult,
  };
};

export const disablePublishTaskAutoDispatch = async (currentSetting?: {
  clientId?: string | null;
  profileId?: string | null;
}) => {
  const nextSetting = normalizePublishTaskAutoDispatchSetting({
    autoSchedulingEnabled: false,
    autoDispatchClientId: currentSetting?.clientId,
    autoDispatchProfileId: currentSetting?.profileId,
  });

  await updateUserSetting({
    key: "browserAutomation",
    data: {
      autoSchedulingEnabled: false,
      autoDispatchClientId: nextSetting.autoDispatchClientId || undefined,
      autoDispatchProfileId: nextSetting.autoDispatchProfileId || undefined,
    },
  });

  return nextSetting;
};

export const triggerPublishTaskAutoDispatchNow = async () => {
  return triggerPublishTaskAutoDispatch();
};
