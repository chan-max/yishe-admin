<template>
  <el-dialog
    v-model="dialogVisible"
    title="分配权限"
    width="760px"
    destroy-on-close
    @open="handleOpen"
  >
    <el-skeleton :loading="loading" animated>
      <template #default>
        <div class="access-dialog">
          <div class="access-dialog__section">
            <div class="access-dialog__title">菜单权限</div>
            <div v-for="group in MENU_ACCESS_GROUPS" :key="group.label" class="access-dialog__group">
              <div class="access-dialog__group-title">{{ group.label }}</div>
              <el-checkbox-group v-model="form.menuKeys" class="access-dialog__checkboxes">
                <el-checkbox
                  v-for="option in group.options"
                  :key="option.key"
                  :label="option.key"
                  border
                >
                  {{ option.label }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </div>
      </template>
    </el-skeleton>

    <template #footer>
      <div class="access-dialog__footer">
        <el-button :disabled="submitLoading" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { getUserAccessSetting, updateUserAccessSetting } from "@/api/user";
import { MENU_ACCESS_GROUPS } from "@/constants/access-control";

const props = defineProps<{
  modelValue: boolean;
  userId: string;
  userName?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value)
});

const loading = ref(false);
const submitLoading = ref(false);
const form = reactive({
  menuKeys: [] as string[]
});

function resetForm() {
  form.menuKeys = [];
}

async function handleOpen() {
  if (!props.userId) {
    return;
  }

  loading.value = true;
  resetForm();
  try {
    const accessControl = await getUserAccessSetting({ userId: props.userId });
    form.menuKeys = Array.isArray(accessControl?.menuKeys) ? accessControl.menuKeys : [];
  } catch (error) {
    ElMessage.error("加载权限配置失败");
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!props.userId) {
    return;
  }

  submitLoading.value = true;
  try {
    await updateUserAccessSetting({
      userId: props.userId,
      accessControl: {
        menuKeys: form.menuKeys
      }
    });
    ElMessage.success("权限配置已保存");
    emit("success");
    dialogVisible.value = false;
  } catch (error) {
    ElMessage.error("保存权限配置失败");
  } finally {
    submitLoading.value = false;
  }
}
</script>

<style scoped>
.access-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.access-dialog__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.access-dialog__title {
  font-size: 15px;
  font-weight: 600;
}

.access-dialog__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.access-dialog__group-title {
  color: var(--el-text-color-secondary);
}

.access-dialog__checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.access-dialog__footer {
  display: flex;
  justify-content: flex-end;
}
</style>
