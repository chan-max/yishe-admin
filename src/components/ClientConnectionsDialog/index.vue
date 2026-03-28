<template>
  <el-dialog
    v-model="visible"
    fullscreen
    append-to-body
    class="client-connections-dialog"
    :modal-class="'client-connections-dialog__mask'"
    :z-index="5000"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <template #header>
      <span>客户端连接</span>
    </template>

    <ClientControl />
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import ClientControl from '@/components/ClientControl/index.vue'

defineOptions({ name: 'ClientConnectionsDialog' })

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
:global(.client-connections-dialog__mask) {
  z-index: 4999 !important;
}

:deep(.client-connections-dialog .el-overlay-dialog) {
  z-index: 5000 !important;
}

:deep(.client-connections-dialog .el-dialog) {
  margin: 0;
}

:deep(.client-connections-dialog .el-dialog__body) {
  height: calc(100vh - 54px);
  overflow: auto;
}
</style>
