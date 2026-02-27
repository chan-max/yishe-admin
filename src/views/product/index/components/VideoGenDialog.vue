<template>
  <el-dialog v-model="dialogVisible" :fullscreen="true" @close="handleClose" :close-on-click-modal="false"
    class="video-gen-fullscreen-dialog">
    <template #header>
      <div class="flex items-center gap-4 py-2 border-b border-gray-100">
        <div class="p-2 text-blue-600">
          <el-icon size="24">
            <VideoCamera />
          </el-icon>
        </div>
        <div>
          <h2 class="text-xl font-bold text-[var(--el-text-color-primary)]">高级视频生成配置</h2>
          <p class="text-sm text-[var(--el-text-color-secondary)]">
            配置高级渲染参数，支持转场、音频、滤镜及实时负载预览
          </p>
        </div>
        <div class="ml-auto flex items-center gap-3">
          <el-tag v-if="generating" type="primary" effect="dark" round class="px-3">
            正在提交生成任务...
          </el-tag>
          <el-button @click="payloadVisible = true" :disabled="generating">查看参数</el-button>
          <el-button @click="handleClose" :disabled="generating">取消</el-button>
          <el-button type="primary" class="px-8 font-bold" :loading="generating" @click="handleSubmit">
            提交视频生产任务
          </el-button>
        </div>
      </div>
    </template>

    <div class="h-[calc(100vh-140px)] flex gap-4 overflow-hidden p-4">
      <!-- 左侧：资源列表 & 批量操作 -->
      <div class="w-1/3 flex flex-col gap-4 overflow-hidden">
        <div class="rounded-lg border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <div class="p-4 border-b border-gray-50 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <el-icon class="text-blue-500">
                <Picture />
              </el-icon>
              <span class="font-bold text-[var(--el-text-color-primary)]">图片素材 ({{ form.selectedImages.length }})</span>
            </div>
            <div class="flex gap-2">
              <el-button size="small" @click="selectAllImages">全选</el-button>
              <el-button size="small" @click="deselectAllImages">反选</el-button>
            </div>
          </div>

          <!-- 图片拖拽/排序区域 (简化版) -->
          <el-scrollbar class="flex-1 p-4">
            <div class="grid grid-cols-3 gap-3">
              <div v-for="(url, index) in productImages" :key="index"
                class="relative group cursor-pointer aspect-square rounded-lg overflow-hidden border-2 transition-all"
                :class="[
                  form.selectedImages.includes(url)
                    ? 'border-blue-500 shadow-md ring-2 ring-blue-100'
                    : 'border-transparent hover:border-gray-200'
                ]" @click="toggleImageSelection(url)">
                <el-image :src="url" fit="cover" class="w-full h-full" />
                <div v-if="form.selectedImages.includes(url)"
                  class="absolute top-1 right-1 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                  <el-icon>
                    <Check />
                  </el-icon>
                </div>
                <div
                  class="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between">
                  <span>#{{ index + 1 }}</span>
                  <span v-if="form.selectedImages.includes(url)">已选</span>
                </div>
              </div>
            </div>
          </el-scrollbar>

          <div class="p-4 border-t border-gray-100">
            <p class="text-xs text-blue-600 mb-2 font-medium flex items-center gap-1">
              <el-icon>
                <InfoFilled />
              </el-icon> 提示：按点击顺序排序生成视频片段
            </p>
          </div>
        </div>

        <!-- 转场效果批量设置 -->
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex items-center gap-2 mb-4 font-bold text-[var(--el-text-color-primary)]">
            <el-icon class="text-orange-500">
              <MagicStick />
            </el-icon>
            <span>批量设置</span>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <span class="text-xs text-gray-400">统一过渡效果</span>
              <el-select v-model="batchSettings.transition" size="small" class="w-full">
                <el-option label="淡入淡出 (Fade)" value="fade" />
                <el-option label="向左滑动" value="directional-left" />
                <el-option label="向右滑动" value="directional-right" />
                <el-option label="无过渡" value="none" />
              </el-select>
            </div>
            <div class="space-y-1">
              <span class="text-xs text-gray-400">单张图片时长 (秒)</span>
              <el-input-number v-model="batchSettings.duration" :min="0.5" :max="30" :step="0.5" size="small"
                class="w-full" />
            </div>
          </div>
          <el-button type="primary" size="small" class="w-full mt-4" plain @click="applyBatchSettings">
            应用到所有已选图片
          </el-button>
        </div>
      </div>

      <!-- 中间：配置详情 -->
      <div class="flex-1 flex flex-col gap-4 overflow-hidden">
        <div class="rounded-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
          <el-tabs v-model="activeTab" class="custom-tabs h-full flex flex-col">
            <el-tab-pane label="场景片段" name="scenes" class="h-full">
              <el-scrollbar>
                <div class="p-4 space-y-3">
                  <div v-for="(scene, index) in scenes" :key="index"
                    class="rounded-lg p-3 border border-gray-200 group relative transition-all hover:border-blue-400">
                    <div class="flex gap-4 items-center">
                      <div class="w-16 h-16 rounded overflow-hidden border border-gray-200 flex-shrink-0">
                        <el-image :src="getPreviewImageUrl(scene.url, { width: 100, format: 'webp' })" fit="contain"
                          class="w-full h-full" />
                      </div>
                      <div class="flex-1 grid grid-cols-4 gap-4">
                        <div class="flex flex-col gap-1">
                          <span
                            class="text-[10px] text-[var(--el-text-color-secondary)] uppercase font-bold tracking-wider">时长</span>
                          <el-input-number v-model="scene.duration" size="small" :min="0.5" style="width: 100%"
                            controls-position="right" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <span
                            class="text-[10px] text-[var(--el-text-color-secondary)] uppercase font-bold tracking-wider">转场</span>
                          <el-select v-model="scene.transition" size="small">
                            <el-option label="无" value="none" />
                            <el-option label="淡入淡出" value="fade" />
                            <el-option label="左滑" value="directional-left" />
                            <el-option label="右滑" value="directional-right" />
                          </el-select>
                        </div>
                        <div class="flex flex-col gap-1">
                          <span
                            class="text-[10px] text-[var(--el-text-color-secondary)] uppercase font-bold tracking-wider">缩放模式</span>
                          <el-select v-model="scene.scaleMode" size="small">
                            <el-option label="适应 (Fit)" value="fit" />
                            <el-option label="填充 (Fill)" value="fill" />
                          </el-select>
                        </div>
                        <div class="flex flex-col gap-1">
                          <span
                            class="text-[10px] text-[var(--el-text-color-secondary)] uppercase font-bold tracking-wider">淡入/淡出</span>
                          <el-select v-model="scene.fade" size="small">
                            <el-option label="无" value="none" />
                            <el-option label="进入 (In)" value="in" />
                            <el-option label="退出 (Out)" value="out" />
                            <el-option label="双向 (Both)" value="both" />
                          </el-select>
                        </div>
                      </div>
                      <div class="flex items-center justify-center pl-2">
                        <el-button :icon="Delete" type="danger" circle size="small" plain @click="removeScene(index)" />
                      </div>
                    </div>
                  </div>

                  <div v-if="scenes.length === 0"
                    class="h-[300px] flex flex-col items-center justify-center text-[var(--el-text-color-secondary)] gap-4">
                    <el-icon size="48" class="opacity-20">
                      <Files />
                    </el-icon>
                    <span>暂无场景片段，请在左侧选择图片</span>
                  </div>
                </div>
              </el-scrollbar>
            </el-tab-pane>

            <el-tab-pane label="核心参数" name="options" class="h-full">
              <el-scrollbar>
                <div class="p-6 space-y-8">
                  <!-- Previous options content -->
                  <section>
                    <div class="flex items-center gap-2 mb-4">
                      <div class="w-1 h-4 bg-blue-500 rounded-full"></div>
                      <span class="font-bold text-[var(--el-text-color-primary)]">画布与渲染选项</span>
                    </div>
                    <el-row :gutter="40">
                      <el-col :span="12">
                        <el-form label-position="top">
                          <el-form-item label="视频分辨率">
                            <div class="flex gap-2 w-full">
                              <el-input-number v-model="options.width" :min="200" :max="3840" controls-position="right"
                                class="flex-1" />
                              <span class="flex items-center text-gray-400">×</span>
                              <el-input-number v-model="options.height" :min="200" :max="3840" controls-position="right"
                                class="flex-1" />
                            </div>
                          </el-form-item>
                          <el-form-item label="渲染帧率 (FPS)">
                            <el-radio-group v-model="options.fps" class="w-full">
                              <el-radio-button :label="24">24</el-radio-button>
                              <el-radio-button :label="25">25</el-radio-button>
                              <el-radio-button :label="30">30</el-radio-button>
                              <el-radio-button :label="60">60</el-radio-button>
                            </el-radio-group>
                          </el-form-item>
                        </el-form>
                      </el-col>
                      <el-col :span="12">
                        <el-form label-position="top">
                          <el-form-item label="背景颜色">
                            <div class="flex items-center gap-4">
                              <el-color-picker v-model="options.backgroundColor" />
                              <el-input v-model="options.backgroundColor" placeholder="#000000" style="width: 120px" />
                            </div>
                          </el-form-item>
                          <el-form-item label="输出格式">
                            <el-select v-model="form.outputFormat" class="w-full">
                              <el-option label="MP4 (标准 / H.264)" value="mp4" />
                              <el-option label="WebM (网络高效 / VP9)" value="webm" />
                              <el-option label="MOV (高质量 / Prores)" value="mov" />
                            </el-select>
                          </el-form-item>
                        </el-form>
                      </el-col>
                    </el-row>
                  </section>

                  <section>
                    <div class="flex items-center gap-2 mb-4">
                      <div class="w-1 h-4 bg-orange-500 rounded-full"></div>
                      <span class="font-bold text-[var(--el-text-color-primary)]">渲染精度与编码</span>
                    </div>
                    <el-row :gutter="40">
                      <el-col :span="12">
                        <el-form label-position="top">
                          <el-form-item label="视频码率 (Bitrate)">
                            <el-select v-model="options.videoBitrate" class="w-full">
                              <el-option label="2000k (经济)" value="2000k" />
                              <el-option label="4000k (中等)" value="4000k" />
                              <el-option label="8000k (高清)" value="8000k" />
                              <el-option label="12000k (超清)" value="12000k" />
                            </el-select>
                          </el-form-item>
                          <el-form-item label="视频 CRF (质量模式)">
                            <el-slider v-model="options.videoCrf" :min="10" :max="35" :step="1" show-input />
                            <div class="text-[10px] text-gray-400 mt-1">数值越小质量越高，建议 18-28</div>
                          </el-form-item>
                        </el-form>
                      </el-col>
                      <el-col :span="12">
                        <el-form label-position="top">
                          <el-form-item label="编码预设 (Preset)">
                            <el-select v-model="options.videoPreset" class="w-full">
                              <el-option label="ultrafast (最快)" value="ultrafast" />
                              <el-option label="superfast" value="superfast" />
                              <el-option label="veryfast" value="veryfast" />
                              <el-option label="fast" value="fast" />
                              <el-option label="medium (平衡)" value="medium" />
                              <el-option label="slow (高质量)" value="slow" />
                              <el-option label="veryslow (极致体积)" value="veryslow" />
                            </el-select>
                          </el-form-item>
                        </el-form>
                      </el-col>
                    </el-row>
                  </section>

                  <section>
                    <div class="flex items-center gap-2 mb-4">
                      <div class="w-1 h-4 bg-purple-500 rounded-full"></div>
                      <span class="font-bold text-[var(--el-text-color-primary)]">音频环境设置</span>
                    </div>
                    <el-row :gutter="40">
                      <el-col :span="12">
                        <el-form label-position="top">
                          <el-form-item label="背景音乐素材">
                            <el-select v-model="form.audioUrl" filterable remote reserve-keyword placeholder="在素材库中搜索音频"
                              :remote-method="loadAudioMaterials" :loading="audioLoading" clearable class="w-full">
                              <el-option v-for="item in audioMaterials" :key="item.url" :label="item.name"
                                :value="item.url">
                                <div class="flex items-center justify-between">
                                  <span class="truncate max-w-[200px]">{{ item.name }}</span>
                                  <el-tag size="small" type="info">{{ item.suffix?.toUpperCase() }}</el-tag>
                                </div>
                              </el-option>
                            </el-select>
                          </el-form-item>
                          <el-form-item label="背景音量">
                            <el-slider v-model="audioVolume" :min="0" :max="100" />
                          </el-form-item>
                        </el-form>
                      </el-col>
                      <el-col :span="12">
                        <el-form label-position="top">
                          <el-form-item label="音频声道">
                            <el-radio-group v-model="options.audioChannels">
                              <el-radio :label="1">单声道 (Mono)</el-radio>
                              <el-radio :label="2">立体声 (Stereo)</el-radio>
                            </el-radio-group>
                          </el-form-item>
                          <el-form-item label="采样率">
                            <el-select v-model="options.audioSampleRate" class="w-full">
                              <el-option label="44.1 kHz (CD 标准)" :value="44100" />
                              <el-option label="48.0 kHz (视频标准)" :value="48000" />
                              <el-option label="32.0 kHz" :value="32000" />
                            </el-select>
                          </el-form-item>
                        </el-form>
                      </el-col>
                    </el-row>
                  </section>
                </div>
              </el-scrollbar>
            </el-tab-pane>
          </el-tabs>
          <!-- 底部摘要信息 -->
          <div class="px-4 py-2 text-[10px] text-gray-500 border-t border-gray-100 flex justify-between bg-gray-50/50">
            <div class="flex gap-4">
              <span>片段数量: <span class="text-[var(--el-text-color-primary)] font-mono">{{ scenes.length }}</span></span>
              <span>总时长: <span class="text-[var(--el-text-color-primary)] font-mono">{{ totalDuration.toFixed(1)
              }}s</span></span>
              <span>分辨率: <span class="text-[var(--el-text-color-primary)] font-mono">{{ options.width }} x {{
                options.height
                  }}</span></span>
            </div>
            <div class="text-[var(--el-color-primary)] cursor-pointer hover:underline text-[11px] font-bold"
              @click="payloadVisible = true">
              查看实时 Payload 参数
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payload 查看对话框 -->
    <el-dialog v-model="payloadVisible" width="60%" append-to-body class="payload-preview-dialog">
      <template #header>
        <div class="flex items-center justify-between pr-8">
          <div class="flex items-center gap-2">
            <el-icon class="text-green-500" size="18">
              <Document />
            </el-icon>
            <span class="font-bold text-[var(--el-text-color-primary)]">实时渲染 Payload (JSON)</span>
          </div>
          <el-button type="success" size="small" @click="copyPayload">复制 JSON</el-button>
        </div>
      </template>
      <div class="payload-content-wrapper">
        <el-scrollbar height="65vh">
          <div class="p-4 bg-gray-900 rounded-lg mx-1">
            <pre class="text-green-400 font-mono text-[12px] leading-relaxed"><code>{{ JSON.stringify(finalPayload, null, 2)
            }}</code></pre>
          </div>
        </el-scrollbar>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  VideoCamera,
  Picture,
  Check,
  Document,
  MagicStick,
  Files,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue';
