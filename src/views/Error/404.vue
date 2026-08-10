<template>
  <section class="error-404-page">
    <div class="error-404-card">
      <div class="error-404-code">404</div>
      <h1 class="error-404-title">页面不存在</h1>
      <p class="error-404-desc">{{ t('error.pageError') }}</p>

      <div class="error-404-actions">
        <ElButton type="primary" @click="push('/')">{{ t('error.returnToHome') }}</ElButton>
        <ElButton plain @click="back">返回上一页</ElButton>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
defineOptions({ name: 'Error404' })

const { t } = useI18n()
const router = useRouter()
const { push, back } = router
</script>

<style scoped lang="scss">
.error-404-page {
  display: flex;
  min-height: calc(100vh - 120px);
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  background: var(--app-content-bg-color, #f5f7fa);
}

.error-404-card {
  width: min(100%, 480px);
  padding: 48px 32px 40px;
  text-align: center;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 4%);
}

.error-404-code {
  margin-bottom: 8px;
  font-size: clamp(64px, 12vw, 96px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--el-text-color-primary);
  opacity: 0.12;
}

.error-404-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.error-404-desc {
  max-width: 320px;
  margin: 8px auto 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.error-404-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}

@media (width <= 640px) {
  .error-404-page {
    padding: 20px 16px;
  }

  .error-404-card {
    padding: 36px 20px 32px;
    border-radius: 10px;
  }

  .error-404-title {
    font-size: 18px;
  }

  .error-404-actions {
    flex-direction: column;
  }
}
</style>
