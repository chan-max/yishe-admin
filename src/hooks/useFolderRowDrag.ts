import { reactive, ref, nextTick, onUnmounted, type Ref } from "vue";
import Sortable from "sortablejs";

export interface FolderDragState {
  dragging: boolean;
  draggingIds: string[];
  overFolderId: string | null;
  overFolderPath: string;
}

export interface UseFolderRowDragOptions<TItem extends { id?: string | number }> {
  /**
   * vxe-grid 外层自定义的 class 名（不带点），例如：'font-template-dnd-grid'
   */
  gridClass: string;
  /**
   * 行拖拽手柄的 CSS 选择器（默认 '.row-drag-handle'）
   */
  handleSelector?: string;
  /**
   * 表格数据源
   */
  dataSource: Ref<TItem[]>;
  /**
   * 当前多选选中的行 id 列表
   */
  selectedIds: Ref<(string | number)[]>;
  /**
   * 触屏拖拽结束时的文件夹放置回调
   */
  onDropToFolder?: (payload: { data: any }) => void | Promise<void>;
}

export interface UseFolderRowDragReturn {
  dragState: FolderDragState;
  /**
   * 在列表渲染完成后调用一次，用于挂载/刷新 Sortable
   */
  setupRowDrag: () => void;
  /**
   * 传给 FolderTree 的 @folder-drag-over
   */
  handleFolderDragOver: (
    payloadOrData: { data: any; event?: DragEvent } | any,
    event?: DragEvent,
  ) => void;
  /**
   * 传给 FolderTree 的 @folder-drag-leave
   */
  handleFolderDragLeave: (payloadOrData: { data: any } | any) => void;
  /**
   * 在完成后端批量移动（无论成功/失败）后调用，用于重置拖拽状态
   */
  resetAfterDrop: () => void;
  /**
   * 当文件夹组件自身触发了 drop 时通知 hook，避免触屏场景重复提交
   */
  markExternalFolderDropHandled: () => void;
}

