<template>
  <section class="temu-context-card">
    <div class="temu-context-card__head">
      <div class="temu-context-status" :title="statusTitle">
        <span class="temu-context-dot" :class="`is-${statusTone}`" />
        <span class="temu-context-status__text" :class="`is-${statusTone}`">
          {{ statusText }}
        </span>
      </div>

      <div class="temu-context-card__actions">
        <el-button
          type="primary"
          size="small"
          :loading="acquireLoading"
          :disabled="acquireDisabled"
          @click="emit('acquire-session')"
        >
          采集会话
        </el-button>
        <el-button size="small" @click="emit('open-session-center')">会话中心</el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { resolveTemuWorkspaceAvailability } from "./temuWorkspace.helpers";

defineOptions({ name: "ToolkitTemuWorkspaceContext" });

const emit = defineEmits<{
  (e: "acquire-session"): void;
  (e: "open-session-center"): void;
}>();

const props = defineProps<{
  profileId?: string;
  profileLoading?: boolean;
  sessionRecord?: Record<string, any> | null;
  platformAccountText?: string;
  validationLoading?: boolean;
  acquireLoading?: boolean;
  acquireDisabled?: boolean;
}>();

const availability = computed(() =>
  resolveTemuWorkspaceAvailability(props.sessionRecord, {
    platformAccountText: props.platformAccountText,
    isValidating: props.validationLoading,
  }),
);
const statusMeta = computed(() => {
  if (props.profileLoading) {
    return {
      tone: "muted",
      text: "读取中",
      title: "正在读取当前环境和会话信息",
    };
  }

  if (!props.profileId) {
    return {
      tone: "muted",
      text: "未选环境",
      title: "未选择执行环境",
    };
  }

  if (availability.value.state === "missing") {
    return {
      tone: availability.value.tone,
      text: "缺少会话",
      title: availability.value.detail,
    };
  }

  if (availability.value.state === "expired") {
    return {
      tone: availability.value.tone,
      text: "会话过期",
      title: availability.value.detail,
    };
  }

  if (availability.value.state === "ready") {
    return {
      tone: availability.value.tone,
      text: "会话可用",
      title: availability.value.detail,
    };
  }

  if (availability.value.state === "checking") {
    return {
      tone: availability.value.tone,
      text: "校验中",
      title: availability.value.detail,
    };
  }

  if (availability.value.state === "incomplete") {
    return {
      tone: availability.value.tone,
      text: "信息不完整",
      title: availability.value.detail,
    };
  }

  if (availability.value.state === "limited") {
    return {
      tone: availability.value.tone,
      text: "部分可用",
      title: availability.value.detail,
    };
  }

  return {
    tone: availability.value.tone,
    text: "待确认",
    title: availability.value.detail,
  };
});

const statusTone = computed(() => statusMeta.value.tone);
const statusText = computed(() => statusMeta.value.text);
const statusTitle = computed(() => statusMeta.value.title);
</script>

<style scoped lang="scss">
.temu-context-card {
  display: flex;
  min-width: 0;
}

.temu-context-card__head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.temu-context-card__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-left: auto;
}

.temu-context-status {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0 2px;
}

.temu-context-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  background: var(--el-text-color-secondary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-text-color-secondary) 16%, transparent);
}

.temu-context-dot.is-success {
  background: var(--el-color-success);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-success) 16%, transparent);
}

.temu-context-dot.is-warning {
  background: var(--el-color-warning);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-warning) 16%, transparent);
}

.temu-context-dot.is-danger {
  background: var(--el-color-danger);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-danger) 16%, transparent);
}

.temu-context-dot.is-muted {
  background: var(--el-text-color-secondary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-text-color-secondary) 16%, transparent);
}

.temu-context-status__text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.temu-context-status__text.is-success {
  color: var(--el-color-success);
}

.temu-context-status__text.is-warning {
  color: var(--el-color-warning);
}

.temu-context-status__text.is-danger {
  color: var(--el-color-danger);
}

.temu-context-status__text.is-muted {
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .temu-context-card__head {
    flex-direction: column;
    align-items: stretch;
  }

  .temu-context-card__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
