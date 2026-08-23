<template>
  <ImageEngineCollectView
    pluginKey="bing"
    title="必应图片 控制台"
    eyebrow="必应图片 (全球高清摄影与设计素材)"
    placeholder="例如: landscape, architecture, cute cat, poster..."
    accentColor="#008373"
  />
</template>

<script setup lang="ts">
import ImageEngineCollectView from '../components/ImageEngineCollectView.vue'

defineOptions({ name: 'ExternalBing' })
</script>
