<template>
  <GenericPlatformRawRenderer
    :record="record"
    :platform-label="t('operation.platformTemu')"
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
  { label: t('operation.discount'), paths: ["discountText", "promotionText"] },
  { label: t('operation.sales'), paths: ["salesText", "soldText"] },
  { label: t('operation.rating'), paths: ["rating", "ratingText"] },
  { label: t('operation.tags'), paths: ["tags", "badges"] },
  { label: t('operation.delivery'), paths: ["shippingText", "deliveryText"] },
];
</script>
