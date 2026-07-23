<template>
  <div
    class="sticker-folder-tree-container"
    :class="{ 'is-dragging-over-folders': dragState?.dragging }"
    :style="{
      width: typeof width === 'number' ? width + 'px' : width,
      minWidth: typeof width === 'number' ? width + 'px' : width,
      maxWidth: typeof width === 'number' ? width + 'px' : width,
      flexShrink: 0,
      borderRight: showBorder ? '1px solid var(--el-border-color)' : undefined,
      paddingRight: showBorder ? '16px' : undefined,
    }"
  >
    <div v-if="mode === 'manage'" class="sticker-folder-tree-header">
      <el-button type="primary" size="small" plain style="width: 100%" @click="handleCreateRoot">
        <el-icon>
          <FolderAdd />
        </el-icon>
        新建文件夹
      </el-button>
    </div>

    <div class="sticker-folder-tree-search">
      <el-input v-model="searchKeyword" clearable size="small" placeholder="搜索文件夹" />
    </div>

    <div class="sticker-folder-tree-drag-surface" @dragleave="handleTreeDragLeave">
      <el-tree
        ref="treeRef"
        :data="displayTreeData"
        :props="{ children: 'children', label: 'name' }"
        node-key="id"
        :indent="14"
        :expand-on-click-node="false"
        :default-expand-all="false"
        :default-expanded-keys="expandedKeys"
        :highlight-current="true"
        :current-node-key="modelValue || getDefaultCurrentKey()"
        style="max-height: calc(100vh - 300px); overflow-y: auto; overflow-x: hidden"
        class="sticker-folder-tree"
      >
        <template #default="{ node, data }">
          <div
            class="sticker-folder-node"
            :data-folder-drop-target="'true'"
            :data-folder-id="data.id != null ? String(data.id) : ''"
            :data-folder-path="data.path || ''"
            :data-folder-name="data.name || ''"
            :data-folder-is-all="data.isAll ? '1' : '0'"
            :class="{
              'is-drop-hover':
                String(dragState?.overFolderId ?? '') === String(data.id) && dragState?.dragging,
            }"
            @dragover.prevent="handleFolderDragOver(data, $event)"
            @drop.prevent="handleFolderDrop(data)"
          >
            <div class="sticker-folder-node-content" @click.stop="handleNodeClick(data)">
              <button
                type="button"
                class="sticker-folder-node-toggle"
                :class="{ 'is-expanded': node.expanded, 'is-leaf': !hasChildren(data) }"
                :disabled="!hasChildren(data)"
                @click.stop="toggleNode(node)"
              >
                <el-icon v-if="hasChildren(data)">
                  <CaretRight />
                </el-icon>
              </button>

              <template v-if="data.isAll || data.id === FOLDER_FILTER.NOT_GROUP">
                <el-icon
                  class="folder-icon"
                  style="flex-shrink: 0; margin-right: 6px; color: var(--el-color-primary)"
                >
                  <Files />
                </el-icon>
              </template>
              <template v-else>
                <img
                  v-if="node.expanded && data.children && data.children.length > 0"
                  src="/img/folder-open.svg"
                  class="folder-icon"
                  alt="folder"
                />
                <img v-else src="/img/folder-close.svg" class="folder-icon" alt="folder" />
              </template>
              <span class="sticker-folder-node-text">
                <template
                  v-for="segment in getHighlightedSegments(data.name)"
                  :key="`${data.id}-${segment.key}`"
                >
                  <span v-if="segment.matched" class="sticker-folder-node-highlight">{{
                    segment.text
                  }}</span>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </span>
            </div>

            <div
              v-if="
                !data.isAll &&
                data.id !== FOLDER_FILTER.ALL &&
                data.id !== FOLDER_FILTER.NOT_GROUP &&
                mode === 'manage'
              "
              class="sticker-folder-node-actions"
            >
              <el-dropdown
                trigger="click"
                @command="(cmd) => handleCommand(cmd, data)"
                @click.stop
                size="small"
              >
                <el-icon class="sticker-folder-action-icon">
                  <MoreFilled />
                </el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="create">
                      <el-icon>
                        <FolderAdd />
                      </el-icon>
                      新建子文件夹
                    </el-dropdown-item>
                    <el-dropdown-item command="rename">
                      <el-icon>
                        <Edit />
                      </el-icon>
                      重命名
                    </el-dropdown-item>
                    <el-dropdown-item command="move">
                      <el-icon>
                        <FolderChecked />
                      </el-icon>
                      移动到
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon>
                        <Delete />
                      </el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 移动文件夹对话框 -->
    <el-dialog
      v-model="moveDialogVisible"
      title="移动文件夹"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="move-folder-dialog">
        <div class="move-folder-dialog__label">选择目标位置</div>
        <el-tree
          :data="moveTargetTreeData"
          :props="{ children: 'children', label: 'name' }"
          node-key="id"
          :expand-on-click-node="false"
          :current-node-key="moveTargetFolderId"
          :default-expand-all="true"
          highlight-current
          class="move-folder-tree"
          @current-change="handleMoveTargetChange"
        >
          <template #default="{ data }">
            <div class="move-folder-tree__node">
              <el-icon v-if="data.isRoot" style="margin-right: 6px; color: var(--el-color-primary)">
                <Folder />
              </el-icon>
              <img v-else src="/img/folder-close.svg" class="move-folder-tree__icon" alt="folder" />
              <span>{{ data.name }}</span>
            </div>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="moveTargetFolderId === undefined" @click="confirmMove">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { FolderAdd, MoreFilled, Edit, Delete, Files, CaretRight, FolderChecked, Folder } from "@element-plus/icons-vue";
