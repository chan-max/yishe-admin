<template>
  <el-dialog
    :model-value="modelValue"
    width="760px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    title="选择执行环境"
    class="task-execution-trigger-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="task-execution-trigger-dialog__body">
      <BrowserAutomationExecutionContextCard
        v-model="executionContext"
        :platform="platform"
        :task-type="taskType"
        title=""
        description=""
      />
    </div>

    <template #footer>
      <div class="task-execution-trigger-dialog__footer">
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
    ElMessage.warning("请先选择浏览器自动化客户端");
    return;
  }
  if (!String(normalizedContext.profileId || "").trim()) {
    ElMessage.warning("请先选择浏览器环境 / Profile");
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
  padding-bottom: 8px;
}

:deep(.task-execution-trigger-dialog .el-dialog__body) {
  padding-top: 0;
}

:deep(.task-execution-trigger-dialog .el-dialog__footer) {
  padding-top: 8px;
}

.task-execution-trigger-dialog__body {
  padding-top: 0;
}

.task-execution-trigger-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
