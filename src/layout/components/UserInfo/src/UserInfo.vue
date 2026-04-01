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
  push('/user/profile')
}
</script>

<template>
  <ElDropdown class="custom-hover" :class="prefixCls" trigger="click">
    <div class="flex items-center cursor-pointer px-2 transition-all duration-300 hover:bg-[var(--el-fill-color-light)] rounded-lg py-1.5 mx-1">
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
        <!-- 顶部信息卡片 -->
        <div class="user-card-header">
          <div class="flex items-center gap-4">
            <div class="relative">
              <ElAvatar :src="avatar" :size="56" class="ring-4 ring-[var(--el-color-primary-light-9)]" />
              <div v-if="isAdmin" class="absolute -bottom-1 -right-1 bg-amber-500 p-1 rounded-full shadow-md">
                <Icon icon="ep:crown" class="text-white text-11px" />
              </div>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-16px font-bold text-[var(--el-text-color-primary)] truncate">{{ userName }}</span>
              <span v-if="companyName" class="text-12px text-[var(--el-text-color-secondary)] truncate mb-1.5">{{ companyName }}</span>
              <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--el-fill-color)] text-11px w-fit" :class="{ 'text-emerald-600 dark:text-emerald-400 font-600': isForever }">
                <Icon icon="ep:clock" class="text-10px" />
                <span>{{ remainingTime }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 操作列表 -->
        <div class="px-2 pb-2 mt-1">
          <ElDropdownItem @click="toProfile" class="menu-item-custom">
            <div class="flex items-center gap-3 w-full">
              <div class="p-1.5 bg-[var(--el-color-primary-light-9)] rounded-md text-[var(--el-color-primary)]">
                <Icon icon="ep:user" />
              </div>
              <span class="text-14px">{{ t('common.profile') }}</span>
            </div>
          </ElDropdownItem>
          
          <ElDropdownItem @click="lockScreen" class="menu-item-custom">
            <div class="flex items-center gap-3 w-full">
              <div class="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                <Icon icon="ep:lock" />
              </div>
              <span class="text-14px">{{ t('lock.lockScreen') }}</span>
            </div>
          </ElDropdownItem>
          
          <div class="divider"></div>
          
          <ElDropdownItem @click="loginOut" class="menu-item-custom logout-hover">
            <div class="flex items-center gap-3 w-full text-red-500">
              <div class="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-md">
                <Icon icon="ep:switch-button" />
              </div>
              <span class="text-14px font-500">{{ t('common.loginOut') }}</span>
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

.user-dropdown-menu {
  padding: 0 !important;
  min-width: 260px !important;
  border-radius: 12px !important;
  border: 1px solid var(--el-border-color-light) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1) !important;
  overflow: hidden;
}

.user-card-header {
  padding: 20px 16px;
  background: linear-gradient(135deg, var(--el-fill-color-blank) 0%, var(--el-fill-color-light) 100%);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.menu-item-custom {
  margin: 2px 0 !important;
  padding: 8px 12px !important;
  border-radius: 8px !important;
  transition: all 0.2s ease !important;
  
  &:hover {
    background-color: var(--el-fill-color-light) !important;
    color: var(--el-color-primary) !important;
  }
}

.logout-hover:hover {
  background-color: var(--el-color-danger-light-9) !important;
}

.divider {
  height: 1px;
  background-color: var(--el-border-color-lighter);
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
</style>