import {
  createStickerFolder,
  deleteStickerFolder,
  getStickerFolderTree,
  renameStickerFolder,
  moveStickerFolder,
} from "@/api/material";
import { FOLDER_FILTER } from "@/constants/folder";

type FolderNode = {
  id: string;
  name: string;
  parentId?: string | null;
  path?: string;
  children?: FolderNode[];
  stickerCount?: number;
};

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    folderCategory: string;
    showCount?: boolean;
    width?: number | string;
    showBorder?: boolean;
    dragState?: {
      dragging: boolean;
      draggingIds: string[];
      overFolderId: string | null;
      overFolderPath: string;
    } | null;
    mode?: "manage" | "select";
  }>(),
  {
    showCount: true,
    width: 280,
    showBorder: true,
    dragState: null,
    mode: "manage",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string | null): void;
  (e: "change", payload: { folderId: string | null; node: any }): void;
  (e: "reloaded"): void;
  (e: "folder-drag-over", payload: { data: any; event?: DragEvent }): void;
  (e: "folder-drag-leave", payload?: { data?: any }): void;
  (e: "folder-drop", payload: { data: any }): void;
}>();

const treeRef = ref();
const rawTreeData = ref<any[]>([]);
const searchKeyword = ref("");
const lastDragOverFolderId = ref<string | null>(null);
const isSearching = computed(() => searchKeyword.value.trim().length > 0);

// 移动文件夹相关状态
const moveDialogVisible = ref(false);
const moveTargetFolderId = ref<string | null | undefined>(undefined);
const movingFolderId = ref<string | null>(null);
const movingFolderName = ref("");
const displayTreeData = computed(() => {
  if (!isSearching.value) {
    return rawTreeData.value;
  }
  return filterTree(rawTreeData.value, searchKeyword.value);
});
const expandedKeys = computed(() => {
  if (!isSearching.value) {
    return [FOLDER_FILTER.NOT_GROUP];
  }
  return collectExpandedKeys(displayTreeData.value);
});

function getDefaultCurrentKey() {
  return props.mode === "select" ? FOLDER_FILTER.NOT_GROUP : FOLDER_FILTER.ALL;
}

// 移动目标文件夹树（排除当前文件夹及其子文件夹）
const moveTargetTreeData = computed(() => {
  const rootItem = { id: null as string | null, name: "根目录（顶层）", isRoot: true, children: [] as any[] };
  // 过滤掉当前正在移动的文件夹及其子文件夹
  const filtered = filterExcludedFolders(rawTreeData.value, movingFolderId.value);
  rootItem.children = filtered.filter((f: any) => f.id !== FOLDER_FILTER.ALL && f.id !== FOLDER_FILTER.NOT_GROUP);
  return [rootItem];
});

