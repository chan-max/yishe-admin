<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useGlobalNotificationStore } from "@/store/modules/globalNotification";
import { getUnreadNotifyMessageCount } from "@/api/system/notify/message";

defineOptions({ name: "GlobalNotificationCenter" });

const { push } = useRouter()
const notificationStore = useGlobalNotificationStore();

// WS 通知未读
const wsUnreadCount = computed(() => notificationStore.unreadCount);
// 站内信未读
const messageUnreadCount = ref(0);

// 总未读 = WS + 站内信
const totalUnread = computed(() => wsUnreadCount.value + messageUnreadCount.value);

const fetchMessageUnreadCount = async () => {
  try {
    const count = await getUnreadNotifyMessageCount();
    messageUnreadCount.value = count || 0;
  } catch {
    // ignore
  }
};

const handleClick = () => {
  push({ name: 'MyNotifyMessage' })
}

onMounted(() => {
  fetchMessageUnreadCount();
  // 每 30 秒轮询一次站内信未读数量
  const timer = setInterval(fetchMessageUnreadCount, 30_000);
  onUnmounted(() => clearInterval(timer));
});
</script>

<template>
  <button
    class="notification-trigger"
    type="button"
    :class="{ 'has-unread': totalUnread > 0 }"
    @click="handleClick"
  >
    <Icon icon="ep:bell" :size="16" />
    <span v-if="totalUnread > 0" class="notification-trigger__badge">{{
      totalUnread > 99 ? "99+" : totalUnread
    }}</span>
  </button>
</template>

<style scoped lang="scss">
.notification-trigger {
  position: relative;
  display: inline-flex;
  width: 34px;
  height: 34px;
  color: var(--top-header-text-color);
  cursor: pointer;
  background: var(--top-header-hover-color);
  border: 1px solid var(--top-tool-border-color);
  border-radius: 10px;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
  align-items: center;
  justify-content: center;
}

.notification-trigger:hover,
.notification-trigger.has-unread {
  color: var(--el-text-color-primary);
  border-color: color-mix(in srgb, var(--top-header-text-color) 14%, transparent 86%);
}

.notification-trigger__badge {
  position: absolute;
  top: -4px;
  right: -5px;
  height: 15px;
  min-width: 15px;
  padding: 0 3px;
  font-size: 9px;
  font-weight: 700;
  line-height: 15px;
  color: #fff;
  text-align: center;
  background: #ef4444;
  border-radius: 999px;
}
</style>
