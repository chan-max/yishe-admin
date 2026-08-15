<template>
  <div class="collect-page">
    <!-- 顶部 Toolbar -->
    <header class="collect-toolbar">
      <div class="collect-toolbar__title">
        <h1 class="collect-toolbar__name">Kaboompics 免费高清图库</h1>
        <span class="collect-toolbar__subtitle">全量全尺寸高清原图素材采集（无损/原图级下载）</span>
      </div>
      <div class="collect-toolbar__actions">
        <div class="client-select-wrapper">
          <span class="client-select-label">客户端节点:</span>
          <el-select
            v-model="selectedClientId"
            placeholder="请选择在线客户端节点"
            size="default"
            class="client-select"
            :loading="clientLoading"
          >
            <el-option
              v-for="item in clientOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="item.disabled"
            />
          </el-select>
        </div>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="collect-main">
      <!-- 英雄连 / 运行状态 -->
      <div class="status-hero" :class="`status-hero--${serviceStatus.state}`">
        <div class="status-hero__icon">
          <el-icon :size="24">
            <Picture />
          </el-icon>
        </div>
        <div class="status-hero__content">
          <div class="status-hero__title">
            <span>Kaboompics 高清图库引擎</span>
            <el-tag :type="statusTagType" size="small" effect="dark">
              {{ serviceStatus.label }}
            </el-tag>
          </div>
          <p class="status-hero__desc">
            {{ serviceStatus.message }}
          </p>
        </div>
        <div class="status-hero__meta">
          <el-button
            type="primary"
            plain
            size="small"
            :loading="actionLoading.refreshRuntime"
            @click="handleRefreshRuntime"
          >
            刷新节点状态
          </el-button>
        </div>
      </div>

      <!-- 操作栏: 搜索与批量入库 -->
      <div class="collect-actions-bar">
        <div class="collect-search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="输入英文搜索关键词 (如: cat, coffee, nature, office)"
            clearable
            size="large"
            @keyup.enter="handleSearch(1)"
          >
            <template #append>
              <el-button type="primary" :loading="searchLoading" @click="handleSearch(1)">
                搜索高清原图
              </el-button>
            </template>
          </el-input>
        </div>

        <div class="collect-batch-ops">
          <el-button
            type="success"
            size="default"
            :disabled="!selectedItems.length || !selectedClientId"
            :loading="batchDownloadLoading"
            @click="handleBatchDownload"
          >
            批量保存到贴纸素材库 ({{ selectedItems.length }})
          </el-button>
          <el-button
            v-if="selectedItems.length"
            type="info"
            plain
            size="default"
            @click="clearSelection"
          >
            取消选择
          </el-button>
        </div>
      </div>

      <!-- 标签筛选 / 快捷推荐 -->
      <div class="quick-tags-bar">
        <span class="quick-tags-label">热门推荐:</span>
        <el-tag
          v-for="tag in quickTags"
          :key="tag"
          class="quick-tag-item"
          effect="plain"
          size="default"
          @click="quickSearch(tag)"
        >
          {{ tag }}
        </el-tag>
      </div>

      <!-- 搜索结果列表 -->
      <div v-loading="searchLoading" class="collect-list-wrapper">
        <el-empty v-if="!searchResults.length && !searchLoading" description="暂无搜索结果，请输入关键词检索" />

        <div v-else class="collect-list">
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="collect-item"
            :class="{ 'is-selected': selectedItems.includes(item.id) }"
          >
            <!-- 勾选复选框 -->
            <div class="collect-item__checkbox" @click.stop="toggleSelect(item)">
              <el-checkbox :model-value="selectedItems.includes(item.id)" />
            </div>

            <!-- 图片容器 -->
            <div class="collect-item__image-box" @click="openPreview(item)">
              <img :src="item.thumbnail || item.image" :alt="item.title" class="collect-item__img" loading="lazy" />
              <div class="collect-item__badge-hd">HD 原图</div>
              <div class="collect-item__overlay">
                <span class="view-btn">查看大图</span>
              </div>
            </div>

            <!-- 素材信息 -->
            <div class="collect-item__info">
              <h4 class="collect-item__title" :title="item.title">{{ item.title || 'Kaboompics 高清摄影' }}</h4>
              <div class="collect-item__meta-row">
                <span v-if="item.width && item.height" class="collect-item__meta-tag">
                  {{ item.width }} × {{ item.height }} px
                </span>
                <span v-if="item.author" class="collect-item__author" :title="item.author">
                  📷 {{ item.author }}
                </span>
              </div>
            </div>

            <!-- 卡片底部操作按钮 -->
            <div class="collect-item__actions">
              <el-button
                type="primary"
                size="small"
                :loading="loadingItems.has(item.id)"
                :disabled="!selectedClientId"
                @click.stop="handleSyncOne(item)"
              >
                保存到贴纸素材库
              </el-button>
              <el-button
                type="info"
                plain
                size="small"
                tag="a"
                :href="item.url || item.link"
                target="_blank"
                @click.stop
              >
                原网页
              </el-button>
            </div>
          </div>
        </div>

        <!-- 统一底层分页器 -->
        <div v-if="searchResults.length" class="collect-pagination">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalResults"
            layout="prev, pager, next, jumper"
            background
            @current-change="handleSearch"
          />
        </div>
      </div>
    </div>

    <!-- 大图预览 Dialog -->
    <el-dialog v-model="previewVisible" title="素材高清原图预览" width="700px" destroy-on-close align-center>
      <div v-if="previewItem" class="preview-modal">
        <div class="preview-modal__img-box">
          <img :src="previewItem.image || previewItem.thumbnail" :alt="previewItem.title" class="preview-modal__img" />
        </div>
        <div class="preview-modal__details">
          <h3>{{ previewItem.title }}</h3>
          <p v-if="previewItem.description" class="preview-desc">{{ previewItem.description }}</p>
          <div class="preview-specs">
            <p><strong>原图尺寸:</strong> {{ previewItem.width }} × {{ previewItem.height }} px</p>
            <p><strong>摄影师:</strong> {{ previewItem.author || 'Kaboompics' }}</p>
            <p><strong>授权协议:</strong> {{ previewItem.license || 'Kaboompics License (Free for Commercial)' }}</p>
            <p v-if="previewItem.tags"><strong>标签:</strong> {{ previewItem.tags }}</p>
            <p><strong>原图链接:</strong> <a :href="previewItem.image" target="_blank" class="link-url">{{ previewItem.image }}</a></p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button
          v-if="previewItem"
          type="primary"
          :loading="loadingItems.has(previewItem.id)"
          :disabled="!selectedClientId"
          @click="handleSyncOne(previewItem)"
        >
          保存到贴纸素材库
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import { Picture } from '@element-plus/icons-vue';
import { usePluginClientNodes } from '@/services/clientNodeState';
import {
  searchKaboompicsAndWait,
  syncKaboompicsToMaterialLibraryAndWait,
  refreshKaboompicsStatus,
  type KaboompicsPhoto,
  type KaboompicsClientVO,
  type KaboompicsServiceStatus,
} from '@/api/external/kaboompics';
import { uploadMaterialFile } from '@/api/material';
import '@/styles/external-collect.css';

