<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";

export interface CommandItem {
  name: string;
  aliases: string[];
  category: string;
  description: string;
}

const props = defineProps<{
  visible: boolean;
  commands: CommandItem[];
  filter: string;
  trigger: "/" | "@" | null;
  anchorRect?: { left: number; top: number; width: number } | null;
}>();

const emit = defineEmits<{
  select: [command: CommandItem];
  close: [];
}>();

const activeIndex = ref(0);
const popupRef = ref<HTMLElement>();
const searchInput = ref("");
const searchRef = ref<HTMLInputElement>();

const categoryOrder = ["tool", "prompt", "workflow", "system"];
const categoryLabels: Record<string, string> = {
  tool: "工具",
  prompt: "提示",
  workflow: "流程",
  system: "系统",
};

// Combine external filter (text after / or @) with internal search input
const query = computed(() => {
  const external = props.filter.toLowerCase().trim();
  const internal = searchInput.value.toLowerCase().trim();
  return external || internal;
});

const filtered = computed(() => {
  const q = query.value;
  if (!q) return props.commands;
  return props.commands.filter((cmd) => {
    const alias = cmd.aliases[0] || `/${cmd.name}`;
    return (
      cmd.name.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      alias.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });
});

const grouped = computed(() => {
  const map = new Map<string, CommandItem[]>();
  // Preserve category order
  for (const cat of categoryOrder) {
    const cmds = filtered.value.filter((c) => (c.category || "tool") === cat);
    if (cmds.length > 0) map.set(cat, cmds);
  }
  // Add any categories not in the predefined order
  for (const cmd of filtered.value) {
    const cat = cmd.category || "tool";
    if (!map.has(cat)) {
      const cmds = filtered.value.filter((c) => (c.category || "tool") === cat);
      if (cmds.length > 0) map.set(cat, cmds);
    }
  }
  return map;
});

const flatList = computed(() => filtered.value);

watch(
  () => [props.filter, searchInput.value],
  () => {
    activeIndex.value = 0;
    nextTick(() => scrollToActive());
  },
);

watch(
  () => props.visible,
  (v) => {
    if (v) {
      activeIndex.value = 0;
      searchInput.value = "";
      nextTick(() => {
        scrollToActive();
        searchRef.value?.focus();
      });
    }
  },
);

function handleKeydown(e: KeyboardEvent): boolean {
  if (!props.visible) return false;

  // If focus is in search input, handle navigation
  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, flatList.value.length - 1);
    nextTick(() => scrollToActive());
    return true;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
    nextTick(() => scrollToActive());
    return true;
  }
  if (e.key === "Enter") {
    if (flatList.value.length > 0) {
      e.preventDefault();
      emit("select", flatList.value[activeIndex.value]);
      return true;
    }
  }
  if (e.key === "Escape") {
    e.preventDefault();
    emit("close");
    return true;
  }
  if (e.key === "Tab") {
    if (flatList.value.length > 0) {
      e.preventDefault();
      emit("select", flatList.value[activeIndex.value]);
      return true;
    }
  }
  return false;
}

function scrollToActive() {
  const el = popupRef.value?.querySelector(".cmd-item.is-active");
  el?.scrollIntoView({ block: "nearest" });
}

function handleClick(cmd: CommandItem) {
  emit("select", cmd);
}

function handleMouseEnter(index: number) {
  activeIndex.value = index;
}

function getDisplayAlias(cmd: CommandItem) {
  return cmd.aliases[0] || `/${cmd.name}`;
}

function handleSearchKeydown(e: KeyboardEvent) {
  // Let parent handleKeydown handle navigation keys
  handleKeydown(e);
}

defineExpose({ handleKeydown });

const popupStyle = computed(() => {
  const rect = props.anchorRect;
  if (!rect) return {};
  // Position above the textarea
  const popupWidth = Math.max(rect.width, 480);
  return {
    left: `${rect.left}px`,
    bottom: `${window.innerHeight - rect.top + 6}px`,
    width: `${popupWidth}px`,
  };
});

