import { computed, readonly } from 'vue'
import { storeToRefs } from 'pinia'
import { useClientNodeStore } from '@/store/modules/clientNode'

export function useClientNodeState() {
  const store = useClientNodeStore()
  store.ensureInitialized()
  const { clients, loading, onlineClients } = storeToRefs(store)

  return {
    clients: readonly(clients),
    onlineClients: computed(() => onlineClients.value),
    loading: readonly(loading),
    refresh: store.refresh
  }
}
