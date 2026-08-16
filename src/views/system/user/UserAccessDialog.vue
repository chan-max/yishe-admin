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
          <div class="access-dialog__section access-dialog__section--ai">
            <div class="access-dialog__title">共享 AI 使用权限</div>
            <div class="access-dialog__desc">
              {{
                targetUserIsAdmin
                  ? "管理员默认可使用公开 AI Key，无需额外开通。"
                  : "控制该用户是否可以选择管理员公开的 AI Key。"
              }}
            </div>
            <div class="access-dialog__ai-row">
              <el-switch
                v-model="form.aiAccessEnabled"
                :disabled="loading || submitLoading || targetUserIsAdmin"
              />
              <span class="access-dialog__ai-text">
                {{
                  targetUserIsAdmin
                    ? "管理员默认可使用公开 AI Key"
                    : form.aiAccessEnabled
                      ? "允许使用管理员公开的 AI Key"
                      : "仅可使用自己配置的 Key"
                }}
              </span>
            </div>
          </div>

          <div class="access-dialog__section">
            <div class="access-dialog__heading">
              <div>
                <div class="access-dialog__title">菜单权限</div>
                <div class="access-dialog__desc">
                  {{
                    targetUserIsAdmin
                      ? "管理员默认拥有全部菜单权限，这里展示当前生效范围。"
                      : "管理员专属菜单仅管理员用户可分配"
                  }}
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
              <div class="access-dialog__group-title">{{ t(group.label) }}</div>
              <el-checkbox-group v-model="form.menuKeys" class="access-dialog__checkboxes">
                <el-checkbox
                  v-for="option in group.options"
                  :key="option.key"
                  :label="option.key"
                  :disabled="isOptionDisabled(option)"
                  border
                >
                  {{ t(option.label) }}<span v-if="option.adminOnly">（仅管理员）</span>
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
import { useI18n } from "@/hooks/web/useI18n";
import {
  getUserAccessSetting,
  updateUserAccessSetting,
  type UserAccessControlSetting,
} from "@/api/user";
import type { MenuAccessOption } from "@/constants/access-control";
import {
  MENU_ACCESS_GROUPS,
  MENU_ACCESS_OPTIONS,
  normalizeMenuAccessKeys,
} from "@/router/menu-access-options";

const { t } = useI18n();

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
const form = reactive<UserAccessControlSetting>({
  menuKeys: [],
  aiAccessEnabled: false,
});

const allMenuOptions = MENU_ACCESS_OPTIONS;
const targetUserIsAdmin = computed(() => !!props.userIsAdmin);
const selectableMenuKeys = computed(() =>
  allMenuOptions
    .filter((option) => targetUserIsAdmin.value || !option.adminOnly)
    .map((option) => option.key),
);
const selectableMenuKeySet = computed(() => new Set(selectableMenuKeys.value));

function sanitizeMenuKeys(menuKeys: string[]) {
  return normalizeMenuAccessKeys(menuKeys, selectableMenuKeySet.value);
}

function isOptionDisabled(option: MenuAccessOption) {
  return !!option.adminOnly && !targetUserIsAdmin.value;
}

function resetForm() {
  form.menuKeys = [];
  form.aiAccessEnabled = false;
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
    form.menuKeys = targetUserIsAdmin.value
      ? [...selectableMenuKeys.value]
      : sanitizeMenuKeys(Array.isArray(accessControl?.menuKeys) ? accessControl.menuKeys : []);
    form.aiAccessEnabled = targetUserIsAdmin.value
      ? true
      : !!accessControl?.aiAccessEnabled;
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
    const menuKeys = targetUserIsAdmin.value
      ? [...selectableMenuKeys.value]
      : sanitizeMenuKeys(form.menuKeys);
    const aiAccessEnabled = targetUserIsAdmin.value ? true : !!form.aiAccessEnabled;
    await updateUserAccessSetting({
      userId: props.userId,
      accessControl: {
        menuKeys,
        aiAccessEnabled,
      },
    });
    form.menuKeys = menuKeys;
    form.aiAccessEnabled = aiAccessEnabled;
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

.access-dialog__section--ai {
  padding: 14px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
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
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.access-dialog__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.access-dialog__ai-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.access-dialog__ai-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
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

@media (width <= 768px) {
  .access-dialog__heading {
    flex-direction: column;
    align-items: stretch;
  }

  .access-dialog__toolbar {
    justify-content: flex-end;
  }

  .access-dialog__ai-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
