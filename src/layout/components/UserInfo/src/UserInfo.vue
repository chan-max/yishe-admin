<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'

import avatarImg from '@/assets/imgs/avatar.png'
import { useDesign } from '@/hooks/web/useDesign'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useUserStore } from '@/store/modules/user'
import LockDialog from './components/LockDialog.vue'
import LockPage from './components/LockPage.vue'
import { useLockStore } from '@/store/modules/lock'

defineOptions({ name: 'UserInfo' })

const { t } = useI18n()
const { push, replace } = useRouter()
const userStore = useUserStore()
const tagsViewStore = useTagsViewStore()
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('user-info')

const avatar = computed(() => userStore.user.avatar || avatarImg)
const userName = computed(() => userStore.user.name || userStore.user.account || 'Admin')

const companyName = computed(() => userStore.user.company?.name || null)
const isAdmin = computed(() => userStore.user.isAdmin || false)
const expireTime = computed(() => userStore.user.expireTime)
const isForever = computed(() => !expireTime.value)

const remainingTime = computed(() => {
  if (!expireTime.value) return '永久有效'
  
  const now = new Date().getTime()
  const expire = new Date(expireTime.value).getTime()
  const diff = expire - now
  
  if (diff <= 0) return '已过期'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `还有 ${days} 天到期`
  if (hours > 0) return `还有 ${hours} 小时到期`
  if (minutes > 0) return `还有 ${minutes} 分钟到期`
  return '即将到期'
})

const lockStore = useLockStore()
const getIsLock = computed(() => lockStore.getLockInfo?.isLock ?? false)
const dialogVisible = ref<boolean>(false)
const lockScreen = () => {
  dialogVisible.value = true
}

const loginOut = async () => {
  try {
    await ElMessageBox.confirm(t('common.loginOutMessage'), t('common.reminder'), {
      confirmButtonText: t('common.ok'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
    await userStore.loginOut()
    tagsViewStore.delAllViews()
    replace('/login?redirect=/home/index')
  } catch {}
}

const toProfile = async () => {
  push('/personal/settings')
}
</script>

<template>
  <ElDropdown :class="prefixCls" trigger="click">
    <div class="user-trigger">
      <ElAvatar :size="26" :src="avatar" class="user-avatar" />
      <div class="user-meta <lg:hidden">
        <span class="user-name">{{ userName }}</span>
        <span class="user-role" :class="isAdmin ? 'is-admin' : 'is-member'">
          {{ isAdmin ? 'Administrator' : 'Member' }}
        </span>
      </div>
      <Icon icon="ep:caret-bottom" class="user-caret" />
    </div>

    <template #dropdown>
      <ElDropdownMenu class="ud-menu">
        <div class="ud-profile">
          <ElAvatar :src="avatar" :size="36" class="ud-avatar" />
          <div class="ud-info">
            <p class="ud-name">{{ userName }}</p>
            <p v-if="companyName" class="ud-company">{{ companyName }}</p>
            <p class="ud-expire" :class="{ 'is-forever': isForever }">{{ remainingTime }}</p>
          </div>
        </div>

        <div class="ud-actions">
          <ElDropdownItem @click="toProfile" class="ud-item">
            <Icon icon="ep:user" class="ud-icon" />
            {{ t('common.profile') }}
          </ElDropdownItem>
          <ElDropdownItem @click="lockScreen" class="ud-item">
            <Icon icon="ep:lock" class="ud-icon" />
            {{ t('lock.lockScreen') }}
          </ElDropdownItem>
          <div class="ud-sep" />
          <ElDropdownItem @click="loginOut" class="ud-item ud-item--out">
            <Icon icon="ep:switch-button" class="ud-icon" />
            {{ t('common.loginOut') }}
          </ElDropdownItem>
        </div>
      </ElDropdownMenu>
    </template>
  </ElDropdown>

  <LockDialog v-if="dialogVisible" v-model="dialogVisible" />
  <teleport to="body">
    <transition name="fade-bottom" mode="out-in">
      <LockPage v-if="getIsLock" />
    </transition>
  </teleport>
</template>

<style scoped lang="scss">
/* Trigger */
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 6px 2px 2px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}

.user-avatar {
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--top-header-text-color);
  white-space: nowrap;
}

.user-role {
  font-size: 10px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;

  &.is-admin {
    color: #f59e0b;
  }

  &.is-member {
    color: var(--el-text-color-placeholder);
  }
}

.user-caret {
  font-size: 10px;
  opacity: 0.25;
  flex-shrink: 0;
}

/* Dropdown */
.ud-menu {
  padding: 0 !important;
  min-width: 200px !important;
  border-radius: 8px !important;
  border: 1px solid var(--el-border-color-light) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  overflow: hidden;
}

.ud-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ud-avatar {
  flex-shrink: 0;
}

.ud-info {
  flex: 1;
  min-width: 0;
}

.ud-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ud-company {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin: 3px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ud-expire {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin: 2px 0 0;

  &.is-forever {
    color: #10b981;
  }
}

.ud-actions {
  padding: 4px;
}

.ud-sep {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 3px 0;
}

.ud-item {
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
  padding: 6px 10px !important;
  border-radius: 5px !important;
  font-size: 12.5px !important;
  font-weight: 400 !important;
  color: var(--el-text-color-primary) !important;
  transition: background 0.12s !important;

  &:hover {
    background: var(--el-fill-color-light) !important;
    color: var(--el-text-color-primary) !important;
  }

  &--out {
    color: var(--el-color-danger) !important;

    &:hover {
      background: var(--el-color-danger-light-9) !important;
      color: var(--el-color-danger) !important;
    }
  }
}

.ud-icon {
  font-size: 13px;
  opacity: 0.6;
}

:deep(.el-dropdown) {
  color: inherit;
}

.fade-bottom-init {
  opacity: 0;
  transform: translateY(-10%);
}

@media (max-width: 768px) {
  .user-trigger {
    padding: 2px;
    gap: 0;
  }
}
</style>
