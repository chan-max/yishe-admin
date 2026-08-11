<template>
  <GenericPlatformRawRenderer
    :record="record"
    :platform-label="t('operation.platformAliexpress')"
    :title-paths="['title', 'pageTitle', 'productName', 'name']"
    :subtitle-paths="['subtitle', 'badgeText', 'shopName', 'sellerName']"
    :price-paths="['priceText', 'price', 'salePrice', 'discountPrice']"
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
  { label: t('operation.keyword'), paths: ["keyword"] },
  { label: t('operation.pageNo'), paths: ["pageNo"] },
  { label: t('operation.shop'), paths: ["shopName", "sellerName"] },
  { label: t('operation.badge'), paths: ["badgeText"] },
  { label: t('operation.originalLink'), paths: ["originalSourceUrl"] },
  { label: t('operation.cardSummary'), paths: ["cardText"] },
];
</script>
