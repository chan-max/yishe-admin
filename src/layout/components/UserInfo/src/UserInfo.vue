<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'

import avatarImg from '@/assets/imgs/avatar.png'
import { useDesign } from '@/hooks/web/useDesign'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useUserStore } from '@/store/modules/user'
import LockDialog from './components/LockDialog.vue'
import LockPage from './components/LockPage.vue'
import { useLockStore } from '@/store/modules/lock'
import { getDeviceInfo } from '@/utils/device'

defineOptions({ name: 'UserInfo' })

const { t } = useI18n()

const { push, replace } = useRouter()

const userStore = useUserStore()

const tagsViewStore = useTagsViewStore()

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('user-info')

const avatar = computed(() => userStore.user.avatar || avatarImg)
const userName = computed(() => userStore.user.name || userStore.user.account || 'Admin')

// 公司信息
const companyName = computed(() => {
  return userStore.user.company?.name || null
})

// 是否为管理员
const isAdmin = computed(() => {
  return userStore.user.isAdmin || false
})

// 过期时间显示
const expireTime = computed(() => {
  return userStore.user.expireTime
})

// 是否永久有效
const isForever = computed(() => {
  return !expireTime.value
})

// 计算剩余时间
const remainingTime = computed(() => {
  if (!expireTime.value) return '永久有效'
  
  const now = new Date().getTime()
  const expire = new Date(expireTime.value).getTime()
  const diff = expire - now
  
  if (diff <= 0) return '已过期'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `还有 ${days} 天到期`
  } else if (hours > 0) {
    return `还有 ${hours} 小时到期`
  } else if (minutes > 0) {
    return `还有 ${minutes} 分钟到期`
  } else {
    return '即将到期'
  }
})

// 锁定屏幕
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


// 获取当前设备信息
const currentDeviceInfo = computed(() => {
  const deviceInfo = getDeviceInfo()
  return {
    type: deviceInfo.userAgent.includes('Mobile') ? '移动设备' : 
          deviceInfo.userAgent.includes('Tablet') ? '平板设备' : '桌面设备',
    browser: deviceInfo.userAgent.includes('Chrome') ? 'Chrome' :
             deviceInfo.userAgent.includes('Firefox') ? 'Firefox' :
             deviceInfo.userAgent.includes('Safari') ? 'Safari' : '未知浏览器'
  }
})
const toProfile = async () => {
  push('/user/profile')
}
const toDocument = () => {
  window.open('https://doc.iocoder.cn/')
}


</script>

<template>
  <ElDropdown class="custom-hover" :class="prefixCls" trigger="click">
    <div class=" flex items-center" >
      <div class="relative">
        <!-- <div :class="{reddot:!userStore.ws.isOnline,greendot:userStore.ws.isOnline}" class="absolute ws-dot" style="width:8px;height:8px;border-radius: 50%;top:-0px;right:-0px;"></div> -->
        <ElAvatar style="width: 32px;height:32px;" :src="avatar" alt="" class="rounded-[50%]" />
        <!-- 身份标签 -->
        <div 
          v-if="isAdmin" 
          class="admin-label"
          title="管理员"
        >
          <Icon icon="ep:crown" />
        </div>
        <div 
          v-else 
          class="user-label"
          title="普通用户"
        >
          <Icon icon="ep:user" />
        </div>
      </div>
      <div class="pl-[8px] <lg:hidden">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-[var(--top-header-text-color)]">{{ userName }}</span>
        </div>
      </div>
    </div>
    <template #dropdown>
      <ElDropdownMenu class="user-dropdown-menu">
        <!-- 用户信息卡片 -->
        <div class="user-info-card">
          <div class="user-avatar-section">
            <ElAvatar :src="avatar" :size="56" class="user-main-avatar" />
            <div v-if="isAdmin" class="user-badge admin-badge">
              <Icon icon="ep:crown" />
            </div>
          </div>
          <div class="user-details">
            <div class="user-name">{{ userName }}</div>
            <div v-if="companyName" class="user-company">{{ companyName }}</div>
            <div class="user-expire" :class="{ 'forever-style': isForever }">
              <Icon icon="ep:clock" />
              <span>{{ remainingTime }}</span>
            </div>
          </div>
        </div>
        
        <!-- 菜单项 -->
        <div class="menu-divider"></div>
        <ElDropdownItem class="menu-item" @click="toProfile">
          <Icon icon="ep:user" />
          <span>{{ t('common.profile') }}</span>
        </ElDropdownItem>
        <ElDropdownItem class="menu-item" @click="lockScreen">
          <Icon icon="ep:lock" />
          <span>{{ t('lock.lockScreen') }}</span>
        </ElDropdownItem>
        <div class="menu-divider"></div>
        <ElDropdownItem class="menu-item logout-item" @click="loginOut">
          <Icon icon="ep:switch-button" />
          <span>{{ t('common.loginOut') }}</span>
        </ElDropdownItem>
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
.fade-bottom-enter-active,
.fade-bottom-leave-active {
  transition:
    opacity 0.25s,
    transform 0.3s;
}

