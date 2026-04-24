import { reactive } from "vue";
import { getMessagePushSetting, type UserMessagePushSetting } from "@/api/user";

type MessagePushMenuState = {
  initialized: boolean;
  loading: boolean;
  enabled: boolean;
  defaultChannelId: number | null;
  defaultChannelName: string;
};

export const messagePushMenuState = reactive<MessagePushMenuState>({
  initialized: false,
  loading: false,
  enabled: false,
  defaultChannelId: null,
  defaultChannelName: "",
});

let pendingRefresh: Promise<void> | null = null;

function applyMessagePushSetting(setting?: UserMessagePushSetting | null) {
  messagePushMenuState.initialized = true;
  messagePushMenuState.enabled = setting?.enabled !== false;
  messagePushMenuState.defaultChannelId = setting?.defaultChannelId ?? null;
  messagePushMenuState.defaultChannelName = String(setting?.defaultMessagePush?.name || "").trim();
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
      const setting = await getMessagePushSetting();
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
