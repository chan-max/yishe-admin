import { computed, readonly, ref, watch } from "vue";
import type {
  BrowserAutomationClientVO,
  BrowserAutomationProfilesPayload,
  BrowserAutomationProfileSummary,
  BrowserAutomationServiceStatus,
} from "@/api/external/browserAutomation";
import { usePluginClientNodes } from "@/services/clientNodeState";
import {
  getBrowserAutomationRuntimeHint,
  getBrowserAutomationServiceText,
} from "@/services/browserAutomationRuntime";
import { formatDate } from "@/utils/formatTime";

export const ACTIVE_BROWSER_AUTOMATION_PROFILE_VALUE = "__active__";

export interface BrowserAutomationExecutionClient extends BrowserAutomationClientVO {
  runtime: BrowserAutomationServiceStatus | null;
}

export interface BrowserAutomationExecutionClientOption {
  value: string;
  label: string;
  meta: string;
  hint: string;
  client: BrowserAutomationExecutionClient;
}

export interface BrowserAutomationExecutionProfileOption {
  value: string;
  label: string;
  meta: string;
  profile: BrowserAutomationProfileSummary | null;
  isActiveOption?: boolean;
}

export const createEmptyBrowserAutomationProfilesPayload =
  (): BrowserAutomationProfilesPayload => ({
    activeProfileId: null,
    items: [],
  });

const normalizeProfileString = (value: unknown) => String(value || "").trim();

const isPlainProfileRecord = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const hasBrowserAutomationProfileSignal = (source: Record<string, any>) =>
  [
    source.name,
    source.account,
    source.remark,
    source.browserVersion,
    source.userDataDir,
    source.createdAt,
    source.updatedAt,
    source.lastUsedAt,
  ].some((item) => !!normalizeProfileString(item)) ||
  Array.isArray(source.platforms) ||
  typeof source.debugPort === "number" ||
  source.exists === true ||
  source.isActive === true ||
  isPlainProfileRecord(source.loginSummary);

const hasObviousNonProfileShape = (source: Record<string, any>) =>
  [
    "clientId",
    "machine",
    "location",
    "nodeStatus",
    "runtime",
    "services",
    "connection",
    "instances",
    "pages",
  ].some((key) => key in source);

const normalizeBrowserAutomationProfileItem = (
  value: unknown,
): BrowserAutomationProfileSummary | null => {
  if (!isPlainProfileRecord(value)) {
    return null;
  }

  const profileId = normalizeProfileString(value.id);
  if (!profileId) {
    return null;
  }

  if (!hasBrowserAutomationProfileSignal(value) && hasObviousNonProfileShape(value)) {
    return null;
  }

  const platforms = Array.isArray(value.platforms)
    ? value.platforms.map((item) => normalizeProfileString(item)).filter(Boolean)
    : undefined;
  const loginSummary = isPlainProfileRecord(value.loginSummary) ? value.loginSummary : undefined;

  return {
    id: profileId,
    name: normalizeProfileString(value.name) || undefined,
    remark: normalizeProfileString(value.remark) || undefined,
    account: normalizeProfileString(value.account) || undefined,
    platforms,
    debugPort: typeof value.debugPort === "number" ? value.debugPort : null,
    browserVersion: normalizeProfileString(value.browserVersion) || undefined,
    loginSummary,
    createdAt: normalizeProfileString(value.createdAt) || null,
    updatedAt: normalizeProfileString(value.updatedAt) || null,
    lastUsedAt: normalizeProfileString(value.lastUsedAt) || null,
    userDataDir: normalizeProfileString(value.userDataDir) || undefined,
    exists: value.exists === true,
    isActive: value.isActive === true,
  };
};

const normalizeBrowserAutomationProfileItems = (
  items: unknown,
): BrowserAutomationProfileSummary[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  const profileMap = new Map<string, BrowserAutomationProfileSummary>();

  items.forEach((item) => {
    const normalizedItem = normalizeBrowserAutomationProfileItem(item);
    if (!normalizedItem?.id || profileMap.has(normalizedItem.id)) {
      return;
    }

    profileMap.set(normalizedItem.id, normalizedItem);
  });

  return Array.from(profileMap.values());
};

