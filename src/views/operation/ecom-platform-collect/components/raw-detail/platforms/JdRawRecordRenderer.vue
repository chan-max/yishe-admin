<template>
  <GenericPlatformRawRenderer
    :record="record"
    :platform-label="t('operation.platformJd')"
    :title-paths="['title', 'productName', 'name']"
    :subtitle-paths="['shopName', 'sellerName', 'brand']"
    :price-paths="['priceText', 'price', 'jdPrice', 'salePrice']"
    :image-paths="['imageUrls', 'images', 'mainImage', 'image', 'imageUrl']"
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
  { label: t('operation.brand'), paths: ["brand", "brandName"] },
  { label: t('operation.commentCount'), paths: ["commentCount", "reviewCount"] },
  { label: t('operation.positiveRate'), paths: ["goodRate", "positiveRate"] },
  { label: t('operation.promotion'), paths: ["promotionText", "couponText"] },
  { label: t('operation.delivery'), paths: ["deliveryText", "shippingText"] },
];
</script>
