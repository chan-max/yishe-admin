<template>
  <GenericPlatformRawRenderer
    :record="record"
    platform-label="抖音店铺"
    :title-paths="['title', 'productName', 'name']"
    :subtitle-paths="['shopName', 'authorName', 'sellerName']"
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
  { label: "达人/作者", paths: ["authorName", "anchorName"] },
  { label: "销量", paths: ["salesText", "soldText"] },
  { label: "评分", paths: ["rating", "ratingText"] },
  { label: "活动", paths: ["promotionText", "couponText"] },
  { label: "发货/地区", paths: ["deliveryText", "location"] },
];
</script>