export const normalizeBrowserAutomationProfilesPayload = (
  payload?: Partial<BrowserAutomationProfilesPayload> | Record<string, any> | null,
): BrowserAutomationProfilesPayload => {
  const rawPayload = (payload || {}) as Record<string, any>;
  const normalizedActiveProfile = normalizeBrowserAutomationProfileItem(rawPayload.activeProfile);
  const normalizedActiveProfileId =
    normalizeProfileString(rawPayload.activeProfileId) || normalizedActiveProfile?.id || null;
  const normalizedItems = normalizeBrowserAutomationProfileItems(
    Array.isArray(rawPayload.items) ? rawPayload.items : rawPayload.profiles,
  );

  if (
    normalizedActiveProfile &&
    !normalizedItems.some((item) => item.id === normalizedActiveProfile.id)
  ) {
    normalizedItems.unshift(normalizedActiveProfile);
  }

  return {
    activeProfileId: normalizedActiveProfileId,
    workspaceDir: rawPayload.workspaceDir,
    profilesRootDir: rawPayload.profilesRootDir,
    items: normalizedItems,
  };
};

const hasBrowserAutomationProfilesPayloadSignal = (
  payload?: Partial<BrowserAutomationProfilesPayload> | Record<string, any> | null,
) => {
  if (!isPlainProfileRecord(payload)) {
    return false;
  }
  const source = payload as Record<string, any>;

  return (
    Array.isArray(source.items) ||
    Array.isArray(source.profiles) ||
    normalizeProfileString(source.activeProfileId) ||
    isPlainProfileRecord(source.activeProfile)
  );
};

const hasBrowserAutomationProfileListSignal = (
  payload?: Partial<BrowserAutomationProfilesPayload> | Record<string, any> | null,
) => {
  if (!isPlainProfileRecord(payload)) {
    return false;
  }
  const source = payload as Record<string, any>;
  return Array.isArray(source.items) || Array.isArray(source.profiles);
};

const formatTimeText = (value?: string | null) =>
  value ? formatDate(new Date(value), "YYYY-MM-DD HH:mm") : "";

