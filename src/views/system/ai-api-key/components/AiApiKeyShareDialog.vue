<template>
  <Dialog v-model="dialogVisible" title="分享 AI API Key" width="520px">
    <el-form label-position="top">
      <el-form-item label="源 Key">
        <el-input :model-value="currentKey?.name || '-'" disabled />
      </el-form-item>
      <el-form-item label="目标用户">
        <el-select
          v-model="selectedUserIds"
          class="ai-api-key-share-dialog__select"
          clearable
          filterable
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择要复制给哪些用户"
          :loading="userLoading"
        >
          <el-option
            v-for="user in userOptions"
            :key="user.id"
            :label="formatUserLabel(user)"
            :value="user.id"
            :disabled="user.id === currentKey?.userId"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">
        确认分享
      </el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { shareAiApiKeyToUsers, type AiApiKeyConfig } from "@/api/aiApiKey";
import { getUserList } from "@/api/user";

interface ShareTargetUser {
  id: number;
  account?: string;
  username?: string;
  name?: string;
  nickname?: string;
}

const emit = defineEmits<{
  (event: "success"): void;
}>();

const dialogVisible = ref(false);
const submitting = ref(false);
const userLoading = ref(false);
const currentKey = ref<AiApiKeyConfig | null>(null);
const userOptions = ref<ShareTargetUser[]>([]);
const selectedUserIds = ref<number[]>([]);

const formatUserLabel = (user: ShareTargetUser) => {
  const name = user.name || user.nickname || user.account || user.username || "";
  return name ? `${name}（${user.id}）` : `用户 ${user.id}`;
};

const loadUsers = async () => {
  userLoading.value = true;
  try {
    const result = await getUserList({ currentPage: 1, pageSize: 500 });
    const list = Array.isArray(result?.list)
      ? result.list
      : Array.isArray(result?.data?.list)
        ? result.data.list
        : [];
    userOptions.value = list;
  } finally {
    userLoading.value = false;
  }
};

const open = async (row: AiApiKeyConfig) => {
  currentKey.value = row;
  selectedUserIds.value = [];
  dialogVisible.value = true;
  await loadUsers();
};

const submit = async () => {
  if (!currentKey.value?.id) return;
  if (!selectedUserIds.value.length) {
    ElMessage.warning("请选择目标用户");
    return;
  }

  submitting.value = true;
  try {
    const result = await shareAiApiKeyToUsers(currentKey.value.id, {
      userIds: selectedUserIds.value,
    });
    ElMessage.success(`已复制给 ${result.createdCount || 0} 个用户`);
    dialogVisible.value = false;
    emit("success");
  } catch (error: any) {
    ElMessage.error(error?.message || "分享失败");
  } finally {
    submitting.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.ai-api-key-share-dialog__select {
  width: 100%;
}
</style>
