<template>
  <el-dialog
    :model-value="modelValue"
    :title="currentTask?.id ? '编辑采集任务' : '新建采集任务'"
    fullscreen
    append-to-body
    class="ecom-collect-task-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="task-dialog-shell">
      <el-form label-position="top" class="task-dialog-form">
        <el-form-item label="任务名称" required>
          <el-input
            v-model="taskForm.name"
            :placeholder="
              selectedPlatformSpec?.taskNamePlaceholder || '例如：Amazon 热门耳机抓取'
            "
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :xs="24" :lg="12">
            <el-form-item label="平台" required>
              <el-select
                v-model="taskForm.platform"
                placeholder="请选择平台"
                @change="handlePlatformChange"
              >
                <el-option
                  v-for="item in catalog.platforms"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :lg="12">
            <el-form-item label="采集场景" required>
              <el-select v-model="taskForm.collectScene" placeholder="请选择场景">
                <el-option
                  v-for="item in availableSceneOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <div v-if="selectedSceneMeta?.description" class="form-hint">
                {{ selectedSceneMeta.description }}
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <PlatformTaskSpecCard :spec="selectedPlatformSpec" :scene="selectedSceneKey" />

        <el-row :gutter="20">
          <el-col v-if="showKeywordConfig" :xs="24" :lg="12">
            <el-form-item label="关键词">
              <el-input
                v-model="taskForm.keyword"
                :placeholder="
                  selectedPlatformSpec?.keywordPlaceholder || 'search 场景优先使用'
                "
              />
            </el-form-item>
          </el-col>

          <el-col v-if="showTargetUrlConfig" :xs="24" :lg="12">
            <el-form-item label="目标链接">
              <el-input
                v-model="taskForm.targetUrl"
                :placeholder="
                  selectedPlatformSpec?.targetUrlPlaceholder || '详情页 / 店铺页链接'
                "
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col v-if="showKeywordConfig" :xs="24" :lg="12">
            <el-form-item label="关键词列表">
              <el-input
                v-model="taskForm.keywordsText"
                type="textarea"
                :rows="4"
                :placeholder="
                  selectedPlatformSpec?.keywordsPlaceholder || '一行一个或逗号分隔'
                "
              />
            </el-form-item>
          </el-col>

          <el-col v-if="showPaginationConfig" :xs="24" :sm="12" :lg="6">
            <el-form-item label="最大页数">
              <el-input-number
                v-model="taskForm.maxPages"
                :min="1"
                :max="20"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :lg="showKeywordConfig ? 6 : 12">
            <el-form-item label="最大记录数">
              <el-input-number
                v-model="taskForm.maxItems"
                :min="1"
                :max="500"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="附加配置 JSON">
          <el-input
            v-model="taskForm.extraJson"
            type="textarea"
            :rows="8"
            :placeholder="extraJsonPlaceholder"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="task-dialog-footer-bar">
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  createEcomPlatformCollectTask,
  updateEcomPlatformCollectTask,
  type EcomPlatformCollectCatalog,
  type EcomPlatformCollectTask,
} from "@/api/operation/ecomPlatformCollect";
import { parseKeywordsText } from "../shared";
import PlatformTaskSpecCard from "./task-platforms/PlatformTaskSpecCard.vue";
import {
  getEcomCollectPlatformFormSpec,
  type EcomCollectSceneKey,
} from "./task-platforms";

