<template>
  <GenericPlatformRawRenderer
    :record="record"
    platform-label="AliExpress"
    :title-paths="['title', 'pageTitle', 'productName', 'name']"
    :subtitle-paths="['subtitle', 'badgeText', 'shopName', 'sellerName']"
    :price-paths="['priceText', 'price', 'salePrice', 'discountPrice']"
    :image-paths="['imageUrls', 'images', 'mainImage', 'image', 'imageUrl']"
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
  { label: "店铺", paths: ["shopName", "sellerName"] },
  { label: "徽标", paths: ["badgeText"] },
  { label: "原始链接", paths: ["originalSourceUrl"] },
  { label: "卡片摘要", paths: ["cardText"] },
];
</script>
