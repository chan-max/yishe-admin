<template>
  <el-dialog
    :model-value="modelValue"
    fullscreen
    append-to-body
    destroy-on-close
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    class="task-execution-trigger-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4 pr-8">
        <div>
          <div class="text-5 text-slate-900 font-600 leading-tight">选择执行环境</div>
          <div class="mt-1 text-3.5 text-slate-500 leading-6">
            手动选择一个浏览器自动化环境，本次执行生效，不会写入任务配置。
          </div>
        </div>
      </div>
    </template>

    <div class="min-h-full bg-slate-50 px-6 py-5 md:px-8">
      <div class="mx-auto max-w-6xl">
        <BrowserAutomationExecutionContextCard
          v-model="executionContext"
          :platform="platform"
          :task-type="taskType"
          title="浏览器自动化执行环境"
          description="请选择本次任务要使用的客户端与浏览器环境。"
        />
      </div>
    </div>

    <template #footer>
      <div class="mx-auto flex max-w-6xl items-center justify-end gap-3 px-2">
        <el-button :disabled="submitting" @click="emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirm">开始执行</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import BrowserAutomationExecutionContextCard from "@/components/BrowserAutomationExecutionContextCard.vue";
import {
  createDefaultBrowserAutomationExecutionContext,
  normalizeBrowserAutomationExecutionContext,
  type BrowserAutomationExecutionContext,
} from "@/views/operation/ecom-data/shared";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    platform?: string;
    taskType?: string;
    submitting?: boolean;
  }>(),
  {
    platform: "",
    taskType: "",
    submitting: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm", value: BrowserAutomationExecutionContext): void;
}>();

const executionContext = ref(createDefaultBrowserAutomationExecutionContext());

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      executionContext.value = createDefaultBrowserAutomationExecutionContext();
    }
  },
);

const handleConfirm = () => {
  const normalizedContext = normalizeBrowserAutomationExecutionContext(
    executionContext.value,
  );
  if (!String(normalizedContext.clientId || "").trim()) {
    ElMessage.warning("请先选择浏览器自动化执行环境");
    return;
  }
  emit(
    "confirm",
    normalizedContext,
  );
};
</script>

<style scoped lang="scss">
:deep(.task-execution-trigger-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 18px 24px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: #fff;
}

:deep(.task-execution-trigger-dialog .el-dialog__body) {
  padding: 0;
  background: #f8fafc;
}

:deep(.task-execution-trigger-dialog .el-dialog__footer) {
  padding: 14px 24px 18px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: #fff;
}
</style>
