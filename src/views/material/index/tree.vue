<template>
  <div style="height: 100%;" class="shrink-0 relative w-full">
    <div class="absolute top-0 w-full flex items-center" style="z-index: 999;height:48px;">
      <el-button @click="handleAdd(null)" size="small" type="primary" link>
        添加文件夹
      </el-button>
    </div>
    <div style="height:48px;width:100%;"></div>
    <div style="  height:calc(100% - 48px); overflow:auto;">
      <div style="flex-shrink: 0;" :key="treeRootKey">
        <el-tree :props="treeProps" :load="loadNode" lazy node-key="id" ref="treeRef" class="category-tree"
          :expand-on-click-node="false"
          @node-click="nodeClick" :default-expanded-keys="expandedKeys" @node-expand="handleNodeExpand"
          :highlight-current="true"
          @node-collapse="handleNodeCollapse">
          <template #default="{ node, data }">
            <div class="tree-node flex gap-2 w-full items-end">
              <img v-if="isFolderOpen(node)" src="/img/folder-open.svg" class="folder-icon" />
              <img v-else src="/img/folder-close.svg" class="folder-icon" />
              <span class="tree-node-text">
                {{ data.name }}
                <span class="tree-node-count">( {{ data.materialCount || 0 }} )</span>
              </span>

              <div style="flex: 1"></div>
              <div class="flex gap-2 items-center tree-node-btns pr-4">
                <el-tooltip v-if="showUpload" content="在该文件夹下上传素材" :hide-after="0">
                  <span @click.stop="handleUpload(node)">
                    <el-icon>
                      <Upload />
                    </el-icon></span>
                </el-tooltip>

                <el-tooltip v-if="showAdd" content="添加子文件夹" :hide-after="0">
                  <span @click.stop="handleAdd(node)">
                    <el-icon>
                      <Plus />
                    </el-icon></span>
                </el-tooltip>
                <el-tooltip v-if="showEdit" content="编辑文件夹名称" :hide-after="0">
                  <span @click.stop="handleEdit(node)"><el-icon>
                      <Edit />
                    </el-icon></span>
                </el-tooltip>
                <el-tooltip v-if="showDelete" content="删除该文件夹" :hide-after="0">
                  <span @click.stop="deleteNode(node)">
                    <el-icon>
                      <Delete />
                    </el-icon></span>
                </el-tooltip>
              </div>
            </div>
          </template>
          <template #empty>
            <el-empty description="暂无目录~" ></el-empty>
          </template>
        </el-tree>
      </div>
    </div>
    
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" @close="dialogClose" :closable="false"
      align-center>
      <el-form :model="addForm" :rules="rules" ref="formRef" label-width="80px">
        <el-row>
          <el-col :span="24" v-if="!isEdit">
            <el-form-item label="添加类型">
              {{ currentNode ? `${currentNode.data.name} 子目录` : "根目录" }}
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="分类名称" prop="name">
              <el-input v-model="addForm.name" placeholder="请输入分类" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, watchEffect } from "vue";

import { MaterialCategoryApi } from '@/api/material/tree';

import { Plus, Delete, Edit, Upload } from "@element-plus/icons-vue";
import { useLocalStorage, useSessionStorage } from "@vueuse/core";
import { getRandomInt } from '@/common/number'


const props = defineProps({
  showUpload: {
    default: true,
  },
  showAdd: {
    default: true,
  },
  showDelete: {
    default: true,
  },
  showEdit: {
    default: true,
  },
})

// 定义 props
const treeProps = ref({
  label: "name",
  children: "children",
  // isLeaf: "leaf",
});
const treeRootKey = ref(123);

const treeRef = ref();

function isFolderOpen(node) {
  return node.expanded && !node.isLeaf;
}

const addForm = ref({
  name: "",
});

const emits = defineEmits(['node-click', 'add', 'update', 'upload', 'delete'])

// 默认展开的节点 key 数组
const expandedKeys = useSessionStorage("_material_tree_expanded_nodes", []);
// const expandedKeys = ref([]);
function handleNodeExpand(data) {
  // return
  // 当节点展开时，将节点 ID 添加到 expandedKeys 数组中
  if (!expandedKeys.value.includes(data.id)) {
    expandedKeys.value.push(data.id);
  }
}




function handleNodeCollapse(data) {
  // return
  // 当节点收起时，将节点 ID 从 expandedKeys 数组中移除
  const index = expandedKeys.value.indexOf(data.id);
  if (index !== -1) {
    expandedKeys.value.splice(index, 1);
  }
}



// 懒加载方法
const loadNode = async (node, resolve) => {
  if (node.level === 0) {
    // 加载根节点
    const rootNodes = await fetchRootNodes();
    resolve(rootNodes);
  } else {
    // 加载子节点
    const childNodes = await fetchChildNodes(node);
    resolve(childNodes);
  }
};