function filterExcludedFolders(nodes: FolderNode[], excludeId: string | null): FolderNode[] {
  if (!excludeId) return nodes;
  return nodes
    .filter((node) => node.id !== excludeId)
    .map((node) => ({
      ...node,
      children: filterExcludedFolders(node.children || [], excludeId),
    }));
}

function getBindingLabel() {
  switch ((props.folderCategory || "").toLowerCase()) {
    case "prompt":
      return "提示词";
    case "fileresource":
    case "file-resource":
    case "file_resource":
      return "资源";
    case "fonttemplate":
      return "字体模板";
    case "psdtemplate":
      return "PSD模板";
    case "imagegroup":
      return "组图";
    case "commonurl":
      return "网址";
    case "sentence":
      return "文案";
    default:
      return "素材";
  }
}

function hasChildren(node: FolderNode) {
  return Array.isArray(node.children) && node.children.length > 0;
}

function cloneNode(node: FolderNode) {
  return {
    ...node,
    children: Array.isArray(node.children) ? node.children.map((child) => cloneNode(child)) : [],
  };
}

function filterTree(nodes: FolderNode[], keyword: string): FolderNode[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return nodes;
  }

  return nodes.reduce<FolderNode[]>((result, node) => {
    const clonedNode = cloneNode(node);
    const filteredChildren = filterTree(clonedNode.children || [], keyword);
    const selfMatched = clonedNode.name.toLowerCase().includes(normalizedKeyword);

    if (selfMatched || filteredChildren.length > 0) {
      clonedNode.children = filteredChildren;
      result.push(clonedNode);
    }

    return result;
  }, []);
}

function collectExpandedKeys(nodes: FolderNode[]) {
  const keys: string[] = [];

  const walk = (items: FolderNode[]) => {
    items.forEach((item) => {
      if (item.children && item.children.length > 0) {
        keys.push(item.id);
        walk(item.children);
      }
    });
  };

  walk(nodes);
  return keys;
}

function getHighlightedSegments(name: string) {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    return [{ key: "full", text: name, matched: false }];
  }

  const lowerName = name.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const segments: Array<{ key: string; text: string; matched: boolean }> = [];
  let startIndex = 0;

  while (startIndex < name.length) {
    const matchIndex = lowerName.indexOf(lowerKeyword, startIndex);
    if (matchIndex === -1) {
      segments.push({
        key: `text-${startIndex}`,
        text: name.slice(startIndex),
        matched: false,
      });
      break;
    }

    if (matchIndex > startIndex) {
      segments.push({
        key: `text-${startIndex}`,
        text: name.slice(startIndex, matchIndex),
        matched: false,
      });
    }

    segments.push({
      key: `match-${matchIndex}`,
      text: name.slice(matchIndex, matchIndex + keyword.length),
      matched: true,
    });
    startIndex = matchIndex + keyword.length;
  }

  return segments.length > 0 ? segments : [{ key: "full", text: name, matched: false }];
}

async function loadTree() {
  const res = await getStickerFolderTree({ folderCategory: props.folderCategory });
  const rootFolders = (res || []).filter(
    (f: any) => f.parentId === null || f.parentId === undefined,
  );

  const allNode: any = {
    id: FOLDER_FILTER.ALL,
    name: "全部",
    path: "",
    parentId: null,
    children: [], // No children for All node in this view
    isAll: true,
  };

  const rootNode: any = {
    id: FOLDER_FILTER.NOT_GROUP,
    name: "未分组",
    path: "",
    parentId: null,
    children: [],
    stickerCount: 0,
  };

  if (props.mode === "select") {
    rawTreeData.value = [rootNode, ...rootFolders];
  } else {
    rawTreeData.value = [allNode, rootNode, ...rootFolders];
  }
  nextTick(() => {
    treeRef.value?.setCurrentKey(props.modelValue || getDefaultCurrentKey());
  });
  emit("reloaded");
}

function handleNodeClick(node: any) {
  if (node.id === FOLDER_FILTER.ALL) {
    emit("update:modelValue", FOLDER_FILTER.ALL);
    emit("change", { folderId: FOLDER_FILTER.ALL, node });
    return;
  }
  const folderId = node.id === FOLDER_FILTER.NOT_GROUP ? FOLDER_FILTER.NOT_GROUP : node.id;
  emit(
    "update:modelValue",
    node.id === FOLDER_FILTER.NOT_GROUP ? FOLDER_FILTER.NOT_GROUP : node.id,
  );
  emit("change", { folderId, node });
}

