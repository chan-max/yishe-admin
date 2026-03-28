<template>
  <el-dropdown
    :trigger="trigger"
    :placement="placement"
    :disabled="disabled"
    :class="dropdownClass"
    @command="handleCommand"
  >
    <slot name="trigger">
      <el-button type="primary" link size="small" class="operation-trigger-button">
        {{ label }}
        <el-icon class="el-icon--right">
          <ArrowDown />
        </el-icon>
      </el-button>
    </slot>
    <template #dropdown>
      <slot v-if="hasDropdownSlot" name="dropdown" />
      <el-dropdown-menu v-else class="operation-menu-compact">
        <slot />
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

withDefaults(
  defineProps<{
    label?: string
    trigger?: 'click' | 'hover' | 'contextmenu'
    placement?:
      | 'top'
      | 'top-start'
      | 'top-end'
      | 'bottom'
      | 'bottom-start'
      | 'bottom-end'
    disabled?: boolean
    dropdownClass?: string
  }>(),
  {
    label: '操作',
    trigger: 'click',
    placement: 'bottom-end',
    disabled: false,
    dropdownClass: 'operation-dropdown'
  }
)

const emit = defineEmits<{
  command: [command: string | number | object]
}>()

const slots = useSlots()
const hasDropdownSlot = computed(() => Boolean(slots.dropdown))

const handleCommand = (command: string | number | object) => {
  emit('command', command)
}
</script>