// 模拟获取根节点数据
const fetchRootNodes = async () => {
  let res = await MaterialCategoryApi.getMaterialCategoryPage({
    // current: 1,
    // size: 999,
    parentId: null,
    // name: "",
  });

  return res;
};

// 在当前节点下上传素材
function handleUpload(node) {
  const pathArr = getNodePathArray(node)
  const ids = getNodePathIds(node)
  const id = node.data.id
  emits('upload', {
    pathArr, id,ids
  })
}

// 模拟获取子节点数据

const fetchChildNodes = async (node) => {

  let res = await MaterialCategoryApi.getMaterialCategoryPage({
    // current: 1,
    // size: 999,
    parentId: (node.data.id),
    // name: "",
  });

  return res;
};


async function deleteNode(node) {
  ElMessageBox.confirm(
    "确认删除该数据吗",
    '删除提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'error',
    }
  )
    .then(async () => {
      await MaterialCategoryApi.deleteMaterialCategory({ id: node.data.id });



      ElMessage.success("删除成功");
      treeRootKey.value++;
    })
    .catch(() => {
    })
}

const formRef = ref();
const dialogTitle = ref("");
const dialogVisible = ref(false);
const isEdit = ref(true);
const currentRow = ref({});
const submitLoading = ref(false);

const currentNode = ref({});

async function getList() { }

getList();

function handleAdd(node) {
  currentNode.value = node;
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建文件夹";
  form.value = {};
}

async function handleEdit(node) {
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑文件夹";
  currentNode.value = node;
  addForm.value.name = node.label;
}

const form = ref({});

const rules = {
  name: [{ required: true, message: "分类名不能为空", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
  addForm.value = {};
};

const submitForm = async () => {
  submitLoading.value = true;
  await formRef.value.validate().finally(() => {
    
  });

  try {
    if (isEdit.value) {
      await MaterialCategoryApi.updateMaterialCategory({
        id: currentNode.value.data.id,
        name: addForm.value.name,
      });
      ElMessage.success("更新成功");
      submitLoading.value = false;
      treeRootKey.value++;
    } else {
      await MaterialCategoryApi.createMaterialCategory({
        name: addForm.value.name,
        serialNumber: '',
        parentId: currentNode.value ? String(currentNode.value.data.id) : null,
      });
      ElMessage.success("添加成功");
      submitLoading.value = false;
      treeRootKey.value++;
    }
    dialogVisible.value = false;
  } catch (e) {
  } finally {
    submitLoading.value = false;
    dialogVisible.value = false;
    getList();
  }

  getList();
};

function getNodePathArray(node) {
  // 递归获取父节点路径
  const path = [];
  const buildPath = (currentNode) => {
    if (currentNode) {

      path.unshift(currentNode.data[treeProps.value.label]); // 将节点名称添加到路径开头
      buildPath(currentNode.parent); // 递归处理父节点
    }
  };
  buildPath(node);
  return path.filter(Boolean) // 拼接成类似文件夹的结构
}


function getNodePathIds(node) {
  // 递归获取父节点路径
  const ids = [];
  const buildId = (currentNode) => {
    if (currentNode) {
      ids.unshift(currentNode.data['id']); // 将节点名称添加到路径开头
      buildId(currentNode.parent); // 递归处理父节点
    }
  };
  buildId(node);
  return ids.filter(Boolean) // 拼接成类似文件夹的结构
}


function nodeClick(node, raw, ...params) {
  const path = getNodePathArray(raw)
  const pathString = path.join(' / ')
  emits('node-click', {
    pathString: pathString,
    path:path,
    ids:getNodePathIds(raw),
    id: raw.data.id
  })
}


</script>

<style lang="less">
.light {
  .category-tree {
    .el-tree-node:focus>.el-tree-node__content {
      background-color: #ddd;
    }
  }
}

.dark {
  .category-tree {
    .el-tree-node:focus>.el-tree-node__content {
      background-color: #444;
    }
  }
}



.category-tree {
  --el-tree-node-content-height: 36px;

  .folder-icon {
    width: 16px;
    height: 16px;
  }

  .tree-node {
    font-weight: 400;
    font-size: 12px;
  }

  .tree-node-btns {
    span {
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: .4;

      &:hover {
        transform: scale(1.5);
        opacity: 1;
      }
    }
  }
}


.tree-node-text:hover {
  transform: scale(1.05);
}

.tree-node-count {
  font-weight: 300;
  font-size: .7em;
  color: var(--el-color-primary);
}

// .category-tree{
//   .el-tree--highlight-current .el-tree-node.is-current>.el-tree-node__content{
//   background-color: rgba(0, 0, blue, 1)!important;
// }
// }


</style>
