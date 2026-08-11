<template>
  <GenericPlatformRawRenderer
    :record="record"
    :platform-label="t('operation.platformDouyinShop')"
    :title-paths="['title', 'productName', 'name']"
    :subtitle-paths="['shopName', 'authorName', 'sellerName']"
    :price-paths="['priceText', 'price', 'salePrice', 'currentPrice']"
    :image-paths="['imageUrls', 'images', 'cover', 'image', 'imageUrl']"
    :detail-fields="detailFields"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import GenericPlatformRawRenderer from "../GenericPlatformRawRenderer.vue";

const { t } = useI18n();

defineProps<{ record: EcomPlatformRawRecord }>();

const detailFields = [
  { label: t('operation.shop'), paths: ["shopName", "sellerName"] },
  { label: t('operation.author'), paths: ["authorName", "anchorName"] },
  { label: t('operation.sales'), paths: ["salesText", "soldText"] },
  { label: t('operation.rating'), paths: ["rating", "ratingText"] },
  { label: t('operation.promotion'), paths: ["promotionText", "couponText"] },
  { label: t('operation.deliveryOrRegion'), paths: ["deliveryText", "location"] },
];
</script>
