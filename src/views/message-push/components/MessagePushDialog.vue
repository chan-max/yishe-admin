<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="渠道名称" prop="name">
            <el-input v-model="formData.name" placeholder="例如：运营告警群" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="推送平台" prop="platform">
            <el-select v-model="formData.platform" class="w-full">
              <el-option label="飞书" value="feishu" />
              <el-option label="企业微信" value="wecom" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="启用状态">
            <el-switch v-model="formData.enabled" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="Webhook" prop="webhookUrl">
            <el-input
              v-model="formData.webhookUrl"
              type="textarea"
              :rows="3"
              placeholder="请输入完整 webhook 地址"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="Secret">
            <el-input
              v-model="formData.secret"
              placeholder="飞书签名机器人可填写，企业微信可留空"
              show-password
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              placeholder="补充说明这个渠道的用途"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">确定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref, unref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createMessagePush,
  getMessagePushDetail,
  updateMessagePush,
  type MessagePushConfig
} from '@/api/messagePush'

const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formRef = ref()

const createFormData = (): MessagePushConfig => ({
  name: '',
  platform: 'feishu',
  webhookUrl: '',
  secret: '',
  enabled: true,
  remark: ''
})

const formData = reactive<MessagePushConfig>({
  ...createFormData()
})

const formRules = {
  name: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
  platform: [{ required: true, message: '请选择推送平台', trigger: 'change' }],
  webhookUrl: [{ required: true, message: '请输入 webhook 地址', trigger: 'blur' }]
}

const resetForm = () => {
  Object.assign(formData, createFormData(), { id: undefined })
}

const open = async (id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = id ? '编辑推送渠道' : '新增推送渠道'
  resetForm()

  if (!id) return

  formLoading.value = true
  try {
    const data = await getMessagePushDetail(id)
    Object.assign(formData, {
      ...createFormData(),
      ...data,
      secret: data.secret || '',
      remark: data.remark || ''
    })
  } finally {
    formLoading.value = false
  }
}

const submitForm = async () => {
  const form = unref(formRef)
  if (!form) return

  await form.validate(async (valid) => {
    if (!valid) return

    formLoading.value = true
    try {
      const payload: MessagePushConfig = {
        ...formData,
        name: String(formData.name || '').trim(),
        webhookUrl: String(formData.webhookUrl || '').trim(),
        secret: String(formData.secret || '').trim(),
        remark: String(formData.remark || '').trim(),
        enabled: Boolean(formData.enabled)
      }

      if (payload.id) {
        await updateMessagePush(payload.id, payload)
        ElMessage.success('修改成功')
      } else {
        await createMessagePush(payload)
        ElMessage.success('新增成功')
      }

      dialogVisible.value = false
      emit('success')
    } finally {
      formLoading.value = false
    }
  })
}

defineExpose({ open })
</script>
