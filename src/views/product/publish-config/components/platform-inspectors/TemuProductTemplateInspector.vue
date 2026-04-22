<template>
  <div class="publish-config-temu-parser">
    <div v-if="analysis.rawEmpty" class="publish-config-temu-parser__placeholder">
      录入 Temu 商品模板后，这里会以可编辑层级结构显示字段。
    </div>

    <template v-else-if="analysis.status === 'error'">
      <div class="publish-config-temu-parser__error">
        {{ analysis.error }}
      </div>
    </template>

    <template v-else>
      <div class="publish-config-temu-parser__tree">
        <TemuTemplateTreeNode
          v-for="node in analysis.tree"
          :key="node.id"
          :node="node"
          :editable-source-paths="props.editableSourcePaths"
          @update-node="handleNodeUpdate"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  analyzeTemuProductTemplate,
  updateTemuProductTemplateValue,
} from "../../task-types/publish-product/platform-handlers/temu-template";
import TemuTemplateTreeNode from "./TemuTemplateTreeNode.vue";

defineOptions({ name: "TemuProductTemplateInspector" });

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const props = defineProps<{
  modelValue?: unknown;
  editableSourcePaths?: string[];
}>();

// 模板文本每次重新解析为树，保证外部文本修改和树内编辑始终是同一份数据。
const analysis = computed(() => analyzeTemuProductTemplate(props.modelValue));

function handleNodeUpdate(payload: { sourcePath: string; value: string | number | boolean }) {
  const nextText = updateTemuProductTemplateValue(
    props.modelValue,
    payload.sourcePath,
    payload.value,
  );
  if (nextText) {
    emit("update:modelValue", nextText);
  }
}
</script>

<style scoped lang="less">
.publish-config-temu-parser {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.publish-config-temu-parser__placeholder,
.publish-config-temu-parser__error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  padding: 12px;
  box-sizing: border-box;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}

.publish-config-temu-parser__placeholder {
  color: var(--el-text-color-secondary);
}

.publish-config-temu-parser__error {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger-light-7);
  background: var(--el-color-danger-light-9);
}

.publish-config-temu-parser__tree {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  overflow: auto;
  padding-right: 2px;
}
</style>