defineOptions({ name: 'ExternalKaboompics' });

// ─── 客户端节点管理 ──────────────────────────────────────────
const {
  clients: rawClients,
  loading: clientLoading,
  refresh: refreshClientNodes,
} = usePluginClientNodes('kaboompics');

const selectedClientId = ref<string>('');

const clientOptions = computed(() => {
  return rawClients.value.map((c) => ({
    label: `${c.deviceName || '客户端'} (${c.ip || '在线'})`,
    value: c.id,
    disabled: c.status !== 'online',
  }));
});

// 默认自动选中第一个在线节点
watch(
  clientOptions,
  (options) => {
    if (!selectedClientId.value && options.length > 0) {
      const firstOnline = options.find((o) => !o.disabled);
      if (firstOnline) {
        selectedClientId.value = firstOnline.value;
      }
    }
  },
  { immediate: true },
);

// ─── 状态 Hero 描述 ──────────────────────────────────────────
const serviceStatus = reactive<{
  state: 'idle' | 'running' | 'error';
  label: string;
  message: string;
}>({
  state: 'idle',
  label: '就绪',
  message: 'Kaboompics 免费高清图库采集服务已就绪，全量下载均为 100% 原始分辨率大图。',
});

const statusTagType = computed(() => {
  if (serviceStatus.state === 'running') return 'success';
  if (serviceStatus.state === 'error') return 'danger';
  return 'info';
});