import { generateProductVideo } from '@/api/product';
import { getClipMaterialList } from '@/api/clip-material';
import { getPreviewImageUrl } from '@/utils/image';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  row: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:visible', 'success']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

// 状态
const activeTab = ref('scenes');
const generating = ref(false);
const audioLoading = ref(false);
const audioMaterials = ref<any[]>([]);
const payloadVisible = ref(false);

// 表单数据
const form = reactive({
  selectedImages: [] as string[],
  outputFormat: 'mp4',
  audioUrl: null as string | null,
  replace: false
});

const options = reactive({
  width: 720,
  height: 720,
  fps: 25,
  videoCodec: 'libx264',
  videoPreset: 'medium',
  videoCrf: 23,
  videoBitrate: '4000k',
  audioCodec: 'aac',
  audioBitrate: '192k',
  audioSampleRate: 44100,
  audioChannels: 2,
  backgroundColor: '#000000'
});

const audioVolume = ref(100);

// 片段数据
const scenes = ref<any[]>([]);

// 批量设置
const batchSettings = reactive({
  transition: 'fade',
  duration: 2,
  scaleMode: 'fit',
  fade: 'none'
});

// 计算属性
const productImages = computed(() => {
  return Array.isArray(props.row?.images) ? props.row.images : [];
});

