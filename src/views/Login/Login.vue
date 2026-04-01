<template>
  <div
    :class="prefixCls"
    class="relative h-[100%] lt-md:px-10px lt-sm:px-10px lt-xl:px-10px lt-xl:px-10px"
  >
    <div class="relative mx-auto h-full flex">
      <div
        :class="`${prefixCls}__left flex-1 bg-[#6900ff] bg-opacity-20 relative p-30px lt-xl:hidden overflow-x-hidden overflow-y-auto`"
      >
        <!-- 左上角的 logo + 系统标题 -->
        <div class="relative flex items-center text-white">
          <img alt="" class="mr-10px h-48px w-48px" src="@/assets/imgs/logo.png" style="object-fit:contain;"/>
          <span class="text-20px font-bold">{{ underlineToHump(appStore.getTitle) }}</span>
        </div>
        <!-- 左边的背景图 + 欢迎语 -->
        <div class="h-[calc(100%-60px)] flex items-center justify-center">
          <img key="1" alt="" class="w-200px" src="@/assets/svgs/login-box-bg.png" />
        </div>
      </div>
      <div
        class="relative flex flex-1 flex-col overflow-y-auto px-20px py-20px sm:px-40px md:px-60px dark:bg-[var(--login-bg-color)]"
      >
        <!-- 右上角的主题、语言选择 -->
        <div
          class="flex items-center justify-between xl:justify-end shrink-0"
          style="color: var(--el-text-color-primary);"
        >
          <div class="flex items-center xl:hidden">
            <img alt="" class="mr-10px h-32px w-32px" src="@/assets/imgs/logo.png" style="object-fit:contain;"/>
            <span class="text-18px font-bold" >{{ underlineToHump(appStore.getTitle) }}</span>
          </div>
          <div class="flex items-center gap-15px">
            <ThemeSwitch />
            <LocaleDropdown />
          </div>
        </div>
        <!-- 右边的登录界面 -->
        <div class="flex-1 flex items-center justify-center py-20px">
          <Transition appear enter-active-class="animate__animated animate__bounceInRight">
            <div
              class="w-full max-w-320px"
            >
              <!-- 账号登录 -->
              <LoginForm class="p-10px lt-xl:(rounded-3xl light:bg-white)" />
              <!-- 手机登录 -->
              <MobileForm class="p-10px lt-xl:(rounded-3xl light:bg-white)" />
              <!-- 二维码登录 -->
              <QrCodeForm class="p-10px lt-xl:(rounded-3xl light:bg-white)" />
              <!-- 注册 -->
              <RegisterForm class="p-10px lt-xl:(rounded-3xl light:bg-white)" />
              <!-- 三方登录 -->
              <SSOLoginVue class="p-10px lt-xl:(rounded-3xl light:bg-white)" />
              <!-- 忘记密码 -->
              <ForgetPasswordForm class="p-10px lt-xl:(rounded-3xl light:bg-white)" />
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { underlineToHump } from '@/utils'
import { useDesign } from '@/hooks/web/useDesign'
import { useAppStore } from '@/store/modules/app'
import { ThemeSwitch } from '@/layout/components/ThemeSwitch'
import { LocaleDropdown } from '@/layout/components/LocaleDropdown'
import { LoginForm, MobileForm, QrCodeForm, RegisterForm, SSOLoginVue, ForgetPasswordForm } from './components'

defineOptions({ name: 'Login' })

const appStore = useAppStore()
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('login')
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-login;

.#{$prefix-cls} {
  overflow: auto;

  &__left {
    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      background-image: url('@/assets/svgs/login-bg.svg');
      background-position: center;
      background-repeat: no-repeat;
      content: '';
    }
  }
}
</style>

<style lang="scss">
.dark .login-form {
  .el-divider__text {
    background-color: var(--login-bg-color);
  }

  .el-card {
    background-color: var(--login-bg-color);
  }
}
</style>

<style lang="scss">
.dark .login-form {
  .el-divider__text {
    background-color: var(--login-bg-color);
  }

  .el-card {
    background-color: var(--login-bg-color);
  }
}
</style>