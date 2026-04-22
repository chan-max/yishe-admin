<template>
  <section class="temu-context-card">
    <div class="temu-context-card__summary">
      <div class="temu-context-status" :title="statusTitle">
        <span class="temu-context-dot" :class="`is-${statusTone}`" />
        <span class="temu-context-status__text" :class="`is-${statusTone}`">
          {{ statusText }}
        </span>
      </div>

      <div class="temu-context-meta">
        <span class="temu-context-meta__label">账号</span>
        <strong class="temu-context-meta__value">{{ accountText }}</strong>
      </div>

      <div class="temu-context-meta">
        <span class="temu-context-meta__label">店铺</span>
        <strong class="temu-context-meta__value">{{ mallText }}</strong>
      </div>

      <div class="temu-context-meta">
        <span class="temu-context-meta__label">Cookie</span>
        <strong class="temu-context-meta__value">{{ cookieSummary }}</strong>
      </div>

      <div class="temu-context-meta temu-context-meta--time">
        <span class="temu-context-meta__label">上次校验</span>
        <strong
          class="temu-context-meta__value temu-context-meta__value--time"
          :class="{ 'is-muted': validationCheckedAtText === '未校验' }"
        >
          {{ validationCheckedAtText }}
        </strong>
      </div>
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
      <el-button
        size="small"
        :loading="validationLoading"
        :disabled="!canValidate"
        @click="emit('validate-session')"
      >
        校验会话
      </el-button>
      <el-button
        size="small"
        :loading="refreshInfoLoading"
        :disabled="!canRefreshIdentity"
        @click="emit('refresh-session-user-info')"
      >
        同步身份
      </el-button>
      <el-button size="small" :disabled="!hasSelectedProfile" @click="emit('open-session-center')">
        会话中心
      </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { resolveTemuWorkspaceAvailability } from "./temuWorkspace.helpers";

defineOptions({ name: "ToolkitTemuWorkspaceContext" });

const emit = defineEmits<{
  (e: "acquire-session"): void;
  (e: "validate-session"): void;
  (e: "refresh-session-user-info"): void;
  (e: "open-session-center"): void;
}>();

const props = defineProps<{
  profileId?: string;
  profileLoading?: boolean;
  sessionRecord?: Record<string, any> | null;
  platformAccountText?: string;
  validationLoading?: boolean;
  validationCheckedAtText?: string;
  refreshInfoLoading?: boolean;
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
const accountText = computed(() => availability.value.accountText || "-");
const mallText = computed(() => availability.value.mallText || "未设置");
const cookieSummary = computed(() => availability.value.cookieSummary || "-");
const validationCheckedAtText = computed(() => props.validationCheckedAtText || "未校验");
const hasSelectedProfile = computed(() => !!props.profileId);
const canValidate = computed(() => hasSelectedProfile.value && availability.value.hasUsableSession);
const canRefreshIdentity = computed(
  () => hasSelectedProfile.value && availability.value.hasUsableSession,
);
</script>

<style scoped lang="scss">
.temu-context-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 12px;
  min-width: 0;
}

.temu-context-card__summary {
  flex: 1 1 420px;
  display: flex;
  align-items: center;
  align-content: center;
  flex-wrap: wrap;
  gap: 6px 12px;
  min-width: 0;
  max-width: 100%;
}

.temu-context-card__actions {
  flex: 0 1 auto;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-left: auto;
  max-width: 100%;
}

.temu-context-status {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  padding: 4px 8px 4px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-fill-color-blank);
  white-space: nowrap;
}

.temu-context-meta {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  flex: 0 1 auto;
  padding: 4px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-fill-color-blank);
  white-space: normal;
  min-width: 0;
  max-width: 100%;
}

.temu-context-meta__label {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
}

.temu-context-meta__value {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.35;
  white-space: normal;
  overflow-wrap: anywhere;
}

.temu-context-meta__value--time {
  color: var(--el-color-primary);
}

.temu-context-meta__value--time.is-muted {
  color: var(--el-text-color-secondary);
}

.temu-context-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  background: var(--el-text-color-secondary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-text-color-secondary) 14%, transparent);
}

.temu-context-dot.is-success {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 14%, transparent);
}

.temu-context-dot.is-warning {
  background: var(--el-color-warning);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-warning) 14%, transparent);
}

.temu-context-dot.is-danger {
  background: var(--el-color-danger);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 14%, transparent);
}

.temu-context-dot.is-muted {
  background: var(--el-text-color-secondary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-text-color-secondary) 14%, transparent);
}

.temu-context-status__text {
  display: inline-flex;
  align-items: center;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
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
  .temu-context-card {
    flex-direction: column;
    align-items: stretch;
  }

  .temu-context-card__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
