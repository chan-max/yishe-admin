<template>
  <ContentWrap :plain="true">
    <div class="hotsearch-placeholder">
      <el-empty :description="t('home.hotSearch.developing')">
        <div class="hotsearch-placeholder__tips">
          {{ t('home.hotSearch.tips') }}
        </div>
      </el-empty>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";

defineOptions({ name: "HotSearch" });

const { t } = useI18n()
</script>

<style scoped lang="scss">
.hotsearch-placeholder {
  display: flex;
  min-height: 60vh;
  align-items: center;
  justify-content: center;
}

.hotsearch-placeholder__tips {
  margin-top: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
