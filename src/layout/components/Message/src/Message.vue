<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import { useUserStoreWithOut } from '@/store/modules/user'
import {
  getUnreadNotifyMessageList,
  getUnreadNotifyMessageCount
} from '@/api/system/notify/message'

defineOptions({ name: 'Message' })

const { t } = useI18n();

const { push } = useRouter()
const userStore = useUserStoreWithOut()
const unreadCount = ref(0)
const list = ref<any[]>([])
const popoverVisible = ref(false)

// 获取未读消息数量
const getUnreadCount = async () => {
  if (!userStore.getIsSetUser) {
    unreadCount.value = 0
    return
  }
  try {
    const data = await getUnreadNotifyMessageCount()
    unreadCount.value = data || 0
  } catch {
    unreadCount.value = 0
  }
}

// 获取未读消息列表
const getList = async () => {
  try {
    const data = await getUnreadNotifyMessageList()
    list.value = data || []
  } catch {
    list.value = []
  }
}

// 点击铃铛
const handleBellClick = async () => {
  await getList()
}

// 跳转我的站内信
const goMyList = () => {
  popoverVisible.value = false
  push({ name: 'MyNotifyMessage' })
}

// 监听全局未读计数变化
const handleUnreadChange = (e: CustomEvent) => {
  unreadCount.value = e.detail?.count ?? 0
}

// 初始化
onMounted(() => {
  getUnreadCount()
  window.addEventListener('notify-message-unread-change', handleUnreadChange as EventListener)
  // 每 2 分钟轮询一次未读计数
  const timer = setInterval(() => {
    if (userStore.getIsSetUser) {
      getUnreadCount()
    }
  }, 1000 * 60 * 2)
  onUnmounted(() => {
    clearInterval(timer)
    window.removeEventListener('notify-message-unread-change', handleUnreadChange as EventListener)
  })
})
</script>

<template>
  <div class="message">
    <ElPopover v-model:visible="popoverVisible" :width="380" placement="bottom" trigger="click">
      <template #reference>
        <ElBadge :is-dot="unreadCount > 0" class="item">
          <Icon
            :size="18"
            class="cursor-pointer"
            icon="ep:bell"
            @click="handleBellClick"
          />
        </ElBadge>
      </template>
      <div class="message-panel">
        <div class="message-panel__header">
          <span class="message-panel__title">{{ t("layout.message.myMessages") }}</span>
          <span v-if="unreadCount > 0" class="message-panel__badge">{{ t("layout.message.unreadCount", { count: unreadCount }) }}</span>
        </div>
        <el-scrollbar class="message-panel__list">
          <template v-if="list.length > 0">
            <div
              v-for="item in list"
              :key="item.id"
              class="message-item"
            >
              <img alt="" class="message-item__icon" src="@/assets/imgs/avatar.png" />
              <div class="message-item__content">
                <span class="message-item__title">
                  {{ item.templateNickname }}：{{ item.templateContent }}
                </span>
                <span class="message-item__date">
                  {{ formatDate(item.createTime) }}
                </span>
              </div>
            </div>
          </template>
          <div v-else class="message-panel__empty">
            <el-empty :description="t('layout.message.noUnreadMessages')" :image-size="60" />
          </div>
        </el-scrollbar>
        <div class="message-panel__footer">
          <XButton preIcon="ep:view" :title="t('layout.message.viewAll')" type="primary" @click="goMyList" />
        </div>
      </div>
    </ElPopover>
  </div>
</template>

<style lang="scss" scoped>
.message {
  display: inline-flex;
  align-items: center;
}

.item {
  display: inline-flex;
  cursor: pointer;
}

.message-panel {
  display: flex;
  flex-direction: column;
}

.message-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.message-panel__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.message-panel__badge {
  font-size: 12px;
  color: var(--el-color-primary);
}

.message-panel__list {
  max-height: 360px;

  .message-item {
    display: flex;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-light);
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  .message-item__icon {
    width: 32px;
    height: 32px;
    margin-right: 10px;
    flex-shrink: 0;
    border-radius: 50%;
  }

  .message-item__content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .message-item__title {
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .message-item__date {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.message-panel__empty {
  padding: 20px 0;
}

.message-panel__footer {
  padding-top: 10px;
  text-align: right;
  border-top: 1px solid var(--el-border-color-light);
}
</style>
