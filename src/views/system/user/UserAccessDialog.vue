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

          <div class="access-dialog__section">
            <div class="access-dialog__title">数据范围</div>
            <el-radio-group v-model="form.dataScope.mode">
              <el-radio label="self">仅自己</el-radio>
              <el-radio label="specificUsers">指定用户</el-radio>
              <el-radio label="all">全部用户</el-radio>
            </el-radio-group>
            <el-select
              v-if="form.dataScope.mode === 'specificUsers'"
              v-model="form.dataScope.userIds"
              class="access-dialog__user-select"
              multiple
              filterable
              clearable
              placeholder="请选择可查看的数据所属用户"
            >
              <el-option
                v-for="item in userOptions"
                :key="item.id"
                :label="item.label"
                :value="item.id"
              />
            </el-select>
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
import { getUserAccessSetting, getUserList, updateUserAccessSetting } from "@/api/user";
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
const userOptions = ref<{ id: string; label: string }[]>([]);
const form = reactive({
  menuKeys: [] as string[],
  dataScope: {
    mode: "self",
    userIds: [] as string[]
  }
});

function resetForm() {
  form.menuKeys = [];
  form.dataScope.mode = "self";
  form.dataScope.userIds = [];
}

async function loadUserOptions() {
  const res = await getUserList({
    currentPage: 1,
    pageSize: 1000
  });
  userOptions.value = (res.list || []).map((item: any) => ({
    id: String(item.id),
    label: `${item.name || item.account} (${item.account})`
  }));
}

async function handleOpen() {
  if (!props.userId) {
    return;
  }

  loading.value = true;
  resetForm();
  try {
    const [accessControl] = await Promise.all([
      getUserAccessSetting({ userId: props.userId }),
      loadUserOptions()
    ]);
    form.menuKeys = Array.isArray(accessControl?.menuKeys) ? accessControl.menuKeys : [];
    form.dataScope.mode = accessControl?.dataScope?.mode || "self";
    form.dataScope.userIds = Array.isArray(accessControl?.dataScope?.userIds)
      ? accessControl.dataScope.userIds.map((item: any) => String(item))
      : [];
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
    const uniqueUserIds = Array.from(new Set([
      String(props.userId),
      ...form.dataScope.userIds.map((item) => String(item))
    ].filter(Boolean)));

    await updateUserAccessSetting({
      userId: props.userId,
      accessControl: {
        menuKeys: form.menuKeys,
        dataScope: {
          mode: form.dataScope.mode,
          userIds: form.dataScope.mode === "specificUsers" ? uniqueUserIds : []
        }
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

.access-dialog__user-select {
  width: 100%;
}

.access-dialog__footer {
  display: flex;
  justify-content: flex-end;
}
</style>
