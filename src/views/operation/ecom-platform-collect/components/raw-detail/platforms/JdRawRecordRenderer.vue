<template>
  <GenericPlatformRawRenderer
    :record="record"
    platform-label="京东"
    :title-paths="['title', 'productName', 'name']"
    :subtitle-paths="['shopName', 'sellerName', 'brand']"
    :price-paths="['priceText', 'price', 'jdPrice', 'salePrice']"
    :image-paths="['imageUrls', 'images', 'mainImage', 'image', 'imageUrl']"
    :detail-fields="detailFields"
  />
</template>

<script setup lang="ts">
import type { EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import GenericPlatformRawRenderer from "../GenericPlatformRawRenderer.vue";

defineProps<{ record: EcomPlatformRawRecord }>();

const detailFields = [
  { label: "店铺", paths: ["shopName", "sellerName"] },
  { label: "品牌", paths: ["brand", "brandName"] },
  { label: "评论数", paths: ["commentCount", "reviewCount"] },
  { label: "好评率", paths: ["goodRate", "positiveRate"] },
  { label: "促销", paths: ["promotionText", "couponText"] },
  { label: "配送", paths: ["deliveryText", "shippingText"] },
];
</script>
