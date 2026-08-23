<template>
  <ImageEngineCollectView
    pluginKey="unsplash"
    title="Unsplash 摄影 控制台"
    eyebrow="Unsplash (全球顶级生活美学与商业摄影)"
    placeholder="例如: coffee, interior, architecture, portrait, nature..."
    accentColor="#111111"
  />
</template>

<script setup lang="ts">
import ImageEngineCollectView from '../components/ImageEngineCollectView.vue'

defineOptions({ name: 'ExternalUnsplash' })
</script>
