import { computed, ref } from "vue";
import { useClientNodeStore, getClientServiceRuntime } from "@/store/modules/clientNode";
import type { WebsocketConnectionVO } from "@/api/system/websocket";

interface DownloadHistoryEntry {
  url: string;
  filePath?: string;
  fileSize?: number;
  success: boolean;
  message: string;
  clientId: string;
  clientName: string;
  timestamp: Date;
}

export const useFileDownloadExecutionContext = () => {
  const store = useClientNodeStore();
  store.ensureInitialized();

  const selectedClientId = ref<string>("");
  const downloadHistory = ref<DownloadHistoryEntry[]>([]);
  const isDownloading = ref(false);

  const availableClients = computed(() =>
    store.clients.filter((client) => {
      if (!client.isOnline) return false;
      const runtime = getClientServiceRuntime(client, "file-download");
      return !!runtime;
    }),
  );

  const selectedClient = computed<WebsocketConnectionVO | undefined>(() =>
    store.clients.find((c) => c.id === selectedClientId.value),
  );

  const selectedClientDisplayName = computed(() => {
    const client = selectedClient.value;
    if (!client) return "未选择客户端";
    const parts: string[] = [];
    if (client.clientInfo?.machine?.code) {
      parts.push(client.clientInfo.machine.code);
    } else {
      parts.push(String(client.id).slice(0, 8));
    }
    if (client.clientInfo?.app?.version) {
      parts.push(`v${client.clientInfo.app.version}`);
    }
    return parts.join(" · ");
  });

  const addHistoryEntry = (entry: Omit<DownloadHistoryEntry, "timestamp">) => {
    downloadHistory.value.unshift({ ...entry, timestamp: new Date() });
    // Keep last 50 entries
    if (downloadHistory.value.length > 50) {
      downloadHistory.value = downloadHistory.value.slice(0, 50);
    }
  };

  const clearHistory = () => {
    downloadHistory.value = [];
  };

  return {
    selectedClientId,
    downloadHistory,
    isDownloading,
    availableClients,
    selectedClient,
    selectedClientDisplayName,
    addHistoryEntry,
    clearHistory,
  };
};
