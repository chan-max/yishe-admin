<template>
  <div class="raw-json-detail">
    <section class="raw-json-detail__section">
      <div class="raw-json-detail__actions">
        <el-button type="primary" plain @click="jsonDialogVisible = true">
          查看完整 JSON
        </el-button>
        <el-button plain @click="snapshotDialogVisible = true">
          查看执行截图
          <span v-if="snapshots.length" class="raw-json-detail__action-count">({{ snapshots.length }})</span>
        </el-button>
      </div>
    </section>

    <el-dialog
      v-model="jsonDialogVisible"
      title="完整 JSON"
      width="80vw"
      append-to-body
      destroy-on-close
      class="raw-json-detail__dialog"
    >
      <JsonPrettyViewer
        :value="collectData"
        :deep="8"
        :show-double-quotes="false"
        :show-length="true"
        class="raw-json-detail__json-viewer"
      />
    </el-dialog>

    <el-dialog
      v-model="snapshotDialogVisible"
      title="执行截图"
      width="80vw"
      append-to-body
      destroy-on-close
      class="raw-json-detail__dialog"
    >
      <div v-if="snapshots.length" class="raw-json-detail__snapshot-grid">
        <div
          v-for="snapshot in snapshots"
          :key="`${snapshot.url || snapshot.path || snapshot.key || ''}`"
          class="raw-json-detail__snapshot-card"
        >
          <el-image
            v-if="snapshot.url"
            :src="snapshot.url"
            fit="cover"
            preview-teleported
            :preview-src-list="snapshotUrls"
            class="raw-json-detail__snapshot-image"
          />
          <div v-else class="raw-json-detail__snapshot-placeholder">本地截图未上传</div>
          <div class="raw-json-detail__snapshot-meta">
            <div>{{ snapshot.label || "截图" }}</div>
            <div v-if="snapshot.key" class="mono">{{ snapshot.key }}</div>
            <div v-else-if="snapshot.path" class="mono">{{ snapshot.path }}</div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无执行截图" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { EcomPlatformCollectCatalog, EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";
import JsonPrettyViewer from "@/components/JsonPrettyViewer.vue";
import { normalizeSnapshotItems } from "./helpers";

const props = defineProps<{
  record: EcomPlatformRawRecord;
  catalog: EcomPlatformCollectCatalog;
}>();

const collectData = computed(() =>
  props.record?.collectData && typeof props.record.collectData === "object"
    ? props.record.collectData
    : {},
);

const snapshots = computed(() => normalizeSnapshotItems(props.record.snapshotData || collectData.value));
const snapshotUrls = computed(() =>
  snapshots.value
    .map((item) => String(item.url || "").trim())
    .filter(Boolean),
);

const jsonDialogVisible = ref(false);
const snapshotDialogVisible = ref(false);
</script>

<style scoped lang="scss">
.raw-json-detail__section {
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.raw-json-detail__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.raw-json-detail__action-count {
  margin-left: 4px;
}

.raw-json-detail__snapshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.raw-json-detail__snapshot-card {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.raw-json-detail__snapshot-image {
  width: 100%;
  height: 160px;
}

.raw-json-detail__snapshot-placeholder {
  display: flex;
  height: 160px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  align-items: center;
  justify-content: center;
}

.raw-json-detail__snapshot-meta {
  display: flex;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  word-break: break-word;
  flex-direction: column;
  gap: 6px;
}

:deep(.raw-json-detail__dialog .el-dialog__body) {
  max-height: 70vh;
  overflow: auto;
}
</style>
