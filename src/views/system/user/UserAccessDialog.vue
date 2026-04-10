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
            <div class="access-dialog__heading">
              <div>
                <div class="access-dialog__title">菜单权限</div>
                <div v-if="!targetUserIsAdmin" class="access-dialog__desc">
                  管理员专属菜单仅管理员用户可分配
                </div>
              </div>
              <div class="access-dialog__toolbar">
                <el-button
                  link
                  type="primary"
                  :disabled="loading || submitLoading || !selectableMenuKeys.length"
                  @click="handleSelectAll"
                >
                  全选
                </el-button>
                <el-button
                  link
                  type="primary"
                  :disabled="loading || submitLoading || !selectableMenuKeys.length"
                  @click="handleInvertSelection"
                >
                  反选
                </el-button>
              </div>
            </div>
            <div
              v-for="group in MENU_ACCESS_GROUPS"
              :key="group.label"
              class="access-dialog__group"
            >
              <div class="access-dialog__group-title">{{ group.label }}</div>
              <el-checkbox-group v-model="form.menuKeys" class="access-dialog__checkboxes">
                <el-checkbox
                  v-for="option in group.options"
                  :key="option.key"
                  :label="option.key"
                  :disabled="isOptionDisabled(option)"
                  border
                >
                  {{ option.label }}<span v-if="option.adminOnly">（仅管理员）</span>
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
import { MENU_ACCESS_GROUPS, type MenuAccessOption } from "@/constants/access-control";

const props = defineProps<{
  modelValue: boolean;
  userId: string;
  userName?: string;
  userIsAdmin?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const loading = ref(false);
const submitLoading = ref(false);
const form = reactive({
  menuKeys: [] as string[],
});

const allMenuOptions = MENU_ACCESS_GROUPS.flatMap((group) => group.options);
const allMenuKeySet = new Set(allMenuOptions.map((option) => option.key));
const targetUserIsAdmin = computed(() => !!props.userIsAdmin);
const selectableMenuKeys = computed(() =>
  allMenuOptions
    .filter((option) => targetUserIsAdmin.value || !option.adminOnly)
    .map((option) => option.key),
);
const selectableMenuKeySet = computed(() => new Set(selectableMenuKeys.value));

function sanitizeMenuKeys(menuKeys: string[]) {
  return Array.from(
    new Set(
      menuKeys
        .map((item) => String(item || "").trim())
        .filter((item) => allMenuKeySet.has(item))
        .filter((item) => selectableMenuKeySet.value.has(item)),
    ),
  );
}

function isOptionDisabled(option: MenuAccessOption) {
  return !!option.adminOnly && !targetUserIsAdmin.value;
}

function resetForm() {
  form.menuKeys = [];
}

function handleSelectAll() {
  form.menuKeys = [...selectableMenuKeys.value];
}

function handleInvertSelection() {
  const selectedSet = new Set(form.menuKeys);
  form.menuKeys = selectableMenuKeys.value.filter((key) => !selectedSet.has(key));
}

async function handleOpen() {
  if (!props.userId) {
    return;
  }

  loading.value = true;
  resetForm();
  try {
    const accessControl = await getUserAccessSetting({ userId: props.userId });
    form.menuKeys = sanitizeMenuKeys(
      Array.isArray(accessControl?.menuKeys) ? accessControl.menuKeys : [],
    );
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
    const menuKeys = sanitizeMenuKeys(form.menuKeys);
    await updateUserAccessSetting({
      userId: props.userId,
      accessControl: {
        menuKeys,
      },
    });
    form.menuKeys = menuKeys;
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

.access-dialog__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.access-dialog__title {
  font-size: 15px;
  font-weight: 600;
}

.access-dialog__desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.access-dialog__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
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

@media (max-width: 768px) {
  .access-dialog__heading {
    flex-direction: column;
    align-items: stretch;
  }

  .access-dialog__toolbar {
    justify-content: flex-end;
  }
}
</style>
