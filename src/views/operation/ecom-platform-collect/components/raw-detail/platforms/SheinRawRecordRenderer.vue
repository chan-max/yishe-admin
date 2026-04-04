<template>
  <GenericPlatformRawRenderer
    :record="record"
    platform-label="SHEIN"
    :title-paths="['title', 'pageTitle', 'productName', 'name']"
    :subtitle-paths="['descriptionText', 'pageTitle', 'shopName', 'sellerName']"
    :price-paths="['priceText', 'price', 'salePrice', 'currentPrice']"
    :image-paths="['imageUrls', 'images', 'mainImage', 'image', 'imageUrl']"
    :image-exclude-patterns="['prime_twitter', 'prime_pinterest', 'prime_facebook']"
    :image-limit="10"
    :detail-fields="detailFields"
  />
</template>

<script setup lang="ts">
import type { EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import GenericPlatformRawRenderer from "../GenericPlatformRawRenderer.vue";

defineProps<{ record: EcomPlatformRawRecord }>();

const detailFields = [
  { label: "页面标题", paths: ["pageTitle"] },
  { label: "店铺", paths: ["shopName", "sellerName"] },
  { label: "描述", paths: ["descriptionText"] },
];
</script>
