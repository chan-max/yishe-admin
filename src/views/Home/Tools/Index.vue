<template>
  <div class="tools-page">
    <header class="tools-header">
      <h1 class="tools-header__title">{{ t('home.tools.title') }}</h1>
    </header>

    <section class="tools-section" aria-labelledby="tools-downloads-heading">
      <div class="tools-section__head">
        <h2 id="tools-downloads-heading" class="tools-section__title">{{ t('home.tools.download') }}</h2>
      </div>

      <div class="tools-grid">
        <article
          v-for="item in downloadCards"
          :key="item.key"
          class="tools-card"
          :class="{ 'is-disabled': !item.actions.some((action) => action.downloadUrl) }"
        >
          <div class="tools-card__top">
            <span class="tools-card__icon" aria-hidden="true">
              <Icon :icon="item.icon" />
            </span>
            <el-tag
              size="small"
              effect="plain"
              round
              :type="item.actions.some((action) => action.downloadUrl) ? 'success' : 'info'"
            >
              {{ item.actions.some((action) => action.downloadUrl) ? t('home.tools.available') : t('home.tools.unconfigured') }}
            </el-tag>
          </div>

          <div class="tools-card__headline">
            <span class="tools-card__title">{{ t(item.title) }}</span>
            <span class="tools-card__platform">{{ t(item.platform) }}</span>
          </div>

          <p class="tools-card__desc">{{ t(item.description) }}</p>

          <div class="tools-card__actions">
            <el-button
              v-for="action in item.actions"
              :key="action.key"
              type="primary"
              round
              :disabled="!action.downloadUrl"
              @click="handleDownload(action.downloadUrl)"
            >
              {{ t(action.label) }}
            </el-button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Icon } from "@/components/Icon";

defineOptions({ name: "ToolsIndex" });

const { t } = useI18n()

interface DownloadCard {
  key: string;
  title: string;
  platform: string;
  description: string;
  icon: string;
  actions: Array<{
    key: string;
    label: string;
    downloadUrl: string;
  }>;
}

const downloadCards: DownloadCard[] = [
  {
    key: "client-unified",
    title: "home.tools.client.title",
    platform: "home.tools.client.platform",
    description: "home.tools.client.description",
    icon: "ep:monitor",
    actions: [
      {
        key: "windows",
        label: "home.tools.client.windowsInstaller",
        downloadUrl:
          "https://github.com/1s-design/yishe-client/releases/latest/download/yishe-client.exe",
      },
      {
        key: "macos",
        label: "home.tools.client.macosInstaller",
        downloadUrl:
          "https://github.com/1s-design/yishe-client/releases/latest/download/yishe-client.dmg",
      },
    ],
  },
  {
    key: "chrome-extension",
    title: "home.tools.extension.title",
    platform: "home.tools.extension.platform",
    description: "home.tools.extension.description",
    icon: "mdi:puzzle",
    actions: [
      {
        key: "extension-zip",
        label: "home.tools.extension.zip",
        downloadUrl:
          "https://github.com/1s-design/yishe-extensions/releases/latest/download/yishe-extensions.zip",
      },
    ],
  },
];

function handleDownload(downloadUrl: string) {
  if (!downloadUrl) return;
  window.open(downloadUrl, "_blank", "noopener");
}
</script>

<style scoped lang="scss">
.tools-page {
  display: flex;
  width: 100%;
  padding: 4px 0 16px;
  box-sizing: border-box;
  flex-direction: column;
  gap: 18px;
}

.tools-header {
  padding: 8px 0 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color) 45%, transparent 55%);
}

.tools-header__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

.tools-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tools-section__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 12px;
}

.tools-section__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
}

.tools-grid {
  display: grid;
  width: 100%;

  /* auto-fit 收起空列，1fr 均分剩余宽度，行内卡片拉满整行 */
  gap: clamp(12px, 1.4vw, 18px);
  grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 360px));
  justify-content: start;
}

.tools-card {
  display: flex;
  padding: 16px 17px;
  background: color-mix(in srgb, var(--el-bg-color) 97%, transparent 3%);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 52%, transparent 48%);
  border-radius: 16px;
  box-shadow: 0 6px 20px rgb(15 23 42 / 5%);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  flex-direction: column;
  gap: 10px;

  &:hover:not(.is-disabled) {
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color) 80%);
    box-shadow: 0 10px 28px rgb(15 23 42 / 7%);
  }

  &.is-disabled {
    opacity: 0.75;
  }
}

.tools-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 30px;
}

.tools-card__icon {
  display: inline-flex;
  width: 36px;
  height: 36px;
  font-size: 17px;
  color: var(--el-text-color-primary);
  background: color-mix(in srgb, var(--el-fill-color-light) 82%, transparent 18%);
  border-radius: 11px;
  align-items: center;
  justify-content: center;
}

.tools-card__headline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
}

.tools-card__title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
}

.tools-card__platform {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--el-color-primary);
}

.tools-card__desc {
  display: -webkit-box;
  min-height: 3.1em;
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.tools-card__actions {
  display: flex;
  padding-top: 4px;
  margin-top: auto;
  flex-wrap: wrap;
  gap: 10px;
}

.tools-card__actions :deep(.el-button) {
  min-height: 38px;
  padding: 0 18px;
  font-weight: 600;
  border-radius: 12px;
}
</style>
