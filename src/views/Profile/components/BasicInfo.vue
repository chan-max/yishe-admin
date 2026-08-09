<template>
  <section class="settings-panel settings-panel--main">
    <div class="settings-panel__title">{{ t('profile.info.basicInfo') }}</div>

    <div class="profile-head">
      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        accept="image/*"
        :on-change="handleAvatarPick"
      >
        <div class="profile-avatar" :class="{ 'is-uploading': uploadingAvatar }">
          <el-avatar :src="avatar" :size="92">
            <Icon icon="ep:user" />
          </el-avatar>
          <span class="profile-avatar__mask">
            <Icon :icon="uploadingAvatar ? 'ep:loading' : 'ep:camera-filled'" :size="16" />
            <span>{{ uploadingAvatar ? '上传中' : '更换头像' }}</span>
          </span>
        </div>
      </el-upload>

      <div class="profile-head__info">
        <div class="profile-head__name-row">
          <span class="profile-head__name">{{ displayName }}</span>
          <span class="profile-head__badge">{{ roleLabel }}</span>
        </div>
        <div class="profile-head__sub">{{ accountText }}</div>

        <div class="profile-head__meta">
          <div class="profile-head__meta-item">
            <span class="profile-head__meta-label">用户简称</span>
            <span class="profile-head__meta-value">{{ shortNameText }}</span>
          </div>
          <div class="profile-head__meta-item">
            <span class="profile-head__meta-label">所属公司</span>
            <span class="profile-head__meta-value">{{ companyText }}</span>
          </div>
          <div class="profile-head__meta-item">
            <span class="profile-head__meta-label">账号状态</span>
            <span class="profile-head__meta-value">{{ expireText }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" class="profile-form">
      <div class="profile-form__grid">
        <el-form-item label="用户名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入用户名称" />
        </el-form-item>

        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号码" />
        </el-form-item>

        <el-form-item label="邮箱地址" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱地址" />
        </el-form-item>

        <el-form-item label="登录账号">
          <el-input :model-value="accountText" disabled />
        </el-form-item>
      </div>

      <div class="profile-form__actions">
        <XButton :title="t('common.save')" type="primary" @click="submit" />
        <XButton :title="t('common.reset')" @click="handleReset" />
      </div>
    </el-form>
  </section>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { getUserInfo, updateUser } from '@/api/user'
import { useUserStore } from '@/store/modules/user'
import { uploadToCOS, deleteCOSFile } from '@/api/cos'

defineOptions({ name: 'BasicInfo' })

const { t } = useI18n()
const message = useMessage()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const profile = ref<Record<string, any> | null>(null)
const formData = reactive<Record<string, any>>({
  id: '',
  account: '',
  name: '',
  shortName: '',
  phone: '',
  email: '',
  avatar: ''
})

const avatar = computed(() => formData.avatar || userStore.user.avatar || '')
const displayName = computed(() => formData.name || userStore.user.name || userStore.user.account || '-')
const accountText = computed(() => formData.account || userStore.user.account || '-')
const shortNameText = computed(() => formData.shortName || userStore.user.shortName || '-')
const companyText = computed(() => profile.value?.company?.name || userStore.user.company?.name || '未加入公司')
const roleLabel = computed(() => (userStore.user.isAdmin ? '管理员' : '普通成员'))
const expireText = computed(() => profile.value?.expireTime || userStore.user.expireTime || userStore.user.company?.expireTime || '长期有效')

// 头像上传
const uploadingAvatar = ref(false)
// 本次会话新上传、尚未落库的 COS key（未保存离开/重置时清理）
const uploadedCosKeys = ref<string[]>([])

// 仅提交 User 实体的合法字段，避免 shortName/company 等非列字段被 TypeORM 校验报错
const buildUpdatePayload = () => {
  const payload: Record<string, any> = {}
  for (const key of ['id', 'account', 'name', 'phone', 'email', 'avatar']) {
    if (formData[key] !== undefined) payload[key] = formData[key]
  }
  return payload
}

const cleanupAvatarFiles = async (keys: string[]) => {
  if (!keys.length) return
  await Promise.allSettled(keys.map((key) => deleteCOSFile(key)))
}

const handleAvatarPick = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    message.error('图片大小不能超过 5MB')
    return
  }

  const user = userStore.user

  uploadingAvatar.value = true
  try {
    const { url, key } = await uploadToCOS({
      file,
      category: 'avatar',
      account: user.account || user.shortName || 'user',
      userId: user.id
    })
    uploadedCosKeys.value.push(key)
    formData.avatar = url

    // 旧头像由后端在更新成功后自动删除（服务端兜底）
    await updateUser(buildUpdatePayload())
    userStore.setUserAvatarAction(url)

    uploadedCosKeys.value = []
    message.success('头像已更新')
    await init()
  } catch (e: any) {
    // 落库失败时清理刚上传的 COS 文件，避免孤儿文件
    await cleanupAvatarFiles(uploadedCosKeys.value)
    uploadedCosKeys.value = []
    message.error(e?.message || '头像上传失败')
  } finally {
    uploadingAvatar.value = false
  }
}

const handleReset = async () => {
  await cleanupAvatarFiles(uploadedCosKeys.value)
  uploadedCosKeys.value = []
  await init()
}

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入用户名称', trigger: 'blur' }],
  email: [
    { required: true, message: t('profile.rules.mail'), trigger: 'blur' },
    { type: 'email', message: t('profile.rules.truemail'), trigger: ['blur', 'change'] }
  ],
  phone: [
    { required: true, message: t('profile.rules.phone'), trigger: 'blur' },
    {
      pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
      message: t('profile.rules.truephone'),
      trigger: 'blur'
    }
  ]
})

const init = async () => {
  const res = await getUserInfo(String(userStore.user.id))
  profile.value = res
  formData.id = res.id || userStore.user.id || ''
  formData.account = res.account || userStore.user.account || ''
  formData.name = res.name || userStore.user.name || ''
  formData.shortName = res.shortName || userStore.user.shortName || ''
  formData.phone = res.phone || res.mobile || ''
  formData.email = res.email || ''
  formData.avatar = res.avatar || userStore.user.avatar || ''
  return res
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    await updateUser(buildUpdatePayload())
    userStore.setUserAvatarAction(formData.avatar || '')
    message.success(t('common.updateSuccess'))
    await init()
  })
}

onMounted(init)
</script>

<style scoped lang="scss">
.settings-panel {
  border-radius: 12px;
  background: var(--el-bg-color);
  box-shadow: var(--app-content-shadow);
}

.settings-panel--main {
  padding: 24px;
}

.settings-panel__title {
  padding-bottom: 14px;
  margin-bottom: 22px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--app-content-border-color);
}

.profile-head {
  display: flex;
  gap: 22px;
  align-items: center;
  margin-bottom: 26px;
}

.profile-avatar {
  position: relative;
  flex-shrink: 0;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;

  &.is-uploading {
    cursor: default;
    opacity: 0.7;
  }
}

.profile-avatar__mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.profile-avatar:hover .profile-avatar__mask,
.profile-avatar:focus-visible .profile-avatar__mask {
  opacity: 1;
}

.profile-head__info {
  min-width: 0;
  flex: 1;
}

.profile-head__name-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.profile-head__name {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.profile-head__badge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  font-size: 12px;
}

.profile-head__sub {
  margin-top: 5px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.profile-head__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px 32px;
  margin-top: 18px;
}

.profile-head__meta-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-head__meta-value {
  display: block;
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
  max-width: 760px;
}

.profile-form__actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

@media (max-width: 900px) {
  .profile-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-head__meta,
  .profile-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
