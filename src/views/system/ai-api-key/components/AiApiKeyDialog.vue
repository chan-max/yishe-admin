<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
    <div
      class="mb-14px rounded-12px bg-[var(--el-fill-color-light)] px-14px py-10px text-[12px] leading-[1.7] text-[var(--el-text-color-secondary)]"
    >
      当前只做 AI Key 基础信息录入与启停管理，暂不处理具体平台对接逻辑。
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      class="ai-api-key-form"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :xs="24" :md="12">
          <el-form-item label="名称" prop="name" class="ai-api-key-form__control-item">
            <el-input v-model="formData.name" placeholder="例如：OpenAI 主账号 Key" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="平台" prop="platform" class="ai-api-key-form__control-item">
            <el-select
              v-model="formData.platform"
              class="w-full"
              filterable
              allow-create
              default-first-option
              placeholder="请选择或输入平台"
            >
              <el-option
                v-for="item in platformOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="API Key" prop="apiKey" class="ai-api-key-form__control-item">
            <el-input v-model="formData.apiKey" placeholder="请输入 API 密钥" show-password />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="启用状态" class="ai-api-key-form__control-item">
            <el-switch v-model="formData.enabled" />
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
import { reactive, ref, unref } from "vue";
import { ElMessage } from "element-plus";
import {
  createAiApiKey,
  getAiApiKeyDetail,
  updateAiApiKey,
  type AiApiKeyConfig,
} from "@/api/aiApiKey";

const emit = defineEmits(["success"]);

const dialogVisible = ref(false);
const dialogTitle = ref("");
const formLoading = ref(false);
const formRef = ref();

const platformOptions = [
  { label: "OpenAI", value: "openai" },
  { label: "Claude", value: "claude" },
  { label: "Qwen", value: "qwen" },
  { label: "DeepSeek", value: "deepseek" },
  { label: "Gemini", value: "gemini" },
  { label: "Doubao", value: "doubao" },
  { label: "Moonshot", value: "moonshot" },
  { label: "OpenRouter", value: "openrouter" },
];

const createFormData = (): AiApiKeyConfig => ({
  name: "",
  platform: "openai",
  apiKey: "",
  enabled: true,
  expiresAt: "",
  remark: "",
});

const formData = reactive<AiApiKeyConfig>({
  ...createFormData(),
});

const formRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  platform: [{ required: true, message: "请选择或输入平台", trigger: "change" }],
  apiKey: [{ required: true, message: "请输入 API Key", trigger: "blur" }],
};

const resetForm = () => {
  Object.assign(formData, createFormData(), { id: undefined });
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
      apiKey: data.apiKey || "",
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
      const payload: AiApiKeyConfig = {
        ...formData,
        name: String(formData.name || "").trim(),
        platform: String(formData.platform || "")
          .trim()
          .toLowerCase(),
        apiKey: String(formData.apiKey || "").trim(),
        remark: String(formData.remark || "").trim(),
        expiresAt: formData.expiresAt || "",
        enabled: Boolean(formData.enabled),
      };

      if (payload.id) {
        await updateAiApiKey(payload.id, payload);
        ElMessage.success("修改成功");
      } else {
        await createAiApiKey(payload);
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
</style>
