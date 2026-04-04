<template>
  <el-dialog
    :model-value="modelValue"
    :title="currentTask?.id ? '编辑采集任务' : '新建采集任务'"
    width="760px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form label-width="110px">
      <el-form-item label="任务名称" required>
        <el-input
          v-model="taskForm.name"
          :placeholder="
            selectedPlatformSpec?.taskNamePlaceholder || '例如：Amazon 热门耳机抓取'
          "
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="平台" required>
            <el-select
              v-model="taskForm.platform"
              placeholder="请选择平台"
              style="width: 100%"
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

        <el-col :span="12">
          <el-form-item label="采集场景" required>
            <el-select v-model="taskForm.collectScene" placeholder="请选择场景" style="width: 100%">
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

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="执行客户端">
            <el-select
              v-model="taskForm.targetClientId"
              clearable
              filterable
              placeholder="仅显示在线且可用客户端"
              style="width: 100%"
              @change="handleClientChange"
            >
              <el-option
                v-for="item in clientOptions"
                :key="item.clientId"
                :label="item.label"
                :value="item.clientId"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="机器编码">
            <el-input v-model="taskForm.targetMachineCode" placeholder="自动回填，可手动调整" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="轮询间隔">
            <el-input-number
              v-model="taskForm.intervalMinutes"
              :min="catalog.defaults.minIntervalMinutes || 10"
              :max="720"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="下次执行时间">
            <el-date-picker
              v-model="taskForm.nextRunAt"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
              placeholder="留空则按当前时间进入调度"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col v-if="showKeywordConfig" :span="12">
          <el-form-item label="关键词">
            <el-input
              v-model="taskForm.keyword"
              :placeholder="
                selectedPlatformSpec?.keywordPlaceholder || 'search 场景优先使用'
              "
            />
          </el-form-item>
        </el-col>

        <el-col v-if="showTargetUrlConfig" :span="12">
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

      <el-row :gutter="16">
        <el-col v-if="showKeywordConfig" :span="12">
          <el-form-item label="关键词列表">
            <el-input
              v-model="taskForm.keywordsText"
              type="textarea"
              :rows="3"
              :placeholder="
                selectedPlatformSpec?.keywordsPlaceholder || '一行一个或逗号分隔'
              "
            />
          </el-form-item>
        </el-col>

        <el-col v-if="showPaginationConfig" :span="6">
          <el-form-item label="最大页数">
            <el-input-number
              v-model="taskForm.maxPages"
              :min="1"
              :max="20"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="showKeywordConfig ? 6 : 12">
          <el-form-item label="最大记录数">
            <el-input-number
              v-model="taskForm.maxItems"
              :min="1"
              :max="500"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="附加配置 JSON">
        <el-input
          v-model="taskForm.extraJson"
          type="textarea"
          :rows="5"
          :placeholder="extraJsonPlaceholder"
        />
      </el-form-item>

      <el-form-item label="启用任务">
        <el-switch v-model="taskForm.isActive" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        保存
      </el-button>
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
import type { EcomCollectClientOption } from "../shared";
import { parseKeywordsText } from "../shared";
import PlatformTaskSpecCard from "./task-platforms/PlatformTaskSpecCard.vue";
import {
  getEcomCollectPlatformFormSpec,
  type EcomCollectSceneKey,
} from "./task-platforms";

const props = defineProps<{
  modelValue: boolean;
  catalog: EcomPlatformCollectCatalog;
  clientOptions: EcomCollectClientOption[];
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
  targetClientId: "",
  targetMachineCode: "",
  intervalMinutes: 30,
  nextRunAt: "",
  keyword: "",
  keywordsText: "",
  targetUrl: "",
  maxPages: 2,
  maxItems: 60,
  extraJson: "",
  isActive: true,
});

const resetTaskForm = () => {
  taskForm.id = "";
  taskForm.name = "";
  taskForm.platform = "";
  taskForm.collectScene = "search";
  taskForm.targetClientId = "";
  taskForm.targetMachineCode = "";
  taskForm.intervalMinutes = props.catalog.defaults.intervalMinutes || 30;
  taskForm.nextRunAt = "";
  taskForm.keyword = "";
  taskForm.keywordsText = "";
  taskForm.targetUrl = "";
  taskForm.maxPages = 2;
  taskForm.maxItems = 60;
  taskForm.extraJson = "";
  taskForm.isActive = true;
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

const handleClientChange = (clientId: string) => {
  const matched = props.clientOptions.find((item) => item.clientId === clientId);
  taskForm.targetMachineCode = matched?.machineCode || "";
};

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
  taskForm.targetClientId = task.targetClientId || "";
  taskForm.targetMachineCode = task.targetMachineCode || "";
  taskForm.intervalMinutes = task.intervalMinutes || props.catalog.defaults.intervalMinutes || 30;
  taskForm.nextRunAt = task.nextRunAt || "";
  taskForm.keyword = String(task.configData?.keyword || "");
  taskForm.keywordsText = Array.isArray(task.configData?.keywords)
    ? task.configData.keywords.join("\n")
    : "";
  taskForm.targetUrl = String(task.configData?.targetUrl || "");
  taskForm.maxPages = Number(task.configData?.maxPages || 2);
  taskForm.maxItems = Number(task.configData?.maxItems || 60);
  taskForm.isActive = task.isActive !== false;

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
      targetClientId: taskForm.targetClientId || undefined,
      targetMachineCode: taskForm.targetMachineCode || undefined,
      intervalMinutes: taskForm.intervalMinutes,
      nextRunAt: taskForm.nextRunAt || undefined,
      isActive: taskForm.isActive,
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
.form-hint {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
