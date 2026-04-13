<template>
  <section class="temu-context-card">
    <div class="temu-context-card__head">
      <div class="temu-context-card__title">会话与身份</div>
      <div class="temu-context-card__actions">
        <el-button size="small" @click="emit('open-session-center')">会话中心</el-button>
      </div>
    </div>

    <div class="temu-context-card__fields">
      <div v-for="item in compactStatusFields" :key="item.key" class="temu-context-field">
        <span>{{ item.label }}</span>
        <strong :class="`is-${item.tone}`">{{ item.value }}</strong>
      </div>
    </div>

    <div v-if="compactStatusNotices.length" class="temu-context-card__notices">
      <span
        v-for="notice in compactStatusNotices"
        :key="notice.key"
        class="temu-status-note"
        :class="`is-${notice.type}`"
      >
        {{ notice.text }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { asPlainObject, countObjectKeys } from "./temuWorkspace.helpers";

defineOptions({ name: "ToolkitTemuWorkspaceContext" });

const emit = defineEmits<{
  (e: "open-session-center"): void;
}>();

const props = defineProps<{
  profileId?: string;
  sessionRecord?: Record<string, any> | null;
  platformAccountText?: string;
}>();

const resolveValidationLabel = (validation?: Record<string, any>) => {
  const status = String(validation?.status || "").trim();
  if (status === "valid") return "有效";
  if (status === "invalid") return "失效";
  if (status === "fresh") return "待校验";
  if (status === "unsupported") return "暂不支持";
  return "未校验";
};

const resolveUserInfoLabel = (userInfoValue?: Record<string, any>) => {
  const status = String(userInfoValue?.status || "").trim();
  if (status === "success") return "已获取";
  if (status === "failed") return "获取失败";
  return "未获取";
};

const sessionRecord = computed(() => asPlainObject(props.sessionRecord));
const sessionData = computed(() => asPlainObject(sessionRecord.value?.session));
const userInfo = computed(() => asPlainObject(sessionRecord.value?.userInfo));
const validation = computed(() => asPlainObject(sessionRecord.value?.validation));

const regionCookieCounts = computed(() => ({
  global: countObjectKeys(sessionData.value?.global?.cookies),
  us: countObjectKeys(sessionData.value?.us?.cookies),
  eu: countObjectKeys(sessionData.value?.eu?.cookies),
}));

const hasUsableSession = computed(() => regionCookieCounts.value.global > 0);
const accountIdText = computed(() =>
  String(userInfo.value?.accountId || sessionRecord.value?.accountId || "").trim(),
);
const accountTypeText = computed(() =>
  String(userInfo.value?.accountType || sessionRecord.value?.accountType || "").trim(),
);
const accountText = computed(() => {
  const fallbackAccount = String(props.platformAccountText || "").trim();
  return (
    [accountIdText.value || fallbackAccount, accountTypeText.value].filter(Boolean).join(" / ") ||
    "-"
  );
});

const currentMallId = computed(() =>
  String(userInfo.value?.mallId || sessionRecord.value?.mallId || "").trim(),
);
const currentMallName = computed(() =>
  String(userInfo.value?.mallName || sessionRecord.value?.mallName || "").trim(),
);
const mallText = computed(() => currentMallName.value || currentMallId.value || "未设置");
const validationLabel = computed(() => resolveValidationLabel(validation.value));
const userInfoStatusLabel = computed(() => resolveUserInfoLabel(userInfo.value));

const compactStatusFields = computed(() => [
  {
    key: "profile",
    label: "环境",
    value: props.profileId || "未选择",
    tone: props.profileId ? "default" : "warning",
  },
  {
    key: "session",
    label: "会话",
    value: hasUsableSession.value ? "可用" : "待获取",
    tone: hasUsableSession.value ? "success" : "warning",
  },
  {
    key: "account",
    label: "账号",
    value: accountText.value,
    tone: accountText.value === "-" ? "muted" : "default",
  },
  {
    key: "mall",
    label: "店铺",
    value: mallText.value,
    tone: mallText.value === "未设置" ? "warning" : "default",
  },
  {
    key: "cookie",
    label: "Cookie",
    value: `G${regionCookieCounts.value.global} / U${regionCookieCounts.value.us} / E${regionCookieCounts.value.eu}`,
    tone: !regionCookieCounts.value.global
      ? "danger"
      : !regionCookieCounts.value.us || !regionCookieCounts.value.eu
        ? "warning"
        : "success",
  },
  {
    key: "identity",
    label: "身份",
    value: userInfoStatusLabel.value,
    tone:
      userInfoStatusLabel.value === "已获取"
        ? "success"
        : userInfoStatusLabel.value === "获取失败"
          ? "danger"
          : "warning",
  },
  {
    key: "validation",
    label: "校验",
    value: validationLabel.value,
    tone:
      validationLabel.value === "有效"
        ? "success"
        : validationLabel.value === "失效"
          ? "danger"
          : validationLabel.value === "待校验"
            ? "warning"
            : "muted",
  },
]);

const compactStatusNotices = computed(() => {
  const notices: Array<{ key: string; type: "info" | "warning" | "error"; text: string }> = [];

  if (!props.profileId) {
    notices.push({ key: "profile", type: "warning", text: "未选择执行环境" });
    return notices;
  }

  if (!hasUsableSession.value) {
    notices.push({ key: "session-missing", type: "error", text: "未获取可用会话" });
    return notices;
  }

  if (!regionCookieCounts.value.global) {
    notices.push({ key: "global", type: "error", text: "全球 Cookie 缺失" });
  }
  if (regionCookieCounts.value.global && !regionCookieCounts.value.us) {
    notices.push({ key: "us", type: "warning", text: "美区 Cookie 不完整" });
  }
  if (regionCookieCounts.value.global && !regionCookieCounts.value.eu) {
    notices.push({ key: "eu", type: "warning", text: "欧区 Cookie 不完整" });
  }
  if (!currentMallId.value) {
    notices.push({ key: "mall", type: "warning", text: "未绑定店铺" });
  }

  if (String(validation.value?.status || "").trim() === "invalid") {
    notices.push({ key: "validation-invalid", type: "error", text: "会话校验失败" });
  }

  if (String(userInfo.value?.status || "").trim() === "failed") {
    notices.push({ key: "userinfo-failed", type: "error", text: "身份信息获取失败" });
  }

  return notices;
});
</script>

<style scoped lang="scss">
.temu-context-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.temu-context-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.temu-context-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.temu-context-card__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 700;
}

.temu-context-card__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
}

.temu-context-field {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.temu-context-field span {
  white-space: nowrap;
}

.temu-context-field strong {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 700;
  word-break: break-word;
}

.temu-context-field strong.is-success {
  color: var(--el-color-success);
}

.temu-context-field strong.is-warning {
  color: var(--el-color-warning);
}

.temu-context-field strong.is-danger {
  color: var(--el-color-danger);
}

.temu-context-field strong.is-muted {
  color: var(--el-text-color-secondary);
}

.temu-context-card__notices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color);
}

.temu-status-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}

.temu-status-note::before {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  content: "";
}

.temu-status-note.is-info {
  color: var(--el-color-info);
}

.temu-status-note.is-warning {
  color: var(--el-color-warning);
}

.temu-status-note.is-error {
  color: var(--el-color-danger);
}

@media (max-width: 768px) {
  .temu-context-card__head {
    flex-direction: column;
    align-items: stretch;
  }

  .temu-context-card__actions {
    width: 100%;
  }
}
</style>
