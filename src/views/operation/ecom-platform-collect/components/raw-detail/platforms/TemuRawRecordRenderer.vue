<template>
  <GenericPlatformRawRenderer
    :record="record"
    platform-label="Temu"
    :title-paths="['title', 'productName', 'name']"
    :subtitle-paths="['shopName', 'sellerName', 'brand']"
    :price-paths="['priceText', 'price', 'discountPrice', 'salePrice']"
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
  { label: "折扣", paths: ["discountText", "promotionText"] },
  { label: "销量", paths: ["salesText", "soldText"] },
  { label: "评分", paths: ["rating", "ratingText"] },
  { label: "标签", paths: ["tags", "badges"] },
  { label: "配送", paths: ["shippingText", "deliveryText"] },
];
</script>
