<template>
  <GenericPlatformRawRenderer
    :record="record"
    :platform-label="t('operation.platformAmazon')"
    :title-paths="['detailData.title', 'title', 'listingData.title', 'pageTitle', 'productName', 'name']"
    :subtitle-paths="['detailData.brand', 'brand', 'detailData.ratingText', 'ratingText', 'detailData.shopName', 'shopName', 'sellerName']"
    :price-paths="['detailData.priceText', 'priceText', 'listingData.priceText', 'price', 'priceCurrent', 'currentPrice']"
    :image-paths="['detailData.imageUrls', 'imageUrls', 'detailData.imageUrl', 'imageUrl', 'listingData.imageUrl', 'images', 'image', 'thumbnail']"
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
  { label: t('operation.asin'), paths: ["detailData.asin", "asin", "recordKey"] },
  { label: t('operation.keyword'), paths: ["keyword"] },
  { label: t('operation.pageNo'), paths: ["pageNo"] },
  { label: t('operation.detailFetchStatus'), paths: ["detailFetchStatus"] },
  { label: t('operation.detailFetchError'), paths: ["detailFetchError"] },
  { label: t('operation.brand'), paths: ["detailData.brand", "brand"] },
  { label: t('operation.seller'), paths: ["detailData.sellerName", "sellerName", "detailData.shopName", "shopName"] },
  { label: t('operation.rating'), paths: ["detailData.ratingText", "ratingText", "badgeText"] },
  { label: t('operation.reviewCount'), paths: ["detailData.reviewCountText", "reviewCountText"] },
  { label: t('operation.availabilityStatus'), paths: ["detailData.availabilityText", "availabilityText"] },
  { label: t('operation.deliveryInfo'), paths: ["detailData.deliveryText", "deliveryText"] },
  { label: t('operation.listingPrice'), paths: ["listingData.priceText"] },
  { label: t('operation.detailPrice'), paths: ["detailData.priceText", "priceText"] },
  { label: t('operation.originalPrice'), paths: ["detailData.originalPriceText", "originalPriceText"] },
  { label: t('operation.breadcrumb'), paths: ["detailData.breadcrumbText", "breadcrumbText"] },
  { label: t('operation.bulletPoints'), paths: ["detailData.bulletPointsText", "bulletPointsText"] },
  { label: t('operation.specSummary'), paths: ["detailData.specSummaryText", "specSummaryText"] },
  { label: t('operation.merchantInfo'), paths: ["detailData.merchantInfoText", "merchantInfoText"] },
  { label: t('operation.listingTitle'), paths: ["listingData.title"] },
  { label: t('operation.cardSummary'), paths: ["listingData.cardText", "cardText"] },
  { label: t('operation.detailDescription'), paths: ["detailData.descriptionText", "descriptionText"] },
];
</script>
