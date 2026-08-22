<template>
  <el-popover
    v-if="visible"
    placement="bottom-end"
    :width="220"
    :show-arrow="false"
    :offset="6"
    trigger="click"
    :transition="''"
    popper-class="header-data-scope-popper"
    @show="handleShow"
  >
    <template #reference>
      <button
        type="button"
        class="ads-trigger"
        :class="{ 'ads-trigger--active': dataScopeStore.mode !== 'self' }"
        :aria-label="t('layout.dataScope.dataScope')"
      >
        <div class="ads-trigger__icon-wrap">
          <Icon
            :icon="dataScopeStore.mode === 'all' ? 'ep:data-board' : dataScopeStore.mode === 'user' ? 'ep:avatar' : 'ep:user'"
            class="th-action-icon"
            :size="17"
          />
          <span v-if="dataScopeStore.mode !== 'self'" class="ads-trigger__dot" />
        </div>
        <span class="th-action-label">{{ triggerLabel }}</span>
      </button>
    </template>

    <div class="ads-panel">
      <!-- 极简模式切换列表（Linear / macOS 风格） -->
      <div class="ads-menu">
        <!-- 1. 我的数据 -->
        <div
          class="ads-menu-item"
          :class="{ 'ads-menu-item--active': dataScopeStore.mode === 'self' && !selectedUserId }"
          @click="handleModeChange('self')"
        >
          <div class="ads-menu-item__left">
            <Icon icon="ep:user" :size="14" class="ads-menu-item__icon" />
            <span class="ads-menu-item__text">{{ t('layout.dataScope.myData') }}</span>
          </div>
          <Icon
            v-if="dataScopeStore.mode === 'self' && !selectedUserId"
            icon="ep:check"
            :size="14"
            class="ads-menu-item__check"
          />
        </div>

        <!-- 2. 全部数据 -->
        <div
          class="ads-menu-item"
          :class="{ 'ads-menu-item--active': dataScopeStore.mode === 'all' }"
          @click="handleModeChange('all')"
        >
          <div class="ads-menu-item__left">
            <Icon icon="ep:data-board" :size="14" class="ads-menu-item__icon" />
            <span class="ads-menu-item__text">{{ t('layout.dataScope.allData') }}</span>
          </div>
          <Icon
            v-if="dataScopeStore.mode === 'all'"
            icon="ep:check"
            :size="14"
            class="ads-menu-item__check"
          />
        </div>
      </div>

      <!-- 分隔线与指定成员搜索 -->
      <div class="ads-divider" />

      <div class="ads-user-wrap">
        <el-select
          v-model="selectedUserId"
          filterable
          clearable
          remote
          :remote-method="remoteSearch"
          :loading="loading"
          :disabled="switching"
          placeholder="指定成员视角..."
          class="ads-select"
          size="small"
          @change="handleUserChange"
          @clear="handleClearUser"
        >
          <el-option
            v-for="item in userOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <div v-if="dataScopeStore.mode === 'user' && dataScopeStore.userLabel" class="ads-user-tag">
          <span class="ads-user-tag__dot" />
          <span class="ads-user-tag__name" :title="dataScopeStore.userLabel">{{ dataScopeStore.userLabel }}</span>
        </div>
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

const triggerLabel = computed(() => {
  if (dataScopeStore.mode === 'all') return t('layout.dataScope.allData')
  if (dataScopeStore.mode === 'user') return '成员视角'
  return t('layout.dataScope.myData')
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
  } else {
    selectedUserId.value = ''
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

async function handleModeChange(value: 'self' | 'all') {
  if (switching.value) return
  if (value === 'self') {
    if (dataScopeStore.mode === 'self' && !selectedUserId.value) return
    dataScopeStore.setSelf()
    selectedUserId.value = ''
    ElMessage.success(t('layout.dataScope.switchedToMyData'))
    await refreshCurrentView()
  } else if (value === 'all') {
    if (dataScopeStore.mode === 'all') return
    dataScopeStore.setAll()
    selectedUserId.value = ''
    ElMessage.success(t('layout.dataScope.switchedToAllData'))
    await refreshCurrentView()
  }
}

async function handleUserChange(userId: string) {
  if (!userId) {
    handleClearUser()
    return
  }
  const option = userOptions.value.find((u) => u.value === userId)
  if (!option) return
  dataScopeStore.setUser(option.value, option.label)
  ElMessage.success(t('layout.dataScope.switchedToUser', { label: option.label }))
  await refreshCurrentView()
}

async function handleClearUser() {
  selectedUserId.value = ''
  dataScopeStore.setSelf()
  ElMessage.success(t('layout.dataScope.switchedToMyData'))
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
  border-radius: 8px;
  transition: all 0.16s ease;

  &__icon-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__dot {
    position: absolute;
    top: -1px;
    right: -3px;
    width: 6px;
    height: 6px;
    background-color: var(--el-color-primary);
    border-radius: 50%;
    box-shadow: 0 0 0 1.5px var(--el-bg-color);
  }

  &--active {
    color: var(--el-color-primary) !important;
  }

  &:hover {
    color: var(--el-color-primary);
    background-color: color-mix(in srgb, var(--top-header-hover-color) 65%, transparent 35%);
  }

  &:active {
    transform: scale(0.96);
  }
}

.ads-panel {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 极简列表项 */
.ads-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ads-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--el-text-color-primary);
  transition: background-color 0.15s ease, color 0.15s ease;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__icon {
    color: var(--el-text-color-secondary);
    transition: color 0.15s ease;
  }

  &__check {
    color: var(--el-color-primary);
  }

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &--active {
    font-weight: 500;
    color: var(--el-color-primary);
    background-color: color-mix(in srgb, var(--el-color-primary) 8%, transparent);

    .ads-menu-item__icon {
      color: var(--el-color-primary);
    }
  }
}

.ads-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 4px 2px;
}

.ads-user-wrap {
  padding: 2px 2px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ads-select {
  width: 100%;
}

.ads-user-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 6px;
  font-size: 11px;
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  border-radius: 4px;

  &__dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: var(--el-color-primary);
    flex-shrink: 0;
  }

  &__name {
    color: var(--el-color-primary);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>

<style lang="scss">
.header-data-scope-popper {
  padding: 0 !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
  overflow: hidden;
}
</style>
