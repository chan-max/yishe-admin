<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="680px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px" v-loading="loading">
      <el-alert
        :title="channelSummary"
        type="info"
        :closable="false"
        class="mb-4"
      />
      <el-form-item label="消息标题">
        <el-input v-model="formData.title" placeholder="可留空" />
      </el-form-item>
      <el-form-item label="消息内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="6"
          placeholder="输入测试消息内容"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submitForm">发送测试消息</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, unref } from 'vue'
import { ElMessage } from 'element-plus'
import { testMessagePush } from '@/api/messagePush'

const dialogVisible = ref(false)
const dialogTitle = ref('测试发送')
const loading = ref(false)
const formRef = ref()
const currentId = ref<number>()
const currentName = ref('')
const currentCode = ref('')

const formData = reactive({
  title: '测试发送',
  content: '这是一条来自消息推送管理模块的测试消息。'
})

const formRules = {
  content: [{ required: true, message: '请输入测试消息内容', trigger: 'blur' }]
}

const channelSummary = computed(() => `当前渠道：${currentName.value || '-'}（${currentCode.value || '-'}）`)

const open = (row: { id: number; name: string; code: string }) => {
  dialogVisible.value = true
  currentId.value = row.id
  currentName.value = row.name
  currentCode.value = row.code
  formData.title = '测试发送'
  formData.content = '这是一条来自消息推送管理模块的测试消息。'
}

const submitForm = async () => {
  const form = unref(formRef)
  if (!form || !currentId.value) return

  await form.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await testMessagePush(currentId.value!, {
        title: String(formData.title || '').trim(),
        content: String(formData.content || '').trim()
      })
      ElMessage.success('测试消息已发送')
      dialogVisible.value = false
    } finally {
      loading.value = false
    }
  })
}

defineExpose({ open })
</script>
