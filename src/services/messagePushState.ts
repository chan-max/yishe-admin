import { reactive } from "vue";
import { getUserMessagePushSetting, type UserMessagePushSetting } from "@/api/messagePush";

type MessagePushMenuState = {
  initialized: boolean;
  loading: boolean;
  enabledSceneCount: number;
  configuredSceneCount: number;
};

export const messagePushMenuState = reactive<MessagePushMenuState>({
  initialized: false,
  loading: false,
  enabledSceneCount: 0,
  configuredSceneCount: 0,
});

let pendingRefresh: Promise<void> | null = null;

function applyMessagePushSetting(setting?: UserMessagePushSetting | null) {
  messagePushMenuState.initialized = true;
  const scenes = setting?.scenes || [];
  messagePushMenuState.enabledSceneCount = scenes.filter((s) => s.enabled).length;
  messagePushMenuState.configuredSceneCount = scenes.filter((s) => s.enabled && s.channelId).length;
}

export function syncMessagePushMenuState(setting?: UserMessagePushSetting | null) {
  applyMessagePushSetting(setting);
}

export async function refreshMessagePushMenuState() {
  if (pendingRefresh) {
    return pendingRefresh;
  }

  pendingRefresh = (async () => {
    messagePushMenuState.loading = true;
    try {
      const setting = await getUserMessagePushSetting();
      applyMessagePushSetting(setting);
    } catch (error) {
      console.warn("[message-push-state] refresh failed", error);
      messagePushMenuState.initialized = true;
    } finally {
      messagePushMenuState.loading = false;
      pendingRefresh = null;
    }
  })();

  return pendingRefresh;
}
