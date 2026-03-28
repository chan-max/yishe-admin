<template>
  <el-dialog
    v-model="visible"
    fullscreen
    append-to-body
    class="ps-console-dialog"
    :modal-class="'ps-console-dialog__mask'"
    :z-index="5000"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <template #header>
      <span>PS 控制台</span>
    </template>

    <PsConsolePanel />
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import PsConsolePanel from '@/components/PsConsolePanel/index.vue'

defineOptions({ name: 'PsConsoleDialog' })

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<style scoped lang="scss">
:global(.ps-console-dialog__mask) {
  z-index: 4999 !important;
}

:deep(.ps-console-dialog .el-overlay-dialog) {
  z-index: 5000 !important;
}

:deep(.ps-console-dialog .el-dialog) {
  margin: 0;
}

:deep(.ps-console-dialog .el-dialog__body) {
  height: calc(100vh - 54px);
  overflow: auto;
}
</style>
