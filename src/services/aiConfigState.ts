import { reactive } from "vue";
import { getAiApiKeyUsageOptions, type AiApiKeyConfig } from "@/api/aiApiKey";
import { getAiSetting, type UserAiSetting } from "@/api/user";

type AiConfigState = {
  initialized: boolean;
  loading: boolean;
  missing: boolean;
  reason: string;
  enabledKeyCount: number;
  boundFeatureCount: number;
  validBoundFeatureCount: number;
  invalidBoundFeatureCount: number;
};

export const aiConfigState = reactive<AiConfigState>({
  initialized: false,
  loading: false,
  missing: false,
  reason: "",
  enabledKeyCount: 0,
  boundFeatureCount: 0,
  validBoundFeatureCount: 0,
  invalidBoundFeatureCount: 0,
});

let pendingRefresh: Promise<void> | null = null;

const normalizeKeyId = (value: unknown) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
};

const normalizeFeatureKeys = (payload?: Partial<UserAiSetting>) => {
  if (
    payload?.featureKeys &&
    typeof payload.featureKeys === "object" &&
    !Array.isArray(payload.featureKeys)
  ) {
    return payload.featureKeys;
  }
  return {};
};

const buildEnabledKeyIdSet = (keys: AiApiKeyConfig[]) => {
  return new Set(
    keys
      .filter((item) => item.available)
      .map((item) => normalizeKeyId(item.id))
      .filter((item): item is number => item !== null),
  );
};

const resolveMissingReason = (summary: {
  enabledKeyCount: number;
  boundFeatureCount: number;
  validBoundFeatureCount: number;
  invalidBoundFeatureCount: number;
}) => {
  if (summary.enabledKeyCount <= 0) {
    return "还没有可用的 AI Key";
  }
  if (summary.boundFeatureCount <= 0) {
    return "还没有给 AI 功能分配 Key";
  }
  if (summary.validBoundFeatureCount <= 0) {
    return "当前 AI 功能绑定的 Key 不可用";
  }
  if (summary.invalidBoundFeatureCount > 0) {
    return `有 ${summary.invalidBoundFeatureCount} 个 AI 功能绑定了不可用 Key`;
  }
  return "";
};

export async function refreshAiConfigState() {
  if (pendingRefresh) {
    return pendingRefresh;
  }

  pendingRefresh = (async () => {
    aiConfigState.loading = true;
    try {
      const [keyList, aiSetting] = await Promise.all([
        getAiApiKeyUsageOptions(),
        getAiSetting(),
      ]);
      const keys = Array.isArray(keyList) ? keyList : [];
      const enabledKeyIds = buildEnabledKeyIdSet(keys);
      const featureKeys = normalizeFeatureKeys(aiSetting || {});

      let boundFeatureCount = 0;
      let validBoundFeatureCount = 0;
      let invalidBoundFeatureCount = 0;

      Object.values(featureKeys).forEach((rawKeyId) => {
        const keyId = normalizeKeyId(rawKeyId);
        if (!keyId) {
          return;
        }
        boundFeatureCount += 1;
        if (enabledKeyIds.has(keyId)) {
          validBoundFeatureCount += 1;
          return;
        }
        invalidBoundFeatureCount += 1;
      });

      const nextState = {
        initialized: true,
        loading: false,
        enabledKeyCount: enabledKeyIds.size,
        boundFeatureCount,
        validBoundFeatureCount,
        invalidBoundFeatureCount,
      };
      const reason = resolveMissingReason(nextState);

      Object.assign(aiConfigState, nextState, {
        missing: !!reason,
        reason,
      });
    } catch (error) {
      console.warn("[ai-config-state] refresh failed", error);
      aiConfigState.initialized = true;
    } finally {
      aiConfigState.loading = false;
      pendingRefresh = null;
    }
  })();

  return pendingRefresh;
}
