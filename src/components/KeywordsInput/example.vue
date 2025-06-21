<template>
  <div class="keywords-example">
    <h2>KeywordsInput 组件使用示例</h2>
    
    <!-- 基础用法 -->
    <el-card class="mb-4">
      <template #header>
        <span>基础用法</span>
      </template>
      <KeywordsInput v-model="basicKeywords" />
      <div class="mt-2">当前值: {{ basicKeywords }}</div>
    </el-card>
    
    <!-- 带标签显示 -->
    <el-card class="mb-4">
      <template #header>
        <span>带标签显示</span>
      </template>
      <KeywordsInput 
        v-model="tagKeywords" 
        :show-tags="true"
        placeholder="输入关键词后会自动显示为标签"
      />
      <div class="mt-2">当前值: {{ tagKeywords }}</div>
    </el-card>
    
    <!-- 在表单中使用 -->
    <el-card class="mb-4">
      <template #header>
        <span>在表单中使用</span>
      </template>
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="关键词标签" prop="keywords">
          <KeywordsInput 
            v-model="formData.keywords" 
            placeholder="请输入关键词，用逗号分隔"
            :show-tags="true"
            @validation="handleValidation"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交表单</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
      <div v-if="validationMessage" class="mt-2 text-red-500">
        {{ validationMessage }}
      </div>
    </el-card>
    
    <!-- 自定义分隔符 -->
    <el-card class="mb-4">
      <template #header>
        <span>自定义分隔符（使用分号）</span>
      </template>
      <KeywordsInput 
        v-model="customKeywords" 
        separator=";"
        placeholder="使用分号分隔关键词"
        :show-tags="true"
      />
      <div class="mt-2">当前值: {{ customKeywords }}</div>
    </el-card>
    
    <!-- 禁用状态 -->
    <el-card class="mb-4">
      <template #header>
        <span>禁用状态</span>
      </template>
      <KeywordsInput 
        v-model="disabledKeywords" 
        :disabled="true"
        :show-tags="true"
      />
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import KeywordsInput from './index.vue'
import type { FormInstance } from 'element-plus'

// 基础用法
const basicKeywords = ref('')

// 带标签显示
const tagKeywords = ref('热门,推荐,新品')

// 表单数据
const formData = reactive({
  keywords: ''
})

// 自定义分隔符
const customKeywords = ref('')

// 禁用状态
const disabledKeywords = ref('已禁用,关键词')

// 表单引用
const formRef = ref<FormInstance>()

// 验证消息
const validationMessage = ref('')

// 表单验证规则
const rules = {
  keywords: [
    { required: true, message: '请输入关键词', trigger: 'blur' },
    {
      validator: (_: any, value: string, callback: any) => {
        if (!value) {
          callback()
          return
        }
        
        const keywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0)
        if (keywords.length === 0) {
          callback(new Error('请输入至少一个关键词'))
          return
        }
        
        if (keywords.length > 10) {
          callback(new Error('关键词数量不能超过10个'))
          return
        }
        
        for (const keyword of keywords) {
          if (keyword.length > 20) {
            callback(new Error(`关键词"${keyword}"长度不能超过20个字符`))
            return
          }
        }
        
        callback()
      },
      trigger: 'blur'
    }
  ]
}

// 处理验证
const handleValidation = (result: { isValid: boolean; message: string }) => {
  if (!result.isValid) {
    validationMessage.value = result.message
  } else {
    validationMessage.value = ''
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    console.log('表单数据:', formData)
    alert('表单验证通过！')
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 重置表单
const resetForm = () => {
  if (!formRef.value) return
  formRef.value.resetFields()
  validationMessage.value = ''
}
</script>

<style scoped>
.keywords-example {
  padding: 20px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.text-red-500 {
  color: #ef4444;
}
</style> 