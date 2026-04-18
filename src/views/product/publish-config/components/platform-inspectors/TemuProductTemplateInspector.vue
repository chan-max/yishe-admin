<template>
  <div class="publish-config-temu-parser">
    <div class="publish-config-temu-parser__header">
      <div>
        <div class="publish-config-temu-parser__title">模板辅助解析</div>
        <div class="publish-config-temu-parser__desc">
          右侧按接近 JSON 的层级方式展示当前输入结构，方便和左侧模板逐项对照查看。
        </div>
      </div>
      <el-tag size="small" effect="plain" :type="resolveStatusTagType(analysis.status)">
        {{ analysis.statusText }}
      </el-tag>
    </div>

    <div v-if="analysis.rawEmpty" class="publish-config-temu-parser__placeholder">
      录入 Temu 商品模板后，这里会即时显示层级结构、数组数量和字段说明。
    </div>

    <template v-else-if="analysis.status === 'error'">
      <div class="publish-config-temu-parser__error">
        {{ analysis.error }}
      </div>
    </template>

    <template v-else>
      <div class="publish-config-temu-parser__summary">
        <div
          v-for="item in analysis.summaryItems"
          :key="item.key"
          class="publish-config-temu-parser__summary-item"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>

      <div class="publish-config-temu-parser__tip">当前只做辅助查看，不在这里直接修改字段值。</div>

      <div v-if="analysis.unknownFieldKeys.length" class="publish-config-temu-parser__tip">
        以下字段暂未收录中文说明，会先按原始字段名展示：
        {{ analysis.unknownFieldKeys.join("、") }}
      </div>

      <div class="publish-config-temu-parser__tree">
        <TemuTemplateTreeNode
          v-for="node in analysis.tree"
          :key="node.id"
          :node="node"
          :editable-source-paths="editableSourcePaths"
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

const analysis = computed(() => analyzeTemuProductTemplate(props.modelValue));
const editableSourcePaths = computed(() => props.editableSourcePaths || []);

function resolveStatusTagType(status?: string) {
  if (status === "success") {
    return "success";
  }
  if (status === "error") {
    return "danger";
  }
  return "info";
}

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
  min-height: 560px;
  padding: 0 0 0 8px;
  border-left: 1px solid var(--el-border-color);
  box-sizing: border-box;
  overflow: auto;
}

.publish-config-temu-parser__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 0 0 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.publish-config-temu-parser__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.publish-config-temu-parser__desc {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.publish-config-temu-parser__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 8px;
}

.publish-config-temu-parser__summary-item {
  min-width: 0;
}

.publish-config-temu-parser__summary-item span {
  display: block;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.publish-config-temu-parser__summary-item strong {
  display: block;
  margin-top: 2px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.publish-config-temu-parser__placeholder,
.publish-config-temu-parser__tip,
.publish-config-temu-parser__error {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.45;
}

.publish-config-temu-parser__placeholder,
.publish-config-temu-parser__tip {
  color: var(--el-text-color-secondary);
}

.publish-config-temu-parser__error {
  color: var(--el-color-danger);
}

.publish-config-temu-parser__tree {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 8px;
  padding: 0;
}

@media (max-width: 768px) {
  .publish-config-temu-parser__header {
    flex-direction: column;
  }

  .publish-config-temu-parser__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