export function useFolderRowDrag<TItem extends { id?: string | number }>(
  options: UseFolderRowDragOptions<TItem>,
): UseFolderRowDragReturn {
  const {
    gridClass,
    handleSelector = ".row-drag-handle",
    dataSource,
    selectedIds,
    onDropToFolder,
  } = options;

  const dragState = reactive<FolderDragState>({
    dragging: false,
    draggingIds: [],
    overFolderId: null,
    overFolderPath: "",
  });

  const sortableRef = ref<Sortable | null>(null);
  let boundTbody: HTMLElement | null = null;
  let setupFrameId = 0;
  let hoverFrameId = 0;
  let pendingHoverFolderId: string | null = null;
  let pendingHoverFolderPath = "";
  let touchTrackingEnabled = false;
  let externalFolderDropHandled = false;
  let trackedFolderTarget: Record<string, any> | null = null;

  const handleTrackedPointerMove = (event: PointerEvent | TouchEvent) => {
    const point = extractClientPoint(event);
    if (!point || !dragState.dragging) return;
    syncFolderTargetFromPoint(point.clientX, point.clientY);
  };

  function cancelSetupFrame() {
    if (setupFrameId) {
      window.cancelAnimationFrame(setupFrameId);
      setupFrameId = 0;
    }
  }

  function cancelHoverFrame() {
    if (hoverFrameId) {
      window.cancelAnimationFrame(hoverFrameId);
      hoverFrameId = 0;
    }
  }

  function destroySortable() {
    sortableRef.value?.destroy();
    sortableRef.value = null;
    boundTbody = null;
  }

  function clearHoverState() {
    cancelHoverFrame();
    pendingHoverFolderId = null;
    pendingHoverFolderPath = "";
    dragState.overFolderId = null;
    dragState.overFolderPath = "";
  }

  function removeTouchTrackingListeners() {
    document.removeEventListener("pointermove", handleTrackedPointerMove);
    document.removeEventListener("touchmove", handleTrackedPointerMove);
  }

  function resetTouchTrackingState() {
    removeTouchTrackingListeners();
    touchTrackingEnabled = false;
    externalFolderDropHandled = false;
    trackedFolderTarget = null;
  }

  function clearTrackedFolderTarget() {
    trackedFolderTarget = null;
  }

  function clearDragState() {
    dragState.dragging = false;
    dragState.draggingIds = [];
    clearHoverState();
    clearTrackedFolderTarget();
    resetTouchTrackingState();
  }

  function scheduleHoverState(folderId: string | null, folderPath = "") {
    pendingHoverFolderId = folderId;
    pendingHoverFolderPath = folderPath;

    if (hoverFrameId) {
      return;
    }

    hoverFrameId = window.requestAnimationFrame(() => {
      hoverFrameId = 0;

      if (!dragState.dragging) {
        return;
      }

      dragState.overFolderId = pendingHoverFolderId;
      dragState.overFolderPath = pendingHoverFolderPath;
    });
  }

  function extractClientPoint(event: PointerEvent | TouchEvent | DragEvent | MouseEvent) {
    if ("touches" in event && event.touches && event.touches.length > 0) {
      return event.touches[0];
    }

    if ("changedTouches" in event && event.changedTouches && event.changedTouches.length > 0) {
      return event.changedTouches[0];
    }

    if (
      "clientX" in event &&
      typeof event.clientX === "number" &&
      typeof event.clientY === "number"
    ) {
      return {
        clientX: event.clientX,
        clientY: event.clientY,
      };
    }

    return null;
  }

  function isTouchLikeEvent(event: unknown) {
    if (!event || typeof event !== "object") return false;
    const maybeTouchEvent = event as {
      touches?: ArrayLike<Touch>;
      changedTouches?: ArrayLike<Touch>;
      pointerType?: string;
    };

    return Boolean(
      (maybeTouchEvent.touches && maybeTouchEvent.touches.length > 0) ||
        (maybeTouchEvent.changedTouches && maybeTouchEvent.changedTouches.length > 0) ||
        maybeTouchEvent.pointerType === "touch",
    );
  }

  function shouldEnableTouchTracking(event: unknown) {
    if (isTouchLikeEvent(event)) {
      return true;
    }

    if (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      navigator.maxTouchPoints > 0 &&
      window.matchMedia?.("(any-pointer: coarse)").matches
    ) {
      return true;
    }

    return false;
  }

  function readFolderTargetFromElement(element: Element | null) {
    const target = element?.closest?.('[data-folder-drop-target="true"]') as HTMLElement | null;
    if (!target) return null;

    const folderId = target.dataset.folderId;
    return {
      id: folderId ?? null,
      path: target.dataset.folderPath || "",
      name: target.dataset.folderName || "",
      isAll: target.dataset.folderIsAll === "1",
    };
  }

  function syncFolderTargetFromPoint(clientX: number, clientY: number) {
    const target = readFolderTargetFromElement(document.elementFromPoint(clientX, clientY));

    if (!target) {
      clearTrackedFolderTarget();
      clearHoverState();
      return;
    }

    trackedFolderTarget = target;
    handleFolderDragOver({ data: target });
  }

  function startTouchTracking() {
    if (touchTrackingEnabled) return;
    touchTrackingEnabled = true;
    document.addEventListener("pointermove", handleTrackedPointerMove, { passive: true });
    document.addEventListener("touchmove", handleTrackedPointerMove, { passive: true });
  }

  function setupRowDrag() {
    nextTick(() => {
      cancelSetupFrame();
      setupFrameId = window.requestAnimationFrame(() => {
        setupFrameId = 0;

        const tbody = document.querySelector(
          `.${gridClass} .vxe-table--body tbody`,
        ) as HTMLElement | null;
        if (!tbody) {
          destroySortable();
          return;
        }

        if (boundTbody === tbody && sortableRef.value) {
          return;
        }

        destroySortable();
        boundTbody = tbody;
        sortableRef.value = Sortable.create(tbody, {
          animation: 180,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          sort: false,
          fallbackOnBody: true,
          fallbackTolerance: 4,
          ghostClass: "template-drag-ghost",
          chosenClass: "template-drag-chosen",
          dragClass: "template-drag-dragging",
          handle: handleSelector,
          draggable: ".vxe-body--row",
          filter: "input,textarea,button,a,[contenteditable]",
          preventOnFilter: false,
          onStart: (evt) => {
            const row = dataSource.value[evt.oldIndex];
            const draggingIds =
              selectedIds.value && selectedIds.value.length
                ? selectedIds.value.map((id) => String(id))
                : row && row.id !== undefined
                  ? [String(row.id)]
                  : [];

            externalFolderDropHandled = false;
            trackedFolderTarget = null;
            dragState.draggingIds = draggingIds;
            dragState.dragging = draggingIds.length > 0;
            clearHoverState();

            if (
              dragState.dragging &&
              shouldEnableTouchTracking((evt as any).originalEvent ?? evt)
            ) {
              startTouchTracking();
            }
          },
          onEnd: () => {
            const shouldHandleTouchDrop =
              touchTrackingEnabled &&
              !externalFolderDropHandled &&
              Boolean(trackedFolderTarget) &&
              typeof onDropToFolder === "function";

            if (shouldHandleTouchDrop) {
              const payload = { data: trackedFolderTarget };
              Promise.resolve(onDropToFolder?.(payload)).finally(() => {
                clearDragState();
              });
              return;
            }

            clearDragState();
          },
        });
      });
    });
  }

  function normalizeDragPayload(
    payloadOrData: { data?: any; event?: DragEvent } | any,
    event?: DragEvent,
  ) {
    if (payloadOrData && typeof payloadOrData === "object" && "data" in payloadOrData) {
      return {
        data: payloadOrData.data,
        event: payloadOrData.event ?? event,
      };
    }
    return {
      data: payloadOrData,
      event,
    };
  }

  function handleFolderDragOver(
    payloadOrData: { data: any; event?: DragEvent } | any,
    event?: DragEvent,
  ) {
    const payload = normalizeDragPayload(payloadOrData, event);
    if (!dragState.dragging) return;
    if (!payload || !payload.data) return;
    if (payload.data.id === "__all__") return;

    const nextFolderId = payload.data.id != null ? String(payload.data.id) : null;
    const nextFolderPath = payload.data.path || "";

    if (
      dragState.overFolderId === nextFolderId &&
      dragState.overFolderPath === nextFolderPath &&
      pendingHoverFolderId === nextFolderId &&
      pendingHoverFolderPath === nextFolderPath
    ) {
      return;
    }

    scheduleHoverState(nextFolderId, nextFolderPath);
  }

  function handleFolderDragLeave(payloadOrData: { data: any } | any) {
    const payload = normalizeDragPayload(payloadOrData);
    if (!payload || !payload.data) {
      clearHoverState();
      return;
    }

    const folderId = payload.data.id != null ? String(payload.data.id) : null;
    if (dragState.overFolderId === folderId || pendingHoverFolderId === folderId) {
      clearHoverState();
    }
  }

  function resetAfterDrop() {
    clearDragState();
  }

  function markExternalFolderDropHandled() {
    externalFolderDropHandled = true;
  }

  onUnmounted(() => {
    cancelSetupFrame();
    cancelHoverFrame();
    destroySortable();
    resetTouchTrackingState();
  });

  return {
    dragState,
    setupRowDrag,
    handleFolderDragOver,
    handleFolderDragLeave,
    resetAfterDrop,
    markExternalFolderDropHandled,
  };
}
