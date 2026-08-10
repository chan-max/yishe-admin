<template>
  <ContentWrap :plain="true">
    <div class="model-service-page">
      <!-- 服务状态 -->
      <div class="status-section">
        <div class="status-line">
          <span class="status-dot" :class="healthState?.available ? 'status-dot--online' : 'status-dot--offline'"></span>
          <span class="status-label">模型服务</span>
          <span class="status-text">{{ resolveHealthText(healthState) }}</span>
          <span class="status-time" v-if="healthState?.updatedAt">{{ formatTime(healthState?.updatedAt) }}</span>
          <el-button link size="small" :loading="healthState?.loading" @click="refreshHealth">
            刷新
          </el-button>
        </div>
        <div class="status-info">
          <span class="info-item">
            <span class="info-label">地址</span>
            <span class="info-value mono">{{ healthState?.baseUrl || '未配置' }}</span>
          </span>
          <span class="info-item">
            <span class="info-label">信息</span>
            <span class="info-value">{{ healthState?.message || '等待检测' }}</span>
          </span>
          <span class="info-item">
            <span class="info-label">运行</span>
            <span class="info-value">{{ uptimeText }}</span>
          </span>
        </div>
      </div>

      <!-- API 接口 -->
      <div class="section">
        <div class="section-title">API 接口</div>
        <el-table :data="apiEndpoints" size="small" stripe>
          <el-table-column prop="method" label="方法" width="80" align="center">
            <template #default="{ row }">
              <span class="method-tag" :class="`method-tag--${row.method.toLowerCase()}`">{{ row.method }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="path" label="路径" min-width="200">
            <template #default="{ row }">
              <span class="mono">{{ row.path }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" width="140" />
          <el-table-column prop="description" label="说明" min-width="280" />
          <el-table-column prop="available" label="状态" width="90" align="center">
            <template #default="{ row }">
              <span class="status-text" :class="row.available ? 'text-success' : 'text-muted'">
                {{ row.available ? '可用' : '检测中' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 已加载模型 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">已加载模型</span>
          <el-button link size="small" :loading="modelsLoading" @click="loadModels">刷新</el-button>
        </div>
        <el-table :data="models" size="small" v-loading="modelsLoading">
          <el-table-column prop="id" label="模型 ID" min-width="280">
            <template #default="{ row }">
              <span class="mono">{{ row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="owned_by" label="来源" width="100" />
          <el-table-column prop="created" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTimestamp(row.created) }}
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!modelsLoading && models.length === 0" description="暂无模型" :image-size="60" />
      </div>

      <!-- Embedding 测试 -->
      <div class="section">
        <div class="section-title">Embedding 测试</div>
        <el-form :model="testForm" label-width="80px" size="small">
          <el-form-item label="输入文本">
            <el-input
              v-model="testForm.text"
              type="textarea"
              :rows="3"
              placeholder="输入需要向量化的文本"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="testLoading" @click="handleTestEmbedding">
              生成
            </el-button>
            <el-button @click="resetTestForm">重置</el-button>
          </el-form-item>
        </el-form>

        <div v-if="testResult" class="test-result">
          <div class="result-row">
            <span class="result-item"><span class="result-label">模型</span> {{ testResult.model }}</span>
            <span class="result-item"><span class="result-label">维度</span> {{ testResult.dimensions }}</span>
            <span class="result-item"><span class="result-label">耗时</span> {{ testResult.duration }}ms</span>
            <span class="result-item"><span class="result-label">Tokens</span> {{ testResult.tokens }}</span>
          </div>
          <div class="vector-preview">
            <span class="result-label">向量 (前20维)</span>
            <div class="vector-content">[{{ testResult.preview }}]</div>
          </div>
        </div>

        <div v-if="testError" class="test-error">
          {{ testError }}
        </div>
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { ElMessage } from "element-plus";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import {
  getModelServiceHealth,
  testEmbedding,
  getModelServiceModels,
  type ModelInfo,
} from "@/api/model-service";
import {
  useServiceHealthState,
  resolveServiceHealthText,
} from "@/services/serviceHealthState";

defineOptions({ name: "AiModelService" });

const healthState = useServiceHealthState("modelService");

const uptimeText = computed(() => {
  if (!healthState?.timestamp) return "-";
  const ts = new Date(healthState.timestamp).getTime();
  if (isNaN(ts)) return "-";
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  return `${Math.floor(seconds / 3600)}小时`;
});

async function refreshHealth() {
  if (!healthState) return;
  healthState.loading = true;
  try {
    const data = await getModelServiceHealth();
    healthState.available = data.available;
    healthState.baseUrl = data.baseUrl;
    healthState.message = data.message;
    healthState.timestamp = data.timestamp;
    healthState.checked = true;
  } catch (error: any) {
    healthState.available = false;
    healthState.message = error?.message || "检测失败";
    healthState.checked = true;
  } finally {
    healthState.loading = false;
    healthState.updatedAt = new Date().toISOString();
  }
}

const apiEndpoints = ref([
  {
    method: "GET",
    path: "/health",
    name: "健康检查",
    description: "返回服务状态、已加载模型、运行时间",
    available: healthState?.available ?? false,
  },
  {
    method: "POST",
    path: "/v1/embeddings",
    name: "Embedding",
    description: "文本转向量，OpenAI 兼容格式",
    available: healthState?.available ?? false,
  },
  {
    method: "GET",
    path: "/v1/models",
    name: "模型列表",
    description: "返回当前可用的模型列表",
    available: healthState?.available ?? false,
  },
]);

const modelsLoading = ref(false);
const models = ref<ModelInfo[]>([]);

async function loadModels() {
  modelsLoading.value = true;
  try {
    const data = await getModelServiceModels();
    models.value = data?.data ?? [];
  } catch {
    models.value = [];
    if (healthState?.available) {
      ElMessage.warning("获取模型列表失败");
    }
  } finally {
    modelsLoading.value = false;
  }
}

const testLoading = ref(false);
const testForm = reactive({ text: "" });
const testResult = ref<{
  model: string;
  dimensions: number;
  duration: number;
  tokens: number;
  preview: string;
} | null>(null);
const testError = ref("");

async function handleTestEmbedding() {
  if (!testForm.text.trim()) {
    ElMessage.warning("请输入测试文本");
    return;
  }
  testLoading.value = true;
  testResult.value = null;
  testError.value = "";
  const startTime = Date.now();
  try {
    const data = await testEmbedding(testForm.text);
    const duration = Date.now() - startTime;
    const embedding = data?.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("返回数据格式异常");
    }
    testResult.value = {
      model: data.model || "unknown",
      dimensions: embedding.length,
      duration,
      tokens: data.usage?.total_tokens || 0,
      preview: embedding.slice(0, 20).map((v: number) => v.toFixed(6)).join(", ") + (embedding.length > 20 ? ", ..." : ""),
    };
  } catch (error: any) {
    testError.value = error?.message || "Embedding 测试失败";
  } finally {
    testLoading.value = false;
  }
}

function resetTestForm() {
  testForm.text = "";
  testResult.value = null;
  testError.value = "";
}

function formatTime(val: string | undefined) {
  if (!val) return "";
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return val;
  }
}

function formatTimestamp(ts: number | undefined) {
  if (!ts) return "-";
  try {
    return new Date(ts * 1000).toLocaleString("zh-CN");
  } catch {
    return "-";
  }
}

function resolveHealthText(state: any) {
  return resolveServiceHealthText(state);
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  await refreshHealth();
  await loadModels();
  pollTimer = setInterval(() => {
    refreshHealth();
  }, 30000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped lang="scss">
.model-service-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
}

/* 状态区 */
.status-section {
  .status-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-info {
    display: flex;
    padding-left: 18px;
    margin-top: 8px;
    gap: 24px;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .info-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .info-value {
    font-size: 13px;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &--online { background: var(--el-color-success); }

  &--offline { background: var(--el-color-danger); }
}

.status-label {
  font-weight: 500;
}

.status-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.status-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.text-success { color: var(--el-color-success); }

.text-muted { color: var(--el-text-color-placeholder); }

/* 区块 */
.section {
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
}

.section-title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

/* 方法标签 */
.method-tag {
  display: inline-block;
  padding: 1px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;

  &--get { color: var(--el-color-success); }

  &--post { color: var(--el-color-primary); }

  &--put { color: var(--el-color-warning); }

  &--delete { color: var(--el-color-danger); }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

/* 测试结果 */
.test-result {
  margin-top: 12px;
}

.result-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.result-item {
  font-size: 13px;
}

.result-label {
  margin-right: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.vector-preview {
  padding: 12px;
  margin-top: 12px;
  background: var(--el-fill-color-lighter);
}

.vector-content {
  margin-top: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  word-break: break-all;
}

.test-error {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-color-danger);
}
</style>
