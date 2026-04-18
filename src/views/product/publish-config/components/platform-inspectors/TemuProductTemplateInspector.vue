<template>
  <div class="publish-config-temu-parser">
    <div class="publish-config-temu-parser__header">
      <div>
        <div class="publish-config-temu-parser__title">当前模板结构</div>
        <div class="publish-config-temu-parser__desc">
          按接近 JSON 的层级方式展示当前 Temu 商品模板，方便查看字段结构、字段说明和源字段路径。
        </div>
      </div>
      <el-tag size="small" effect="plain" :type="resolveStatusTagType(analysis.status)">
        {{ analysis.statusText }}
      </el-tag>
    </div>

    <div v-if="analysis.rawEmpty" class="publish-config-temu-parser__placeholder">
      录入 Temu 商品模板后，这里会显示层级结构、数组数量和字段说明。
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

      <div class="publish-config-temu-parser__tip">
        当前先用于辅助查看，字段编辑会按后续白名单逐步开放。
      </div>

      <div v-if="analysis.unknownFieldKeys.length" class="publish-config-temu-parser__tip">
        暂未收录说明的字段：
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
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
}

.publish-config-temu-parser__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 0 0 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.publish-config-temu-parser__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.publish-config-temu-parser__desc {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.publish-config-temu-parser__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
  gap: 8px 12px;
}

.publish-config-temu-parser__summary-item {
  min-width: 0;
}

.publish-config-temu-parser__summary-item span {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.publish-config-temu-parser__summary-item strong {
  display: block;
  margin-top: 2px;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.publish-config-temu-parser__placeholder,
.publish-config-temu-parser__tip,
.publish-config-temu-parser__error {
  font-size: 12px;
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
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0;
  overflow: auto;
  padding-right: 4px;
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
