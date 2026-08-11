<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { getUnreadNotifyMessageCount } from "@/api/system/notify/message";

defineOptions({ name: "GlobalNotificationCenter" });

const { t } = useI18n();

const { push } = useRouter()

const unreadCount = ref(0);

const fetchUnreadCount = async () => {
  try {
    const data = await getUnreadNotifyMessageCount();
    unreadCount.value = typeof data === 'number' ? data : (data?.data || 0);
  } catch {
    // ignore
  }
};

const handleClick = () => {
  push({ name: 'MyNotifyMessage' })
}

onMounted(() => {
  fetchUnreadCount();
  const timer = setInterval(fetchUnreadCount, 30_000);
  onUnmounted(() => clearInterval(timer));
});
</script>

<template>
  <button
    class="notification-trigger"
    type="button"
    :class="{ 'has-unread': unreadCount > 0 }"
    :aria-label="t('layout.notification.message')"
    @click="handleClick"
  >
    <span class="th-action-icon">
      <Icon icon="ep:bell" :size="18" />
      <span v-if="unreadCount > 0" class="notification-trigger__badge">{{
        unreadCount > 99 ? "99+" : unreadCount
      }}</span>
    </span>
    <span class="th-action-label">{{ t("layout.notification.message") }}</span>
  </button>
</template>

<style scoped lang="scss">
.notification-trigger {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: none;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.th-action-icon {
  position: relative;
  display: inline-flex;
  line-height: 1;
}

.notification-trigger.has-unread {
  color: var(--el-color-primary);
}

.notification-trigger__badge {
  position: absolute;
  top: -4px;
  right: -7px;
  height: 13px;
  min-width: 13px;
  padding: 0 3px;
  font-size: 8px;
  font-weight: 700;
  line-height: 13px;
  color: #fff;
  text-align: center;
  background: #ef4444;
  border-radius: 999px;
  box-shadow: 0 0 0 2px var(--top-header-bg-color, var(--el-bg-color));
}
</style>
