import { reactive, ref, nextTick, onUnmounted, type Ref } from 'vue'
import Sortable from 'sortablejs'

export interface FolderDragState {
  dragging: boolean
  draggingIds: string[]
  overFolderId: string | null
  overFolderPath: string
}

export interface UseFolderRowDragOptions<TItem extends { id?: string | number }> {
  /**
   * vxe-grid 外层自定义的 class 名（不带点），例如：'font-template-dnd-grid'
   */
  gridClass: string
  /**
   * 行拖拽手柄的 CSS 选择器（默认 '.row-drag-handle'）
   */
  handleSelector?: string
  /**
   * 表格数据源
   */
  dataSource: Ref<TItem[]>
  /**
   * 当前多选选中的行 id 列表
   */
  selectedIds: Ref<(string | number)[]>
}

export interface UseFolderRowDragReturn {
  dragState: FolderDragState
  /**
   * 在列表渲染完成后调用一次，用于挂载/刷新 Sortable
   */
  setupRowDrag: () => void
  /**
   * 传给 FolderTree 的 @folder-drag-over
   */
  handleFolderDragOver: (payloadOrData: { data: any; event?: DragEvent } | any, event?: DragEvent) => void
  /**
   * 传给 FolderTree 的 @folder-drag-leave
   */
  handleFolderDragLeave: (payloadOrData: { data: any } | any) => void
  /**
   * 在完成后端批量移动（无论成功/失败）后调用，用于重置拖拽状态
   */
  resetAfterDrop: () => void
}

export function useFolderRowDrag<TItem extends { id?: string | number }>(
  options: UseFolderRowDragOptions<TItem>
): UseFolderRowDragReturn {
  const { gridClass, handleSelector = '.row-drag-handle', dataSource, selectedIds } = options

  const dragState = reactive<FolderDragState>({
    dragging: false,
    draggingIds: [],
    overFolderId: null,
    overFolderPath: ''
  })

  const sortableRef = ref<Sortable | null>(null)
  function setupRowDrag() {
    nextTick(() => {
      const tbody = document.querySelector(`.${gridClass} .vxe-table--body tbody`) as HTMLElement | null
      if (!tbody) return

      sortableRef.value?.destroy()
      sortableRef.value = Sortable.create(tbody, {
        animation: 120,
        sort: false,
        ghostClass: 'template-drag-ghost',
        handle: handleSelector,
        draggable: '.vxe-body--row',
        filter: 'input,textarea,button,a,[contenteditable]',
        preventOnFilter: false,
        onStart: (evt) => {
          const row = dataSource.value[evt.oldIndex]
          const draggingIds =
            selectedIds.value && selectedIds.value.length
              ? selectedIds.value.map((id) => String(id))
              : row && row.id !== undefined
              ? [String(row.id)]
              : []

          dragState.draggingIds = draggingIds
          dragState.dragging = draggingIds.length > 0
          dragState.overFolderId = null
          dragState.overFolderPath = ''
        },
        onEnd: () => {
          dragState.dragging = false
          dragState.draggingIds = []
          dragState.overFolderId = null
          dragState.overFolderPath = ''
        }
      })
    })
  }

  function normalizeDragPayload(payloadOrData: { data?: any; event?: DragEvent } | any, event?: DragEvent) {
    if (payloadOrData && typeof payloadOrData === 'object' && 'data' in payloadOrData) {
      return {
        data: payloadOrData.data,
        event: payloadOrData.event ?? event
      }
    }
    return {
      data: payloadOrData,
      event
    }
  }

  function handleFolderDragOver(payloadOrData: { data: any; event?: DragEvent } | any, event?: DragEvent) {
    const payload = normalizeDragPayload(payloadOrData, event)
    if (!dragState.dragging) return
    if (!payload || !payload.data) return
    if (payload.data.id === '__all__') return
    if (dragState.overFolderId !== payload.data.id) {
      dragState.overFolderId = payload.data.id
      dragState.overFolderPath = payload.data.path || ''
    }
  }

  function handleFolderDragLeave(payloadOrData: { data: any } | any) {
    const payload = normalizeDragPayload(payloadOrData)
    if (!payload || !payload.data) {
      dragState.overFolderId = null
      dragState.overFolderPath = ''
      return
    }
    if (dragState.overFolderId === payload.data.id) {
      dragState.overFolderId = null
      dragState.overFolderPath = ''
    }
  }

  function resetAfterDrop() {
    dragState.dragging = false
    dragState.draggingIds = []
    dragState.overFolderId = null
    dragState.overFolderPath = ''
  }

  onUnmounted(() => {
    sortableRef.value?.destroy()
  })

  return {
    dragState,
    setupRowDrag,
    handleFolderDragOver,
    handleFolderDragLeave,
    resetAfterDrop
  }
}

