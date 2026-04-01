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
    </div>
  </div>
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
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-bg-color);
}

.settings-panel--main {
  padding: 18px;
}

.settings-panel__title {
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

@media (max-width: 960px) {
  .settings-panel--main {
    padding: 16px;
  }
}
</style>
