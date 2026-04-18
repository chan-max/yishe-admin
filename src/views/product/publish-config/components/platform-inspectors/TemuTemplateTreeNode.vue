<template>
  <div class="temu-tree-node" :class="[`depth-${depthClass}`]">
    <div class="temu-tree-node__body">
      <div class="temu-tree-node__row">
        <code class="temu-tree-node__key">{{ node.displayKey }}</code>
        <span class="temu-tree-node__label">{{ node.label }}</span>
        <span class="temu-tree-node__meta">{{ node.typeLabel }}</span>
        <span class="temu-tree-node__preview">{{ node.preview }}</span>
        <el-button
          v-if="canEdit && !editing"
          link
          type="primary"
          size="small"
          class="temu-tree-node__edit-trigger"
          @click="startEdit"
        >
          编辑
        </el-button>
      </div>

      <div class="temu-tree-node__source">
        <span>源字段</span>
        <code>{{ node.sourcePath }}</code>
      </div>

      <div v-if="showDescription" class="temu-tree-node__desc">
        {{ node.description }}
      </div>

      <div v-if="editing" class="temu-tree-node__editor">
        <el-switch
          v-if="node.valueType === 'boolean'"
          v-model="draftBoolean"
          inline-prompt
          active-text="true"
          inactive-text="false"
        />

        <el-input
          v-else-if="isStringEditor"
          v-model="draftText"
          :type="isLongText ? 'textarea' : 'text'"
          :rows="isLongText ? 3 : undefined"
          size="small"
          placeholder="输入新值"
        />

        <el-input
          v-else-if="node.valueType === 'number'"
          v-model="draftText"
          size="small"
          placeholder="输入数字"
        />

        <div v-if="editorError" class="temu-tree-node__error">
          {{ editorError }}
        </div>

        <div class="temu-tree-node__editor-actions">
          <el-button size="small" type="primary" :disabled="!!editorError" @click="applyEdit">
            应用
          </el-button>
          <el-button size="small" text @click="cancelEdit">取消</el-button>
        </div>
      </div>
    </div>

    <div v-if="hasChildren" class="temu-tree-node__children">
      <TemuTemplateTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :editable-source-paths="editableSourcePaths"
        @update-node="forwardUpdate"
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
}>();

const props = defineProps<{
  node: TemuTemplateTreeNodeData;
  editableSourcePaths?: string[];
}>();

const editing = ref(false);
const draftText = ref("");
const draftBoolean = ref(false);

const hasChildren = computed(() => props.node.children.length > 0);
const showDescription = computed(() => !!props.node.description && !hasChildren.value);
const depthClass = computed(() => Math.min(props.node.depth, 3));
const isStringEditor = computed(() => props.node.valueType === "string");
const canEdit = computed(
  () =>
    props.node.editable &&
    Array.isArray(props.editableSourcePaths) &&
    props.editableSourcePaths.includes(props.node.sourcePath),
);
const isLongText = computed(
  () => props.node.valueType === "string" && String(props.node.rawValue || "").length > 48,
);
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
    draftText.value = value === null || value === undefined ? "" : String(value);
    draftBoolean.value = Boolean(value);
  },
  { immediate: true },
);

function startEdit() {
  draftText.value =
    props.node.rawValue === null || props.node.rawValue === undefined
      ? ""
      : String(props.node.rawValue);
  draftBoolean.value = Boolean(props.node.rawValue);
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
}

function applyEdit() {
  if (!canEdit.value || props.node.valueType === null) {
    return;
  }

  if (props.node.valueType === "boolean") {
    emit("update-node", { sourcePath: props.node.sourcePath, value: draftBoolean.value });
    editing.value = false;
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
    editing.value = false;
    return;
  }

  emit("update-node", { sourcePath: props.node.sourcePath, value: draftText.value });
  editing.value = false;
}

function forwardUpdate(payload: { sourcePath: string; value: string | number | boolean }) {
  emit("update-node", payload);
}
</script>

<style scoped lang="less">
.temu-tree-node {
  --temu-accent: #1d4ed8;
  --temu-accent-line: rgba(29, 78, 216, 0.2);
  position: relative;
  padding-left: 18px;
}

.temu-tree-node.depth-1 {
  --temu-accent: #2563eb;
  --temu-accent-line: rgba(37, 99, 235, 0.18);
}

.temu-tree-node.depth-2 {
  --temu-accent: #3b82f6;
  --temu-accent-line: rgba(59, 130, 246, 0.16);
}

.temu-tree-node.depth-3 {
  --temu-accent: #60a5fa;
  --temu-accent-line: rgba(96, 165, 250, 0.14);
}

.temu-tree-node::before {
  content: "";
  position: absolute;
  left: 7px;
  top: 7px;
  bottom: 0;
  width: 1px;
  border-radius: 999px;
  background: var(--temu-accent-line);
}

.temu-tree-node__body {
  min-width: 0;
  padding: 3px 0 4px;
  border-bottom: 1px solid
    color-mix(in srgb, var(--temu-accent) 10%, var(--el-border-color-lighter));
}

.temu-tree-node__row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 3px 6px;
  min-width: 0;
  line-height: 1.45;
}

.temu-tree-node__key {
  font-size: 11px;
  color: var(--temu-accent);
  padding: 0;
  font-weight: 600;
}

.temu-tree-node__label {
  font-size: 12px;
  color: color-mix(in srgb, var(--temu-accent) 72%, var(--el-text-color-primary));
  font-weight: 600;
}

.temu-tree-node__meta {
  font-size: 11px;
  color: color-mix(in srgb, var(--temu-accent) 74%, #64748b);
}

.temu-tree-node__preview {
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.temu-tree-node__edit-trigger {
  margin-left: auto;
  padding: 0;
  min-height: auto;
}

.temu-tree-node__source,
.temu-tree-node__desc,
.temu-tree-node__error {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
}

.temu-tree-node__source {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 6px;
  color: var(--el-text-color-placeholder);
}

.temu-tree-node__source code {
  color: color-mix(in srgb, var(--temu-accent) 58%, var(--el-text-color-secondary));
  word-break: break-all;
}

.temu-tree-node__desc {
  color: var(--el-text-color-placeholder);
}

.temu-tree-node__editor {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.temu-tree-node__editor-actions {
  display: flex;
  gap: 6px;
}

.temu-tree-node__error {
  color: var(--el-color-danger);
}

.temu-tree-node__children {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.temu-tree-node__children > .temu-tree-node:last-child::before {
  bottom: 8px;
}
</style>
