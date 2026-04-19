<template>
  <div class="ai-assistant-page">
    <AiAssistantSurface />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const AiAssistantSurface = defineAsyncComponent(
  () => import("@/components/AiAssistant/AiAssistantSurface.vue"),
);

defineOptions({
  name: "AiAssistantPage",
});
</script>

<style scoped>
.ai-assistant-page {
  --ai-assistant-page-height: calc(
    100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-content-padding) - var(--app-content-padding)
  );
  height: var(--ai-assistant-page-height);
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.ai-assistant-page > * {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

@media (max-width: 768px) {
  .ai-assistant-page {
    --ai-assistant-page-height: calc(
      100vh - var(--top-tool-height) - var(--app-content-padding) - var(--app-content-padding)
    );
  }
}
</style>