function toggleNode(node: any) {
  if (!node) return;
  if (node.expanded) {
    node.collapse();
    return;
  }
  node.expand();
}

// 新建根文件夹
async function handleCreateRoot() {
  try {
    const { value } = await ElMessageBox.prompt("请输入文件夹名称", "新建文件夹", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /\S/,
      inputErrorMessage: "文件夹名称不能为空",
    });

    await createStickerFolder({
      name: value,
      parentId: null,
      folderCategory: props.folderCategory,
    });
    ElMessage.success("创建成功");
    loadTree();
  } catch (error) {
    if (error !== "cancel") {
      console.error(error);
    }
  }
}

// 文件夹操作菜单
async function handleCommand(command: string, data: any) {
  if (command === "create") {
    try {
      const { value } = await ElMessageBox.prompt("请输入子文件夹名称", "新建子文件夹", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /\S/,
        inputErrorMessage: "文件夹名称不能为空",
      });

      await createStickerFolder({
        name: value,
        parentId: data.id,
        folderCategory: props.folderCategory,
      });
      ElMessage.success("创建成功");
      loadTree();
    } catch (error) {
      if (error !== "cancel") console.error(error);
    }
  } else if (command === "rename") {
    try {
      const { value } = await ElMessageBox.prompt("请输入新名称", "重命名", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: data.name,
        inputPattern: /\S/,
        inputErrorMessage: "文件夹名称不能为空",
      });

      await renameStickerFolder({
        id: data.id,
        name: value,
        folderCategory: props.folderCategory,
      });
      ElMessage.success("重命名成功");
      loadTree();
    } catch (error) {
      if (error !== "cancel") console.error(error);
    }
  } else if (command === "delete") {
    try {
      await ElMessageBox.confirm(
        `确定要删除文件夹 "${data.name}" 吗？\n删除后文件夹内的${getBindingLabel()}将移动到未分组。`,
        "警告",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        },
      );

      await deleteStickerFolder(String(data.id), true, {
        folderCategory: props.folderCategory,
      });
      ElMessage.success("删除成功");
      // 如果删除的是当前选中的文件夹，重置选中状态
      if (props.modelValue === data.id) {
        emit("update:modelValue", FOLDER_FILTER.ALL);
        emit("change", { folderId: FOLDER_FILTER.ALL, node: null });
      }
      loadTree();
    } catch (error) {
      if (error !== "cancel") console.error(error);
    }
  } else if (command === "move") {
    movingFolderId.value = String(data.id);
    movingFolderName.value = data.name;
    moveTargetFolderId.value = undefined;
    moveDialogVisible.value = true;
  }
}

function handleFolderDragOver(data: any, evt?: DragEvent) {
  if (data.id === FOLDER_FILTER.ALL) return;
  const folderId = data?.id != null ? String(data.id) : null;
  if (folderId && lastDragOverFolderId.value === folderId) return;
  lastDragOverFolderId.value = folderId;
  emit("folder-drag-over", { data, event: evt });
}

function handleTreeDragLeave(evt?: DragEvent) {
  const currentTarget = evt?.currentTarget as HTMLElement | null;
  const relatedTarget = evt?.relatedTarget as Node | null;

  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
    return;
  }

  lastDragOverFolderId.value = null;
  emit("folder-drag-leave");
}

function handleFolderDrop(data: any) {
  lastDragOverFolderId.value = null;
  emit("folder-drop", { data });
}

function handleMoveTargetChange(data: any) {
  moveTargetFolderId.value = data.id;
}

async function confirmMove() {
  if (!movingFolderId.value || moveTargetFolderId.value === undefined) return;

  try {
    await moveStickerFolder({
      id: movingFolderId.value,
      parentId: moveTargetFolderId.value,
      folderCategory: props.folderCategory,
    });
    ElMessage.success(`文件夹「${movingFolderName.value}」已移动`);
    moveDialogVisible.value = false;
    loadTree();
  } catch (error: any) {
    ElMessage.error(error?.message || "移动失败");
  }
}

