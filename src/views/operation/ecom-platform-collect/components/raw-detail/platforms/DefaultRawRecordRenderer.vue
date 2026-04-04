<template>
  <GenericPlatformRawRenderer
    :record="record"
    :platform-label="platformLabel"
    :title-paths="['title', 'productName', 'name', 'pageTitle']"
    :subtitle-paths="['shopName', 'sellerName', 'brand', 'descriptionText']"
    :price-paths="['priceText', 'price', 'salePrice', 'currentPrice']"
    :image-paths="['imageUrls', 'images', 'image', 'imageUrl', 'thumbnail']"
    :detail-fields="detailFields"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import GenericPlatformRawRenderer from "../GenericPlatformRawRenderer.vue";

const props = defineProps<{
  record: EcomPlatformRawRecord;
  platformLabel?: string;
}>();

const platformLabel = computed(() => props.platformLabel || props.record.platform || "平台数据");

const detailFields = [
  { label: "店铺/卖家", paths: ["shopName", "sellerName", "brand"] },
  { label: "价格", paths: ["priceText", "price", "salePrice", "currentPrice"] },
  { label: "销量", paths: ["salesText", "soldText", "orderCount"] },
  { label: "评分", paths: ["rating", "ratingText"] },
  { label: "标签", paths: ["tags", "badges"] },
  { label: "附加说明", paths: ["descriptionText", "summaryText"] },
];
</script>
