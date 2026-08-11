<template>
  <SchemaDrivenRawRecordRenderer :record="record" :catalog="catalog" />
</template>

<script setup lang="ts">
import type { EcomPlatformCollectCatalog, EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import SchemaDrivenRawRecordRenderer from "./SchemaDrivenRawRecordRenderer.vue";

defineProps<{
  record: EcomPlatformRawRecord;
  catalog: EcomPlatformCollectCatalog;
}>();
</script>
