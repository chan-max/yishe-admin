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
import { useI18n } from 'vue-i18n';
import type { EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import GenericPlatformRawRenderer from "../GenericPlatformRawRenderer.vue";
import { getRawPlatform } from "../../../shared";

const { t } = useI18n();

const props = defineProps<{
  record: EcomPlatformRawRecord;
  platformLabel?: string;
}>();

const platformLabel = computed(() => props.platformLabel || getRawPlatform(props.record) || t('operation.platformData'));

const detailFields = [
  { label: t('operation.shopOrSeller'), paths: ["shopName", "sellerName", "brand"] },
  { label: t('operation.price'), paths: ["priceText", "price", "salePrice", "currentPrice"] },
  { label: t('operation.sales'), paths: ["salesText", "soldText", "orderCount"] },
  { label: t('operation.rating'), paths: ["rating", "ratingText"] },
  { label: t('operation.tags'), paths: ["tags", "badges"] },
  { label: t('operation.additionalNotes'), paths: ["descriptionText", "summaryText"] },
];
</script>
