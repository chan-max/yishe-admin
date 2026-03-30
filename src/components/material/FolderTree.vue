<template>
  <div class="sticker-folder-tree-container" :class="{ 'is-dragging-over-folders': dragState?.dragging }" :style="{
    width: typeof width === 'number' ? width + 'px' : width,
    minWidth: typeof width === 'number' ? width + 'px' : width,
    maxWidth: typeof width === 'number' ? width + 'px' : width,
    flexShrink: 0,
    borderRight: showBorder ? '1px solid var(--el-border-color)' : undefined,
    paddingRight: showBorder ? '16px' : undefined,
  }">
    <div v-if="mode === 'manage'" class="sticker-folder-tree-header">
      <el-button type="primary" size="small" plain style="width: 100%" @click="handleCreateRoot">
        <el-icon>
          <FolderAdd />
        </el-icon>
        新建文件夹
      </el-button>
    </div>

    <div class="sticker-folder-tree-search">
      <el-input
        v-model="searchKeyword"
        clearable
        size="small"
        placeholder="搜索文件夹"
      />
    </div>

    <div class="sticker-folder-tree-drag-surface" @dragleave="handleTreeDragLeave">
      <el-tree ref="treeRef" :data="displayTreeData" :props="{ children: 'children', label: 'name' }" node-key="id"
        :expand-on-click-node="false" :default-expand-all="false" :default-expanded-keys="expandedKeys"
        :highlight-current="true" :current-node-key="modelValue || getDefaultCurrentKey()"
        style="max-height: calc(100vh - 300px); overflow-y: auto; overflow-x: hidden" class="sticker-folder-tree">
        <template #default="{ node, data }">
          <div class="sticker-folder-node"
            :class="{ 'is-drop-hover': String(dragState?.overFolderId ?? '') === String(data.id) && dragState?.dragging }"
            @dragenter.prevent="handleFolderDragEnter(data, $event)"
            @dragover.prevent="handleFolderDragOver(data, $event)"
            @drop.prevent="handleFolderDrop(data)">
            <div class="sticker-folder-node-content">
              <template v-if="data.isAll || data.id === FOLDER_FILTER.NOT_GROUP">
                <el-icon class="folder-icon" style="flex-shrink: 0; margin-right: 6px; color: var(--el-color-primary)">
                  <Files />
                </el-icon>
              </template>
              <template v-else>
                <img v-if="node.expanded && data.children && data.children.length > 0" src="/img/folder-open.svg"
                  class="folder-icon" alt="folder" />
                <img v-else src="/img/folder-close.svg" class="folder-icon" alt="folder" />
              </template>

              <span class="sticker-folder-node-text" @click.stop="handleNodeClick(data)">
                <template v-for="(segment, index) in getHighlightedSegments(data.name)" :key="`${data.id}-${index}`">
                  <span v-if="segment.matched" class="sticker-folder-node-highlight">{{ segment.text }}</span>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </span>
            </div>

            <div v-if="data.id !== FOLDER_FILTER.NOT_GROUP && mode === 'manage'" class="sticker-folder-node-actions">
              <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, data)" @click.stop size="small">
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
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { FolderAdd, MoreFilled, Edit, Delete, Files } from "@element-plus/icons-vue";
import { createStickerFolder, deleteStickerFolder, getStickerFolderTree, renameStickerFolder } from "@/api/material";
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
    mode?: 'manage' | 'select';
  }>(),
  {
    showCount: true,
    width: 280,
    showBorder: true,
    dragState: null,
    mode: 'manage',
  }
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
const isSearching = computed(() => searchKeyword.value.trim().length > 0);
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
    return [{ text: name, matched: false }];
  }

  const lowerName = name.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const segments: Array<{ text: string; matched: boolean }> = [];
  let startIndex = 0;

  while (startIndex < name.length) {
    const matchIndex = lowerName.indexOf(lowerKeyword, startIndex);
    if (matchIndex === -1) {
      segments.push({ text: name.slice(startIndex), matched: false });
      break;
    }

    if (matchIndex > startIndex) {
      segments.push({ text: name.slice(startIndex, matchIndex), matched: false });
    }

    segments.push({
      text: name.slice(matchIndex, matchIndex + keyword.length),
      matched: true,
    });
    startIndex = matchIndex + keyword.length;
  }

  return segments.length > 0 ? segments : [{ text: name, matched: false }];
}

async function loadTree() {
  const res = await getStickerFolderTree({ folderCategory: props.folderCategory });
  const rootFolders = (res || []).filter((f: any) => f.parentId === null || f.parentId === undefined);

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

  if (props.mode === 'select') {
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
  emit("update:modelValue", node.id === FOLDER_FILTER.NOT_GROUP ? FOLDER_FILTER.NOT_GROUP : node.id);
  emit("change", { folderId, node });
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

    await createStickerFolder({ name: value, parentId: null, folderCategory: props.folderCategory });
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

      await createStickerFolder({ name: value, parentId: data.id, folderCategory: props.folderCategory });
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

      await renameStickerFolder({ id: data.id, name: value });
      ElMessage.success("重命名成功");
      loadTree();
    } catch (error) {
      if (error !== "cancel") console.error(error);
    }
  } else if (command === "delete") {
    try {
      await ElMessageBox.confirm(
        `确定要删除文件夹 "${data.name}" 吗？\n删除后文件夹内的素材将移动到根目录。`,
        "警告",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      );

      await deleteStickerFolder({ id: data.id });
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
  }
}

