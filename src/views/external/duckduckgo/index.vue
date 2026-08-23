<template>
  <ImageEngineCollectView
    pluginKey="duckduckgo"
    title="DuckDuckGo 控制台"
    eyebrow="DuckDuckGo (国际化隐私图搜)"
    placeholder="例如: vintage art, poster, coffee, nature..."
    accentColor="#DE5833"
  />
</template>

<script setup lang="ts">
import ImageEngineCollectView from '../components/ImageEngineCollectView.vue'

defineOptions({ name: 'ExternalDuckDuckGo' })
</script>
