<template>
  <div class="tools-page">
    <header class="tools-header">
      <h1 class="tools-header__title">工具</h1>
    </header>

    <section class="tools-section" aria-labelledby="tools-downloads-heading">
      <div class="tools-section__head">
        <h2 id="tools-downloads-heading" class="tools-section__title">下载</h2>
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
              {{ item.actions.some((action) => action.downloadUrl) ? "可用" : "未配置" }}
            </el-tag>
          </div>

          <div class="tools-card__headline">
            <span class="tools-card__title">{{ item.title }}</span>
            <span class="tools-card__platform">{{ item.platform }}</span>
          </div>

          <p class="tools-card__desc">{{ item.description }}</p>

          <div class="tools-card__actions">
            <el-button
              v-for="action in item.actions"
              :key="action.key"
              type="primary"
              round
              :disabled="!action.downloadUrl"
              @click="handleDownload(action.downloadUrl)"
            >
              {{ action.label }}
            </el-button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@/components/Icon";

defineOptions({ name: "ToolsIndex" });

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
    title: "YiShe 客户端",
    platform: "Windows / macOS",
    description:
      "统一版客户端，浏览器自动化已内置，直接下载对应系统安装包即可。",
    icon: "ep:monitor",
    actions: [
      {
        key: "windows",
        label: "Windows 安装包",
        downloadUrl:
          "https://github.com/1s-design/yishe-client/releases/latest/download/yishe-client.exe",
      },
      {
        key: "macos",
        label: "macOS 安装包",
        downloadUrl:
          "https://github.com/1s-design/yishe-client/releases/latest/download/yishe-client.dmg",
      },
    ],
  },
  {
    key: "chrome-extension",
    title: "YiShe 浏览器插件",
    platform: "Chrome / Edge",
    description: "下载后解压，在扩展页通过“加载已解压的扩展程序”导入即可。",
    icon: "mdi:puzzle",
    actions: [
      {
        key: "extension-zip",
        label: "插件 zip",
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
  flex-direction: column;
  gap: 18px;
  padding: 4px 0 16px;
  width: 100%;
  box-sizing: border-box;
}

.tools-header {
  padding: 8px 0 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color) 45%, transparent 55%);
}

.tools-header__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
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
  flex-direction: column;
  gap: 10px;
  padding: 16px 17px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 52%, transparent 48%);
  background: color-mix(in srgb, var(--el-bg-color) 97%, transparent 3%);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover:not(.is-disabled) {
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color) 80%);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.07);
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
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: color-mix(in srgb, var(--el-fill-color-light) 82%, transparent 18%);
  color: var(--el-text-color-primary);
  font-size: 17px;
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
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}

.tools-card__platform {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  line-height: 1.25;
}

.tools-card__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 3.1em;
}

.tools-card__actions {
  margin-top: auto;
  padding-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tools-card__actions :deep(.el-button) {
  font-weight: 600;
  min-height: 38px;
  padding: 0 18px;
  border-radius: 12px;
}
</style>
