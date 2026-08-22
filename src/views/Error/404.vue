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
  box-sizing: border-box;
  width: 100%;
  min-height: calc(100vh - var(--top-tool-height, 0px) - var(--tags-view-height, 0px));
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--app-content-bg-color, var(--el-bg-color-page, #f5f7fa));
  overflow: hidden;
}

.error-404-card {
  box-sizing: border-box;
  width: min(100%, 460px);
  padding: 40px 32px 36px;
  text-align: center;
  background: var(--el-bg-color-overlay, var(--el-bg-color, #fff));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.error-404-code {
  margin-bottom: 6px;
  font-size: clamp(56px, 10vw, 88px);
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
  line-height: 1.6;
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
    padding: 16px;
  }

  .error-404-card {
    padding: 32px 20px 24px;
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
