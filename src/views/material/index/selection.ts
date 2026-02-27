import { ref } from 'vue'

export const gridRef = ref()

export const resetCheckStatus = (idsRef: { value: any[] }) => {
  const grid = gridRef.value as any
  if (grid && typeof grid.clearCheckboxRow === 'function') {
    grid.clearCheckboxRow()
  }
  if (grid && typeof grid.clearCheckboxReserve === 'function') {
    grid.clearCheckboxReserve()
  }
  idsRef.value = []
}

