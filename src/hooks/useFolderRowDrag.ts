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
  let boundTbody: HTMLElement | null = null
  let setupFrameId = 0
  let hoverFrameId = 0
  let pendingHoverFolderId: string | null = null
  let pendingHoverFolderPath = ''

  function cancelSetupFrame() {
    if (setupFrameId) {
      window.cancelAnimationFrame(setupFrameId)
      setupFrameId = 0
    }
  }

  function cancelHoverFrame() {
    if (hoverFrameId) {
      window.cancelAnimationFrame(hoverFrameId)
      hoverFrameId = 0
    }
  }

  function destroySortable() {
    sortableRef.value?.destroy()
    sortableRef.value = null
    boundTbody = null
  }

  function clearHoverState() {
    cancelHoverFrame()
    pendingHoverFolderId = null
    pendingHoverFolderPath = ''
    dragState.overFolderId = null
    dragState.overFolderPath = ''
  }

  function clearDragState() {
    dragState.dragging = false
    dragState.draggingIds = []
    clearHoverState()
  }

  function scheduleHoverState(folderId: string | null, folderPath = '') {
    pendingHoverFolderId = folderId
    pendingHoverFolderPath = folderPath

    if (hoverFrameId) {
      return
    }

    hoverFrameId = window.requestAnimationFrame(() => {
      hoverFrameId = 0

      if (!dragState.dragging) {
        return
      }

      dragState.overFolderId = pendingHoverFolderId
      dragState.overFolderPath = pendingHoverFolderPath
    })
  }

  function setupRowDrag() {
    nextTick(() => {
      cancelSetupFrame()
      setupFrameId = window.requestAnimationFrame(() => {
        setupFrameId = 0

        const tbody = document.querySelector(`.${gridClass} .vxe-table--body tbody`) as HTMLElement | null
        if (!tbody) {
          destroySortable()
          return
        }

        if (boundTbody === tbody && sortableRef.value) {
          return
        }

        destroySortable()
        boundTbody = tbody
        sortableRef.value = Sortable.create(tbody, {
          animation: 180,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          sort: false,
          ghostClass: 'template-drag-ghost',
          chosenClass: 'template-drag-chosen',
          dragClass: 'template-drag-dragging',
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
            clearHoverState()
          },
          onEnd: () => {
            clearDragState()
          }
        })
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

    const nextFolderId = payload.data.id != null ? String(payload.data.id) : null
    const nextFolderPath = payload.data.path || ''

    if (
      dragState.overFolderId === nextFolderId &&
      dragState.overFolderPath === nextFolderPath &&
      pendingHoverFolderId === nextFolderId &&
      pendingHoverFolderPath === nextFolderPath
    ) {
      return
    }

    scheduleHoverState(nextFolderId, nextFolderPath)
  }

  function handleFolderDragLeave(payloadOrData: { data: any } | any) {
    const payload = normalizeDragPayload(payloadOrData)
    if (!payload || !payload.data) {
      clearHoverState()
      return
    }

    const folderId = payload.data.id != null ? String(payload.data.id) : null
    if (dragState.overFolderId === folderId || pendingHoverFolderId === folderId) {
      clearHoverState()
    }
  }

  function resetAfterDrop() {
    clearDragState()
  }

  onUnmounted(() => {
    cancelSetupFrame()
    cancelHoverFrame()
    destroySortable()
  })

  return {
    dragState,
    setupRowDrag,
    handleFolderDragOver,
    handleFolderDragLeave,
    resetAfterDrop
  }
}

