<template>
  <div
    class="sticker-folder-tree-container"
    :style="{
      width: width + 'px',
      minWidth: width + 'px',
      maxWidth: width + 'px',
      flexShrink: 0,
      borderRight: showBorder ? '1px solid var(--el-border-color)' : undefined,
      paddingRight: showBorder ? '16px' : undefined,
    }"
  >
    <div class="sticker-folder-tree-header">
      <el-button type="primary" size="small" plain style="width: 100%" @click="handleCreateRoot">
        <el-icon><FolderAdd /></el-icon>
        新建文件夹
      </el-button>
    </div>

    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="{ children: 'children', label: 'name' }"
      node-key="id"
      :expand-on-click-node="false"
      :default-expand-all="false"
      :default-expanded-keys="['__root__']"
      :highlight-current="true"
      :current-node-key="modelValue || '__root__'"
      style="max-height: calc(100vh - 300px); overflow-y: auto; overflow-x: hidden"
      class="sticker-folder-tree"
    >
      <template #default="{ node, data }">
        <div class="sticker-folder-node">
          <div class="sticker-folder-node-content">
            <img
              v-if="node.expanded && data.children && data.children.length > 0"
              src="/img/folder-open.svg"
              class="folder-icon"
              alt="folder"
            />
            <img v-else src="/img/folder-close.svg" class="folder-icon" alt="folder" />

            <span class="sticker-folder-node-text" @click.stop="handleNodeClick(data)">{{ data.name }}</span>
            <span v-if="showCount && data.id !== '__root__'" class="sticker-folder-node-count"
              >({{ data.stickerCount || 0 }})</span
            >
          </div>

          <div v-if="data.id !== '__root__'" class="sticker-folder-node-actions">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, data)" @click.stop size="small">
              <el-icon class="sticker-folder-action-icon"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="create">
                    <el-icon><FolderAdd /></el-icon>
                    新建子文件夹
                  </el-dropdown-item>
                  <el-dropdown-item command="rename">
                    <el-icon><Edit /></el-icon>
                    重命名
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
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
import { FolderAdd, MoreFilled, Edit, Delete } from "@element-plus/icons-vue";
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
    width?: number;
    showBorder?: boolean;
  }>(),
  {
    showCount: true,
    width: 280,
    showBorder: true,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string | null): void;
  (e: "change", payload: { folderId: string | null; node: any }): void;
  (e: "reloaded"): void;
}>();

const treeRef = ref();
const treeData = ref<any[]>([]);

async function loadTree() {
  const res = await getStickerFolderTree({ folderCategory: props.folderCategory });
  const rootFolders = (res || []).filter((f: any) => f.parentId === null || f.parentId === undefined);
  const rootNode: any = {
    id: "__root__",
    name: "根目录",
    path: "",
    parentId: null,
    stickerCount: 0,
    children: rootFolders,
    isRoot: true,
  };
  treeData.value = [rootNode];
  nextTick(() => {
    treeRef.value?.setCurrentKey(props.modelValue || "__root__");
  });
  emit("reloaded");
}

function handleNodeClick(node: any) {
  const folderId = node.id === "__root__" ? null : node.id;
  emit("update:modelValue", node.id === "__root__" ? "__root__" : node.id);
  emit("change", { folderId, node });
}

async function handleCreateRoot() {
  try {
    const { value } = await ElMessageBox.prompt("请输入文件夹名称", "新建文件夹", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /^[^/\\?*<>|"]+$/,
      inputErrorMessage: '文件夹名称不能包含特殊字符：/ \\ ? * < > | "',
    });
    await createStickerFolder({ name: value, parentId: null, folderCategory: props.folderCategory });
    ElMessage.success("创建成功");
    await loadTree();
  } catch (e) {
    if (e !== "cancel") ElMessage.error((e as any)?.message || "创建失败");
  }
}

async function handleCommand(command: string, node: any) {
  if (command === "create") {
    try {
      const { value } = await ElMessageBox.prompt("请输入文件夹名称", "新建子文件夹", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /^[^/\\?*<>|"]+$/,
        inputErrorMessage: '文件夹名称不能包含特殊字符：/ \\ ? * < > | "',
      });
      await createStickerFolder({ name: value, parentId: node.id, folderCategory: props.folderCategory });
      ElMessage.success("创建成功");
      await loadTree();
    } catch (e) {
      if (e !== "cancel") ElMessage.error((e as any)?.message || "创建失败");
    }
    return;
  }

  if (command === "rename") {
    try {
      const { value } = await ElMessageBox.prompt("请输入新名称", "重命名文件夹", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: node.name,
        inputPattern: /^[^/\\?*<>|"]+$/,
        inputErrorMessage: '文件夹名称不能包含特殊字符：/ \\ ? * < > | "',
      });
      await renameStickerFolder({ id: node.id, name: value, folderCategory: props.folderCategory });
      ElMessage.success("重命名成功");
      await loadTree();
    } catch (e) {
      if (e !== "cancel") ElMessage.error((e as any)?.message || "重命名失败");
    }
    return;
  }

  if (command === "delete") {
    try {
      await ElMessageBox.confirm("确认删除该文件夹吗？（需先清空子文件夹）", "删除提示", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      });
      await deleteStickerFolder(node.id, true, { folderCategory: props.folderCategory });
      ElMessage.success("删除成功");
      await loadTree();
    } catch (e) {
      if (e !== "cancel") ElMessage.error((e as any)?.message || "删除失败");
    }
  }
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
      padding-left: 8px !important;

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

