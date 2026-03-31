import { defineStore } from 'pinia'
import { store } from '@/store'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

export type AdminDataScopeMode = 'self' | 'user' | 'all'

export type AdminDataScopeState = {
  mode: AdminDataScopeMode
  userId: string
  userLabel: string
}

const { wsCache } = useCache()

const DEFAULT_SCOPE: AdminDataScopeState = {
  mode: 'self',
  userId: '',
  userLabel: ''
}

function readCachedScope(): AdminDataScopeState {
  const cached = wsCache.get(CACHE_KEY.ADMIN_DATA_SCOPE)
  if (!cached || typeof cached !== 'object') {
    return { ...DEFAULT_SCOPE }
  }

  const mode = cached.mode === 'all' || cached.mode === 'user' ? cached.mode : 'self'
  return {
    mode,
    userId: String(cached.userId || ''),
    userLabel: String(cached.userLabel || '')
  }
}

function persistScope(scope: AdminDataScopeState) {
  wsCache.set(CACHE_KEY.ADMIN_DATA_SCOPE, scope)
}

export const useDataScopeStore = defineStore('admin-data-scope', {
  state: (): AdminDataScopeState => readCachedScope(),
  getters: {
    headerPayload(state) {
      return {
        mode: state.mode,
        userId: state.mode === 'user' ? state.userId : ''
      }
    }
  },
  actions: {
    reset() {
      this.mode = 'self'
      this.userId = ''
      this.userLabel = ''
      persistScope({ ...DEFAULT_SCOPE })
    },
    setSelf() {
      this.mode = 'self'
      this.userId = ''
      this.userLabel = ''
      persistScope({
        mode: this.mode,
        userId: this.userId,
        userLabel: this.userLabel
      })
    },
    setAll() {
      this.mode = 'all'
      this.userId = ''
      this.userLabel = ''
      persistScope({
        mode: this.mode,
        userId: this.userId,
        userLabel: this.userLabel
      })
    },
    setUser(userId: string, userLabel: string) {
      this.mode = 'user'
      this.userId = String(userId || '')
      this.userLabel = userLabel || ''
      persistScope({
        mode: this.mode,
        userId: this.userId,
        userLabel: this.userLabel
      })
    }
  }
})

export const useDataScopeStoreWithOut = () => useDataScopeStore(store)