const buildClientMeta = (client: BrowserAutomationExecutionClient) => {
  const parts = [
    client.location?.city || client.location?.region || client.location?.country || "",
    client.appVersion || "",
    getBrowserAutomationServiceText(client.runtime),
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return parts.join(" · ");
};

const buildProfileMeta = (
  profile: BrowserAutomationProfileSummary,
  options: { active?: boolean } = {},
) => {
  const parts = [
    profile.account || "",
    profile.lastUsedAt
      ? `最近使用 ${formatTimeText(profile.lastUsedAt)}`
      : profile.updatedAt
        ? `最近更新 ${formatTimeText(profile.updatedAt)}`
        : "",
    options.active ? "当前活动环境" : "",
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return parts.join(" · ") || (options.active ? "当前活动环境" : "已配置环境");
};

const buildProfileLabel = (profile?: BrowserAutomationProfileSummary | null) => {
  const profileId = String(profile?.id || "").trim();
  const profileName = String(profile?.name || "").trim();

  if (profileName && profileName !== profileId) {
    return `${profileName} (${profileId})`;
  }

  return profileId || profileName || "未命名环境";
};

export function useBrowserAutomationExecutionContext() {
  const {
    clients: rawClients,
    loading,
    refresh,
    getServiceRuntime,
  } = usePluginClientNodes("browser-automation", { includeOffline: true });

  const selectedClientId = ref("");
  const selectedProfileValue = ref("");
  const profilePayload = ref<BrowserAutomationProfilesPayload>(
    createEmptyBrowserAutomationProfilesPayload(),
  );

  const clients = computed<BrowserAutomationExecutionClient[]>(() =>
    rawClients.value.map((client: any) => ({
      clientId: client.id,
      isOnline: client.isOnline,
      nodeStatus: client.nodeStatus,
      connectedAt: client.connectedAt,
      lastOnlineAt: client.lastOnlineAt,
      lastOfflineAt: client.lastOfflineAt,
      appVersion: client.clientInfo?.appVersion || null,
      machine: client.clientInfo?.machine || null,
      location: client.clientInfo?.location || null,
      uploader: (getServiceRuntime(client) as BrowserAutomationServiceStatus | null) || null,
      runtime: (getServiceRuntime(client) as BrowserAutomationServiceStatus | null) || null,
    })),
  );

  const selectedClient = computed(
    () => clients.value.find((item) => item.clientId === selectedClientId.value) || null,
  );

  const selectedClientName = computed(
    () => selectedClient.value?.machine?.code || selectedClient.value?.clientId || "未选择客户端",
  );

  const clientOptions = computed<BrowserAutomationExecutionClientOption[]>(() =>
    clients.value.map((client) => ({
      value: client.clientId,
      label: client.machine?.code || client.clientId,
      meta: buildClientMeta(client),
      hint: getBrowserAutomationRuntimeHint(client.runtime),
      client,
    })),
  );

  const profileItems = computed(() =>
    Array.isArray(profilePayload.value?.items) ? profilePayload.value.items : [],
  );

  const activeProfile = computed(() => {
    const activeProfileId = String(profilePayload.value?.activeProfileId || "").trim();
    if (!activeProfileId) {
      return null;
    }

    return (
      profileItems.value.find((item) => String(item?.id || "").trim() === activeProfileId) || null
    );
  });

  const effectiveProfileId = computed(() =>
    selectedProfileValue.value === ACTIVE_BROWSER_AUTOMATION_PROFILE_VALUE
      ? ""
      : selectedProfileValue.value,
  );

  const selectedProfile = computed(() => {
    const profileId = effectiveProfileId.value;
    if (!profileId) {
      return null;
    }
    return profileItems.value.find((item) => String(item?.id || "").trim() === profileId) || null;
  });

  const selectedEnvironmentLabel = computed(() => {
    if (selectedProfile.value) {
      return buildProfileLabel(selectedProfile.value);
    }
    if (activeProfile.value) {
      return buildProfileLabel(activeProfile.value);
    }
    return "当前活动环境";
  });

  const profileOptions = computed<BrowserAutomationExecutionProfileOption[]>(() => {
    if (!profileItems.value.length) {
      return [
        {
          value:
            String(activeProfile.value?.id || "").trim() || ACTIVE_BROWSER_AUTOMATION_PROFILE_VALUE,
          label: activeProfile.value ? buildProfileLabel(activeProfile.value) : "当前活动环境",
          meta: activeProfile.value
            ? buildProfileMeta(activeProfile.value, { active: true })
            : "跟随客户端当前浏览器环境执行",
          profile: activeProfile.value,
          isActiveOption: true,
        },
      ];
    }

    const activeProfileId = String(activeProfile.value?.id || "").trim();
    const options: BrowserAutomationExecutionProfileOption[] = [];

    profileItems.value.forEach((profile) => {
      const profileId = String(profile?.id || "").trim();
      if (!profileId) {
        return;
      }
      options.push({
        value: profileId,
        label: buildProfileLabel(profile),
        meta: buildProfileMeta(profile, { active: profileId === activeProfileId }),
        profile,
        isActiveOption: profileId === activeProfileId,
      });
    });

    return options;
  });

  const syncClientSelection = () => {
    if (loading.value || !clients.value.length) {
      return;
    }

    if (
      selectedClientId.value &&
      !clients.value.some((item) => item.clientId === selectedClientId.value)
    ) {
      selectedClientId.value = "";
    }
  };

  const syncProfileSelection = () => {
    if (selectedProfileValue.value === ACTIVE_BROWSER_AUTOMATION_PROFILE_VALUE) {
      return;
    }

    if (
      selectedProfileValue.value &&
      profileItems.value.some(
        (item) => String(item?.id || "").trim() === selectedProfileValue.value,
      )
    ) {
      return;
    }

    selectedProfileValue.value = "";
  };

  const setProfilesPayload = (payload?: Partial<BrowserAutomationProfilesPayload> | null) => {
    if (!hasBrowserAutomationProfilesPayloadSignal(payload) && selectedProfileValue.value) {
      return;
    }

    if (
      selectedProfileValue.value &&
      profileItems.value.length &&
      !hasBrowserAutomationProfileListSignal(payload)
    ) {
      return;
    }

    profilePayload.value = normalizeBrowserAutomationProfilesPayload(payload);
    syncProfileSelection();
  };

  const resetProfiles = () => {
    setProfilesPayload(createEmptyBrowserAutomationProfilesPayload());
    selectedProfileValue.value = "";
  };

  watch(clients, () => {
    syncClientSelection();
  });

  return {
    loading: readonly(loading),
    refreshClients: refresh,
    clients,
    clientOptions,
    selectedClientId,
    selectedClient,
    selectedClientName,
    profilePayload: readonly(profilePayload),
    profileItems,
    profileOptions,
    activeProfile,
    selectedProfileValue,
    selectedProfile,
    effectiveProfileId,
    selectedEnvironmentLabel,
    syncClientSelection,
    syncProfileSelection,
    setProfilesPayload,
    resetProfiles,
  };
}
