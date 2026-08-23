<template>
  <ImageEngineCollectView
    pluginKey="flickr"
    title="Flickr 摄影社区 控制台"
    eyebrow="Flickr (全球摄影师社区与自由商用大图)"
    placeholder="例如: street photography, vintage, wildlife, portrait..."
    accentColor="#FF0084"
  />
</template>

<script setup lang="ts">
import ImageEngineCollectView from '../components/ImageEngineCollectView.vue'

defineOptions({ name: 'ExternalFlickr' })
</script>