const totalDuration = computed(() => {
  return scenes.value.reduce((acc, scene) => acc + (Number(scene.duration) || 0), 0);
});

const finalPayload = computed(() => {
  if (!props.row?.id) return null;

  const resources: any[] = scenes.value.map((scene) => ({
    type: 'image',
    url: scene.url,
    duration: Number(scene.duration),
    transition: scene.transition,
    transitionDuration: 0.5,
    scaleMode: scene.scaleMode,
    fade: scene.fade,
    fadeDuration: 1,
    position: 'center'
  }));

  // 添加音频资源
  if (form.audioUrl) {
    resources.push({
      type: 'audio',
      url: form.audioUrl,
      volume: audioVolume.value,
      startTime: 0
    });
  }

  return {
    id: props.row.id,
    replace: form.replace,
    resources,
    options: {
      ...options,
      format: form.outputFormat
    }
  };
});

// 监听
watch(() => props.row, (newRow) => {
  if (newRow && newRow.images) {
    // 默认全选
    form.selectedImages = [...newRow.images];
    updateScenesFromSelection();

    // 尝试获取第一张图片的比例设置分辨率 (这里可以更智能一点，目前保持默认)
  }
}, { immediate: true });

// 方法
function handleClose() {
  emit('update:visible', false);
}

