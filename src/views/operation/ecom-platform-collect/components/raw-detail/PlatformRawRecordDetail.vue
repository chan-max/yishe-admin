<template>
  <component :is="renderer" v-bind="rendererProps" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EcomPlatformCollectCatalog, EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import AmazonRawRecordRenderer from "./platforms/AmazonRawRecordRenderer.vue";
import TemuRawRecordRenderer from "./platforms/TemuRawRecordRenderer.vue";
import TiktokShopRawRecordRenderer from "./platforms/TiktokShopRawRecordRenderer.vue";
import DouyinShopRawRecordRenderer from "./platforms/DouyinShopRawRecordRenderer.vue";
import TaobaoRawRecordRenderer from "./platforms/TaobaoRawRecordRenderer.vue";
import JdRawRecordRenderer from "./platforms/JdRawRecordRenderer.vue";
import AliexpressRawRecordRenderer from "./platforms/AliexpressRawRecordRenderer.vue";
import SheinRawRecordRenderer from "./platforms/SheinRawRecordRenderer.vue";
import DefaultRawRecordRenderer from "./platforms/DefaultRawRecordRenderer.vue";
import { getPlatformLabel } from "../../shared";

const props = defineProps<{
  record: EcomPlatformRawRecord;
  catalog: EcomPlatformCollectCatalog;
}>();

const rendererMap: Record<string, any> = {
  amazon: AmazonRawRecordRenderer,
  temu: TemuRawRecordRenderer,
  tiktok_shop: TiktokShopRawRecordRenderer,
  douyin_shop: DouyinShopRawRecordRenderer,
  taobao: TaobaoRawRecordRenderer,
  jd: JdRawRecordRenderer,
  aliexpress: AliexpressRawRecordRenderer,
  shein: SheinRawRecordRenderer,
};

const renderer = computed(
  () => rendererMap[String(props.record.platform || "").trim()] || DefaultRawRecordRenderer,
);

const platformLabel = computed(() =>
  getPlatformLabel(props.catalog, props.record.platform),
);

const rendererProps = computed(() => {
  if (renderer.value === DefaultRawRecordRenderer) {
    return {
      record: props.record,
      platformLabel: platformLabel.value,
    };
  }

  return {
    record: props.record,
  };
});
</script>
