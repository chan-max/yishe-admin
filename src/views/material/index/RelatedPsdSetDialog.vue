<template>
  <el-dialog
    v-model="visible"
    fullscreen
    :destroy-on-close="true"
    :title="`素材 ${materialId || ''} 关联套图`"
  >
    <div v-loading="loading">
      <el-table
        :data="list"
        border
        size="small"
        style="width: 100%"
        max-height="calc(100vh - 260px)"
      >
        <el-table-column prop="id" label="套图ID" min-width="220" show-overflow-tooltip />
        <el-table-column prop="name" label="名称" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="模板" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row?.psdTemplate?.name || row?.psdTemplateId || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            <span>{{ row?.createTime ? formatTimestamp(row.createTime) : '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="暂无关联套图" />
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { formatTimestamp } from '@/common/date'
import { stickerPsdSetApi } from '@/api/stickerPsdSet'

const visible = ref(false)
const loading = ref(false)
const materialId = ref('')
const list = ref<any[]>([])

const statusLabelMap: Record<string, string> = {
  pending: '待制作',
  processing: '制作中',
  completed: '已完成',
  failed: '失败'
}

function getStatusLabel(status?: string) {
  if (!status) return '-'
  return statusLabelMap[status] || status
}

function getStatusTagType(status?: string): 'warning' | 'primary' | 'success' | 'danger' | 'info' {
  if (status === 'pending') return 'warning'
  if (status === 'processing') return 'primary'
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'danger'
  return 'info'
}

async function open(row: any) {
  if (!row?.id) {
    ElMessage.warning('素材ID不存在')
    return
  }

  materialId.value = String(row.id)
  visible.value = true
  loading.value = true
  list.value = []

  try {
    const res: any = await stickerPsdSetApi.page({
      currentPage: 1,
      pageSize: 200,
      stickerId: String(row.id),
      includeDetails: true
    })
    const rows = res?.list || res?.data?.list || []
    list.value = Array.isArray(rows) ? rows : []
  } catch (error: any) {
    ElMessage.error(error?.message || '查询关联套图失败')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
