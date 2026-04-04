<template>
  <GenericPlatformRawRenderer
    :record="record"
    platform-label="Amazon"
    :title-paths="['title', 'pageTitle', 'productName', 'name']"
    :subtitle-paths="['subtitle', 'badgeText', 'shopName', 'sellerName']"
    :price-paths="['priceText', 'price', 'priceCurrent', 'currentPrice']"
    :image-paths="['imageUrls', 'images', 'image', 'imageUrl', 'thumbnail']"
    :detail-fields="detailFields"
  />
</template>

<script setup lang="ts">
import type { EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import GenericPlatformRawRenderer from "../GenericPlatformRawRenderer.vue";

defineProps<{ record: EcomPlatformRawRecord }>();

const detailFields = [
  { label: "关键词", paths: ["keyword"] },
  { label: "页码", paths: ["pageNo"] },
  { label: "评分标签", paths: ["badgeText"] },
  { label: "店铺", paths: ["shopName", "sellerName"] },
  { label: "卡片摘要", paths: ["cardText"] },
];
</script>
