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
  <ElDropdown class="custom-hover" :class="prefixCls" trigger="click">
    <div class="user-trigger flex items-center cursor-pointer rounded-lg px-1.5 py-1 transition-all duration-300 hover:bg-[var(--el-fill-color-light)]">
      <div class="relative flex items-center justify-center">
        <ElAvatar 
          :size="32" 
          :src="avatar" 
          class="border-2 border-[var(--el-border-color-light)] shadow-sm" 
        />
        <!-- 身份状态指示 -->
        <span 
          class="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[var(--top-header-bg-color)] rounded-full z-20"
          :class="isAdmin ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'"
        ></span>
      </div>
      <div class="pl-2.5 <lg:hidden flex flex-col justify-center">
        <span class="text-13px font-600 text-[var(--top-header-text-color)] leading-tight">{{ userName }}</span>
        <span class="text-10px font-500 uppercase tracking-tighter opacity-70" :class="isAdmin ? 'text-amber-500' : 'text-[var(--el-text-color-placeholder)]'">
          {{ isAdmin ? 'Administrator' : 'Standard Member' }}
        </span>
      </div>
      <Icon icon="ep:caret-bottom" class="ml-1.5 text-12px opacity-30 transition-transform duration-300" />
    </div>
    
    <template #dropdown>
      <ElDropdownMenu class="user-dropdown-menu">
        <div class="user-card-header">
          <div class="flex items-center gap-3">
            <div class="relative">
              <ElAvatar :src="avatar" :size="42" class="user-card-avatar" />
              <div v-if="isAdmin" class="user-admin-dot"></div>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="user-card-name">{{ userName }}</span>
              <span v-if="companyName" class="user-card-company">{{ companyName }}</span>
              <div class="user-card-status" :class="{ 'user-card-status--forever': isForever }">
                <Icon icon="ep:clock" class="text-9px opacity-75" />
                <span>{{ remainingTime }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 操作列表 -->
        <div class="px-2 pb-2 mt-1">
          <ElDropdownItem @click="toProfile" class="menu-item-custom">
            <div class="flex items-center gap-3 w-full">
              <div class="menu-item-icon">
                <Icon icon="ep:user" class="text-[13px]" />
              </div>
              <span class="menu-item-text">{{ t('common.profile') }}</span>
            </div>
          </ElDropdownItem>
          
          <ElDropdownItem @click="lockScreen" class="menu-item-custom">
            <div class="flex items-center gap-3 w-full">
              <div class="menu-item-icon">
                <Icon icon="ep:lock" class="text-[13px]" />
              </div>
              <span class="menu-item-text">{{ t('lock.lockScreen') }}</span>
            </div>
          </ElDropdownItem>
          
          <div class="divider"></div>
          
          <ElDropdownItem @click="loginOut" class="menu-item-custom logout-hover">
            <div class="flex items-center gap-3 w-full text-red-500">
              <div class="menu-item-icon menu-item-icon--danger">
                <Icon icon="ep:switch-button" class="text-[13px]" />
              </div>
              <span class="menu-item-text font-500">{{ t('common.loginOut') }}</span>
            </div>
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
.fade-bottom-init {
  opacity: 0;
  transform: translateY(-10%);
}

.user-trigger {
  margin-inline: 0;
}

.user-dropdown-menu {
  padding: 0 !important;
  min-width: 236px !important;
  border-radius: 10px !important;
  border: 1px solid var(--el-border-color-light) !important;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08) !important;
  overflow: hidden;
}

.user-card-header {
  padding: 14px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.user-card-avatar {
  border: 1px solid var(--el-border-color-light);
}

.user-admin-dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #f59e0b;
}

.user-card-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-card-company {
  margin: 3px 0 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  line-height: 1.2;
  color: var(--el-text-color-secondary);
}

.user-card-status {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-bg-color);
  font-size: 10px;
  line-height: 1;
  color: var(--el-text-color-secondary);
}

.user-card-status--forever {
  color: #059669;
  border-color: #ccebdc;
  background: #f2fbf6;
}

.menu-item-custom {
  margin: 2px 0 !important;
  padding: 7px 10px !important;
  border: 1px solid transparent !important;
  border-radius: 8px !important;
  transition: all 0.2s ease !important;
  
  &:hover {
    background: var(--el-fill-color-light) !important;
    border-color: var(--el-border-color-lighter) !important;
    color: var(--el-color-primary) !important;
  }
}

.menu-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex-shrink: 0;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.menu-item-icon--danger {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.menu-item-text {
  font-size: 12px;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.logout-hover:hover {
  background: var(--el-color-danger-light-9) !important;
  border-color: #fecaca !important;
}

.divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 6px 8px;
}

/* 兼容顶部导航文本颜色 */
:deep(.el-dropdown) {
  color: inherit;
  &:hover {
    .ep-caret-bottom {
      transform: rotate(180deg);
      opacity: 0.8;
    }
  }
}

@media (max-width: 768px) {
  .user-trigger {
    padding-inline: 4px;
  }
}
</style>
