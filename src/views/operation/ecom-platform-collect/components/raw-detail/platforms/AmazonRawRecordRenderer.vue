<template>
  <GenericPlatformRawRenderer
    :record="record"
    platform-label="Amazon"
    :title-paths="['detailData.title', 'title', 'listingData.title', 'pageTitle', 'productName', 'name']"
    :subtitle-paths="['detailData.brand', 'brand', 'detailData.ratingText', 'ratingText', 'detailData.shopName', 'shopName', 'sellerName']"
    :price-paths="['detailData.priceText', 'priceText', 'listingData.priceText', 'price', 'priceCurrent', 'currentPrice']"
    :image-paths="['detailData.imageUrls', 'imageUrls', 'detailData.imageUrl', 'imageUrl', 'listingData.imageUrl', 'images', 'image', 'thumbnail']"
    :detail-fields="detailFields"
  />
</template>

<script setup lang="ts">
import type { EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import GenericPlatformRawRenderer from "../GenericPlatformRawRenderer.vue";

defineProps<{ record: EcomPlatformRawRecord }>();

const detailFields = [
  { label: "ASIN", paths: ["detailData.asin", "asin", "recordKey"] },
  { label: "关键词", paths: ["keyword"] },
  { label: "页码", paths: ["pageNo"] },
  { label: "详情抓取状态", paths: ["detailFetchStatus"] },
  { label: "详情抓取错误", paths: ["detailFetchError"] },
  { label: "品牌", paths: ["detailData.brand", "brand"] },
  { label: "卖家", paths: ["detailData.sellerName", "sellerName", "detailData.shopName", "shopName"] },
  { label: "评分", paths: ["detailData.ratingText", "ratingText", "badgeText"] },
  { label: "评论数", paths: ["detailData.reviewCountText", "reviewCountText"] },
  { label: "库存状态", paths: ["detailData.availabilityText", "availabilityText"] },
  { label: "配送信息", paths: ["detailData.deliveryText", "deliveryText"] },
  { label: "列表价格", paths: ["listingData.priceText"] },
  { label: "详情价格", paths: ["detailData.priceText", "priceText"] },
  { label: "划线价", paths: ["detailData.originalPriceText", "originalPriceText"] },
  { label: "面包屑", paths: ["detailData.breadcrumbText", "breadcrumbText"] },
  { label: "要点", paths: ["detailData.bulletPointsText", "bulletPointsText"] },
  { label: "规格摘要", paths: ["detailData.specSummaryText", "specSummaryText"] },
  { label: "商家信息", paths: ["detailData.merchantInfoText", "merchantInfoText"] },
  { label: "列表标题", paths: ["listingData.title"] },
  { label: "卡片摘要", paths: ["listingData.cardText", "cardText"] },
  { label: "详情描述", paths: ["detailData.descriptionText", "descriptionText"] },
];
</script>
