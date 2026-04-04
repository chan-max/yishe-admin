<template>
  <GenericPlatformRawRenderer
    :record="record"
    platform-label="TikTok Shop"
    :title-paths="['title', 'productName', 'name']"
    :subtitle-paths="['shopName', 'sellerName', 'authorName']"
    :price-paths="['priceText', 'price', 'salePrice', 'currentPrice']"
    :image-paths="['imageUrls', 'images', 'cover', 'image', 'imageUrl']"
    :detail-fields="detailFields"
  />
</template>

<script setup lang="ts">
import type { EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import GenericPlatformRawRenderer from "../GenericPlatformRawRenderer.vue";

defineProps<{ record: EcomPlatformRawRecord }>();

const detailFields = [
  { label: "店铺", paths: ["shopName", "sellerName"] },
  { label: "销量", paths: ["salesText", "soldText"] },
  { label: "评分", paths: ["rating", "ratingText"] },
  { label: "佣金/活动", paths: ["promotionText", "campaignText"] },
  { label: "标签", paths: ["tags", "badges"] },
  { label: "发货地", paths: ["shipFrom", "location"] },
];
</script>
