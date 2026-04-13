<template>
  <div class="tools-page">
    <header class="tools-header">
      <h1 class="tools-header__title">工具</h1>
      <p class="tools-header__desc">客户端与插件安装包集中入口；点击下方按钮在新窗口下载。</p>
    </header>

    <section class="tools-section" aria-labelledby="tools-downloads-heading">
      <div class="tools-section__head">
        <h2 id="tools-downloads-heading" class="tools-section__title">下载</h2>
        <p class="tools-section__meta">未配置链接的项将保持灰色不可用。</p>
      </div>

      <div class="tools-grid">
        <article
          v-for="item in downloadCards"
          :key="item.key"
          class="tools-card"
          :class="{ 'is-disabled': !item.downloadUrl }"
        >
          <div class="tools-card__top">
            <span class="tools-card__icon" aria-hidden="true">
              <Icon :icon="item.icon" />
            </span>
            <el-tag size="small" effect="plain" round :type="item.downloadUrl ? 'success' : 'info'">
              {{ item.downloadUrl ? "可用" : "未配置" }}
            </el-tag>
          </div>

          <div class="tools-card__headline">
            <span class="tools-card__title">{{ item.title }}</span>
            <span class="tools-card__platform">{{ item.platform }}</span>
          </div>

          <p class="tools-card__desc">{{ item.description }}</p>

          <div class="tools-card__actions">
            <el-button
              type="primary"
              round
              :disabled="!item.downloadUrl"
              @click="handleDownload(item.downloadUrl)"
            >
              {{ item.actionText }}
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
  actionText: string;
  downloadUrl: string;
  icon: string;
}

const downloadCards: DownloadCard[] = [
  {
    key: "client-windows",
    title: "客户端",
    platform: "Windows",
    description: "与服务端长连接，桥接浏览器自动化与桌面能力。",
    actionText: "Windows 安装包",
    downloadUrl:
      "https://github.com/1s-design/yishe-client/releases/latest/download/yishe-client.exe",
    icon: "ep:monitor",
  },
  {
    key: "client-macos",
    title: "客户端",
    platform: "macOS",
    description: "与服务端长连接，桥接浏览器自动化与桌面能力。",
    actionText: "macOS 安装包",
    downloadUrl:
      "https://github.com/1s-design/yishe-client/releases/latest/download/yishe-client.dmg",
    icon: "mdi:apple",
  },
  {
    key: "client-windows-with-plugins",
    title: "客户端（内置插件）",
    platform: "Windows",
    description: "内置浏览器自动化端，并额外包含 PS 自动化端，适合一体化安装。",
    actionText: "Windows 一体包",
    downloadUrl:
      "https://github.com/1s-design/yishe-client/releases/latest/download/yishe-client-with-plugins.exe",
    icon: "ep:box",
  },
  {
    key: "client-macos-with-plugins",
    title: "客户端（内置插件）",
    platform: "macOS",
    description: "内置浏览器自动化端，适合一体化安装。",
    actionText: "macOS 一体包",
    downloadUrl:
      "https://github.com/1s-design/yishe-client/releases/latest/download/yishe-client-with-plugins.dmg",
    icon: "mdi:apple-keyboard-command",
  },
  {
    key: "ps-automation",
    title: "PS 自动化端",
    platform: "Windows",
    description: "Photoshop 桥接与相关自动化任务。",
    actionText: "PS 端",
    downloadUrl:
      "https://github.com/1s-design/yishe-ps/releases/latest/download/yishe-ps-windows.exe",
    icon: "ep:set-up",
  },
  {
    key: "browser-automation",
    title: "浏览器自动化端",
    platform: "Windows",
    description: "独立承接浏览器自动化，与客户端解耦。",
    actionText: "Windows 包",
    downloadUrl:
      "https://github.com/1s-design/yishe-auto-browser/releases/latest/download/yishe-auto-browser-windows.exe",
    icon: "ep:connection",
  },
  {
    key: "browser-automation-macos",
    title: "浏览器自动化端",
    platform: "macOS",
    description: "独立承接浏览器自动化，与客户端解耦。",
    actionText: "macOS 包",
    downloadUrl:
      "https://github.com/1s-design/yishe-auto-browser/releases/latest/download/yishe-auto-browser-mac",
    icon: "mdi:apple",
  },
  {
    key: "chrome-extension",
    title: "YiShe 浏览器插件",
    platform: "Chrome / Edge",
    description: "解压后于扩展页「加载已解压的扩展程序」导入。",
    actionText: "插件 zip",
    downloadUrl:
      "https://github.com/1s-design/yishe-extensions/releases/latest/download/yishe-extensions.zip",
    icon: "mdi:puzzle",
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

.tools-header__desc {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
  max-width: 48rem;
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

.tools-section__meta {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  line-height: 1.45;
}

.tools-grid {
  display: grid;
  width: 100%;
  /* auto-fit 收起空列，1fr 均分剩余宽度，行内卡片拉满整行 */
  gap: clamp(12px, 1.4vw, 18px);
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
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
}

.tools-card__actions :deep(.el-button) {
  font-weight: 600;
  min-height: 38px;
  padding: 0 18px;
  border-radius: 12px;
}
</style>
