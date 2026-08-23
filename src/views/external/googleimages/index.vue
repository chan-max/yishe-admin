<template>
  <ImageEngineCollectView
    pluginKey="googleimages"
    title="谷歌图片 控制台"
    eyebrow="谷歌图片 (全球综合检索与精准语义匹配)"
    placeholder="例如: modern architecture, artwork, landscape, vintage..."
    accentColor="#4285F4"
  />
</template>

<script setup lang="ts">
import ImageEngineCollectView from '../components/ImageEngineCollectView.vue'

defineOptions({ name: 'ExternalGoogleImages' })
</script>
