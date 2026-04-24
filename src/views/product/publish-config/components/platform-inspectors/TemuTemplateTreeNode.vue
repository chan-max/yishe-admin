<template>
  <div
    class="temu-tree-node"
    :class="{
      'temu-tree-node--branch': hasChildren,
      'temu-tree-node--leaf': !hasChildren,
    }"
  >
    <div class="temu-tree-node__main">
      <div class="temu-tree-node__row">
        <button
          v-if="hasChildren"
          type="button"
          class="temu-tree-node__toggle"
          :class="{ 'is-expanded': expanded }"
          @click="toggleExpanded"
        >
          <span class="temu-tree-node__toggle-arrow">&gt;</span>
        </button>
        <span v-else class="temu-tree-node__toggle-spacer"></span>

        <div class="temu-tree-node__body">
          <div class="temu-tree-node__title-row">
            <code class="temu-tree-node__key">{{ node.displayKey }}</code>
            <span class="temu-tree-node__label">{{ node.label }}</span>
            <span class="temu-tree-node__meta">{{ node.typeLabel }}</span>
            <el-button
              v-if="isArrayNode"
              size="small"
              text
              type="primary"
              class="temu-tree-node__inline-action"
              @click.stop="addArrayItem"
            >
              添加元素
            </el-button>
            <el-button
              v-if="isArrayItemNode"
              size="small"
              text
              type="danger"
              class="temu-tree-node__inline-action"
              @click.stop="removeArrayItem"
            >
              删除元素
            </el-button>
          </div>

          <div class="temu-tree-node__sub-row">
            <code class="temu-tree-node__source" :title="node.sourcePath">{{ node.sourcePath }}</code>
            <span v-if="hasChildren" class="temu-tree-node__preview">
              {{ node.preview }}
            </span>
            <span v-else-if="showLeafPreview" class="temu-tree-node__value-preview">
              {{ node.preview }}
            </span>
          </div>

          <div v-if="showDescription" class="temu-tree-node__desc">
            {{ node.description }}
          </div>

          <div v-if="canRenderEditor" class="temu-tree-node__editor">
            <el-switch
              v-if="node.valueType === 'boolean'"
              v-model="draftBoolean"
              inline-prompt
              active-text="true"
              inactive-text="false"
              @change="handleBooleanChange"
            />

            <template v-else>
              <div class="temu-tree-node__editor-row">
                <el-input
                  v-model="draftText"
                  :type="isLongText ? 'textarea' : 'text'"
                  :rows="isLongText ? 2 : undefined"
                  size="small"
                  :placeholder="node.valueType === 'number' ? '输入数字' : '输入字段值'"
                />

                <div v-if="isDirty" class="temu-tree-node__editor-actions">
                  <el-button
                    size="small"
                    type="primary"
                    :disabled="!!editorError"
                    @click="applyEdit"
                  >
                    应用
                  </el-button>
                  <el-button size="small" text @click="resetDraft">重置</el-button>
                </div>
              </div>

              <div v-if="editorError" class="temu-tree-node__error">
                {{ editorError }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-if="hasChildren && expanded" class="temu-tree-node__children">
      <TemuTemplateTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :editable-source-paths="editableSourcePaths"
        @update-node="forwardUpdate"
        @add-array-item="forwardAddArrayItem"
        @remove-array-item="forwardRemoveArrayItem"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { TemuTemplateTreeNode as TemuTemplateTreeNodeData } from "../../task-types/publish-product/platform-handlers/temu-template";

defineOptions({ name: "TemuTemplateTreeNode" });

const emit = defineEmits<{
  (e: "update-node", payload: { sourcePath: string; value: string | number | boolean }): void;
  (e: "add-array-item", payload: { sourcePath: string }): void;
  (e: "remove-array-item", payload: { sourcePath: string; index: number }): void;
}>();

const props = defineProps<{
  node: TemuTemplateTreeNodeData;
  editableSourcePaths?: string[];
}>();

const draftText = ref("");
const draftBoolean = ref(false);
const expanded = ref(true);

const hasChildren = computed(() => props.node.children.length > 0);
const isArrayNode = computed(() => props.node.typeLabel === "数组");
const arrayItemInfo = computed(() => {
  const match = String(props.node.sourcePath || "").match(/^(.*)\[(\d+)\]$/);
  if (!match) return null;
  return {
    sourcePath: match[1],
    index: Number(match[2]),
  };
});
const isArrayItemNode = computed(() => !!arrayItemInfo.value);
const editableSourcePaths = computed(() => props.editableSourcePaths || []);
const canEdit = computed(() => {
  // 节点自身可编辑还不够，外层还可以进一步限制允许改动的 sourcePath 白名单。
  if (!props.node.editable) {
    return false;
  }

  if (!editableSourcePaths.value.length) {
    return true;
  }

  return editableSourcePaths.value.includes(props.node.sourcePath);
});
const canRenderEditor = computed(() => !hasChildren.value && canEdit.value);
const showLeafPreview = computed(() => !hasChildren.value && !canEdit.value);
const showDescription = computed(() => {
  if (!props.node.description) {
    return false;
  }

  return !hasChildren.value || props.node.depth === 0;
});
const isLongText = computed(
  () => props.node.valueType === "string" && String(props.node.rawValue || "").length > 48,
);
const rawTextValue = computed(() =>
  props.node.rawValue === null || props.node.rawValue === undefined ? "" : String(props.node.rawValue),
);
const isDirty = computed(() => {
  if (!canRenderEditor.value || props.node.valueType === "boolean") {
    return false;
  }

  return draftText.value !== rawTextValue.value;
});
const editorError = computed(() => {
  if (props.node.valueType !== "number") {
    return "";
  }

  const normalized = String(draftText.value || "").trim();
  if (!normalized) {
    return "数字不能为空";
  }
  return Number.isFinite(Number(normalized)) ? "" : "请输入合法数字";
});

watch(
  () => props.node.rawValue,
  (value) => {
    // 外部模板文本被其他节点更新后，这里同步草稿态，避免局部编辑器显示旧值。
    draftText.value = value === null || value === undefined ? "" : String(value);
    draftBoolean.value = Boolean(value);
  },
  { immediate: true },
);

function toggleExpanded() {
  expanded.value = !expanded.value;
}

function resetDraft() {
  draftText.value = rawTextValue.value;
}

function handleBooleanChange(value: string | number | boolean) {
  if (!canEdit.value) {
    return;
  }

  emit("update-node", {
    sourcePath: props.node.sourcePath,
    value: Boolean(value),
  });
}

function applyEdit() {
  if (!canRenderEditor.value || props.node.valueType === null || !isDirty.value) {
    return;
  }

  if (props.node.valueType === "number") {
    if (editorError.value) {
      return;
    }
    emit("update-node", {
      sourcePath: props.node.sourcePath,
      value: Number(String(draftText.value || "").trim()),
    });
    return;
  }

  emit("update-node", { sourcePath: props.node.sourcePath, value: draftText.value });
}

function forwardUpdate(payload: { sourcePath: string; value: string | number | boolean }) {
  emit("update-node", payload);
}

function addArrayItem() {
  emit("add-array-item", { sourcePath: props.node.sourcePath });
}

function removeArrayItem() {
  if (!arrayItemInfo.value) return;
  emit("remove-array-item", arrayItemInfo.value);
}

function forwardAddArrayItem(payload: { sourcePath: string }) {
  emit("add-array-item", payload);
}

function forwardRemoveArrayItem(payload: { sourcePath: string; index: number }) {
  emit("remove-array-item", payload);
}
</script>

<style scoped lang="less">
.temu-tree-node {
  min-width: 0;
}

.temu-tree-node__main {
  border: 1px solid var(--el-border-color-lighter);
  border-left: 3px solid var(--el-color-primary-light-7);
  border-radius: 7px;
  background: var(--el-bg-color);
}

.temu-tree-node__row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
}

