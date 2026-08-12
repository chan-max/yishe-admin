<template>
  <div class="ai-assistant-page">
    <AiAssistant />
  </div>
</template>

<script setup lang="ts">
import AiAssistant from "@/components/AiAssistant/index.vue";

defineOptions({
  name: "AiAssistantPage",
});
</script>

<style scoped>
.ai-assistant-page {
  --ai-assistant-page-height: calc(
    100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-content-padding) -
      var(--app-content-padding)
  );

  display: flex;
  width: 100%;
  height: var(--ai-assistant-page-height);
  min-height: 0;
  overflow: hidden;
  /* 仅抵消父级 AppView 的左右 padding */
  margin-inline: calc(-1 * var(--app-content-padding));
  width: calc(100% + 2 * var(--app-content-padding));
}

.ai-assistant-page > * {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

@media (width <= 768px) {
  .ai-assistant-page {
    --ai-assistant-page-height: calc(
      100vh - var(--top-tool-height) - var(--app-content-padding) - var(--app-content-padding)
    );
  }
}
</style>
