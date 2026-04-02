import { computed, readonly } from "vue";
import { storeToRefs } from "pinia";
import type { WebsocketConnectionVO } from "@/api/system/websocket";
import {
  getClientServiceRuntime,
  type ClientPluginKey,
  useClientNodeStore,
} from "@/store/modules/clientNode";

export function useClientNodeState() {
  const store = useClientNodeStore();
  store.ensureInitialized();
  const { clients, loading, onlineClients } = storeToRefs(store);

  return {
    clients: readonly(clients),
    onlineClients: computed(() => onlineClients.value),
    loading: readonly(loading),
    refresh: store.refresh,
  };
}

export function usePluginClientNodes(
  pluginKey: ClientPluginKey,
  options: { includeOffline?: boolean } = {},
) {
  const store = useClientNodeStore();
  store.ensureInitialized();
  const { loading } = storeToRefs(store);

  const clients = computed(() => store.getPluginClients(pluginKey, options));
  const getServiceRuntime = (
    client?: Pick<WebsocketConnectionVO, "clientInfo"> | Record<string, any> | null,
  ) => getClientServiceRuntime(client || undefined, pluginKey);

  return {
    clients: readonly(clients),
    loading: readonly(loading),
    refresh: store.refresh,
    getServiceRuntime,
  };
}
