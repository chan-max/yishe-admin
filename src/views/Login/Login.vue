<template>
  <main class="login-page">
    <!-- Left: Brand Illustration Panel -->
    <aside class="login-art-panel" aria-label="品牌插画区域">
      <div class="login-art-bg login-art-bg--1"></div>
      <div class="login-art-bg login-art-bg--2"></div>
      <div class="login-art-illust">
        <LoginIllustration />
      </div>
      <div class="login-art-slogan" aria-label="智能、高效、协作">
        <span>智能</span>
        <i aria-hidden="true" />
        <span>高效</span>
        <i aria-hidden="true" />
        <span>协作</span>
      </div>
    </aside>

    <!-- Right: Form Panel -->
    <section class="login-form-pane" aria-labelledby="login-title">
      <div class="login-brand">
        <img :src="logo" alt="1s Design" class="login-brand__logo" />
        <div class="login-brand__text">
          <p class="login-brand__name">1s Design</p>
          <p class="login-brand__title">智能设计助手</p>
        </div>
      </div>

      <div class="login-form-content">
        <h1 id="login-title" class="login-heading">{{ t('login.welcome') }}</h1>

        <LoginForm />
        <MobileForm />
        <QrCodeForm />
        <RegisterForm />
        <SSOLoginVue />
        <ForgetPasswordForm />
      </div>

      <footer class="login-footer">衣设系统 · 1s Design</footer>
    </section>
  </main>
</template>

<script lang="ts" setup>
import {
  LoginForm,
  MobileForm,
  QrCodeForm,
  RegisterForm,
  SSOLoginVue,
  ForgetPasswordForm,
  LoginIllustration
} from './components'
import logo from '@/assets/imgs/logo.png'

defineOptions({ name: 'Login' })

const { t } = useI18n()
</script>

<style lang="scss" scoped>
.login-page {
  --el-bg-color-overlay: var(--app-content-surface-color);
  --el-fill-color-light: var(--app-content-surface-muted-color);
  --el-text-color-primary: var(--el-text-color-regular);
  position: relative;
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 37%);
  overflow: hidden;
  background: var(--app-content-bg-color);
  color: var(--el-text-color-primary);
}

.login-art-panel {
  position: relative;
  min-width: 0;
  z-index: 1;
  overflow: hidden;
  border-top-right-radius: clamp(6px, 0.8vw, 10px);
  border-bottom-right-radius: clamp(6px, 0.8vw, 10px);
  corner-shape: squircle;
  background: linear-gradient(150deg, #faf8ff 0%, #f1edff 55%, #e7e0ff 100%);
  color: var(--el-color-primary);
}

.login-art-bg {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;

  &--1 {
    top: -16%;
    right: -8%;
    width: 520px;
    height: 520px;
    background: radial-gradient(circle, rgba(99, 91, 255, 0.16) 0%, transparent 62%);
  }

  &--2 {
    bottom: -14%;
    left: -6%;
    width: 460px;
    height: 460px;
    background: radial-gradient(circle, rgba(255, 200, 87, 0.14) 0%, transparent 60%);
  }
}

.login-art-illust {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.login-art-slogan {
  position: absolute;
  bottom: clamp(24px, 4vh, 48px);
  left: clamp(24px, 4vw, 54px);
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;

  i {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.56;
  }
}

// Right panel
.login-form-pane {
  display: flex;
  min-width: 0;
  min-height: 100vh;
  align-items: stretch;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(28px, 6vh, 56px) clamp(26px, 3.5vw, 52px) 22px;
  background: var(--app-content-bg-color);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;

  &__logo {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    object-fit: contain;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &__name {
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.1;
  }

  &__title {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.2;
  }
}

.login-form-content {
  display: flex;
  width: min(100%, 400px);
  flex: 1;
  flex-direction: column;
  justify-content: center;
  margin: 0 auto;
}

.login-heading {
  margin: 0 0 16px;
  color: var(--el-text-color-regular);
  font-size: clamp(22px, 1.65vw, 27px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.16;
}

.login-footer {
  width: min(100%, 400px);
  margin: 0 auto;
  color: var(--el-text-color-placeholder);
  font-size: 9px;
  font-weight: 550;
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

// Dark mode
:global(html.dark) {
  .login-art-panel {
    background: linear-gradient(150deg, #141122 0%, #191332 55%, #150f2e 100%);
  }

  .login-art-bg {
    &--1 {
      background: radial-gradient(circle, rgba(124, 115, 255, 0.2) 0%, transparent 62%);
    }

    &--2 {
      background: radial-gradient(circle, rgba(255, 200, 87, 0.08) 0%, transparent 60%);
    }
  }

  .login-art-slogan {
    color: #a5b4fc;
  }
}

// Mobile: hide illustration, single column
@media (max-width: 860px) {
  .login-page {
    grid-template-columns: minmax(0, 1fr);
  }

  .login-form-pane {
    align-items: center;
    padding: 28px 22px 22px;
  }

  .login-brand {
    width: min(100%, 400px);
  }

  .login-heading {
    margin-bottom: 36px;
  }

  .login-footer {
    margin-top: 40px;
  }

  .login-art-panel {
    display: none;
  }
}

@media (max-height: 680px) and (min-width: 861px) {
  .login-form-pane {
    padding-top: 32px;
    padding-bottom: 24px;
  }

  .login-heading {
    margin-bottom: 40px;
  }
}
</style>