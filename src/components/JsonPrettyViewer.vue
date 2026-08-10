<template>
  <div :class="viewerClass" class="json-pretty-viewer">
    <VueJsonPretty
      :data="normalizedValue"
      :deep="deep"
      :show-line="showLine"
      :show-double-quotes="showDoubleQuotes"
      :show-length="showLength"
      :show-icon="showIcon"
      :virtual="virtual"
      class="json-pretty-viewer__inner"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import { useAppStore } from "@/store/modules/app";

const props = withDefaults(
  defineProps<{
    value?: unknown;
    dark?: boolean;
    deep?: number;
    showLine?: boolean;
    showDoubleQuotes?: boolean;
    showLength?: boolean;
    showIcon?: boolean;
    virtual?: boolean;
  }>(),
  {
    value: null,
    dark: undefined,
    deep: 3,
    showLine: false,
    showDoubleQuotes: true,
    showLength: true,
    showIcon: true,
    virtual: false,
  },
);

const appStore = useAppStore();

const normalizedValue = computed(() => {
  if (typeof props.value === "string") {
    try {
      return JSON.parse(props.value);
    } catch {
      return props.value;
    }
  }
  return props.value ?? {};
});

const isDark = computed(() =>
  typeof props.dark === "boolean" ? props.dark : appStore.getIsDark,
);

const viewerClass = computed(() =>
  isDark.value ? "json-pretty-viewer--dark" : "json-pretty-viewer--light",
);
</script>

<style scoped lang="scss">
.json-pretty-viewer {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.json-pretty-viewer__inner {
  min-width: max-content;
  font-size: 12px;
  line-height: 1.7;
}

.json-pretty-viewer:deep(.vjs-tree) {
  font-family: "JetBrains Mono", SFMono-Regular, Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
}

.json-pretty-viewer--light:deep(.vjs-key) {
  color: var(--el-color-primary);
}

.json-pretty-viewer--light:deep(.vjs-value-string) {
  color: var(--el-color-success);
}

.json-pretty-viewer--light:deep(.vjs-value-number),
.json-pretty-viewer--light:deep(.vjs-value-boolean) {
  color: var(--el-color-warning);
}

.json-pretty-viewer--light:deep(.vjs-value-null) {
  color: var(--el-text-color-placeholder);
}

.json-pretty-viewer--light:deep(.vjs-tree-node:hover) {
  color: var(--el-text-color-primary);
  background-color: var(--el-fill-color-light);
}

.json-pretty-viewer--dark:deep(.vjs-tree) {
  color: var(--el-text-color-primary);
}

.json-pretty-viewer--dark:deep(.vjs-key) {
  color: var(--el-color-primary-light-3);
}

.json-pretty-viewer--dark:deep(.vjs-value-string) {
  color: var(--el-color-success-light-3);
}

.json-pretty-viewer--dark:deep(.vjs-value-number),
.json-pretty-viewer--dark:deep(.vjs-value-boolean) {
  color: var(--el-color-warning-light-3);
}

.json-pretty-viewer--dark:deep(.vjs-value-null) {
  color: var(--el-text-color-placeholder);
}

.json-pretty-viewer--dark:deep(.vjs-tree-node:hover) {
  color: var(--el-text-color-primary);
  background-color: var(--el-fill-color);
}
</style>
