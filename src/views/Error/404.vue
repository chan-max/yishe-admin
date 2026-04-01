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
  background: linear-gradient(180deg, #fff 0%, #f7f8fa 100%);
}

.error-404-card {
  width: min(100%, 520px);
  padding: 40px 28px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  text-align: center;
}

.error-404-code {
  margin-bottom: 10px;
  font-size: clamp(56px, 10vw, 88px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--el-text-color-primary);
}

.error-404-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.error-404-desc {
  margin: 10px auto 0;
  max-width: 360px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.error-404-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
}

@media (max-width: 640px) {
  .error-404-page {
    padding: 20px 16px;
  }

  .error-404-card {
    padding: 32px 20px;
    border-radius: 12px;
  }

  .error-404-title {
    font-size: 20px;
  }

  .error-404-actions {
    flex-direction: column;
  }
}
</style>