const actionLoading = reactive({
  refreshRuntime: false,
});

const handleRefreshRuntime = async () => {
  if (!selectedClientId.value) {
    ElMessage.warning('请先选择在线客户端节点');
    return;
  }
  actionLoading.refreshRuntime = true;
  try {
    const res = await refreshKaboompicsStatus(selectedClientId.value);
    if (res.success) {
      ElMessage.success('已发送刷新节点状态指令');
    } else {
      ElMessage.error(res.message || '刷新指令发送失败');
    }
  } catch (err: any) {
    ElMessage.error(err.message || '网络请求错误');
  } finally {
    actionLoading.refreshRuntime = false;
  }
};

// ─── 搜索与分页 ──────────────────────────────────────────────
const searchKeyword = ref('cat');
const searchLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const totalResults = ref(0);
const searchResults = ref<KaboompicsPhoto[]>([]);

const quickTags = ['cat', 'coffee', 'nature', 'office', 'flower', 'lifestyle', 'travel', 'food'];

const quickSearch = (tag: string) => {
  searchKeyword.value = tag;
  handleSearch(1);
};

const handleSearch = async (page = 1) => {
  if (!selectedClientId.value) {
    ElMessage.warning('请先选择在线客户端节点');
    return;
  }
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词');
    return;
  }

  currentPage.value = page;
  searchLoading.value = true;
  selectedItems.value = [];

  try {
    const res = await searchKaboompicsAndWait(selectedClientId.value, searchKeyword.value.trim(), {
      page: currentPage.value,
      limit: pageSize.value,
    });

    if (res.success) {
      searchResults.value = res.items || [];
      totalResults.value = res.total || res.count || searchResults.value.length;
      ElMessage.success(`检索到 ${searchResults.value.length} 张 Kaboompics 高清原图`);
    } else {
      searchResults.value = [];
      ElMessage.error(res.error || '搜索失败');
    }
  } catch (error: any) {
    searchResults.value = [];
    ElMessage.error(error.message || '搜索请求发生错误');
  } finally {
    searchLoading.value = false;
  }
};

// ─── 多选与保存到贴纸素材库 (`sticker` 主表) ────────────────────
const selectedItems = ref<string[]>([]);
const loadingItems = ref<Set<string>>(new Set());
const batchDownloadLoading = ref(false);

const toggleSelect = (item: KaboompicsPhoto) => {
  const idx = selectedItems.value.indexOf(item.id);
  if (idx > -1) {
    selectedItems.value.splice(idx, 1);
  } else {
    selectedItems.value.push(item.id);
  }
};

const clearSelection = () => {
  selectedItems.value = [];
};

const getItemById = (id: string) => searchResults.value.find((item) => item.id === id);

