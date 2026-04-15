<template>
  <section class="temu-context-card">
    <div class="temu-context-card__head">
      <div class="temu-context-card__title">会话与身份</div>
      <div class="temu-context-card__actions">
        <el-button size="small" @click="emit('open-session-center')">会话中心</el-button>
      </div>
    </div>

    <div class="temu-context-card__grid">
      <div
        v-for="item in compactStatusFields"
        :key="item.key"
        class="temu-context-chip"
        :title="`${item.label}：${item.value}`"
      >
        <span class="temu-context-chip__label">{{ item.label }}</span>
        <strong class="temu-context-chip__value" :class="`is-${item.tone}`">
          {{ item.value }}
        </strong>
      </div>
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
  profileLoading?: boolean;
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
    value: props.profileLoading ? "" : props.profileId || "未选择",
    tone: props.profileLoading ? "muted" : props.profileId ? "default" : "warning",
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
    key: "session",
    label: "会话",
    value: hasUsableSession.value ? "可用" : "待获取",
    tone: hasUsableSession.value ? "success" : "warning",
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
  gap: 8px;
}

.temu-context-card__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.temu-context-card__title {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 700;
}

.temu-context-card__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 6px;
}

.temu-context-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.temu-context-chip__label {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.temu-context-chip__value {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

.temu-context-chip__value.is-success {
  color: var(--el-color-success);
}

.temu-context-chip__value.is-warning {
  color: var(--el-color-warning);
}

.temu-context-chip__value.is-danger {
  color: var(--el-color-danger);
}

.temu-context-chip__value.is-muted {
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .temu-context-card__head {
    flex-direction: column;
    align-items: stretch;
  }

  .temu-context-card__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .temu-context-card__actions {
    width: 100%;
  }
}
</style>
