<template>
  <div :class="['compact-notice', `compact-notice--${type}`]">
    <div class="compact-notice__main">
      <div v-if="title" class="compact-notice__title">{{ title }}</div>
      <div v-if="description" class="compact-notice__description">
        {{ description }}
      </div>
      <slot />
    </div>

    <div v-if="actions.length" class="compact-notice__actions">
      <el-button
        v-for="action in actions"
        :key="`${action.label}-${action.to || action.href || ''}`"
        link
        size="small"
        @click="handleActionClick(action)"
      >
        {{ action.label }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

defineOptions({ name: "CompactNotice" });

export interface CompactNoticeAction {
  label: string;
  to?: string;
  href?: string;
  target?: "_blank" | "_self";
}

const props = withDefaults(
  defineProps<{
    type?: "info" | "warning" | "success" | "danger";
    title?: string;
    description?: string;
    actions?: CompactNoticeAction[];
  }>(),
  {
    type: "info",
    title: "",
    description: "",
    actions: () => [],
  },
);

const router = useRouter();

const actions = computed(() => props.actions || []);

const handleActionClick = async (action: CompactNoticeAction) => {
  if (action.href) {
    window.open(action.href, action.target || "_blank");
    return;
  }

  if (action.to) {
    await router.push(action.to);
  }
};
</script>

<style scoped lang="scss">
.compact-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  border: 1px solid var(--notice-border-color, var(--el-border-color-lighter));
  border-radius: 8px;
  background: var(--notice-bg-color, var(--el-fill-color-light));
}

.compact-notice__main {
  min-width: 0;
  flex: 1;
}

.compact-notice__title {
  font-size: 12px;
  line-height: 1.35;
  font-weight: 600;
  color: var(--notice-title-color, var(--el-text-color-primary));
}

.compact-notice__description {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--notice-text-color, var(--el-text-color-secondary));
}

.compact-notice__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
  white-space: nowrap;
}

.compact-notice__actions :deep(.el-button) {
  padding: 0 4px;
  font-size: 11px;
}

.compact-notice--info {
  --notice-bg-color: var(--el-color-primary-light-9);
  --notice-border-color: var(--el-color-primary-light-7);
  --notice-title-color: var(--el-color-primary-dark-2);
}

.compact-notice--warning {
  --notice-bg-color: var(--el-color-warning-light-9);
  --notice-border-color: var(--el-color-warning-light-7);
  --notice-title-color: var(--el-color-warning-dark-2);
}

.compact-notice--success {
  --notice-bg-color: var(--el-color-success-light-9);
  --notice-border-color: var(--el-color-success-light-7);
  --notice-title-color: var(--el-color-success-dark-2);
}

.compact-notice--danger {
  --notice-bg-color: var(--el-color-danger-light-9);
  --notice-border-color: var(--el-color-danger-light-7);
  --notice-title-color: var(--el-color-danger-dark-2);
}

@media (max-width: 768px) {
  .compact-notice {
    align-items: flex-start;
    flex-direction: column;
  }

  .compact-notice__actions {
    margin-left: -4px;
  }
}
</style>