onMounted(loadTree);
watch(
  () => props.folderCategory,
  () => loadTree(),
);
watch(displayTreeData, () => {
  nextTick(() => {
    treeRef.value?.setCurrentKey(props.modelValue || getDefaultCurrentKey());
  });
});
watch(
  () => props.dragState?.dragging,
  (dragging) => {
    if (!dragging) {
      lastDragOverFolderId.value = null;
    }
  },
);
</script>

<style lang="less" scoped>
/* 文件夹树样式（复用 material/index 的样式） */
.sticker-folder-tree-container {
  --folder-tree-toggle-slot-size: 16px;
  --folder-tree-node-height: 34px;
  --folder-tree-node-radius: 8px;

  padding-top: 4px;

  &.is-dragging-over-folders {
    position: relative;
    z-index: 2;
  }

  .sticker-folder-tree-header {
    margin-bottom: 8px;
    padding-inline: 4px;
  }

  .sticker-folder-tree-search {
    margin-bottom: 8px;
    padding-inline: 4px;
  }

  .sticker-folder-tree-drag-surface {
    padding-inline: 4px;
    padding-bottom: 4px;
  }

  .sticker-folder-tree {
    --el-tree-node-content-height: var(--folder-tree-node-height);

    :deep(.el-tree-node__content) {
      height: var(--folder-tree-node-height);
      margin-bottom: 2px;
      border-radius: var(--folder-tree-node-radius);
      background: transparent;
      transition:
        color 0.18s ease,
        border-color 0.18s ease,
        background-color 0.18s ease;
      will-change: color;
    }

    :deep(.el-tree-node__content > .el-tree-node__expand-icon) {
      display: none;
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background: transparent;
    }
  }

  :deep(.el-tree-node__content:hover .sticker-folder-node) {
    border-color: var(--folder-tree-node-hover-border-color);
    box-shadow: var(--folder-tree-node-hover-shadow);
    color: var(--folder-tree-node-active-color);
    transform: translateX(2px);
  }

  :deep(.el-tree-node__content:hover .sticker-folder-node::before) {
    opacity: 1;
  }

  :deep(.el-tree-node__content:hover .sticker-folder-node::after) {
    opacity: 1;
    transform: translateY(-50%) scaleY(1);
  }

  :deep(.el-tree-node__content:hover .sticker-folder-node .sticker-folder-node-content) {
    transform: translateX(1px);
  }

  :deep(.el-tree-node__content:hover .sticker-folder-node .folder-icon) {
    transform: translateX(1px) scale(1.04);
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content .sticker-folder-node) {
    border-color: var(--folder-tree-node-active-border-color);
    background: var(--folder-tree-node-active-bg);
    color: var(--folder-tree-node-active-color);
    box-shadow: var(--folder-tree-node-active-shadow);
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content .sticker-folder-node::before) {
    opacity: 0;
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content .sticker-folder-node::after) {
    opacity: 1;
    transform: translateY(-50%) scaleY(1);
  }

  :deep(
    .el-tree-node.is-current > .el-tree-node__content .sticker-folder-node .sticker-folder-node-text
  ) {
    font-weight: 600;
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content .sticker-folder-node-actions) {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  .sticker-folder-node {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: calc(var(--folder-tree-node-height) - 2px);
    padding-right: 4px;
    border-radius: var(--folder-tree-node-radius);
    border: 1px solid transparent;
    overflow: hidden;
    isolation: isolate;
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
    transition:
      background-color 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease,
      transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 0;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--folder-tree-node-hover-bg), transparent 86%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 4px;
      width: 3px;
      height: 16px;
      z-index: 1;
      border-radius: 999px;
      background: var(--folder-tree-node-accent-color);
      opacity: 0;
      transform: translateY(-50%) scaleY(0.42);
      transition:
        opacity 0.18s ease,
        transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
    }

    > * {
      position: relative;
      z-index: 1;
    }

    &.is-drop-hover {
      background: var(--folder-tree-node-drop-bg);
      border-color: var(--folder-tree-node-drop-border-color);
      box-shadow:
        0 0 0 1px var(--folder-tree-node-drop-border-color),
        var(--folder-tree-node-drop-shadow);
      transform: translateX(3px);

      &::after {
        opacity: 1;
        transform: translateY(-50%) scaleY(1);
      }

      .sticker-folder-node-content {
        transform: translateX(1px);

        .folder-icon {
          transform: translateX(1px) scale(1.06);
        }

        .sticker-folder-node-text {
          color: var(--folder-tree-node-drop-color);
          font-weight: 600;
        }
      }

      .sticker-folder-node-actions {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
      }
    }

    .sticker-folder-node-content {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      padding-left: 4px;
      transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
      cursor: pointer;

      .sticker-folder-node-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--folder-tree-toggle-slot-size);
        height: var(--folder-tree-toggle-slot-size);
        padding: 0;
        margin-right: 2px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--el-text-color-secondary);
        flex-shrink: 0;
        cursor: pointer;
        transition:
          color 0.18s ease,
          background-color 0.18s ease,
          transform 0.18s ease;

        .el-icon {
          font-size: 12px;
          transition: transform 0.18s ease;
        }

        &.is-expanded .el-icon {
          transform: rotate(90deg);
        }

        &:hover:not(:disabled) {
          color: var(--folder-tree-node-active-color);
          background: rgba(45, 107, 255, 0.08);
        }

        &:focus-visible {
          outline: 2px solid rgba(45, 107, 255, 0.22);
          outline-offset: 1px;
        }

        &:disabled {
          width: var(--folder-tree-toggle-slot-size);
          margin-right: 2px;
          background: transparent;
          cursor: default;
          pointer-events: none;
        }
      }

      .folder-icon {
        width: 16px;
        height: 16px;
        margin-right: 5px;
        flex-shrink: 0;
        transition:
          transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
          opacity 0.18s ease;
      }

      .sticker-folder-node-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 11px;
        color: var(--el-text-color-primary);
        cursor: pointer;
        transition:
          color 0.18s ease,
          opacity 0.18s ease;

        .sticker-folder-node-highlight {
          color: var(--el-color-danger);
          font-weight: 600;
          background-color: var(--el-color-danger-light-9);
          border-radius: 2px;
          padding: 0 1px;
        }
      }

      .sticker-folder-node-count {
        font-size: 9px;
        color: var(--el-text-color-secondary);
        font-weight: 500;
        margin-left: 4px;
      }
    }

    .sticker-folder-node-actions {
      display: flex;
      align-items: center;
      padding-right: 2px;
      margin-left: 8px;
      opacity: 0;
      transform: translateX(4px) scale(0.94);
      pointer-events: none;
      transition:
        opacity 0.18s ease,
        transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);

      .sticker-folder-action-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        font-size: 13px;
        cursor: pointer;
        transition:
          color 0.2s ease,
          background-color 0.2s ease,
          transform 0.2s ease,
          box-shadow 0.2s ease;
        color: var(--folder-tree-action-icon-color);
        background: var(--folder-tree-action-icon-bg);
        border-radius: 6px;

        &:hover {
          color: var(--folder-tree-action-icon-hover-color);
          background: var(--folder-tree-action-icon-hover-bg);
          transform: translateY(-1px);
          box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);
        }
      }

      :deep(.el-dropdown) {
        .el-dropdown__caret-button {
          display: none;
        }
      }
    }

    &:hover {
      .sticker-folder-node-actions {
        opacity: 1;
        transform: translateX(0) scale(1);
        pointer-events: auto;
      }
    }
  }

  &.is-dragging-over-folders {
    .sticker-folder-node {
      transition:
        background-color 0.16s ease,
        box-shadow 0.16s ease,
        border-color 0.16s ease,
        transform 0.16s ease;
    }

    .sticker-folder-node-content {
      transition: transform 0.16s ease;
    }
  }

  :deep(.el-dropdown-menu) {
    min-width: 140px;
    padding: 4px 0;

    .el-dropdown-menu__item {
      padding: 6px 14px;
      font-size: 11px;

      .el-icon {
        margin-right: 6px;
        font-size: 12px;
      }
    }
  }
}

.move-folder-dialog {
  .move-folder-dialog__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 12px;
  }

  .move-folder-tree {
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 8px;

    :deep(.el-tree-node__content) {
      height: 32px;
      border-radius: 6px;
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background: var(--el-color-primary-light-9);
    }
  }

  .move-folder-tree__node {
    display: flex;
    align-items: center;
    font-size: 13px;
  }

  .move-folder-tree__icon {
    width: 16px;
    height: 16px;
    margin-right: 6px;
    flex-shrink: 0;
  }
}
</style>
