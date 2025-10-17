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
    replace('/login?redirect=/index')
  } catch {}
}

const loginOutAll = async () => {
  try {
    await ElMessageBox.confirm('确定要登出所有设备吗？这将使其他设备上的登录状态失效。', '登出所有设备', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.loginOutAll()
    tagsViewStore.delAllViews()
    replace('/login?redirect=/index')
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
      <div class="pl-[5px] text-14px text-[var(--top-header-text-color)] <lg:hidden">
        <div class="flex items-center gap-2">
          <span>{{ userName }}</span>
        </div>
        <div v-if="companyName" class="text-xs text-blue-600 font-medium mt-1">{{ companyName }}</div>
      </div>
    </div>
    <template #dropdown>
      <ElDropdownMenu>
        <!-- 用户信息头部 -->
        <ElDropdownItem class="user-info-header">
          <div class="flex items-center gap-3 w-full">
            <ElAvatar :src="avatar" :size="40" />
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ userName }}</div>
              <div class="text-xs text-gray-500">{{ companyName || '个人用户' }}</div>
              <div class="flex items-center gap-1 mt-1">
                <Icon :icon="isAdmin ? 'ep:crown' : 'ep:user'" :class="isAdmin ? 'admin-icon-small' : 'user-icon-small'" />
                <span :class="isAdmin ? 'admin-text-small' : 'user-text-small'">
                  {{ isAdmin ? '系统管理员' : '普通用户' }}
                </span>
              </div>
            </div>
          </div>
        </ElDropdownItem>
        <ElDropdownItem divided>
          <Icon icon="ep:tools" />
          <div @click="toProfile">{{ t('common.profile') }}</div>
        </ElDropdownItem>
        <!-- <ElDropdownItem>
          <Icon icon="ep:menu" />
          <div @click="toDocument">{{ t('common.document') }}</div>
        </ElDropdownItem> -->
        <ElDropdownItem divided>
          <Icon icon="ep:lock" />
          <div @click="lockScreen">{{ t('lock.lockScreen') }}</div>
        </ElDropdownItem>
        <ElDropdownItem>
          <Icon icon="ep:monitor" />
          <div>当前设备: {{ currentDeviceInfo.type }}</div>
        </ElDropdownItem>
        <ElDropdownItem divided @click="loginOut">
          <Icon icon="ep:switch-button" />
          <div>{{ t('common.loginOut') }}</div>
        </ElDropdownItem>
        <ElDropdownItem @click="loginOutAll">
          <Icon icon="ep:close" />
          <div>登出所有设备</div>
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
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  border: 2px solid #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.4);
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
  background: linear-gradient(135deg, #10b981, #34d399);
  border: 2px solid #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(16, 185, 129, 0.3);
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

/* 下拉菜单用户信息头部样式 */
.user-info-header {
  padding: 12px 16px !important;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

.user-info-header:hover {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
}

/* 小尺寸图标和文字样式 */
.admin-icon-small {
  color: #d97706;
  font-size: 14px;
  font-weight: bold;
}

.admin-text-small {
  color: #92400e;
  font-size: 12px;
  font-weight: 600;
}

.user-icon-small {
  color: #10b981;
  font-size: 14px;
}

.user-text-small {
  color: #059669;
  font-size: 12px;
  font-weight: 600;
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
  
  .user-info-header {
    padding: 8px 12px !important;
  }
}
</style>
