<template>
  <div class="keywords-input">
    <el-input
      v-model="inputValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :show-word-limit="showWordLimit"
      :disabled="disabled"
      @input="handleInput"
      @blur="handleBlur"
    />
    <div v-if="showHelper" class="text-gray-500 text-sm mt-1">
      {{ helperText }}
    </div>
    <div v-if="showTags && keywords.length > 0" class="keywords-tags mt-2">
      <el-tag
        v-for="(keyword, index) in keywords"
        :key="index"
        closable
        @close="removeKeyword(index)"
        class="mr-2 mb-2"
      >
        {{ keyword }}
      </el-tag>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { parseKeywords, cleanKeywords, validateKeywords } from '@/utils/keywords'

interface Props {
  modelValue?: string
  placeholder?: string
  maxlength?: number
  showWordLimit?: boolean
  disabled?: boolean
  showHelper?: boolean
  helperText?: string
  showTags?: boolean
  separator?: string
  validateOnBlur?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入关键词，用逗号分隔',
  maxlength: 200,
  showWordLimit: true,
  disabled: false,
  showHelper: true,
  helperText: '多个关键词请用逗号分隔',
  showTags: false,
  separator: ',',
  validateOnBlur: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'validation', result: { isValid: boolean; message: string }): void
}>()

const inputValue = ref(props.modelValue || '')

// 解析关键词数组
const keywords = computed(() => {
  return parseKeywords(inputValue.value, props.separator)
})

// 处理输入
const handleInput = (value: string) => {
  inputValue.value = value
  emit('update:modelValue', value)
  emit('change', value)
}

// 处理失焦，清理多余的空格和逗号
const handleBlur = () => {
  const cleaned = cleanKeywords(inputValue.value, props.separator)
  
  if (cleaned !== inputValue.value) {
    inputValue.value = cleaned
    emit('update:modelValue', cleaned)
    emit('change', cleaned)
  }
  
  // 验证关键词
  if (props.validateOnBlur) {
    const validation = validateKeywords(cleaned, props.separator)
    emit('validation', validation)
  }
}

// 移除关键词标签
const removeKeyword = (index: number) => {
  const newKeywords = keywords.value.filter((_, i) => i !== index)
  const newValue = newKeywords.join(props.separator)
  inputValue.value = newValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== inputValue.value) {
    inputValue.value = newValue || ''
  }
})
</script>

<style scoped>
.keywords-input {
  width: 100%;
}

.keywords-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style> 