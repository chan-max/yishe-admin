<template>
  <GenericPlatformRawRenderer
    :record="record"
    :platform-label="t('operation.platformTiktokShop')"
    :title-paths="['title', 'productName', 'name']"
    :subtitle-paths="['shopName', 'sellerName', 'authorName']"
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
  { label: t('operation.sales'), paths: ["salesText", "soldText"] },
  { label: t('operation.rating'), paths: ["rating", "ratingText"] },
  { label: t('operation.commissionOrCampaign'), paths: ["promotionText", "campaignText"] },
  { label: t('operation.tags'), paths: ["tags", "badges"] },
  { label: t('operation.shipFrom'), paths: ["shipFrom", "location"] },
];
</script>
