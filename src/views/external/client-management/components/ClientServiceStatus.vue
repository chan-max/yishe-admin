<template>
  <div class="service-status">
    <template v-if="services.length">
      <div v-for="svc in services" :key="svc.key" class="svc-row">
        <span class="svc-name">{{ svc.label || svc.key }}</span>
        <span :class="['svc-status', `is-${svc.status}`]">{{ svc.status }}</span>
        <span v-if="svc.state" class="svc-state">{{ svc.state }}</span>
        <span v-if="svc.message" class="svc-msg">{{ svc.message }}</span>
      </div>
    </template>
    <el-empty v-else description="暂无服务" :image-size="40" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { WebsocketConnectionVO } from "@/api/system/websocket";

const props = defineProps<{ client: WebsocketConnectionVO }>();

const services = computed(() => {
  const map = props.client?.clientInfo?.services || {};
  return Object.entries(map).map(([key, v]) => {
    const s = v as Record<string, any>;
    return {
      key,
      label: s.label || key,
      status: s.available ? "可用" : s.connected ? "已连接" : s.status || s.state || "未知",
      state: s.state,
      busy: s.busy,
      message: s.message,
    };
  });
});
</script>

<style scoped lang="scss">
.service-status {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.svc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.svc-name {
  font-weight: 600;
  min-width: 120px;
  color: var(--el-text-color-primary);
}

.svc-status {
  padding: 1px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;

  &.is-可用,
  &.is-已连接 {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  &.is-未知 {
    color: var(--el-text-color-placeholder);
    background: var(--el-fill-color);
  }
}

.svc-state {
  color: var(--el-text-color-secondary);
}

.svc-msg {
  flex: 1;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
