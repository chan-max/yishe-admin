<template>
  <div class="personal-settings-page">
    <div class="personal-settings-page__header">
      <div>
        <h1 class="personal-settings-page__title">{{ t('common.profile') }}</h1>
        <p class="personal-settings-page__desc">{{ t('profile.page.desc') }}</p>
      </div>
    </div>

    <div class="personal-settings-page__content">
      <BasicInfo />
      <OpenApiSetting />
      <section class="settings-panel settings-panel--main">
        <div class="settings-panel__title">{{ t('profile.info.resetPwd') }}</div>
        <ResetPwd />
      </section>
    </div>  </div>
</template>
<script lang="ts" setup>
import { BasicInfo, OpenApiSetting, ResetPwd } from './components'

const { t } = useI18n()
defineOptions({ name: 'PersonalSettingsPage' })
</script>
<style scoped lang="scss">
.personal-settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.personal-settings-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 4px 2px;
}

.personal-settings-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.personal-settings-page__desc {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.personal-settings-page__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-panel {
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--app-content-shadow);
}

.settings-panel--main {
  padding: 24px;
}

.settings-panel__title {
  padding-bottom: 14px;
  margin-bottom: 22px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--app-content-border-color);
}

@media (width <= 960px) {
  .settings-panel--main {
    padding: 16px;
  }
}
</style>