function toggleImageSelection(url: string) {
  const index = form.selectedImages.indexOf(url);
  if (index > -1) {
    form.selectedImages.splice(index, 1);
  } else {
    form.selectedImages.push(url);
  }
  updateScenesFromSelection();
}

function updateScenesFromSelection() {
  // 根据 selectedImages 构建 scenes，保留已有的配置
  const newScenes = form.selectedImages.map(url => {
    const existing = scenes.value.find(s => s.url === url);
    if (existing) return existing;
    return {
      url,
      duration: batchSettings.duration,
      transition: batchSettings.transition,
      scaleMode: batchSettings.scaleMode,
      fade: batchSettings.fade
    };
  });
  scenes.value = newScenes;
}

function removeScene(index: number) {
  const url = scenes.value[index].url;
  scenes.value.splice(index, 1);
  const selIndex = form.selectedImages.indexOf(url);
  if (selIndex > -1) {
    form.selectedImages.splice(selIndex, 1);
  }
}

function selectAllImages() {
  form.selectedImages = [...productImages.value];
  updateScenesFromSelection();
}

function deselectAllImages() {
  form.selectedImages = [];
  scenes.value = [];
}

function applyBatchSettings() {
  scenes.value.forEach(scene => {
    scene.duration = batchSettings.duration;
    scene.transition = batchSettings.transition;
    scene.scaleMode = batchSettings.scaleMode;
    scene.fade = batchSettings.fade;
  });
  ElMessage.success('已应用批量设置');
}

