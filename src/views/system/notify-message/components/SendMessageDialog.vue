<template>
  <el-dialog v-model="dialogVisible" title="发送消息" width="600px" destroy-on-close>
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="submitting"
    >
      <el-form-item label="接收人" prop="receiverIds">
        <el-select
          v-model="formData.receiverIds"
          multiple
          filterable
          remote
          reserve-keyword
          placeholder="选择或搜索用户..."
          :remote-method="searchUsers"
          :loading="userLoading"
          style="width: 100%"
          @focus="loadInitialUsers"
        >
          <el-option
            v-for="user in userOptions"
            :key="user.id"
            :label="`${user.name || user.account} (${user.account})`"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="5"
          placeholder="请输入消息内容"
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitForm">发送</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, unref } from 'vue'
import { ElMessage } from 'element-plus'
import { sendDirectNotifyMessage } from '@/api/system/notify/message'
import { getUserPage, type UserVO } from '@/api/system/user'

const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref()
const userLoading = ref(false)
const userOptions = ref<UserVO[]>([])

interface SendMessageFormData {
  receiverIds: number[]
  title: string
  content: string
}

const createFormData = (): SendMessageFormData => ({
  receiverIds: [],
  title: '',
  content: ''
})

const formData = reactive<SendMessageFormData>(createFormData())

const formRules = {
  receiverIds: [{ required: true, message: '请选择接收人', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入消息内容', trigger: 'blur' }]
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

const searchUsers = (keyword: string) => {
  if (searchTimer) clearTimeout(searchTimer)

  if (!keyword || !keyword.trim()) {
    userOptions.value = []
    return
  }

  searchTimer = setTimeout(async () => {
    userLoading.value = true
    try {
      const res: any = await getUserPage({ currentPage: 1, pageSize: 20, name: keyword.trim() } as any)
      userOptions.value = res?.data?.list || res?.list || []
    } catch (e) {
      userOptions.value = []
    } finally {
      userLoading.value = false
    }
  }, 300)
}

const loadInitialUsers = async () => {
  if (userOptions.value.length > 0) return
  userLoading.value = true
  try {
    const res: any = await getUserPage({ currentPage: 1, pageSize: 50 } as any)
    userOptions.value = res?.data?.list || res?.list || []
  } catch {
    userOptions.value = []
  } finally {
    userLoading.value = false
  }
}

const resetForm = () => {
  Object.assign(formData, createFormData())
  userOptions.value = []
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
}

const open = () => {
  resetForm()
  dialogVisible.value = true
}

const submitForm = async () => {
  const form = unref(formRef)
  if (!form) return

  await form.validate(async (valid: boolean) => {
    if (!valid) return

    submitting.value = true
    try {
      await sendDirectNotifyMessage({
        receiverIds: formData.receiverIds,
        title: formData.title.trim(),
        content: formData.content.trim()
      })
      ElMessage.success('发送成功')
      dialogVisible.value = false
      emit('success')
    } finally {
      submitting.value = false
    }
  })
}

defineExpose({ open })
</script>
