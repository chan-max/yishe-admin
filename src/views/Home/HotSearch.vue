<template>
  <ContentWrap :plain="true">
    <div class="hotsearch-placeholder">
      <el-empty description="热搜采集功能待开发">
        <div class="hotsearch-placeholder__tips">
          该功能正在重新设计中，后续版本将开放多平台热搜采集与工作流节点能力。
        </div>
      </el-empty>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";

defineOptions({ name: "HotSearch" });
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