function handleFolderDragEnter(data: any, evt?: DragEvent) {
  if (data.id === FOLDER_FILTER.ALL) return;
  emit("folder-drag-over", { data, event: evt });
}

function handleFolderDragOver(data: any, evt?: DragEvent) {
  if (data.id === FOLDER_FILTER.ALL) return;
  emit("folder-drag-over", { data, event: evt });
}

function handleTreeDragLeave(evt?: DragEvent) {
  const currentTarget = evt?.currentTarget as HTMLElement | null;
  const relatedTarget = evt?.relatedTarget as Node | null;

  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
    return;
  }

  emit("folder-drag-leave");
}

function handleFolderDrop(data: any) {
  emit("folder-drop", { data });
}

onMounted(loadTree);
watch(
  () => props.folderCategory,
  () => loadTree()
);
watch(displayTreeData, () => {
  nextTick(() => {
    treeRef.value?.setCurrentKey(props.modelValue || getDefaultCurrentKey());
  });
});
</script>

<style lang="less" scoped>
/* 文件夹树样式（复用 material/index 的样式） */
.sticker-folder-tree-container {
  padding-top: 4px;

  .sticker-folder-tree-header {
    margin-bottom: 10px;
    padding-inline: 4px;
  }

  .sticker-folder-tree-search {
    margin-bottom: 10px;
    padding-inline: 4px;
  }

  .sticker-folder-tree-drag-surface {
    padding-inline: 4px;
    padding-bottom: 6px;
  }

  .sticker-folder-tree {
    --el-tree-node-content-height: var(--folder-tree-node-height);

    :deep(.el-tree-node__content) {
      height: var(--folder-tree-node-height);
      margin-bottom: 2px;
      border-radius: var(--folder-tree-node-radius);
      transition:
        background-color 0.18s ease,
        color 0.18s ease,
        border-color 0.18s ease;

      &:hover {
        background-color: var(--folder-tree-node-hover-bg);
      }
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background-color: var(--folder-tree-node-active-bg);
      color: var(--folder-tree-node-active-color);
      font-weight: 500;
      box-shadow: inset 0 0 0 1px var(--folder-tree-node-active-border-color);
    }

    :deep(.el-tree-node__expand-icon) {
      margin-right: 2px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      transition:
        color 0.18s ease,
        transform 0.18s ease;
    }

    :deep(.el-tree-node__expand-icon:hover) {
      color: var(--folder-tree-node-active-color);
    }
  }

.sticker-folder-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-right: 8px;
    border-radius: var(--folder-tree-node-radius);
    border: 1px solid transparent;
    transition:
      background-color 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease,
      transform 0.18s ease;

    &.is-drop-hover {
      background:
        linear-gradient(90deg, var(--el-color-primary-light-8), var(--folder-tree-node-active-bg));
      border-color: var(--el-color-primary);
      box-shadow:
        0 0 0 2px var(--el-color-primary-light-5),
        0 10px 24px rgba(64, 158, 255, 0.16);
      transform: translateX(2px);

      .sticker-folder-node-content {
        .folder-icon {
          transform: scale(1.08);
          filter: drop-shadow(0 2px 4px rgba(64, 158, 255, 0.24));
        }

        .sticker-folder-node-text {
          color: var(--el-color-primary-dark-2);
          font-weight: 700;
        }
      }
    }

    .sticker-folder-node-content {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;

      .folder-icon {
        width: 18px;
        height: 18px;
        margin-right: 6px;
        flex-shrink: 0;
      }

      .sticker-folder-node-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        color: var(--el-text-color-primary);
        cursor: pointer;

        .sticker-folder-node-highlight {
          color: var(--el-color-danger);
          font-weight: 600;
          background-color: var(--el-color-danger-light-9);
          border-radius: 2px;
          padding: 0 1px;
        }
      }

      .sticker-folder-node-count {
        font-size: 11px;
        color: var(--el-text-color-secondary);
        font-weight: 500;
        margin-left: 6px;
      }
    }

    .sticker-folder-node-actions {
      display: flex;
      align-items: center;
      padding-right: 2px;
      margin-left: 12px;

      .sticker-folder-action-icon {
        font-size: 14px;
        cursor: pointer;
        opacity: 0.54;
        transition:
          opacity 0.2s,
          color 0.2s,
          background-color 0.2s;
        color: var(--el-text-color-secondary);
        padding: 4px;
        border-radius: 6px;

        &:hover {
          opacity: 1;
          color: var(--el-color-primary);
          background: var(--folder-tree-node-hover-bg);
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
        .sticker-folder-action-icon {
          opacity: 0.7;
        }
      }
    }
  }

  &.is-dragging-over-folders {
    .sticker-folder-node {
      transition: none;
    }
  }

  :deep(.el-dropdown-menu) {
    min-width: 140px;
    padding: 4px 0;

    .el-dropdown-menu__item {
      padding: 6px 16px;
      font-size: 13px;

      .el-icon {
        margin-right: 6px;
        font-size: 14px;
      }
    }
  }
}
</style>
