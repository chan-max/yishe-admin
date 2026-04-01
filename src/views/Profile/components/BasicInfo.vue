<template>
  <section class="settings-panel settings-panel--main">
    <div class="settings-panel__title">{{ t('profile.info.basicInfo') }}</div>

    <div class="profile-summary">
      <div class="profile-summary__avatar">
        <UserAvatar :img="avatar" />
        <div class="profile-summary__tip">支持修改头像地址</div>
      </div>

      <div class="profile-summary__main">
        <div class="profile-summary__name-row">
          <div class="profile-summary__name">{{ displayName }}</div>
          <span class="profile-summary__badge">{{ roleLabel }}</span>
        </div>
        <div class="profile-summary__sub">{{ accountText }}</div>

        <div class="profile-summary__meta">
          <div class="profile-summary__meta-item">
            <span class="profile-summary__meta-label">用户简称</span>
            <span class="profile-summary__meta-value">{{ shortNameText }}</span>
          </div>
          <div class="profile-summary__meta-item">
            <span class="profile-summary__meta-label">所属公司</span>
            <span class="profile-summary__meta-value">{{ companyText }}</span>
          </div>
          <div class="profile-summary__meta-item">
            <span class="profile-summary__meta-label">账号状态</span>
            <span class="profile-summary__meta-value">{{ expireText }}</span>
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

        <el-form-item label="头像地址" prop="avatar">
          <el-input v-model="formData.avatar" placeholder="请输入头像地址" />
        </el-form-item>
      </div>

      <div class="profile-form__readonly">
        <div class="profile-form__readonly-item">
          <span class="profile-form__readonly-label">登录账号</span>
          <span class="profile-form__readonly-value">{{ accountText }}</span>
        </div>
        <div class="profile-form__readonly-item">
          <span class="profile-form__readonly-label">用户类型</span>
          <span class="profile-form__readonly-value">{{ roleLabel }}</span>
        </div>
      </div>

      <div class="profile-form__actions">
        <XButton :title="t('common.save')" type="primary" @click="submit" />
        <XButton :title="t('common.reset')" @click="init" />
      </div>
    </el-form>
  </section>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { getUserInfo, updateUser } from '@/api/user'
import { useUserStore } from '@/store/modules/user'
import UserAvatar from './UserAvatar.vue'

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
    await updateUser({ ...profile.value, ...formData })
    userStore.setUserAvatarAction(formData.avatar || '')
    message.success(t('common.updateSuccess'))
    await init()
  })
}

onMounted(init)
</script>

<style scoped lang="scss">
.settings-panel {
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-bg-color);
}

.settings-panel--main {
  padding: 18px;
}

.settings-panel__title {
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.profile-summary {
  display: flex;
  gap: 18px;
  padding: 18px;
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.profile-summary__avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.profile-summary__tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-summary__main {
  min-width: 0;
  flex: 1;
}

.profile-summary__name-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.profile-summary__name {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.profile-summary__badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  border: 1px solid var(--el-border-color-light);
}

.profile-summary__sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.profile-summary__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.profile-summary__meta-item {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.profile-summary__meta-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-summary__meta-value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.profile-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 16px;
}

.profile-form__readonly {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding-top: 4px;
}

.profile-form__readonly-item {
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.profile-form__readonly-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-form__readonly-value {
  display: block;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.profile-form__actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 18px;
}

@media (max-width: 900px) {
  .profile-summary {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-summary__meta,
  .profile-form__grid,
  .profile-form__readonly {
    grid-template-columns: 1fr;
  }
}
</style>
