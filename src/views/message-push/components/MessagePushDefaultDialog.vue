<template>
  <Dialog v-model="dialogVisible" title="通知设置" width="680px">
    <div class="message-push-setting">
      <div class="message-push-setting__intro">
        已登录用户调用开放发送接口时，如果没有显式传入
        <code>channelId</code>，系统会优先使用这里绑定的默认通知渠道。
      </div>

      <el-alert
        :title="currentSummaryText"
        type="info"
        :closable="false"
        class="message-push-setting__alert"
      />

      <el-form
        v-loading="loading || saving"
        class="message-push-setting__form"
        label-position="top"
      >
        <el-form-item label="通知总开关">
          <div class="message-push-setting__field">
            <el-switch
              v-model="formData.enabled"
              inline-prompt
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="message-push-setting__help">
              关闭后，系统异步任务的成功/失败等额外通知将不再推送到外部通知渠道，但不会影响原有业务执行。
            </div>
          </div>
        </el-form-item>

        <el-form-item label="默认通知渠道">
          <el-select
            v-model="formData.defaultChannelId"
            class="message-push-setting__select"
            clearable
            filterable
            placeholder="不绑定则每次都需要显式传入 channelId"
            :disabled="!formData.enabled"
          >
            <el-option
              v-for="item in channelOptions"
              :key="item.id"
              :label="formatChannelOptionLabel(item)"
              :value="item.id!"
              :disabled="item.enabled === false"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="message-push-setting__footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { MessagePushConfig, MessagePushPlatform } from "@/api/messagePush";
import {
  getMessagePushSetting,
  updateMessagePushSetting,
  type UserMessagePushSetting,
} from "@/api/user";

const props = defineProps<{
  channels: MessagePushConfig[];
}>();

const emit = defineEmits<{
  (event: "saved", payload: UserMessagePushSetting): void;
}>();

const dialogVisible = ref(false);
const loading = ref(false);
const saving = ref(false);
const currentSetting = ref<UserMessagePushSetting>({
  enabled: true,
  defaultChannelId: null,
  defaultMessagePush: null,
});

const formData = reactive({
  enabled: true,
  defaultChannelId: null as number | null,
});

const platformLabelMap: Record<MessagePushPlatform, string> = {
  feishu: "飞书",
  wecom: "企业微信",
};

const channelOptions = computed(() => {
  return [...(props.channels || [])].sort(
    (left, right) => Number(right.id || 0) - Number(left.id || 0),
  );
});

const currentSummaryText = computed(() => {
  if (currentSetting.value?.enabled === false) {
    const current = currentSetting.value?.defaultMessagePush;
    if (!current || !currentSetting.value?.defaultChannelId) {
      return "当前通知已关闭，且未绑定默认通知渠道";
    }
    return `当前通知已关闭；默认通知渠道保留为 ${current.name}（ID: ${current.id} / ${formatPlatform(
      current.platform as MessagePushPlatform,
    )}）`;
  }

  const current = currentSetting.value?.defaultMessagePush;
  if (!current || !currentSetting.value?.defaultChannelId) {
    return "当前通知已开启，但未绑定默认通知渠道";
  }
  const suffix = current.enabled === false ? "，该渠道已停用，请尽快调整" : "";
  return `当前通知已开启；默认通知：${current.name}（ID: ${current.id} / ${formatPlatform(
    current.platform as MessagePushPlatform,
  )}）${suffix}`;
});

const formatPlatform = (platform?: MessagePushPlatform | string) => {
  const normalized = String(platform || "")
    .trim()
    .toLowerCase() as MessagePushPlatform;
  return platformLabelMap[normalized] || normalized || "-";
};

const formatChannelOptionLabel = (item: MessagePushConfig) => {
  const platform = formatPlatform(item.platform);
  const status = item.enabled === false ? "已停用" : "启用";
  return `${item.name}（ID: ${item.id} / ${platform} / ${status}）`;
};

const loadSetting = async () => {
  loading.value = true;
  try {
    const data = await getMessagePushSetting();
    currentSetting.value = data || {
      enabled: true,
      defaultChannelId: null,
      defaultMessagePush: null,
    };
    formData.enabled = currentSetting.value.enabled !== false;
    formData.defaultChannelId = currentSetting.value.defaultChannelId || null;
  } finally {
    loading.value = false;
  }
};

const open = async () => {
  dialogVisible.value = true;
  await loadSetting();
};

const submitForm = async () => {
  const selectedChannel =
    channelOptions.value.find(
      (item) => Number(item.id) === Number(formData.defaultChannelId),
    ) || null;

  if (selectedChannel && selectedChannel.enabled === false) {
    ElMessage.error("所选通知渠道已停用，请重新选择");
    return;
  }

  saving.value = true;
  try {
    const data = await updateMessagePushSetting({
      enabled: formData.enabled,
      defaultChannelId: formData.enabled
        ? formData.defaultChannelId
        : formData.defaultChannelId,
    });
    currentSetting.value = data || {
      enabled: true,
      defaultChannelId: null,
      defaultMessagePush: null,
    };
    formData.enabled = currentSetting.value.enabled !== false;
    formData.defaultChannelId = currentSetting.value.defaultChannelId || null;
    ElMessage.success("通知设置已保存");
    emit("saved", currentSetting.value);
    dialogVisible.value = false;
  } finally {
    saving.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.message-push-setting {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-push-setting__intro {
  padding: 12px 14px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 10px;
}

.message-push-setting__intro code {
  padding: 1px 5px;
  margin: 0 2px;
  font-family: var(--el-font-family);
  color: var(--el-color-primary);
  background: var(--el-fill-color);
  border-radius: 4px;
}

.message-push-setting__alert {
  align-items: flex-start;
}

.message-push-setting__form {
  padding-top: 2px;
}

.message-push-setting__form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.message-push-setting__form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.message-push-setting__form :deep(.el-form-item__label) {
  padding: 0 0 8px;
  font-weight: 500;
  line-height: 20px;
  color: var(--el-text-color-primary);
}

.message-push-setting__field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.message-push-setting__help {
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.message-push-setting__select {
  width: 100%;
}

.message-push-setting__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.message-push-setting__footer :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
