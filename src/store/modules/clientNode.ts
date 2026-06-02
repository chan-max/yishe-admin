import { computed, ref } from "vue";
import { defineStore, storeToRefs } from "pinia";
import {
  getMyClientNodeViews,
  type WebsocketConnectionVO,
} from "@/api/system/websocket";
import {
  isClientServiceRuntimeBusy,
  resolveClientServiceSummary,
} from "@/services/clientServiceRuntime";
import {
  websocketClient,
  type ClientConnectionChangedEvent,
  type PsAutomationStatusEvent,
  type ServiceRuntimeEvent,
} from "@/services/websocketClient";

export type ClientPluginKey =
  | "browser-automation"
  | "ps-automation"
  | "google-art"
  | "image-processing"
  | "video-template"
  | "file-download";
export type ClientPluginSummary = "available" | "offline";
type ClientNodeRefreshOptions = { summary?: boolean };

const listenersBound = ref(false);
const CLIENT_NODE_SUMMARY_CACHE_KEY = "yishe-admin:client-node-summary-cache";
const CLIENT_NODE_SUMMARY_CACHE_TTL_MS = 2 * 60_000;
const SERVICE_ALIAS_MAP: Partial<Record<ClientPluginKey, string[]>> = {
  "browser-automation": ["uploader", "browser"],
  "ps-automation": ["photoshop"],
  "file-download": ["file-download"],
};

const resolveConnectionViews = (response: unknown): WebsocketConnectionVO[] => {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && typeof response === "object" && Array.isArray((response as any).data)) {
    return (response as any).data;
  }
  return [];
};

export const compareClientNodes = (a: WebsocketConnectionVO, b: WebsocketConnectionVO) => {
  if (!!a.isOnline !== !!b.isOnline) {
    return a.isOnline ? -1 : 1;
  }

  const aTime = a.lastOnlineAt || a.lastOfflineAt || a.connectedAt || "";
  const bTime = b.lastOnlineAt || b.lastOfflineAt || b.connectedAt || "";
  if (aTime !== bTime) {
    return aTime > bTime ? -1 : 1;
  }

  return String(a.id || "").localeCompare(String(b.id || ""));
};

export const normalizeClientPluginKey = (value?: string | null) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  const aliasMap: Record<string, ClientPluginKey> = {
    uploader: "browser-automation",
    browser: "browser-automation",
    photoshop: "ps-automation",
  };
  return aliasMap[normalized] || (normalized as ClientPluginKey);
};

