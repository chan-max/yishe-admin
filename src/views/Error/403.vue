<template>
  <div class="forbidden-page">
    <div class="forbidden-card">
      <div class="forbidden-code">403</div>
      <div class="forbidden-title">无权限</div>
      <div class="forbidden-actions">
        <el-button type="primary" plain @click="goBack">返回</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'Error403' })

const router = useRouter()
const { push } = router

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  push('/home/index')
}
</script>

<style scoped lang="less">
.forbidden-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  box-sizing: border-box;
  background: var(--app-content-bg-color);
}

.forbidden-card {
  width: min(420px, 100%);
  padding: 44px 32px 32px;
  border-radius: 16px;
  background: var(--app-content-surface-color);
  border: 1px solid var(--app-content-border-color);
  box-shadow: var(--app-content-shadow);
  text-align: center;
}

.forbidden-code {
  font-size: 56px;
  line-height: 1;
  font-weight: 600;
  color: var(--el-color-primary);
  letter-spacing: -1px;
}

.forbidden-title {
  margin-top: 16px;
  font-size: 20px;
  line-height: 1.5;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.forbidden-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

@media (max-width: 640px) {
  .forbidden-card {
    padding: 36px 24px 28px;
  }

  .forbidden-code {
    font-size: 48px;
  }

  .forbidden-title {
    font-size: 18px;
  }
}
</style>
