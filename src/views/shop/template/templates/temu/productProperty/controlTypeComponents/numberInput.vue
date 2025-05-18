<template>
  <el-input
    type="text"
    v-model="displayValue"
    style="width: 360px;"
    :placeholder="placeholder"
    @input="handleInput"
    @blur="handleBlur"
    @keydown="handleKeyDown"
  ></el-input>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: [Number, String],
  min: {
    type: Number,
    default: -Infinity
  },
  max: {
    type: Number,
    default: Infinity
  },
  precision: {
    type: Number,
    default: null
  },
  placeholder: {
    type: String,
    default: '请输入'
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'blur'])

const internalValue = ref(props.modelValue)
const isEditing = ref(false)

// 显示值，编辑时显示原始输入，非编辑时显示格式化后的值
const displayValue = computed({
  get() {
    if (isEditing.value) {
      return internalValue.value
    }
    
    const num = parseFloat(internalValue.value)
    if (isNaN(num)) return ''
    
    // 应用精度限制
    if (props.precision !== null) {
      return num.toFixed(props.precision)
    }
    return num.toString()
  },
  set(value) {
    internalValue.value = value
  }
})

// 处理输入
const handleInput = (value) => {
  isEditing.value = true
  
  // 过滤非数字字符（允许小数点、负号）
  let filteredValue = value.replace(/[^\d.-]/g, '')
  
  // 处理多个小数点的情况
  const decimalParts = filteredValue.split('.')
  if (decimalParts.length > 2) {
    filteredValue = `${decimalParts[0]}.${decimalParts.slice(1).join('')}`
  }
  
  // 处理多个负号的情况
  if (filteredValue.startsWith('-')) {
    filteredValue = '-' + filteredValue.replace(/-/g, '')
  } else {
    filteredValue = filteredValue.replace(/-/g, '')
  }
  
  internalValue.value = filteredValue
  emit('update:modelValue', filteredValue)
  emit('change', filteredValue)
}

// 处理键盘事件，阻止非法按键
const handleKeyDown = (e) => {
  const allowedKeys = [
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 
    'Tab', 'Home', 'End'
  ]
  
  // 允许控制键
  if (allowedKeys.includes(e.key)) return
  
  // 允许数字
  if (e.key >= '0' && e.key <= '9') return
  
  // 允许小数点（如果允许小数）
  if (e.key === '.' && props.precision !== 0) {
    // 防止输入多个小数点
    if (internalValue.value.includes('.')) {
      e.preventDefault()
    }
    return
  }
  
  // 允许负号（如果最小值小于0）
  if (e.key === '-' && props.min < 0) {
    // 防止在中间输入负号或输入多个负号
    if (internalValue.value.includes('-') || e.target.selectionStart !== 0) {
      e.preventDefault()
    }
    return
  }
  
  // 阻止其他按键
  e.preventDefault()
}

// 处理失焦事件
const handleBlur = () => {
  isEditing.value = false
  
  let value = parseFloat(internalValue.value)
  
  // 如果是NaN，则重置为最小值或0
  if (isNaN(value)) {
    value = props.min >= 0 ? props.min : 0
  }
  
  // 应用最小值限制
  if (value < props.min) {
    value = props.min
  }
  
  // 应用最大值限制
  if (value > props.max) {
    value = props.max
  }
  
  // 应用精度限制
  if (props.precision !== null) {
    value = parseFloat(value.toFixed(props.precision))
  }
  
  // 更新内部值和触发事件
  internalValue.value = value.toString()
  emit('update:modelValue', value)
  emit('change', value)
  emit('blur', value)
}

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  if (!isEditing.value) {
    internalValue.value = newVal
  }
})
</script>