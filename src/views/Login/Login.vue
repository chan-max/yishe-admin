<template>
  <div class="login-page">
    <!-- Background decorations -->
    <div class="login-page__bg login-page__bg--1"></div>
    <div class="login-page__bg login-page__bg--2"></div>
    <div class="login-page__bg login-page__bg--3"></div>

    <!-- Brand area (left) -->
    <div class="login-page__brand">
      <div class="login-page__brand-inner">
        <div class="login-page__brand-logo">
          <img src="@/assets/imgs/logo.png" alt="logo" />
        </div>
        <div class="login-page__brand-text">
          <p class="login-page__brand-day">1s Design</p>
          <h1 class="login-page__brand-title">智能设计助手</h1>
        </div>
      </div>
    </div>

    <!-- Card area (right) -->
    <div class="login-page__card-wrapper">
      <!-- Outer glass shell -->
      <div class="login-page__shell">
        <!-- Inner white panel -->
        <div class="login-page__panel">
          <!-- Left: Illustration -->
          <div class="login-page__illustration">
            <LoginIllustration />
          </div>

          <!-- Right: Login Form -->
          <div class="login-page__form-area">
            <LoginForm />
            <MobileForm />
            <QrCodeForm />
            <RegisterForm />
            <SSOLoginVue />
            <ForgetPasswordForm />
          </div>
        </div>
      </div>
    </div>
  </div>
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

defineOptions({ name: 'Login' })
</script>

<style lang="scss" scoped>
.login-page {
  position: relative;
  display: flex;
  align-items: center;
  width: 100vw;
  height: 100vh;
  padding: 40px;
  overflow: hidden;
  background: linear-gradient(135deg, #635BFF 0%, #5548E8 50%, #7C73FF 100%);

  // Background decorations
  &__bg {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;

    &--1 {
      top: -12%;
      right: -6%;
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.13) 0%, transparent 60%);
    }

    &--2 {
      bottom: -8%;
      left: -4%;
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.09) 0%, transparent 60%);
    }

    &--3 {
      top: 35%;
      left: 28%;
      width: 350px;
      height: 350px;
      background: radial-gradient(circle, rgba(255, 200, 87, 0.1) 0%, transparent 60%);
    }
  }

  // Brand area (left)
  &__brand {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 35%;
    height: 100%;
    z-index: 2;
  }

  &__brand-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  &__brand-logo {
    img {
      width: 80px;
      height: 80px;
      object-fit: contain;
      border-radius: 16px;
    }
  }

  &__brand-text {
    text-align: center;
    color: #ffffff;
  }

  &__brand-day {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 0.05em;
    opacity: 0.9;
  }

  &__brand-title {
    margin: 8px 0 0;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  // Card area (right)
  &__card-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 65%;
    height: 100%;
    z-index: 2;
  }

  // Outer glass shell
  &__shell {
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(1000px, 80vw);
    height: min(580px, 78vh);
    min-width: 900px;
    min-height: 520px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 28px;
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 80px rgba(99, 91, 255, 0.18);
  }

  // Inner white panel
  &__panel {
    display: flex;
    width: 100%;
    height: 100%;
    background: #ffffff;
    border-radius: 20px;
    overflow: hidden;
  }

  // Left illustration area
  &__illustration {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52%;
    height: 100%;
    min-height: 380px;
    background: linear-gradient(135deg, #faf9ff 0%, #f0edff 100%);
    overflow: hidden;
  }

  // Right form area
  &__form-area {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 48%;
    min-width: 340px;
    height: 100%;
    overflow-y: auto;
  }
}

// Dark mode
:global(html.dark) {
  .login-page {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a40 100%);

    &__shell {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.1);
    }

    &__panel {
      background: #1e1e2e;
    }

    &__illustration {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
  }
}

// Tablet (768px - 1200px)
@media (max-width: 1200px) {
  .login-page {
    padding: 24px;

    &__brand {
      display: none;
    }

    &__card-wrapper {
      width: 100%;
    }

    &__shell {
      width: 90vw;
      min-width: auto;
      height: auto;
      min-height: 460px;
      max-height: 85vh;
      border-radius: 22px;
    }

    &__panel {
      border-radius: 16px;
    }

    &__illustration {
      width: 45%;
      min-height: 280px;
    }

    &__form-area {
      width: 55%;
      min-width: 280px;
    }
  }
}

// Mobile (<=768px)
@media (max-width: 768px) {
  .login-page {
    padding: 16px;
    align-items: flex-start;
    padding-top: 40px;
    overflow-y: auto;

    &__bg {
      display: none;
    }

    &__brand {
      display: none;
    }

    &__card-wrapper {
      width: 100%;
      height: auto;
      align-items: flex-start;
    }

    &__shell {
      width: 100%;
      min-width: auto;
      height: auto;
      min-height: auto;
      padding: 8px;
      border-radius: 18px;
    }

    &__panel {
      border-radius: 14px;
    }

    &__illustration {
      display: none;
    }

    &__form-area {
      width: 100%;
      min-width: auto;
    }
  }
}

// Very small mobile
@media (max-width: 375px) {
  .login-page {
    padding: 12px;
    padding-top: 24px;
  }
}
</style>

<!-- Shared form styles for all form variants -->
<style lang="scss">
.login-page__form-area {
  .login-form {
    padding: clamp(18px, 2.5vw, 36px);
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;

    :deep(.el-form-item) {
      margin-bottom: 14px;
    }

    :deep(.el-input__wrapper) {
      background: #F5F5FA;
      border: none;
      border-radius: 6px;
      box-shadow: none !important;
      padding: 0 12px;
    }

    :deep(.el-input__inner) {
      height: 44px;
      font-size: 13px;
      color: #1a1a2e;
    }

    :deep(.el-button--primary) {
      width: 100%;
      height: 44px;
      font-size: 13px;
      font-weight: 600;
      background: #635BFF;
      border: none;
      border-radius: 6px;
      margin-top: 6px;

      &:hover {
        background: #5146E5;
      }
    }
  }
}

:global(html.dark) {
  .login-page__form-area {
    .login-form {
      :deep(.el-input__wrapper) {
        background: #2a2a3e;
      }

      :deep(.el-input__inner) {
        color: #f0f0f5;
      }
    }
  }
}
</style>
