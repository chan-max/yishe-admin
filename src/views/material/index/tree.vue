<template>
  <div class="tree-container">
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      node-key="id"
      :default-expand-all="true"
      :expand-on-click-node="false"
      :highlight-current="true"
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <div class="tree-node">
          <el-icon v-if="data.children && data.children.length > 0">
            <Folder />
          </el-icon>
          <el-icon v-else>
            <Document />
          </el-icon>
          <span class="node-label">{{ data.label }}</span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Folder, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { MaterialCategoryApi } from '@/api/material/tree'

defineProps({
  showUpload: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['node-click'])

const treeRef = ref()
const treeData = ref([])

const treeProps = {
  children: 'children',
  label: 'label'
}

// 模拟分类数据，实际应该从API获取
const mockTreeData = [
  {
    id: '1',
    label: '服装类',
    children: [
      {
        id: '1-1',
        label: '上衣',
        children: [
          { id: '1-1-1', label: 'T恤' },
          { id: '1-1-2', label: '衬衫' },
          { id: '1-1-3', label: '外套' }
        ]
      },
      {
        id: '1-2',
        label: '下装',
        children: [
          { id: '1-2-1', label: '裤子' },
          { id: '1-2-2', label: '裙子' }
        ]
      }
    ]
  },
  {
    id: '2',
    label: '配饰类',
    children: [
      { id: '2-1', label: '包包' },
      { id: '2-2', label: '鞋子' },
      { id: '2-3', label: '帽子' }
    ]
  },
  {
    id: '3',
    label: '其他',
    children: [
      { id: '3-1', label: '背景' },
      { id: '3-2', label: '装饰' }
    ]
  }
]

const handleNodeClick = (data: any, node: any) => {
  if (!data.children || data.children.length === 0) {
    // 只有叶子节点才能被选择
    const pathString = getNodePath(node)
    const ids = getNodeIds(node)
    
    emit('node-click', {
      pathString,
      id: data.id,
      ids
    })
    
    ElMessage.success(`已选择分类: ${pathString}`)
  }
}

const getNodePath = (node: any): string => {
  const path = []
  let currentNode = node
  
  while (currentNode) {
    path.unshift(currentNode.data.label)
    currentNode = currentNode.parent
  }
  
  return path.join(' > ')
}

const getNodeIds = (node: any): string => {
  const ids = []
  let currentNode = node
  
  while (currentNode) {
    ids.unshift(currentNode.data.id)
    currentNode = currentNode.parent
  }
  
  return ids.join(',')
}

onMounted(async () => {
  try {
    // 从API获取真实的分类数据
    const response = await MaterialCategoryApi.getMaterialCategoryPage({
      pageNum: 1,
      pageSize: 1000
    })
    
    if (response && response.list) {
      // 将API数据转换为树形结构
      treeData.value = buildTreeData(response.list)
    } else {
      // 如果API失败，使用模拟数据
      treeData.value = mockTreeData
    }
  } catch (error) {
    console.error('获取分类数据失败:', error)
    // 使用模拟数据作为备选
    treeData.value = mockTreeData
  }
})

// 构建树形数据的辅助函数
const buildTreeData = (list: any[]) => {
  // 这里需要根据实际的API数据结构来构建树形数据
  // 假设API返回的是平铺的列表，需要构建层级关系
  const map = new Map()
  const roots = []
  
  // 首先创建所有节点
  list.forEach(item => {
    map.set(item.id, {
      id: item.id,
      label: item.name || item.label,
      children: []
    })
  })
  
  // 然后建立父子关系
  list.forEach(item => {
    const node = map.get(item.id)
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId).children.push(node)
    } else {
      roots.push(node)
    }
  })
  
  return roots
}
</script>

<style scoped>
.tree-container {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.node-label {
  font-size: 14px !important;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  flex: 1;
  min-width: 0;
  display: block;
  width: 0;
  flex-grow: 1;
}

.tree-node:hover .node-label {
  font-size: 14px !important;
}

:deep(.el-tree) {
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

:deep(.el-tree-node) {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

:deep(.el-tree-node__content) {
  height: 32px;
  line-height: 32px;
  overflow: hidden !important;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-right: 8px;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
  overflow: hidden !important;
  width: 100% !important;
  max-width: 100% !important;
}

:deep(.el-tree-node__content:hover .tree-node) {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

:deep(.el-tree-node__content:hover .node-label) {
  font-size: 14px !important;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #e6f7ff;
  color: #1890ff;
  overflow: hidden !important;
}

:deep(.el-tree-node__expand-icon) {
  flex-shrink: 0;
}

:deep(.el-tree-node__label) {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

:deep(.el-tree-node__content:hover .el-tree-node__label) {
  width: 100%;
  max-width: 100%;
  overflow: hidden !important;
}

:deep(.el-tree-node:hover) {
  width: 100%;
  max-width: 100%;
  overflow: hidden !important;
}
</style>