// Click outside to close
function handleClickOutside(e: MouseEvent) {
  if (!popupRef.value?.contains(e.target as Node)) {
    emit("close");
  }
}

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="cmd-popup">
      <div
        v-if="visible && flatList.length > 0"
        ref="popupRef"
        class="command-popup"
        :style="popupStyle"
        @mousedown.prevent
      >
        <!-- Search bar -->
        <div class="cmd-search">
          <input
            ref="searchRef"
            v-model="searchInput"
            class="cmd-search-input"
            placeholder="搜索命令..."
            @keydown="handleSearchKeydown"
          />
        </div>

        <!-- Command list -->
        <div class="cmd-list">
          <template v-for="[category, cmds] in grouped" :key="category">
            <div class="cmd-group-label">
              {{ categoryLabels[category] || category }}
            </div>
            <div
              v-for="cmd in cmds"
              :key="cmd.name"
              class="cmd-item"
              :class="{ 'is-active': flatList.indexOf(cmd) === activeIndex }"
              @click="handleClick(cmd)"
              @mouseenter="handleMouseEnter(flatList.indexOf(cmd))"
            >
              <span class="cmd-alias">{{ getDisplayAlias(cmd) }}</span>
              <span class="cmd-desc">{{ cmd.description }}</span>
            </div>
          </template>
        </div>

        <!-- Footer hints -->
        <div class="cmd-footer">
          <kbd>↑↓</kbd>
          <span>导航</span>
          <kbd>↵</kbd>
          <span>选择</span>
          <kbd>esc</kbd>
          <span>关闭</span>
          <span class="cmd-count">{{ flatList.length }} 个命令</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.command-popup {
  position: fixed;
  z-index: 9999;
  display: flex;
  max-height: 400px;
  overflow: hidden;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 8px;
  box-shadow:
    0 4px 24px rgb(0 0 0 / 10%),
    0 1px 4px rgb(0 0 0 / 5%);
  flex-direction: column;
}

/* Search bar */
.cmd-search {
  padding: 8px 10px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #f0f0f0);
  flex-shrink: 0;
}

.cmd-search-input {
  width: 100%;
  padding: 4px 2px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary, #303133);
  background: transparent;
  border: none;
  outline: none;
}

.cmd-search-input::placeholder {
  color: var(--el-text-color-placeholder, #c0c4cc);
}

/* Command list */
.cmd-list {
  min-height: 0;
  padding: 4px 0;
  overflow-y: auto;
  flex: 1;
}

.cmd-group-label {
  padding: 6px 12px 3px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--el-text-color-secondary, #909399);
  user-select: none;
}

.cmd-item {
  display: flex;
  min-height: 36px;
  padding: 7px 12px;
  cursor: pointer;
  transition: background-color 0.08s;
  align-items: center;
  gap: 12px;
}

.cmd-item:hover,
.cmd-item.is-active {
  background: var(--el-color-primary-light-9, #ecf5ff);
}

.cmd-item.is-active {
  background: var(--el-color-primary-light-8, #d9ecff);
}

.cmd-alias {
  min-width: 80px;
  font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: var(--el-color-primary, #409eff);
  flex-shrink: 0;
}

.cmd-desc {
  min-width: 0;
  overflow: hidden;
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--el-text-color-regular, #606266);
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

/* Footer */
.cmd-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-top: 1px solid var(--el-border-color-extra-light, #f0f0f0);
  flex-shrink: 0;
  user-select: none;
}

.cmd-footer kbd {
  display: inline-flex;
  height: 18px;
  min-width: 18px;
  padding: 0 4px;
  font-family: "SF Mono", Monaco, Menlo, monospace;
  font-size: 10px;
  line-height: 1;
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 3px;
  align-items: center;
  justify-content: center;
}

.cmd-footer span {
  margin-right: 6px;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #c0c4cc);
}

.cmd-count {
  margin-left: auto !important;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #c0c4cc);
}

/* Transition */
.cmd-popup-enter-active,
.cmd-popup-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.cmd-popup-enter-from,
.cmd-popup-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
