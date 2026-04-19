<template>
  <StyleProvider hash-priority="high">
    <ConfigProvider :theme="antdThemeConfig">
      <XProvider>
        <div class="ai-assistant-surface is-page" :style="panelCssVars">
          <AiAssistantPanel />
        </div>
      </XProvider>
    </ConfigProvider>
  </StyleProvider>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { ConfigProvider } from "ant-design-vue";
import { StyleProvider, XProvider } from "ant-design-x-vue";
import { useAiAssistantTheme } from "./useAiAssistantTheme";

defineOptions({ name: "AiAssistantSurface" });

const AiAssistantPanel = defineAsyncComponent(() => import("./AiAssistantPanel.vue"));

const { antdThemeConfig, panelCssVars } = useAiAssistantTheme();
</script>

<style lang="scss" scoped>
.ai-assistant-surface {
  height: 100%;
  min-height: 0;
  background: var(--ai-page-bg);

  &.is-page {
    display: flex;
    width: 100%;
    min-width: 0;
    min-height: 0;
  }

  &.is-page > * {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
