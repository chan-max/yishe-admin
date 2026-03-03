import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { stickerPsdSetApi } from '@/api/stickerPsdSet'

const psdSetStatusLabelMap: Record<string, string> = {
  pending: '待制作',
  processing: '制作中',
  completed: '已完成',
  failed: '失败'
}

export function useRelatedPsdSets() {
  const relatedPsdSetDialogVisible = ref(false)
  const relatedPsdSetLoading = ref(false)
  const relatedPsdSetSource = ref<any[]>([])
  const relatedPsdSetMaterialId = ref<string>('')
  const relatedPsdSetMaterialInfo = ref<any>(null)

  function getPsdSetStatusLabel(status?: string) {
    if (!status) return '-'
    return psdSetStatusLabelMap[status] || status
  }

  function getPsdSetStatusTagType(status?: string): 'warning' | 'primary' | 'success' | 'danger' | 'info' {
    if (status === 'pending') return 'warning'
    if (status === 'processing') return 'primary'
    if (status === 'completed') return 'success'
    if (status === 'failed') return 'danger'
    return 'info'
  }

  async function openRelatedPsdSets(row: any) {
    if (!row?.id) {
      ElMessage.warning('素材ID不存在')
      return
    }

    relatedPsdSetMaterialId.value = String(row.id)
    relatedPsdSetMaterialInfo.value = {
      id: String(row.id),
      name: row.name || '-',
      suffix: row.suffix || '-',
      folder: row.folder || '根目录'
    }

    relatedPsdSetDialogVisible.value = true
    relatedPsdSetLoading.value = true
    relatedPsdSetSource.value = []

    try {
      const res: any = await stickerPsdSetApi.page({
        currentPage: 1,
        pageSize: 200,
        stickerId: String(row.id),
        includeDetails: true
      })
      const list = res?.list || res?.data?.list || []
      relatedPsdSetSource.value = Array.isArray(list) ? list : []
    } catch (error: any) {
      ElMessage.error(error?.message || '查询关联套图失败')
    } finally {
      relatedPsdSetLoading.value = false
    }
  }

  return {
    relatedPsdSetDialogVisible,
    relatedPsdSetLoading,
    relatedPsdSetSource,
    relatedPsdSetMaterialId,
    relatedPsdSetMaterialInfo,
    getPsdSetStatusLabel,
    getPsdSetStatusTagType,
    openRelatedPsdSets
  }
}
