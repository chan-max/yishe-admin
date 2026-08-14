<template>
  <div class="login-card">
    <div class="login-card__shell">
      <div class="login-card__inner">
        <div class="login-card__illustration">
          <slot name="illustration">
            <LoginIllustration />
          </slot>
        </div>
        <div class="login-card__panel">
          <slot name="form">
            <LoginForm />
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginIllustration from './LoginIllustration.vue'
import { LoginForm } from './index'

defineOptions({ name: 'LoginCard' })
</script>

<style lang="scss" scoped>
.login-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  &__shell {
    width: min(1100px, 85vw);
    height: min(620px, 82vh);
    min-width: 1000px;
    min-height: 580px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 32px;
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 80px rgba(99, 91, 255, 0.18);
  }

  &__inner {
    display: flex;
    width: 100%;
    height: 100%;
    background: #ffffff;
    border-radius: 24px;
    overflow: hidden;
  }

  &__illustration {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 55%;
    height: 100%;
    background: linear-gradient(135deg, #faf9ff 0%, #f0edff 100%);
    overflow: hidden;
  }

  &__panel {
    width: 45%;
    min-width: 420px;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

// Dark mode
:global(html.dark) {
  .login-card {
    &__shell {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.1);
    }

    &__inner {
      background: #1e1e2e;
    }

    &__illustration {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
  }
}

// Tablet
@media (max-width: 1200px) {
  .login-card {
    &__shell {
      width: 90vw;
      min-width: auto;
      height: auto;
      min-height: 500px;
      border-radius: 24px;
    }

    &__inner {
      border-radius: 18px;
    }

    &__illustration {
      width: 40%;
      
      :deep(svg) {
        width: 280px;
        height: 280px;
      }
    }

    &__panel {
      width: 60%;
      min-width: 320px;
    }
  }
}

// Mobile
@media (max-width: 768px) {
  .login-card {
    &__shell {
      width: 100%;
      min-width: auto;
      height: auto;
      min-height: auto;
      padding: 8px;
      border-radius: 20px;
    }

    &__inner {
      border-radius: 16px;
    }

    &__illustration {
      display: none;
    }

    &__panel {
      width: 100%;
      min-width: auto;
    }
  }
}
</style>
