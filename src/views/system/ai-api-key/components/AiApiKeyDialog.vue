<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
    <div
      class="mb-14px rounded-12px bg-[var(--el-fill-color-light)] px-14px py-10px text-[12px] leading-[1.7] text-[var(--el-text-color-secondary)]"
    >
      这里录入的是可复用的 AI 凭据。具体功能使用哪个调用方式和模型，请在“AI 使用设置”里配置。
    </div>

    <el-form
      ref="formRef"
      :key="formRenderKey"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      class="ai-api-key-form"
      v-loading="formLoading"
      autocomplete="off"
    >
      <el-row :gutter="20">
        <el-col :xs="24" :md="12">
          <el-form-item label="名称" prop="name" class="ai-api-key-form__control-item">
            <el-input v-model="formData.name" placeholder="例如：OpenAI 主账号 Key" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="默认模型" class="ai-api-key-form__control-item">
            <el-input
              v-model="formData.model"
              placeholder="可选，例如：gpt-4o / qwen-vl-max-latest"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="Base URL" class="ai-api-key-form__control-item">
            <el-input
              v-model="formData.baseUrl"
              placeholder="可选，例如 https://api.openai.com/v1"
              autocomplete="off"
              name="ai-base-url"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="API Key" prop="apiKey" class="ai-api-key-form__control-item">
            <el-input
              v-model="formData.apiKey"
              placeholder="请输入 API 密钥"
              show-password
              autocomplete="new-password"
              name="ai-api-key"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="启用状态" class="ai-api-key-form__control-item">
            <el-switch v-model="formData.enabled" />
          </el-form-item>
        </el-col>
        <el-col v-if="canManagePublic" :xs="24" :md="12">
          <el-form-item label="公开使用" class="ai-api-key-form__control-item">
            <div class="ai-api-key-public-field">
              <el-switch v-model="formData.isPublic" />
              <div class="ai-api-key-public-field__hint">
                开启后，拥有共享 AI 使用权限的用户可引用这个 Key，但看不到明文。
              </div>
            </div>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="过期时间" class="ai-api-key-form__control-item">
            <el-date-picker
              v-model="formData.expiresAt"
              type="datetime"
              class="ai-api-key-form__date-picker !w-full"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="不填则视为长期有效"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              placeholder="补充这个 Key 的用途、来源或注意事项"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">确定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, unref } from "vue";
import { ElMessage } from "element-plus";
import {
  createAiApiKey,
  getAiApiKeyDetail,
  updateAiApiKey,
  type AiApiKeyConfig,
} from "@/api/aiApiKey";
import { useUserStore } from "@/store/modules/user";

const emit = defineEmits(["success"]);
const userStore = useUserStore();

const dialogVisible = ref(false);
const dialogTitle = ref("");
const formLoading = ref(false);
const formRef = ref();
const formRenderKey = ref(0);
const canManagePublic = computed(() => !!userStore.user?.isAdmin);

const createFormData = (): AiApiKeyConfig => ({
  name: "",
  model: "",
  apiKey: "",
  baseUrl: "",
  enabled: true,
  isPublic: false,
  expiresAt: "",
  remark: "",
});

const formData = reactive<AiApiKeyConfig>({
  ...createFormData(),
});

const formRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  apiKey: [{ required: true, message: "请输入 API Key", trigger: "blur" }],
};

const resetForm = () => {
  Object.assign(formData, createFormData(), { id: undefined });
  formRenderKey.value += 1;
};

const open = async (id?: number) => {
  dialogVisible.value = true;
  dialogTitle.value = id ? "编辑 AI API Key" : "新增 AI API Key";
  resetForm();

  if (!id) return;

  formLoading.value = true;
  try {
    const data = await getAiApiKeyDetail(id);
    Object.assign(formData, {
      ...createFormData(),
      ...data,
      model: data.model || "",
      apiKey: data.apiKey || "",
      baseUrl: data.baseUrl || "",
      isPublic: !!data.isPublic,
      expiresAt: data.expiresAt || "",
      remark: data.remark || "",
    });
  } finally {
    formLoading.value = false;
  }
};

const submitForm = async () => {
  const form = unref(formRef);
  if (!form) return;

  await form.validate(async (valid) => {
    if (!valid) return;

    formLoading.value = true;
    try {
      const payload: Partial<AiApiKeyConfig> = {
        ...formData,
        name: String(formData.name || "").trim(),
        model: String(formData.model || "").trim(),
        apiKey: String(formData.apiKey || "").trim(),
        baseUrl: String(formData.baseUrl || "").trim(),
        remark: String(formData.remark || "").trim(),
        expiresAt: formData.expiresAt || "",
        enabled: Boolean(formData.enabled),
      };

      if (canManagePublic.value) {
        payload.isPublic = Boolean(formData.isPublic);
      }

      if (payload.id) {
        await updateAiApiKey(payload.id, payload);
        ElMessage.success("修改成功");
      } else {
        await createAiApiKey(payload as AiApiKeyConfig);
        ElMessage.success("新增成功");
      }

      dialogVisible.value = false;
      emit("success");
    } finally {
      formLoading.value = false;
    }
  });
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.ai-api-key-form :deep(.ai-api-key-form__control-item .el-form-item__label) {
  display: flex;
  align-self: stretch;
  align-items: center;
  min-height: var(--ep-cover-control-height-lg, 38px);
  padding-top: 0;
  padding-bottom: 0;
  line-height: normal;
}

.ai-api-key-form :deep(.ai-api-key-form__control-item .el-form-item__content) {
  min-height: var(--ep-cover-control-height-lg, 38px);
  align-items: center;
}

.ai-api-key-form :deep(.ai-api-key-form__date-picker.el-date-editor) {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--ep-cover-control-height-lg, 38px);
}

.ai-api-key-form :deep(.ai-api-key-form__date-picker .el-input__wrapper) {
  min-height: var(--ep-cover-control-height-lg, 38px);
  align-items: center;
}

.ai-api-key-public-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-api-key-public-field__hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
