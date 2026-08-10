<template>
  <el-form ref="formRef" :model="password" :rules="rules" label-position="top" class="password-form">
    <div class="password-form__grid">
      <el-form-item :label="t('profile.password.newPassword')" prop="newPassword">
        <InputPassword v-model="password.newPassword" strength />
      </el-form-item>
      <el-form-item :label="t('profile.password.confirmPassword')" prop="confirmPassword">
        <InputPassword v-model="password.confirmPassword" strength />
      </el-form-item>
    </div>
    <div class="password-form__actions">
      <XButton :title="t('common.save')" type="primary" @click="submit(formRef)" />
      <XButton :title="t('common.reset')" @click="reset(formRef)" />
    </div>
  </el-form>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import { updateUserPassword } from '@/api/user'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'ResetPwd' })

const { t } = useI18n()
const message = useMessage()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const password = reactive({
  newPassword: '',
  confirmPassword: ''
})

const equalToPassword = (_rule, value, callback) => {
  if (password.newPassword !== value) {
    callback(new Error(t('profile.password.diffPwd')))
  } else {
    callback()
  }
}

const rules = reactive<FormRules>({
  newPassword: [
    { required: true, message: t('profile.password.newPwdMsg'), trigger: 'blur' },
    { min: 6, max: 20, message: t('profile.password.pwdRules'), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: t('profile.password.cfPwdMsg'), trigger: 'blur' },
    { required: true, validator: equalToPassword, trigger: 'blur' }
  ]
})

const submit = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate(async (valid) => {
    if (valid) {
      await updateUserPassword({
        id: userStore.user.id,
        newPassword: password.newPassword
      })
      message.success(t('common.updateSuccess'))
      reset(formEl)
    }
  })
}

const reset = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}
</script>

<style scoped lang="scss">
.password-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.password-form__actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 8px;
}

@media (width <= 900px) {
  .password-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
