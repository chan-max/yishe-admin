<template>
  <GenericPlatformRawRenderer
    :record="record"
    :platform-label="t('operation.platformShein')"
    :title-paths="['title', 'pageTitle', 'productName', 'name']"
    :subtitle-paths="['descriptionText', 'pageTitle', 'shopName', 'sellerName']"
    :price-paths="['priceText', 'price', 'salePrice', 'currentPrice']"
    :image-paths="['imageUrls', 'images', 'mainImage', 'image', 'imageUrl']"
    :image-exclude-patterns="['prime_twitter', 'prime_pinterest', 'prime_facebook']"
    :image-limit="10"
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
  { label: t('operation.pageTitle'), paths: ["pageTitle"] },
  { label: t('operation.shop'), paths: ["shopName", "sellerName"] },
  { label: t('operation.description'), paths: ["descriptionText"] },
];
</script>
