<template>
  <GenericPlatformRawRenderer
    :record="record"
    :platform-label="t('operation.platformTaobao')"
    :title-paths="['title', 'productName', 'name']"
    :subtitle-paths="['shopName', 'sellerName', 'brand']"
    :price-paths="['priceText', 'price', 'discountPrice', 'salePrice']"
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
  { label: t('operation.sales'), paths: ["salesText", "soldText"] },
  { label: t('operation.discount'), paths: ["promotionText", "couponText"] },
  { label: t('operation.service'), paths: ["serviceText", "shippingText"] },
  { label: t('operation.tags'), paths: ["tags", "badges"] },
];
</script>
