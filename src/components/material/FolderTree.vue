<template>
  <div class="sticker-folder-tree-container" :style="{
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

    <el-tree ref="treeRef" :data="treeData" :props="{ children: 'children', label: 'name' }" node-key="id"
      :expand-on-click-node="false" :default-expand-all="false" :default-expanded-keys="['__root__']"
      :highlight-current="true" :current-node-key="modelValue || '__root__'"
      style="max-height: calc(100vh - 300px); overflow-y: auto; overflow-x: hidden" class="sticker-folder-tree">
      <template #default="{ node, data }">
        <div class="sticker-folder-node"
          :class="{ 'is-drop-hover': dragState?.overFolderId === data.id && dragState?.dragging }"
          @dragover.prevent="handleFolderDragOver(data, $event)" @dragleave="handleFolderDragLeave(data)"
          @drop.prevent="handleFolderDrop(data)">
          <div class="sticker-folder-node-content">
            <template v-if="data.isAll || data.id === '__root__'">
              <el-icon class="folder-icon" style="flex-shrink: 0; margin-right: 6px; color: var(--el-color-primary)">
                <Files />
              </el-icon>
            </template>
            <template v-else>
              <img v-if="node.expanded && data.children && data.children.length > 0" src="/img/folder-open.svg"
                class="folder-icon" alt="folder" />
              <img v-else src="/img/folder-close.svg" class="folder-icon" alt="folder" />
            </template>

            <span class="sticker-folder-node-text" @click.stop="handleNodeClick(data)">{{ data.name }}</span>
            <span v-if="showCount && data.id !== '__root__' && !data.isAll" class="sticker-folder-node-count">({{
              data.stickerCount
              ||
              0 }})</span>
          </div>

          <div v-if="data.id !== '__root__' && mode === 'manage'" class="sticker-folder-node-actions">
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
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { FolderAdd, MoreFilled, Edit, Delete, Files } from "@element-plus/icons-vue";
import { createStickerFolder, deleteStickerFolder, getStickerFolderTree, renameStickerFolder } from "@/api/material";

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
  (e: "folder-drag-leave", payload: { data: any }): void;
  (e: "folder-drop", payload: { data: any }): void;
}>();

const treeRef = ref();
const treeData = ref<any[]>([]);

async function loadTree() {
  const res = await getStickerFolderTree({ folderCategory: props.folderCategory });
  const rootFolders = (res || []).filter((f: any) => f.parentId === null || f.parentId === undefined);

  const allNode: any = {
    id: "__all__",
    name: "全部",
    path: "",
    parentId: null,
    children: [], // No children for All node in this view
    isAll: true,
  };

  const rootNode: any = {
    id: "__root__",
    name: "未分类",
    path: "",
    parentId: null,
    children: [],
    stickerCount: 0,
  };

  if (props.mode === 'select') {
    treeData.value = [rootNode, ...rootFolders];
  } else {
    treeData.value = [allNode, rootNode, ...rootFolders];
  }
  nextTick(() => {
    // If current modelValue is null (old root), set to __root__? Or if it's __all__?
    // User might have passed __root__ as initial value.
    treeRef.value?.setCurrentKey(props.modelValue || "__all__");
  });
  emit("reloaded");
}

function handleNodeClick(node: any) {
  if (node.id === '__all__') {
    emit("update:modelValue", "__all__");
    emit("change", { folderId: 'all', node });
    return;
  }
  const folderId = node.id === "__root__" ? null : node.id;
  emit("update:modelValue", node.id === "__root__" ? "__root__" : node.id);
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
        emit("update:modelValue", "__all__");
        emit("change", { folderId: 'all', node: null });
      }
      loadTree();
    } catch (error) {
      if (error !== "cancel") console.error(error);
    }
  }
}

function handleFolderDragOver(data: any, evt?: DragEvent) {
  if (data.id === '__all__') return; // Prevent drop on All
  emit("folder-drag-over", { data, event: evt });
}

function handleFolderDragLeave(data: any) {
  emit("folder-drag-leave", { data });
}

function handleFolderDrop(data: any) {
  emit("folder-drop", { data });
}

onMounted(loadTree);
watch(
  () => props.folderCategory,
  () => loadTree()
);
</script>

<style lang="less" scoped>
/* 文件夹树样式（复用 material/index 的样式） */
.sticker-folder-tree-container {
  .sticker-folder-tree-header {
    margin-bottom: 12px;
  }

  .sticker-folder-tree {
    --el-tree-node-content-height: 36px;

    :deep(.el-tree-node__content) {
      height: 36px;
      /* padding-left: 8px !important; // 移除强制左内边距，以免破坏层级缩进 */

      &:hover {
        background-color: var(--el-fill-color-light);
      }
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-weight: 500;
    }

    :deep(.el-tree-node__expand-icon) {
      color: var(--el-text-color-regular);
    }
  }

  .sticker-folder-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-right: 8px;
    border-radius: 6px;
    transition: background-color 0.15s ease, box-shadow 0.15s ease;

    &.is-drop-hover {
      background-color: var(--el-color-primary-light-9);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
    }

    .sticker-folder-node-content {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;

      .folder-icon {
        width: 16px;
        height: 16px;
        margin-right: 6px;
        flex-shrink: 0;
      }

      .sticker-folder-node-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        cursor: pointer;
        transform-origin: left center;

        &:hover {
          transform: scale(1.05);
        }
      }

      .sticker-folder-node-count {
        font-size: 11px;
        color: var(--el-color-primary);
        font-weight: 300;
        margin-left: 6px;
      }
    }

    .sticker-folder-node-actions {
      display: flex;
      align-items: center;
      padding-right: 4px;
      margin-left: 12px;

      .sticker-folder-action-icon {
        font-size: 14px;
        cursor: pointer;
        opacity: 0.4;
        transition: opacity 0.2s, color 0.2s;
        color: var(--el-text-color-regular);
        padding: 2px;

        &:hover {
          opacity: 1;
          color: var(--el-color-primary);
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
