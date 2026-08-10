<template>
  <Dialog
    v-model="dialogVisible"
    title="通知设置"
    width="680px"
    :close-on-click-modal="false"
  >
    <div v-loading="loading" class="notify-setting">
      <div class="notify-setting__desc">
        按通知场景独立配置，不同场景可推送到不同渠道。关闭的场景不会推送，但不影响原有业务执行。
      </div>

      <div class="notify-setting__list">
        <div v-for="item in formItems" :key="item.code" class="notify-row">
          <div class="notify-row__info">
            <div class="notify-row__label">{{ item.label }}</div>
            <div class="notify-row__scene">{{ item.scene }}</div>
          </div>
          <div class="notify-row__actions">
            <el-switch v-model="item.enabled" size="small" />
            <el-select
              v-model="item.channelId"
              size="small"
              class="notify-row__select"
              clearable
              filterable
              placeholder="选择渠道"
              :disabled="!item.enabled"
            >
              <el-option
                v-for="ch in enabledChannels"
                :key="ch.id"
                :label="ch.name"
                :value="ch.id!"
              >
                <span>{{ ch.name }}</span>
                <span class="notify-option__platform">
                  {{ formatPlatform(ch.platform) }}
                </span>
              </el-option>
            </el-select>
          </div>
        </div>
      </div>

      <div v-if="!enabledChannels.length" class="notify-setting__empty">
        暂无可用推送渠道，请先新增渠道配置。
      </div>
    </div>

    <template #footer>
      <div class="notify-setting__footer">
        <span class="notify-setting__footer-text">最近更新：{{ updatedAtText }}</span>
        <div class="notify-setting__footer-actions">
          <el-button size="small" @click="dialogVisible = false">取消</el-button>
          <el-button size="small" type="primary" :loading="saving" @click="saveConfig">
            保存
          </el-button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import dayjs from "dayjs";
import {
  getMessagePushScenes,
  getMessagePushChannelOptions,
  getUserMessagePushSetting,
  updateUserMessagePushSetting,
  type MessagePushConfig,
  type MessagePushScene,
  type UserMessagePushSetting,
} from "@/api/messagePush";
import { ElMessage } from "element-plus";

type FormItem = MessagePushScene & {
  enabled: boolean;
  channelId: number | null;
};

const emit = defineEmits(["saved"]);

const dialogVisible = ref(false);
const loading = ref(false);
const saving = ref(false);
const scenes = ref<MessagePushScene[]>([]);
const channels = ref<MessagePushConfig[]>([]);

const formItems = reactive<FormItem[]>([]);

const enabledChannels = computed(() => {
  return channels.value.filter((c) => c.enabled);
});

const updatedAtText = computed(() => {
  if (!formItems.length) return "未保存";
  const any = formItems.find((i) => i._updatedAt);
  return any?._updatedAt
    ? dayjs(any._updatedAt).format("YYYY-MM-DD HH:mm:ss")
    : "未保存";
});

const formatPlatform = (platform?: string) => {
  if (platform === "feishu") return "飞书";
  if (platform === "wecom") return "企微";
  return platform || "";
};

const applySetting = (payload?: Partial<UserMessagePushSetting>) => {
  const rawScenes = payload?.scenes || [];
  const sceneMap = new Map(rawScenes.map((s) => [s.code, s]));

  formItems.length = 0;
  scenes.value.forEach((scene) => {
    const existing = sceneMap.get(scene.code);
    formItems.push({
      ...scene,
      enabled: existing?.enabled !== false,
      channelId: existing?.channelId ?? null,
      _updatedAt: payload?.updatedAt,
    });
  });
};

const loadConfig = async () => {
  loading.value = true;
  try {
    const [scenesData, channelData, settingData] = await Promise.all([
      getMessagePushScenes(),
      getMessagePushChannelOptions(),
      getUserMessagePushSetting(),
    ]);
    scenes.value = Array.isArray(scenesData) ? scenesData : [];
    channels.value = Array.isArray(channelData) ? channelData : [];
    applySetting(settingData || {});
  } finally {
    loading.value = false;
  }
};

const open = async () => {
  dialogVisible.value = true;
  await loadConfig();
};

const saveConfig = async () => {
  const payload: UserMessagePushSetting = {
    scenes: formItems.map((item) => ({
      code: item.code,
      enabled: item.enabled,
      channelId: item.channelId,
    })),
    updatedAt: formItems[0]?._updatedAt || "",
  };

  saving.value = true;
  try {
    const data = await updateUserMessagePushSetting(payload);
    applySetting(data || payload);
    ElMessage.success("通知设置已保存");
    emit("saved");
    dialogVisible.value = false;
  } finally {
    saving.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.notify-setting {
  padding: 16px 4px;
}

.notify-setting__desc {
  padding: 10px 12px;
  margin-bottom: 16px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.notify-setting__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notify-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 10px;
  border-radius: 6px;
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.notify-row__info {
  flex: 1;
  min-width: 0;
}

.notify-row__label {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.notify-row__scene {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.notify-row__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.notify-row__select {
  width: 140px;
}

.notify-option__platform {
  float: right;
  margin-left: 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.notify-setting__empty {
  padding: 10px 12px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 6px;
}

.notify-setting__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.notify-setting__footer-text {
  color: var(--el-text-color-secondary);
}

.notify-setting__footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
