<template>
  <el-popover
    v-if="visible"
    placement="bottom-end"
    :width="260"
    :show-arrow="false"
    :offset="8"
    trigger="click"
    :transition="''"
    popper-class="header-data-scope-popper"
    @show="handleShow"
  >
    <template #reference>
      <button type="button" class="ads-trigger" :aria-label="t('layout.dataScope.dataScope')">
        <Icon icon="ep:data-board" class="th-action-icon" :size="18" />
        <span class="th-action-label">{{ t('layout.dataScope.data') }}</span>
      </button>
    </template>

    <div class="ads-panel">
      <div class="ads-panel__title">{{ t('layout.dataScope.dataScope') }}</div>

      <el-radio-group
        v-model="currentMode"
        :disabled="switching"
        class="ads-radios"
        @change="handleModeChange"
      >
        <el-radio-button value="self">{{ t('layout.dataScope.myData') }}</el-radio-button>
        <el-radio-button value="all">{{ t('layout.dataScope.allData') }}</el-radio-button>
      </el-radio-group>

      <div class="ads-divider" />

      <el-select
        v-model="selectedUserId"
        filterable
        remote
        :remote-method="remoteSearch"
        :loading="loading"
        :disabled="switching"
        :placeholder="t('layout.dataScope.selectUserPlaceholder')"
        class="ads-select"
        size="small"
        @change="handleUserChange"
      >
        <el-option
          v-for="item in userOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>

      <div v-if="dataScopeStore.mode === 'user' && dataScopeStore.userLabel" class="ads-current">
        <span class="ads-current__label">当前查看:</span>
        <span class="ads-current__value">{{ dataScopeStore.userLabel }}</span>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@/components/Icon'
import { ElMessage } from 'element-plus'
import { getUserList } from '@/api/user'
import { useTagsView } from '@/hooks/web/useTagsView'
import { useDataScopeStore } from '@/store/modules/dataScope'
import { useUserStore } from '@/store/modules/user'

type UserOption = {
  value: string
  label: string
}

defineOptions({ name: 'AdminDataScopeSwitch' })

const { t } = useI18n()
const userStore = useUserStore()
const dataScopeStore = useDataScopeStore()
const { refreshPage } = useTagsView()

const loading = ref(false)
const loaded = ref(false)
const userOptions = ref<UserOption[]>([])
const switching = ref(false)
const selectedUserId = ref('')

const visible = computed(() => !!userStore.user?.isAdmin)

const currentMode = computed({
  get: () => dataScopeStore.mode === 'user' ? '' : dataScopeStore.mode,
  set: () => undefined,
})

async function loadUsers(query?: string) {
  if (loading.value) return
  loading.value = true
  try {
    const res = await getUserList({ currentPage: 1, pageSize: 100, search: query })
    const currentUserId = String(userStore.user?.id || '')
    userOptions.value = (res.list || res.data?.list || [])
      .map((item: any) => ({
        value: String(item.id),
        label: `${item.name || item.account} (${item.account})`,
      }))
      .filter((u: UserOption) => u.value !== currentUserId)
    loaded.value = true
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

function remoteSearch(query: string) {
  if (query) loadUsers(query)
}

async function handleShow() {
  if (!loaded.value) await loadUsers()
  if (dataScopeStore.mode === 'user') {
    selectedUserId.value = dataScopeStore.userId
  }
}

async function refreshCurrentView() {
  switching.value = true
  try {
    await refreshPage()
  } finally {
    switching.value = false
  }
}

async function handleModeChange(value: string) {
  if (value === 'self') {
    dataScopeStore.setSelf()
    selectedUserId.value = ''
    ElMessage.success(t('layout.dataScope.switchedToMyData'))
    await refreshCurrentView()
  } else if (value === 'all') {
    dataScopeStore.setAll()
    selectedUserId.value = ''
    ElMessage.success(t('layout.dataScope.switchedToAllData'))
    await refreshCurrentView()
  }
}

async function handleUserChange(userId: string) {
  if (!userId) return
  const option = userOptions.value.find((u) => u.value === userId)
  if (!option) return
  dataScopeStore.setUser(option.value, option.label)
  ElMessage.success(t('layout.dataScope.switchedToUser', { label: option.label }))
  await refreshCurrentView()
}
</script>

<style lang="scss" scoped>
.ads-trigger {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: auto;
  min-width: 48px;
  min-height: calc(var(--top-tool-height) - 14px);
  padding: 4px 6px 3px;
  margin: 0;
  color: var(--top-header-text-color);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 10px;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;

  &:hover {
    color: var(--el-color-primary);
    background-color: color-mix(in srgb, var(--top-header-hover-color) 65%, transparent 35%);
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.96);
  }
}

.ads-panel {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ads-panel__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding: 2px 4px 0;
}

.ads-radios {
  width: 100%;
  display: flex;

  :deep(.el-radio-button__inner) {
    flex: 1;
    font-size: 12px;
  }
}

.ads-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 2px 0;
}

.ads-select {
  width: 100%;
}

.ads-current {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font-size: 11px;
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  border-radius: 6px;
}

.ads-current__label {
  color: var(--el-text-color-secondary);
}

.ads-current__value {
  color: var(--el-color-primary);
  font-weight: 500;
}
</style>

<style lang="scss">
.header-data-scope-popper {
  padding: 0 !important;
  border: 1px solid var(--el-border-color-light) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%) !important;
  overflow: hidden;
}
</style>
