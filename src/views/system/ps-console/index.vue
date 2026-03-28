<template>
  <ContentWrap :plain="true">
    <PsConsolePanel />
  </ContentWrap>
</template>

<script lang="ts" setup>
import PsConsolePanel from '@/components/PsConsolePanel/index.vue'

defineOptions({ name: 'SystemPsConsole' })
</script>
