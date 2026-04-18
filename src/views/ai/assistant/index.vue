<template>
  <ContentWrap :plain="true">
    <AiAssistantPanel mode="page" />
  </ContentWrap>
</template>

<script setup lang="ts">
import AiAssistantPanel from '@/components/AiAssistant/AiAssistantPanel.vue'

defineOptions({
  name: 'AiAssistantPage'
})
</script>