.fade-bottom-enter-from {
  opacity: 0;
  transform: translateY(-10%);
}

.fade-bottom-leave-to {
  opacity: 0;
  transform: translateY(10%);
}

.reddot {
  background-color: red !important; /* 更柔和的红色 */
  box-shadow: 0 0 10px rgba(255, 111, 97, 0.6);
}

.greendot {
  background-color: rgb(0, 255, 110);
  box-shadow: 0 0 10px rgba(89, 255, 95, 0.6);
}

/* 管理员标签样式 - 头像右上角 */
.admin-label {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #f6c453;
  border: 2px solid var(--app-content-surface-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.24);
  z-index: 10;
  animation: adminPulse 2s ease-in-out infinite;
}

.admin-label .icon {
  color: #d97706;
  font-size: 8px;
  font-weight: bold;
}

/* 普通用户标签样式 - 头像右上角 */
.user-label {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #34c784;
  border: 2px solid var(--app-content-surface-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
  z-index: 10;
}

.user-label .icon {
  color: #ffffff;
  font-size: 8px;
}

/* 管理员脉冲动画 */
@keyframes adminPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.4);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(245, 158, 11, 0.6);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.4);
  }
}

/* 下拉菜单样式 */
.user-dropdown-menu {
  padding: 8px !important;
  min-width: 240px !important;
}

/* Element Plus 下拉菜单样式覆盖 */
:deep(.user-dropdown-menu .el-dropdown-menu__item) {
  padding: 0 !important;
}

:deep(.user-dropdown-menu .el-dropdown-menu__item:hover) {
  background-color: transparent !important;
}

/* 用户信息卡片 */
.user-info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--app-content-surface-muted-color);
  border: 1px solid var(--app-content-border-color);
  border-radius: 12px;
  margin-bottom: 4px;
}

.user-avatar-section {
  position: relative;
  flex-shrink: 0;
}

.user-main-avatar {
  border: 2px solid var(--app-content-border-color);
  box-shadow: none;
}

.user-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  border: 2px solid var(--app-content-surface-color);
}

.admin-badge {
  background: #f59e0b;
}

.admin-badge .icon {
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: inherit;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-company {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-expire {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: inherit;
  opacity: 0.7;
}

.user-expire .icon {
  font-size: 12px;
}

/* 永久有效样式 */
.forever-style {
  color: rgba(34, 197, 94, 0.9) !important;
  opacity: 1 !important;
  font-weight: 500;
}

/* 分隔线 */
.menu-divider {
  height: 1px;
  background: var(--app-content-border-color);
  margin: 4px 0;
}

/* 菜单项 */
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.menu-item:hover {
  background: var(--app-content-surface-muted-color);
}

.menu-item .icon {
  font-size: 16px;
  color: inherit;
  opacity: 0.7;
}

.menu-item span {
  font-size: 14px;
  color: inherit;
}

/* 登出项 */
.logout-item .icon,
.logout-item span {
  color: #ef4444;
}

.logout-item:hover {
  background: rgba(239, 68, 68, 0.08);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .admin-label,
  .user-label {
    width: 14px;
    height: 14px;
    top: -1px;
    right: -1px;
  }
  
  .admin-label .icon,
  .user-label .icon {
    font-size: 7px;
  }
}
</style>
