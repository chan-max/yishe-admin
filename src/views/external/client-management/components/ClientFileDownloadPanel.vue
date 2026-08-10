<template>
  <div class="file-download-panel">
    <div class="input-row">
      <el-input
        v-model="url"
        placeholder="输入文件 URL"
        clearable
        size="small"
        @keyup.enter="handleDownload"
      />
      <el-button
        size="small"
        :loading="isChecking"
        :disabled="!url.trim() || isChecking"
        @click="handleCheck"
      >
        查询
      </el-button>
      <el-button
        type="primary"
        size="small"
        :loading="isDownloading"
        :disabled="!url.trim() || isDownloading"
        @click="handleDownload"
      >
        {{ isDownloading ? "下载中" : "下载" }}
      </el-button>
    </div>

    <!-- 查询结果 -->
    <div v-if="checkResult" class="result">
      <span>查询结果</span>
      <span :class="['status', checkResult.found ? 'ok' : 'err']">
        {{ checkResult.found ? "已缓存" : "未缓存" }}
      </span>
      <span v-if="checkResult.filePath" class="path" :title="checkResult.filePath">
        {{ checkResult.filePath }}
      </span>
      <span v-if="checkResult.fileSize" class="size">
        {{ formatFileSize(checkResult.fileSize) }}
      </span>
    </div>

    <!-- 下载结果 -->
    <div v-if="downloadResult" class="result">
      <span>下载结果</span>
      <span :class="['status', downloadResult.success ? 'ok' : 'err']">
        {{ downloadResult.success ? "成功" : "失败" }}
      </span>
      <span v-if="downloadResult.filePath" class="path" :title="downloadResult.filePath">
        {{ downloadResult.filePath }}
      </span>
      <span v-if="downloadResult.fileSize" class="size">
        {{ formatFileSize(downloadResult.fileSize) }}
      </span>
      <span class="msg">{{ downloadResult.message }}</span>
    </div>

    <!-- 历史记录 -->
    <div v-if="history.length" class="history">
      <div class="history-head">
        <span>记录</span>
        <el-button text size="small" type="danger" @click="history = []">清空</el-button>
      </div>
      <div class="history-list">
        <div v-for="(item, i) in history" :key="i" class="history-item">
          <span :class="['dot', item.success ? 'ok' : 'err']" />
          <span :class="['type-tag', `is-${item.type}`]">{{ item.type }}</span>
          <span class="url" :title="item.url">{{ item.url }}</span>
          <span v-if="item.filePath" class="path" :title="item.filePath">{{ item.filePath }}</span>
          <span v-if="item.fileSize" class="size">{{ formatFileSize(item.fileSize) }}</span>
          <span class="time">{{ formatTime(item.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { ClientControlService } from "@/services/clientControl";

const props = defineProps<{ clientId: string; clientName: string }>();

const url = ref("");
const isDownloading = ref(false);
const isChecking = ref(false);

const checkResult = ref<{ found: boolean; filePath?: string; fileSize?: number } | null>(null);
const downloadResult = ref<{ success: boolean; message: string; filePath?: string; fileSize?: number } | null>(null);

const history = ref<
  {
    type: "查询" | "下载";
    url: string;
    success: boolean;
    filePath?: string;
    fileSize?: number;
    timestamp: Date;
  }[]
>([]);

const handleCheck = async () => {
  const v = url.value.trim();
  if (!v || !props.clientId) return;

  isChecking.value = true;
  try {
    const result = await ClientControlService.checkFileDownloaded(props.clientId, v, true);

    if (result.success) {
      checkResult.value = {
        found: result.found,
        filePath: result.filePath,
        fileSize: result.fileSize,
      };
      history.value.unshift({
        type: "查询",
        url: v,
        success: result.found,
        filePath: result.filePath,
        fileSize: result.fileSize,
        timestamp: new Date(),
      });
    } else {
      ElMessage.error(result.message || "查询失败");
    }

    trimHistory();
  } finally {
    isChecking.value = false;
  }
};

const handleDownload = async () => {
  const v = url.value.trim();
  if (!v || !props.clientId) return;

  isDownloading.value = true;
  try {
    const result = await ClientControlService.downloadFileToClient(props.clientId, v, true);

    downloadResult.value = {
      success: result.success,
      message: result.message,
      filePath: result.filePath,
      fileSize: result.fileSize,
    };
    history.value.unshift({
      type: "下载",
      url: v,
      success: result.success,
      filePath: result.filePath,
      fileSize: result.fileSize,
      timestamp: new Date(),
    });

    if (result.success) ElMessage.success(result.message || "文件已下载");
    else ElMessage.error(result.message || "下载失败");

    trimHistory();
  } finally {
    isDownloading.value = false;
  }
};

const trimHistory = () => {
  if (history.value.length > 50) history.value = history.value.slice(0, 50);
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatTime = (date: Date): string =>
  new Date(date).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
</script>

<style scoped lang="scss">
.file-download-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-row {
  display: flex;
  gap: 8px;
}

.result {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  flex-wrap: wrap;
}

.status {
  font-weight: 600;

  &.ok {
    color: var(--el-color-success);
  }

  &.err {
    color: var(--el-color-danger);
  }
}

.path {
  max-width: 400px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.size {
  color: var(--el-text-color-placeholder);
}

.msg {
  color: var(--el-text-color-regular);
}

.history {
  &-head {
    display: flex;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    align-items: center;
    justify-content: space-between;
  }

  &-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 200px;
    overflow-y: auto;
  }

  &-item {
    display: flex;
    padding: 4px 0;
    font-size: 12px;
    align-items: center;
    gap: 8px;
  }
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;

  &.ok {
    background: var(--el-color-success);
  }

  &.err {
    background: var(--el-color-danger);
  }
}

.type-tag {
  padding: 0 5px;
  font-size: 10px;
  border-radius: 2px;
  flex-shrink: 0;

  &.is-查询 {
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }

  &.is-下载 {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.url {
  overflow: hidden;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.history .path {
  max-width: 200px;
}

.history .size {
  flex-shrink: 0;
}

.time {
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}
</style>
