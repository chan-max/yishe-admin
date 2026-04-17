import { computed, ref } from "vue";
import { defineStore, storeToRefs } from "pinia";
import {
  getMyRuntimeWebsocketConnectionViews,
  type WebsocketConnectionVO,
} from "@/api/system/websocket";
import { resolveClientServiceSummary } from "@/services/clientServiceRuntime";
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
  | "video-template";
export type ClientPluginSummary = "available" | "offline";

const listenersBound = ref(false);

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
  return aliasMap[normalized] || normalized;
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
  return services["google-art"] || services.googleArt || null;
};

export const useClientNodeStore = defineStore("client-node", () => {
  const clients = ref<WebsocketConnectionVO[]>([]);
  const loading = ref(false);
  const initialized = ref(false);

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

  const refresh = async () => {
    loading.value = true;
    try {
      const response = await getMyRuntimeWebsocketConnectionViews();
      clients.value = resolveConnectionViews(response).sort(compareClientNodes);
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
    };

    (
      [
        "browser-automation",
        "ps-automation",
        "google-art",
        "image-processing",
        "video-template",
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
              [pluginKey]: {
                ...(previous?.clientInfo?.services?.[pluginKey] || {}),
                ...(event.runtime || {}),
              },
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
              event.client.workspaceDirectory ?? previous?.clientInfo?.workspaceDirectory,
            machine: event.client.machine ?? previous?.clientInfo?.machine,
            location: event.client.location ?? previous?.clientInfo?.location,
            services: {
              ...(previous?.clientInfo?.services || {}),
              ...(event.client.services || {}),
            },
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

  const ensureInitialized = () => {
    if (initialized.value) return;
    initialized.value = true;
    if (!listenersBound.value) {
      listenersBound.value = true;
      websocketClient.events.on("serviceRuntime", handleServiceRuntime);
      websocketClient.events.on("clientConnectionChanged", handleClientConnectionChanged);
      websocketClient.events.on("psAutomationStatus", handlePsAutomationStatus);
    }
    void refresh();
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