async function loadAudioMaterials(keyword: string = '') {
  audioLoading.value = true;
  try {
    const res = await getClipMaterialList({
      currentPage: 1,
      pageSize: 50,
      keyword: keyword || undefined
    });

    // 过滤出音频
    const audioSuffixes = ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'];
    audioMaterials.value = (res.list || []).filter((item: any) =>
      item.suffix && audioSuffixes.includes(item.suffix.toLowerCase())
    );
  } catch (e) {
    console.error(e);
  } finally {
    audioLoading.value = false;
  }
}

async function handleSubmit() {
  if (scenes.value.length === 0) {
    return ElMessage.warning('请至少选择一张图片');
  }

  generating.value = true;
  try {
    const payload = finalPayload.value;
    await generateProductVideo(payload);
    ElMessage.success('视频生成任务已提交，请稍后查看');
    emit('success');
    handleClose();
  } catch (e: any) {
    ElMessage.error(e?.message || '生成视频失败');
  } finally {
    generating.value = false;
  }
}

function copyPayload() {
  try {
    const text = JSON.stringify(finalPayload.value, null, 2);
    navigator.clipboard.writeText(text);
    ElMessage.success('已复制到剪贴板');
  } catch (e) {
    ElMessage.error('复制失败');
  }
}

onMounted(() => {
  loadAudioMaterials();
});
</script>

<style scoped lang="less">
.video-gen-fullscreen-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    margin-right: 0;
    padding-bottom: 0;
  }
}

.payload-preview-dialog {
  :deep(.el-dialog__header) {
    margin-right: 0;
    background: var(--el-fill-color-light);
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 12px;
    background: var(--el-bg-color);
  }
}

.custom-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
    padding: 0 24px;
    background: transparent;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    height: 50px;
    font-weight: bold;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
