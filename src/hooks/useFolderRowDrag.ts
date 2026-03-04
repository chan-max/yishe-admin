import { reactive, ref, nextTick, onUnmounted, type Ref } from 'vue'
import { useMouse } from '@vueuse/core'
import Sortable from 'sortablejs'

export interface FolderDragState {
  dragging: boolean
  draggingIds: string[]
  overFolderId: string | null
  overFolderPath: string
}

export interface DragHintState {
  visible: boolean
  text: string
  x: number
  y: number
}

export interface UseFolderRowDragOptions<TItem extends { id?: string | number }> {
  /**
   * vxe-grid 外层自定义的 class 名（不带点），例如：'font-template-dnd-grid'
   */
  gridClass: string
  /**
   * 提示文案中使用的实体名称，例如：'字体模板' / '模板' / '素材'
   */
  itemLabel: string
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
  dragHint: DragHintState
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
  const { gridClass, itemLabel, handleSelector = '.row-drag-handle', dataSource, selectedIds } = options

  const dragState = reactive<FolderDragState>({
    dragging: false,
    draggingIds: [],
    overFolderId: null,
    overFolderPath: ''
  })

  const dragHint = reactive<DragHintState>({
    visible: false,
    text: '',
    x: -9999,
    y: -9999
  })

  const dragHintListenerBound = ref(false)
  const sortableRef = ref<Sortable | null>(null)
  let rafId = 0  // 用于防抖位置更新

  const { x: mouseX, y: mouseY } = useMouse({ touch: false })

  function updateDragHintPosition(e?: DragEvent) {
    const x = e && 'clientX' in e ? e.clientX : mouseX.value
    const y = e && 'clientY' in e ? e.clientY : mouseY.value
    dragHint.x = (x || 0) - 180
    dragHint.y = (y || 0) + 16
  }

  function handleGlobalDragOver(e: DragEvent) {
    if (!dragState.dragging) return
    if (!dragState.overFolderId) return
    dragHint.visible = true
    dragHint.text = `将 ${dragState.draggingIds.length} 个${itemLabel}移动到 ${dragState.overFolderPath || '该文件夹'}`
    
    // 使用 RAF 防抖位置更新，避免频繁更新
    if (rafId) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      updateDragHintPosition(e)
      rafId = 0
    })
  }

  function bindGlobalDragHint() {
    if (dragHintListenerBound.value) return
    window.addEventListener('dragover', handleGlobalDragOver)
    dragHintListenerBound.value = true
  }

  function unbindGlobalDragHint() {
    if (!dragHintListenerBound.value) return
    window.removeEventListener('dragover', handleGlobalDragOver)
    dragHintListenerBound.value = false
  }

  function hideDragHint() {
    dragHint.visible = false
    dragHint.text = ''
    dragHint.x = -9999
    dragHint.y = -9999
    unbindGlobalDragHint()
  }

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
          dragHint.visible = false
          dragHint.text = ''
          dragHint.x = -9999
          dragHint.y = -9999

          bindGlobalDragHint()

          if (evt.originalEvent && 'clientX' in evt.originalEvent) {
            updateDragHintPosition(evt.originalEvent as DragEvent)
          }
        },
        onEnd: () => {
          dragState.dragging = false
          dragState.draggingIds = []
          dragState.overFolderId = null
          dragState.overFolderPath = ''
          hideDragHint()
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
    
    // 只有当进入新文件夹时才更新状态，避免频繁更新
    if (dragState.overFolderId !== payload.data.id) {
      dragState.overFolderId = payload.data.id
      dragState.overFolderPath = payload.data.path || ''
      dragHint.visible = true
      dragHint.text = `将 ${dragState.draggingIds.length} 个${itemLabel}移动到 ${dragState.overFolderPath || '该文件夹'}`
    }
    
    // 位置更新用 RAF 防抖，减少频繁更新
    if (payload.event) {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        updateDragHintPosition(payload.event)
        rafId = 0
      })
    }
  }

  function handleFolderDragLeave(payloadOrData: { data: any } | any) {
    const payload = normalizeDragPayload(payloadOrData)
    if (!payload || !payload.data) return
    if (dragState.overFolderId === payload.data.id) {
      dragState.overFolderId = null
      dragState.overFolderPath = ''
      dragHint.visible = false
      dragHint.x = -9999
      dragHint.y = -9999
    }
  }

  function resetAfterDrop() {
    dragState.dragging = false
    dragState.draggingIds = []
    dragState.overFolderId = null
    dragState.overFolderPath = ''
    hideDragHint()
  }

  onUnmounted(() => {
    sortableRef.value?.destroy()
    unbindGlobalDragHint()
    if (rafId) cancelAnimationFrame(rafId)
  })

  return {
    dragState,
    dragHint,
    setupRowDrag,
    handleFolderDragOver,
    handleFolderDragLeave,
    resetAfterDrop
  }
}