/** 单张保存到贴纸素材库 */
const handleSyncOne = async (item: KaboompicsPhoto) => {
  if (!selectedClientId.value || !item.image) {
    ElMessage.warning('该内容没有可同步的原图链接');
    return;
  }

  loadingItems.value.add(item.id);
  try {
    // 1. 客户端下载原图并上传 COS
    const result = await syncKaboompicsToMaterialLibraryAndWait(selectedClientId.value, {
      imageUrl: item.image, // 全尺寸原图 URL
      metadata: {
        title: item.title,
        id: item.id,
        author: item.author,
        width: item.width,
        height: item.height,
      },
    });

    if (result.success) {
      const resultData = result.data?.data || result.data || {};
      if (!resultData.cosUrl) {
        ElMessage.error('图片未成功上传至个人 COS 存储，入库取消');
        return;
      }

      // 2. 直接持久化写入 sticker 核心主表
      await uploadMaterialFile({
        url: resultData.cosUrl,
        originUrl: item.url || item.image,
        name: item.title || 'Kaboompics 高清原图',
        keywords: item.tags || searchKeyword.value || 'kaboompics',
        description: item.description || `Author: ${item.author || 'Kaboompics'}`,
        source: 'kaboompics',
        suffix: 'jpg',
        meta: item,
      });

      ElMessage.success(`已成功保存原图到贴纸素材库: ${item.title}`);
    } else {
      ElMessage.error(`入库失败: ${result.message || '未知错误'}`);
    }
  } catch (error: any) {
    ElMessage.error(`入库异常: ${error.message || '网络或服务端错误'}`);
  } finally {
    loadingItems.value.delete(item.id);
  }
};

/** 批量保存到贴纸素材库 */
const handleBatchDownload = async () => {
  if (!selectedClientId.value || selectedItems.value.length === 0) return;
  batchDownloadLoading.value = true;
  let successCount = 0;
  let failCount = 0;

  ElNotification.info({
    title: '批量保存高清原图',
    message: `开始处理 ${selectedItems.value.length} 个素材原图...`,
    duration: 3000,
  });

  try {
    for (const id of selectedItems.value) {
      const item = getItemById(id);
      if (!item || !item.image) continue;

      try {
        const res = await syncKaboompicsToMaterialLibraryAndWait(selectedClientId.value, {
          imageUrl: item.image,
          metadata: {
            title: item.title,
            id: item.id,
          },
        });

        if (res.success) {
          const resultData = res.data?.data || res.data || {};
          if (!resultData.cosUrl) {
            failCount++;
            continue;
          }

          await uploadMaterialFile({
            url: resultData.cosUrl,
            originUrl: item.url || item.image,
            name: item.title || 'Kaboompics 高清原图',
            keywords: item.tags || searchKeyword.value || 'kaboompics',
            description: item.description || '',
            source: 'kaboompics',
            suffix: 'jpg',
            meta: item,
          });

          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    if (failCount === 0) {
      ElMessage.success(`批量保存高清原图成功 (${successCount} 个)`);
    } else {
      ElMessage.warning(`批量完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);
    }
  } finally {
    batchDownloadLoading.value = false;
    clearSelection();
  }
};

// ─── 大图预览 modal ──────────────────────────────────────────
const previewVisible = ref(false);
const previewItem = ref<KaboompicsPhoto | null>(null);

const openPreview = (item: KaboompicsPhoto) => {
  previewItem.value = item;
  previewVisible.value = true;
};

onMounted(() => {
  refreshClientNodes();
});
</script>

<style scoped>
.quick-tags-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.quick-tags-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}
.quick-tag-item {
  cursor: pointer;
  transition: all 0.2s ease;
}
.quick-tag-item:hover {
  transform: translateY(-1px);
  border-color: #409eff;
}
.collect-item__badge-hd {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: #00f2fe;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
  z-index: 2;
}
.preview-modal__img-box {
  text-align: center;
  max-height: 450px;
  overflow: hidden;
  border-radius: 8px;
  background: #f5f7fa;
  margin-bottom: 16px;
}
.preview-modal__img {
  max-height: 450px;
  max-width: 100%;
  object-fit: contain;
}
.preview-specs {
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.8;
  color: #475569;
}
.link-url {
  color: #409eff;
  word-break: break-all;
}
</style>