const readClientNodeSummaryCache = (): WebsocketConnectionVO[] => {
  try {
    const raw = sessionStorage.getItem(CLIENT_NODE_SUMMARY_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const updatedAt = Number(parsed?.updatedAt || 0);
    if (!updatedAt || Date.now() - updatedAt > CLIENT_NODE_SUMMARY_CACHE_TTL_MS) {
      return [];
    }
    return resolveConnectionViews(parsed?.items).sort(compareClientNodes);
  } catch {
    return [];
  }
};

const writeClientNodeSummaryCache = (items: WebsocketConnectionVO[]) => {
  try {
    sessionStorage.setItem(
      CLIENT_NODE_SUMMARY_CACHE_KEY,
      JSON.stringify({
        updatedAt: Date.now(),
        items,
      }),
    );
  } catch {
    // 缓存只是为了改善下拉首屏体验，失败不影响真实数据刷新。
  }
};

const mergeServiceRuntime = (
  previous?: Record<string, any> | null,
  incoming?: Record<string, any> | null,
) => {
  const prev = previous && typeof previous === "object" ? previous : {};
  const next = incoming && typeof incoming === "object" ? incoming : {};
  const prevDetails = prev.details && typeof prev.details === "object" ? prev.details : {};
  const nextDetails = next.details && typeof next.details === "object" ? next.details : {};
  const mergedDetails = {
    ...prevDetails,
    ...nextDetails,
    profiles: Array.isArray(nextDetails.profiles) ? nextDetails.profiles : prevDetails.profiles,
    instances: Array.isArray(nextDetails.instances)
      ? nextDetails.instances
      : prevDetails.instances,
    activeProfile: nextDetails.activeProfile ?? prevDetails.activeProfile,
    activeProfileId: nextDetails.activeProfileId ?? prevDetails.activeProfileId,
    browserConnected: nextDetails.browserConnected ?? prevDetails.browserConnected,
    hasInstance: nextDetails.hasInstance ?? prevDetails.hasInstance,
    profilesRootDir: nextDetails.profilesRootDir ?? prevDetails.profilesRootDir,
    workspaceDir: nextDetails.workspaceDir ?? prevDetails.workspaceDir,
    connection: nextDetails.connection ?? prevDetails.connection,
    pageCount: nextDetails.pageCount ?? prevDetails.pageCount,
  };

  const merged: Record<string, any> = {
    ...prev,
    ...next,
    details: mergedDetails,
  };

  const incomingState = String(next.state || "").trim().toLowerCase();
  const incomingTaskId = String(next.currentTaskId || "").trim();
  const claimsBusy =
    next.busy === true || (incomingState === "busy" && !!incomingTaskId);
  const reportsIdle = next.busy === false || incomingState === "idle";
  const implicitIdle =
    !claimsBusy &&
    (reportsIdle ||
      (!!incomingState && incomingState !== "busy") ||
      (next.connected === true && next.available === true && next.busy !== true));

  if (reportsIdle || implicitIdle) {
    merged.busy = false;
    if (!incomingTaskId || !claimsBusy) {
      merged.currentTaskId = null;
    }
    if (merged.state === "busy" || incomingState === "busy" || implicitIdle) {
      merged.state =
        incomingState === "idle"
          ? "idle"
          : next.connected === true || merged.connected === true
            ? next.available === true || merged.available === true
              ? "idle"
              : "connected"
            : merged.state === "busy"
              ? "connected"
              : merged.state;
    }
    if (!Object.prototype.hasOwnProperty.call(nextDetails, "activeJobsCount")) {
      mergedDetails.activeJobsCount = 0;
    }
    if (!Object.prototype.hasOwnProperty.call(nextDetails, "queueCount")) {
      mergedDetails.queueCount = 0;
    }
    if (mergedDetails.photoshopStatus === "busy") {
      mergedDetails.photoshopStatus =
        next.available === true || merged.available === true || mergedDetails.photoshopReady === true
          ? "ready"
          : "starting";
    }
  }

  const nextCheckedAt = Date.parse(String(next.lastCheckedAt || ""));
  const prevCheckedAt = Date.parse(String(prev.lastCheckedAt || ""));
  if (
    Number.isFinite(nextCheckedAt) &&
    (!Number.isFinite(prevCheckedAt) || nextCheckedAt >= prevCheckedAt)
  ) {
    merged.busy = next.busy === true;
    merged.currentTaskId = next.currentTaskId ?? null;
    if (next.state !== undefined) {
      merged.state = next.state;
    }
    merged.lastCheckedAt = next.lastCheckedAt;
  }

  return merged;
};

const mergeServiceMap = (
  previous?: Record<string, any> | null,
  incoming?: Record<string, any> | null,
) => {
  const prev = previous && typeof previous === "object" ? previous : {};
  const next = incoming && typeof incoming === "object" ? incoming : {};
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const merged: Record<string, any> = {};

  Object.entries(SERVICE_ALIAS_MAP).forEach(([pluginKey, aliasList]) => {
    const aliases = aliasList || [];
    if ([pluginKey, ...aliases].some((key) => prev[key] || next[key])) {
      keys.add(pluginKey);
    }
  });

  keys.forEach((key) => {
    const aliases = SERVICE_ALIAS_MAP[key as ClientPluginKey] || [];
    const previousRuntime = prev[key] || aliases.map((alias) => prev[alias]).find(Boolean);
    const incomingRuntime = next[key] || aliases.map((alias) => next[alias]).find(Boolean);
    merged[key] = mergeServiceRuntime(previousRuntime, incomingRuntime);
  });

  return merged;
};

const mergeClientNodeView = (
  previous: WebsocketConnectionVO | undefined,
  incoming: WebsocketConnectionVO,
): WebsocketConnectionVO => {
  const merged = {
    ...(previous || {}),
    ...incoming,
    clientInfo: {
      ...(previous?.clientInfo || {}),
      ...(incoming.clientInfo || {}),
      services: mergeServiceMap(previous?.clientInfo?.services, incoming.clientInfo?.services),
    },
  } as WebsocketConnectionVO;

  const psAutomation = merged.clientInfo?.psAutomation;
  if (psAutomation?.running === true) {
    const psRuntime = getClientServiceRuntime(merged, "ps-automation");
    const hasActivePsdWork =
      Number(psAutomation.queueCount ?? 0) > 0 ||
      String(psAutomation.currentPsSetId || "").trim().length > 0;
    if (psRuntime && !isClientServiceRuntimeBusy(psRuntime) && !hasActivePsdWork) {
      merged.clientInfo = {
        ...merged.clientInfo,
        psAutomation: {
          ...psAutomation,
          running: false,
          queueCount: 0,
        },
      };
    }
  }

  return merged;
};

export const getClientServiceRuntime = (
  client: Pick<WebsocketConnectionVO, "clientInfo"> | Record<string, any> | undefined | null,
  pluginKey: ClientPluginKey,
) => {
  const services = client?.clientInfo?.services || {};
  if (pluginKey === "browser-automation") {
    return services["browser-automation"] || services.uploader || null;
  }
  if (pluginKey === "ps-automation") {
    return services["ps-automation"] || services.photoshop || null;
  }
  if (pluginKey === "video-template") {
    return services["video-template"] || null;
  }
  if (pluginKey === "image-processing") {
    return services["image-processing"] || null;
  }
  if (pluginKey === "file-download") {
    return services["file-download"] || null;
  }
  return services["google-art"] || services.googleArt || null;
};

export const useClientNodeStore = defineStore("client-node", () => {
  const clients = ref<WebsocketConnectionVO[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const detailLevel = ref<"none" | "summary" | "full">("none");

  const replaceClient = (
    clientId: string,
    updater: (previous?: WebsocketConnectionVO) => WebsocketConnectionVO,
  ) => {
    const index = clients.value.findIndex((item) => item.id === clientId);
    if (index >= 0) {
      const next = [...clients.value];
      next[index] = updater(next[index]);
      clients.value = next.sort(compareClientNodes);
      return;
    }
    clients.value = [updater(undefined), ...clients.value].sort(compareClientNodes);
  };

  const refresh = async (options: ClientNodeRefreshOptions = {}) => {
    loading.value = true;
    try {
      const summary = options.summary === true;
      const response = await getMyClientNodeViews({ summary });
      const previousMap = new Map(clients.value.map((item) => [item.id, item]));
      clients.value = resolveConnectionViews(response)
        .map((item) => mergeClientNodeView(previousMap.get(item.id), item))
        .sort(compareClientNodes);
      detailLevel.value = summary ? "summary" : "full";
      if (summary) {
        writeClientNodeSummaryCache(clients.value);
      }
    } finally {
      loading.value = false;
    }
  };

  const pluginStatusMap = computed<Record<ClientPluginKey, ClientPluginSummary>>(() => {
    const summary: Record<ClientPluginKey, ClientPluginSummary> = {
      "browser-automation": "offline",
      "ps-automation": "offline",
      "google-art": "offline",
      "image-processing": "offline",
      "video-template": "offline",
      "file-download": "offline",
    };

    (
      [
        "browser-automation",
        "ps-automation",
        "google-art",
        "image-processing",
        "video-template",
        "file-download",
      ] as ClientPluginKey[]
    ).forEach(
      (pluginKey) => {
        let pluginSummary: ClientPluginSummary = "offline";

        clients.value.forEach((client) => {
          if (!client.isOnline) return;
          const runtime = getClientServiceRuntime(client, pluginKey);
          const runtimeSummary = resolveClientServiceSummary(runtime);

          if (runtimeSummary === "available") {
            pluginSummary = "available";
            return;
          }
        });

        summary[pluginKey] = pluginSummary;
      },
    );

    return summary;
  });

  const onlineClients = computed(() => clients.value.filter((item) => item.isOnline));

  const getPluginClients = (
    pluginKey: ClientPluginKey,
    options: { includeOffline?: boolean } = {},
  ) =>
    clients.value
      .filter((client) => !!getClientServiceRuntime(client, pluginKey))
      .filter((client) => options.includeOffline || !!client.isOnline)
      .sort(compareClientNodes);

  const handleServiceRuntime = (event: ServiceRuntimeEvent) => {
    const pluginKey = normalizeClientPluginKey(event.pluginKey || event.service);
    if (!pluginKey || !event.clientId) return;

    replaceClient(
      event.clientId,
      (previous) =>
        ({
          ...(previous || {
            id: event.clientId,
            namespace: "/ws",
            connectedAt: event.reportedAt || null,
            lastOnlineAt: event.reportedAt || null,
            lastOfflineAt: null,
            isOnline: true,
            nodeStatus: "online",
          }),
          lastOnlineAt: event.reportedAt || previous?.lastOnlineAt || previous?.connectedAt || null,
          lastOfflineAt: previous?.lastOfflineAt || null,
          isOnline: true,
          nodeStatus: "online",
          clientInfo: {
            ...(previous?.clientInfo || {}),
            services: {
              ...(previous?.clientInfo?.services || {}),
              [pluginKey]: mergeServiceRuntime(
                getClientServiceRuntime(previous, pluginKey),
                event.runtime || {},
              ),
            },
          },
        }) as WebsocketConnectionVO,
    );
  };

  const handleClientConnectionChanged = (event: ClientConnectionChangedEvent) => {
    const clientId = event.client?.clientId;
    if (!clientId) return;

    if (event.action === "removed") {
      replaceClient(
        clientId,
        (previous) =>
          ({
            ...(previous || {
              id: clientId,
              namespace: "/ws",
              connectedAt: event.client.connectedAt || event.reportedAt || null,
            }),
            isOnline: false,
            nodeStatus: "offline",
            lastOnlineAt:
              previous?.lastOnlineAt || event.client.connectedAt || previous?.connectedAt || null,
            lastOfflineAt: event.reportedAt || previous?.lastOfflineAt || null,
          }) as WebsocketConnectionVO,
      );
      return;
    }

    const eventClient = event.client as any;
    replaceClient(
      clientId,
      (previous) =>
        ({
          ...(previous || {
            id: clientId,
            namespace: "/ws",
            connectedAt: event.client.connectedAt || event.reportedAt || null,
          }),
          connectedAt: event.client.connectedAt || previous?.connectedAt || null,
          lastOnlineAt:
            event.client.connectedAt || event.reportedAt || previous?.lastOnlineAt || null,
          lastOfflineAt: previous?.lastOfflineAt || null,
          isOnline: true,
          nodeStatus: "online",
          clientInfo: {
            ...(previous?.clientInfo || {}),
            appVersion: event.client.appVersion ?? previous?.clientInfo?.appVersion,
            workspaceDirectory:
              eventClient.workspaceDirectory ?? previous?.clientInfo?.workspaceDirectory,
            machine: event.client.machine ?? previous?.clientInfo?.machine,
            location: event.client.location ?? previous?.clientInfo?.location,
            services: mergeServiceMap(previous?.clientInfo?.services, event.client.services || {}),
            psAutomation: event.client.psAutomation ?? previous?.clientInfo?.psAutomation,
          },
        }) as WebsocketConnectionVO,
    );
  };

  const handlePsAutomationStatus = (event: PsAutomationStatusEvent) => {
    if (!event.clientId) return;
    replaceClient(
      event.clientId,
      (previous) =>
        ({
          ...(previous || {
            id: event.clientId,
            namespace: "/ws",
            connectedAt: event.updatedAt || null,
            lastOnlineAt: event.updatedAt || null,
            lastOfflineAt: null,
            isOnline: true,
            nodeStatus: "online",
          }),
          lastOnlineAt: event.updatedAt || previous?.lastOnlineAt || previous?.connectedAt || null,
          lastOfflineAt: previous?.lastOfflineAt || null,
          isOnline: true,
          nodeStatus: "online",
          clientInfo: {
            ...(previous?.clientInfo || {}),
            psAutomation: {
              ...(previous?.clientInfo?.psAutomation || {}),
              ...event,
            },
          },
        }) as WebsocketConnectionVO,
    );
  };

  const ensureInitialized = (options: ClientNodeRefreshOptions = {}) => {
    if (!listenersBound.value) {
      listenersBound.value = true;
      websocketClient.events.on("serviceRuntime", handleServiceRuntime);
      websocketClient.events.on("clientConnectionChanged", handleClientConnectionChanged);
      websocketClient.events.on("psAutomationStatus", handlePsAutomationStatus);
    }
    if (!initialized.value) {
      initialized.value = true;
      if (options.summary === true && !clients.value.length) {
        const cachedClients = readClientNodeSummaryCache();
        if (cachedClients.length) {
          clients.value = cachedClients;
          detailLevel.value = "summary";
        }
      }
      void refresh(options);
      return;
    }
    if (options.summary !== true && detailLevel.value !== "full") {
      void refresh(options);
    }
  };

  return {
    clients,
    onlineClients,
    loading,
    initialized,
    pluginStatusMap,
    refresh,
    ensureInitialized,
    getPluginClients,
  };
});

export const useClientNodeStoreRefs = () => {
  const store = useClientNodeStore();
  store.ensureInitialized();
  return {
    store,
    ...storeToRefs(store),
  };
};
