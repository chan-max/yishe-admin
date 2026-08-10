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
        <el-table-column label="缩略图" width="120" align="center">
          <template #default="{ row }">
            <div v-if="getPsdSetImageList(row).length" class="related-psd-set-thumbnail">
              <el-image
                :src="getPsdSetThumbnailUrl(row)"
                :preview-src-list="getPsdSetImageList(row)"
                :initial-index="0"
                :preview-teleported="true"
                :hide-on-click-modal="false"
                fit="cover"
                class="related-psd-set-thumbnail__image"
              >
                <template #error>
                  <div class="related-psd-set-thumbnail__empty">加载失败</div>
                </template>
              </el-image>
              <span
                v-if="getPsdSetImageList(row).length > 1"
                class="related-psd-set-thumbnail__badge"
              >
                {{ getPsdSetImageList(row).length }}张
              </span>
            </div>
            <span v-else class="related-psd-set-thumbnail__empty">无图</span>
          </template>
        </el-table-column>
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
import { getFastPreviewImageUrl } from '@/utils/image'

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

function getPsdSetImageList(row: any): string[] {
  const imageList = Array.isArray(row?.images)
    ? row.images.filter(
        (url: any): url is string => typeof url === 'string' && url.trim().length > 0
      )
    : []
  const fallbackImages = [row?.thumbnail, row?.preview, row?.image, row?.imageUrl].filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0
  )

  return Array.from(new Set([...imageList, ...fallbackImages]))
}

function getPsdSetThumbnailUrl(row: any) {
  const firstImage = getPsdSetImageList(row)[0] || ''
  return firstImage ? getFastPreviewImageUrl(firstImage, { width: 160, height: 120 }) : ''
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

<style scoped>
.related-psd-set-thumbnail {
  position: relative;
  display: inline-flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
}

.related-psd-set-thumbnail__image {
  width: 72px;
  height: 72px;
  overflow: hidden;
  cursor: zoom-in;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.related-psd-set-thumbnail__badge {
  position: absolute;
  right: 4px;
  bottom: 4px;
  height: 16px;
  padding: 0 5px;
  font-size: 10px;
  line-height: 16px;
  color: #fff;
  background: rgb(15 23 42 / 68%);
  border-radius: 999px;
}

.related-psd-set-thumbnail__empty {
  display: inline-flex;
  width: 72px;
  height: 72px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  align-items: center;
  justify-content: center;
}
</style>