const props = defineProps<{
  modelValue: boolean;
  catalog: EcomPlatformCollectCatalog;
  task?: EcomPlatformCollectTask | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const submitting = ref(false);

const taskForm = reactive({
  id: "",
  name: "",
  platform: "",
  collectScene: "search",
  keyword: "",
  keywordsText: "",
  targetUrl: "",
  maxPages: 2,
  maxItems: 60,
  extraJson: "",
});

const resetTaskForm = () => {
  taskForm.id = "";
  taskForm.name = "";
  taskForm.platform = "";
  taskForm.collectScene = "search";
  taskForm.keyword = "";
  taskForm.keywordsText = "";
  taskForm.targetUrl = "";
  taskForm.maxPages = 2;
  taskForm.maxItems = 60;
  taskForm.extraJson = "";
};

const currentTask = computed(() => props.task || null);

const selectedPlatformMeta = computed(() =>
  props.catalog.platforms.find((item) => item.value === taskForm.platform),
);

const selectedPlatformSpec = computed(() =>
  getEcomCollectPlatformFormSpec(taskForm.platform),
);

const availableSceneOptions = computed(() => {
  const supportedScenes = selectedPlatformMeta.value?.supportedScenes;
  if (!Array.isArray(supportedScenes) || !supportedScenes.length) {
    return props.catalog.scenes;
  }
  return props.catalog.scenes.filter((item) => supportedScenes.includes(item.value));
});

const selectedSceneMeta = computed(() =>
  props.catalog.scenes.find((item) => item.value === taskForm.collectScene),
);

const selectedSceneRequirements = computed(
  () => selectedSceneMeta.value?.requirements || {},
);

const selectedSceneKey = computed(
  () => taskForm.collectScene as EcomCollectSceneKey,
);

const extraJsonPlaceholder = computed(
  () =>
    selectedPlatformSpec.value?.extraJsonPlaceholder ||
    '{"sort":"sales","shopId":"xxx"}',
);

const showKeywordConfig = computed(
  () => selectedSceneRequirements.value.keyword === true,
);

const showTargetUrlConfig = computed(
  () => selectedSceneRequirements.value.targetUrl === true,
);

const showPaginationConfig = computed(
  () => selectedSceneRequirements.value.pagination === true,
);

const handlePlatformChange = (platform: string) => {
  const matchedPlatform = props.catalog.platforms.find((item) => item.value === platform);
  const supportedScenes = matchedPlatform?.supportedScenes || [];
  if (
    supportedScenes.length > 0 &&
    taskForm.collectScene &&
    !supportedScenes.includes(taskForm.collectScene)
  ) {
    taskForm.collectScene = supportedScenes[0] || "";
  }
};

const buildConfigData = () => {
  let extraConfig = {};
  if (taskForm.extraJson.trim()) {
    try {
      extraConfig = JSON.parse(taskForm.extraJson.trim());
    } catch {
      throw new Error("附加配置 JSON 格式不正确");
    }
  }

  return {
    ...extraConfig,
    keyword: showKeywordConfig.value ? taskForm.keyword.trim() || undefined : undefined,
    keywords: showKeywordConfig.value
      ? parseKeywordsText(taskForm.keywordsText)
      : undefined,
    targetUrl: showTargetUrlConfig.value ? taskForm.targetUrl.trim() || undefined : undefined,
    maxPages: showPaginationConfig.value ? taskForm.maxPages || undefined : undefined,
    maxItems: taskForm.maxItems || undefined,
  };
};

const validateTaskForm = () => {
  const configData = buildConfigData();
  const keyword = String(configData.keyword || "").trim();
  const keywords = Array.isArray(configData.keywords) ? configData.keywords : [];
  const targetUrl = String(configData.targetUrl || "").trim();

  if (!taskForm.name.trim()) {
    throw new Error("请填写任务名称");
  }
  if (!taskForm.platform) {
    throw new Error("请选择平台");
  }
  if (!taskForm.collectScene) {
    throw new Error("请选择采集场景");
  }
  if (taskForm.collectScene === "search" && !keyword && !keywords.length) {
    throw new Error("关键词搜索场景至少需要填写一个关键词");
  }
  if (
    ["product_detail", "shop_hot_products"].includes(taskForm.collectScene) &&
    !targetUrl
  ) {
    throw new Error("当前采集场景需要填写目标链接");
  }

  return configData;
};

const syncTaskToForm = () => {
  resetTaskForm();

  if (!currentTask.value) {
    return;
  }

  const task = currentTask.value;
  taskForm.id = task.id;
  taskForm.name = task.name;
  taskForm.platform = task.platform;
  taskForm.collectScene = task.collectScene;
  taskForm.keyword = String(task.configData?.keyword || "");
  taskForm.keywordsText = Array.isArray(task.configData?.keywords)
    ? task.configData.keywords.join("\n")
    : "";
  taskForm.targetUrl = String(task.configData?.targetUrl || "");
  taskForm.maxPages = Number(task.configData?.maxPages || 2);
  taskForm.maxItems = Number(task.configData?.maxItems || 60);

  const { keyword, keywords, targetUrl, maxPages, maxItems, ...extraConfig } =
    task.configData || {};
  taskForm.extraJson =
    extraConfig && Object.keys(extraConfig).length
      ? JSON.stringify(extraConfig, null, 2)
      : "";
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const configData = validateTaskForm();
    const payload = {
      name: taskForm.name.trim(),
      platform: taskForm.platform,
      collectScene: taskForm.collectScene,
      configData,
    };

    if (taskForm.id) {
      await updateEcomPlatformCollectTask(taskForm.id, payload);
      ElMessage.success("任务已更新");
    } else {
      await createEcomPlatformCollectTask(payload);
      ElMessage.success("任务已创建");
    }

    emit("update:modelValue", false);
    emit("success");
  } catch (error: any) {
    ElMessage.error(error?.message || "保存任务失败");
  } finally {
    submitting.value = false;
  }
};

watch(
  () => [props.modelValue, props.task, props.catalog.platforms.length, props.catalog.scenes.length],
  ([visible]) => {
    if (visible) {
      syncTaskToForm();
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.ecom-collect-task-dialog :deep(.el-dialog) {
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 0;
  border-radius: 0;
}

.ecom-collect-task-dialog :deep(.el-dialog__header) {
  padding: 18px 28px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.ecom-collect-task-dialog :deep(.el-dialog__body) {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.ecom-collect-task-dialog :deep(.el-dialog__footer) {
  flex: 0 0 auto;
  padding: 0;
  border-top: 1px solid rgb(15 23 42 / 8%);
  background: rgb(255 255 255 / 88%);
  backdrop-filter: blur(14px);
  box-shadow: 0 -10px 30px rgb(15 23 42 / 6%);
}

.task-dialog-shell {
  height: 100%;
  overflow: auto;
  padding: 24px 28px 28px;
  box-sizing: border-box;
}

.task-dialog-form {
  width: 100%;
  max-width: none;
  margin: 0;
}

.task-dialog-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

.task-dialog-form :deep(.el-form-item__label) {
  padding-bottom: 8px;
  line-height: 1.45;
}

.task-dialog-form :deep(.el-input),
.task-dialog-form :deep(.el-select),
.task-dialog-form :deep(.el-date-editor),
.task-dialog-form :deep(.el-input-number) {
  width: 100%;
}

.task-dialog-footer-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-height: 76px;
  padding: 14px 28px 18px;
  box-sizing: border-box;
}

.form-hint {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

@media (max-width: 768px) {
  .task-dialog-shell {
    padding: 16px;
  }

  .ecom-collect-task-dialog :deep(.el-dialog__header) {
    padding: 16px 16px 12px;
  }

  .task-dialog-footer-bar {
    padding: 12px 16px 16px;
    min-height: 68px;
  }
}
</style>