.temu-tree-node__toggle,
.temu-tree-node__toggle-spacer {
  flex: 0 0 20px;
  width: 20px;
}

.temu-tree-node__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.temu-tree-node__toggle:hover {
  border-color: var(--el-color-primary-light-5);
}

.temu-tree-node__toggle-arrow {
  display: inline-flex;
  font-size: 11px;
  font-weight: 700;
  transform-origin: center;
  transition: transform 0.2s ease;
}

.temu-tree-node__toggle.is-expanded .temu-tree-node__toggle-arrow {
  transform: rotate(90deg);
}

.temu-tree-node__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.temu-tree-node__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 6px;
  min-width: 0;
}

.temu-tree-node__key {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 600;
}

.temu-tree-node__label {
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.temu-tree-node__inline-action {
  height: 20px;
  padding: 0 4px;
  font-size: 11px;
}

.temu-tree-node__meta {
  padding: 0 6px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 18px;
}

.temu-tree-node__sub-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  min-width: 0;
}

.temu-tree-node__source {
  display: inline-block;
  max-width: min(100%, 420px);
  overflow: hidden;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.temu-tree-node__preview,
.temu-tree-node__value-preview {
  min-width: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.temu-tree-node__editor {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 2px;
}

.temu-tree-node__editor-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.temu-tree-node__editor-row :deep(.el-input),
.temu-tree-node__editor-row :deep(.el-textarea) {
  flex: 1;
}

.temu-tree-node__desc {
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.temu-tree-node__editor-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

.temu-tree-node__error {
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-color-danger);
}

.temu-tree-node__children {
  margin-left: 10px;
  padding: 4px 0 0 14px;
  border-left: 1px dashed var(--el-border-color);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

@media (max-width: 768px) {
  .temu-tree-node__row {
    padding: 8px;
  }

  .temu-tree-node__editor-row {
    flex-direction: column;
  }

  .temu-tree-node__children {
    margin-left: 9px;
    padding-left: 10px;
  }
}
</style>
