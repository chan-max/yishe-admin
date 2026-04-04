<template>
  <GenericPlatformRawRenderer
    :record="record"
    platform-label="淘宝"
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
  { label: "品牌", paths: ["brand", "brandName"] },
  { label: "销量", paths: ["salesText", "soldText"] },
  { label: "优惠", paths: ["promotionText", "couponText"] },
  { label: "服务", paths: ["serviceText", "shippingText"] },
  { label: "标签", paths: ["tags", "badges"] },
];
</script>
