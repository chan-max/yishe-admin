<template>
  <div>
    <div class="search-form-container">
      <form-item label="ID搜索">
        <el-input v-model="queryParams.id" clearable placeholder="请输入模板ID" style="width: 200px"
          @keyup.enter="getList"></el-input>
      </form-item>
      <form-item label="搜索">
        <el-input v-model="queryParams.searchKeyword" clearable placeholder="请输入名称、关键词或描述" style="width: 200px"
          @keyup.enter="getList"></el-input>
      </form-item>
      <form-item label="排序方式">
        <el-select v-model="queryParams.sortingFields" style="width: 160px" @change="getList">
          <el-option v-for="item in sortTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>
      <form-item label="是否可用">
        <el-select v-model="queryParams.enabled" style="width: 140px" clearable placeholder="全部" @change="getList">
          <el-option label="可用" :value="true" />
          <el-option label="不可用" :value="false" />
        </el-select>
      </form-item>
      <form-item label="适合尺寸">
        <el-select
          v-model="queryParams.suitableSizesArray"
          style="width: 280px"
          clearable
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择适合尺寸"
          popper-class="psd-size-select-dropdown"
          @change="handleQuerySuitableSizesChange"
        >
          <el-option
            v-for="config in sizeConfigs"
            :key="config.key"
            :label="getFullLabel(config)"
            :value="config.key"
          />
        </el-select>
      </form-item>
      <form-item label="抠图支持">
        <el-select
          v-model="queryParams.cutoutModesArray"
          style="width: 220px"
          clearable
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择抠图支持"
          popper-class="psd-size-select-dropdown"
          @change="handleQueryCutoutModesChange"
        >
          <el-option
            v-for="item in cutoutModeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </form-item>
      <div class="search-actions">
        <el-button type="primary" @click="getList" :icon="Search"> 搜索 </el-button>
        <el-button type="primary" :disabled="single" @click="handleAdd" :icon="Plus">
          新增
        </el-button>
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)">
          批量删除
        </el-button>
      </div>
    </div>

    <div class="flex relative overflow-visible">
      <div class="relative flex-shrink-0 z-[200] !overflow-visible" :class="folderTreeCollapsed ? 'w-0' : 'w-[280px]'">
        <div class="h-full overflow-hidden">
          <div class="h-full w-[280px]">
            <FolderTree v-model="selectedFolderId" :folder-category="FOLDER_CATEGORY" :show-count="false"
              :drag-state="dragState" @change="handleFolderChange" @folder-drag-over="handleFolderDragOver"
              @folder-drag-leave="handleFolderDragLeave" @folder-drop="handleFolderDrop" />
          </div>
        </div>
        <div
          class="absolute top-1/2 -right-4 w-8 h-16 bg-white border border-gray-200 rounded-r flex items-center justify-center cursor-pointer shadow-md z-[999] hover:bg-gray-50 text-gray-600 hover:text-primary transition-colors"
          @click="folderTreeCollapsed = !folderTreeCollapsed" style="transform: translateY(-50%)">
          <el-icon :size="14">
            <DArrowRight v-if="folderTreeCollapsed" />
            <DArrowLeft v-else />
          </el-icon>
        </div>
      </div>

      <div class="content-container" style="flex: 1; min-width: 0; overflow: hidden;">
        <!-- 表格展示 -->
        <div class="common-table">
          <vxe-grid class="psd-template-dnd-grid dnd-text-selectable" v-bind="gridOptions" :data="dataSource" :loading="loading"
            :row-class-name="getRowClassName" @checkbox-change="checkboxChange" @checkbox-all="checkboxAllChange">
            <template #dragHandleSlot>
              <div
                class="row-drag-handle flex items-center justify-center cursor-grab text-gray-400 hover:text-primary">
                <el-icon :size="14">
                  <Rank />
                </el-icon>
              </div>
            </template>
            <template #thumbnailSlot="{ row }">
              <div class="thumbnail-cell">
                <el-image v-if="row.thumbnail" :src="getPreviewImageUrl(row.thumbnail, { width: 150, height: 150, quality: 80, format: 'webp' })" :preview-src-list="[row.thumbnail]"
                  :initial-index="0" preview-teleported hide-on-click-modal fit="contain" :lazy="true"
                  class="thumbnail-image" />
                <span v-else class="thumbnail-placeholder">暂无缩略图</span>
              </div>
            </template>

            <template #titleNameDefaultSlot="{ row }">
              <div v-if="row.titleTemplateId" class="flex items-center gap-2">
                <span>
                  {{ row.titleName }}
                </span>
              </div>
              <div v-else>
                <el-button type="danger" @click="handleEdit(row)" link size="small">
                  未选择标题,点击选择
                </el-button>
              </div>
            </template>

            <template #urlSlot="{ row }">
              <div class="flex items-center gap-1">
                <a v-if="row.url" :href="row.url" target="_blank" rel="noopener" class="text-primary">
                  {{ row.url }}
                </a>
                <span v-else class="text-gray-400">无</span>
              </div>
            </template>

            <template #psdInfoSlot="{ row }">
              <div class="psd-info-cell">
                <el-button v-if="row.psdTemplateConfig" type="primary" link size="small"
                  @click="handleViewPsdInfo(row)">
                  <el-icon class="info-icon">
                    <InfoFilled />
                  </el-icon>
                  <span class="info-text">配置</span>
                </el-button>
                <span v-else class="text-gray-400 text-xs">无</span>
              </div>
            </template>

            <template #suitableSizesSlot="{ row }">
              <div class="suitable-sizes-cell-compact">
                <template v-if="row.suitableSizes && row.suitableSizes.length > 0">
                  <el-popover placement="top" :width="360" trigger="hover">
                    <template #reference>
                      <span class="size-summary-link">
                        {{ (row.suitableSizes || [])
                          .slice(0, 2)
                          .map((sizeKey) => getSizeShapeUiConfig(sizeKey)?.label || sizeKey)
                          .join(' / ') }}
                        <span v-if="row.suitableSizes.length > 2"> 等{{ row.suitableSizes.length }}个</span>
                      </span>
                    </template>
                    <div class="suitable-sizes-popover">
                      <el-tag
                        v-for="sizeKey in row.suitableSizes"
                        :key="sizeKey"
                        size="small"
                        class="size-tag-mini"
                        :style="{
                          backgroundColor: getSizeShapeUiConfig(sizeKey)?.color + '20',
                          borderColor: getSizeShapeUiConfig(sizeKey)?.color,
                          color: getSizeShapeUiConfig(sizeKey)?.color
                        }"
                      >
                        {{ getSizeShapeUiConfig(sizeKey)?.label || sizeKey }}
                      </el-tag>
                    </div>
                  </el-popover>
                </template>
                <span v-else class="text-gray-400 text-xs">未设置</span>
              </div>
            </template>

            <template #cutoutModesSlot="{ row }">
              <div class="suitable-sizes-cell-compact">
                <template v-if="row.cutoutModes && row.cutoutModes.length > 0">
                  <el-tag
                    v-for="mode in row.cutoutModes"
                    :key="mode"
                    size="small"
                    class="size-tag-mini"
                    type="info"
                  >
                    {{ getCutoutModeLabel(mode) }}
                  </el-tag>
                </template>
                <span v-else class="text-gray-400 text-xs">未设置</span>
              </div>
            </template>

            <template #pathStatusSlot="{ row }">
              <el-tag v-if="row.url && row.windowsLocalPath" type="success" size="small">远程 + 本地</el-tag>
              <el-tag v-else-if="row.url" type="primary" size="small">远程路径</el-tag>
              <el-tag v-else-if="row.windowsLocalPath" type="warning" size="small">本地路径</el-tag>
              <el-tag v-else type="info" size="small">未提供路径</el-tag>
            </template>

            <template #enabledSlot="{ row }">
              <el-tag v-if="row.enabled" type="success" size="small" effect="dark">
                可用
              </el-tag>
              <el-tag v-else type="info" size="small" effect="plain">
                不可用
              </el-tag>
            </template>

            <template #operationDefaultSlot="{ row }">
              <el-dropdown trigger="click">
                <el-button type="primary" link size="small">
                  操作
                  <el-icon class="el-icon--right">
                    <ArrowDown />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                    <el-dropdown-item @click="handleToggleEnabled(row)">
                      {{ row.enabled ? '设为不可用' : '设为可用' }}
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleAiGenerate(row)"
                      :disabled="!row.thumbnail || aiTableLoading[row.id]">
                      <span v-if="aiTableLoading[row.id]">AI生成中...</span>
                      <span v-else>AI生成内容</span>
                    </el-dropdown-item>
                    <el-dropdown-item :disabled="!row.url" @click="() => downloadFileByElement(row.url, row.name)">
                      下载源文件
                    </el-dropdown-item>
                    <el-dropdown-item divided class="dropdown-item-danger" @click="handleDelete(row)">
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </vxe-grid>
        </div>

        <!-- 分页 -->
        <div class="py-4 flex justify-end">
          <pagination :total="total" v-model:page="queryParams.currentPage" v-model:limit="queryParams.pageSize"
            @pagination="getList" />
        </div>
      </div>
    </div>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      fullscreen
      :destroy-on-close="true"
      class="psd-template-fullscreen-dialog"
      @close="dialogClose"
    >
      <div class="psd-template-dialog-layout">
        <div class="psd-template-dialog-main">
          <!-- 基础信息 -->
          <div class="dialog-section dialog-section-basic">
            <div class="dialog-section-title">基础信息</div>
            <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="psd-template-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="模板名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入模板名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="是否可用">
                    <el-switch v-model="form.enabled" :active-value="true" :inactive-value="false" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="关键词" prop="keywords">
                    <el-input v-model="form.keywords" placeholder="请输入关键词，多个关键词用逗号分隔" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="描述" prop="description">
                    <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入模板描述" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="24">
                  <el-form-item label="本地路径" prop="windowsLocalPath">
                    <el-input v-model="form.windowsLocalPath" placeholder="请输入 Windows 本地路径" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <!-- PSD 文件与缩略图 -->
          <div class="dialog-section dialog-section-assets">
            <div class="dialog-section-title">PSD 文件与缩略图</div>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form :model="form" label-width="100px">
                  <el-form-item label="PSD 文件" prop="file">
                    <el-upload
                      style="width: 100%"
                      action="#"
                      :limit="1"
                      :file-list="fileList"
                      :on-change="handleFileChange"
                      :before-upload="beforeUpload"
                      :auto-upload="false"
                      :on-remove="handleFileRemove"
                      accept=".psd"
                    >
                      <el-button type="primary">选择文件</el-button>
                      <template #tip>
                        <div class="el-upload__tip">
                          {{ isEdit ? '可选，替换则重新上传' : '可选' }}
                        </div>
                      </template>
                    </el-upload>
                  </el-form-item>
                </el-form>
              </el-col>
              <el-col :span="12">
                <el-form :model="form" label-width="100px">
                  <el-form-item label="缩略图">
                    <div class="thumbnail-upload-container">
                      <input
                        ref="thumbnailInputRef"
                        type="file"
                        accept="image/*"
                        style="display: none"
                        @change="handleThumbnailFileSelect"
                      />
                      <div
                        v-if="!thumbnailPreviewUrl && !form.thumbnail"
                        class="thumbnail-upload-placeholder"
                        @click="triggerThumbnailSelect"
                      >
                        <el-icon class="upload-icon">
                          <Plus />
                        </el-icon>
                        <div class="upload-text">上传</div>
                      </div>
                      <div v-else class="thumbnail-preview-wrapper">
                        <el-image
                          :src="getPreviewImageUrl(thumbnailPreviewUrl || form.thumbnail, { width: 180, height: 180, quality: 85, format: 'webp' })"
                          fit="contain"
                          :lazy="true"
                          class="thumbnail-preview-image"
                        />
                        <div class="thumbnail-action-buttons">
                          <el-button type="primary" size="small" @click.stop="triggerThumbnailSelect">
                            <el-icon>
                              <Edit />
                            </el-icon>
                          </el-button>
                          <el-button type="danger" size="small" @click.stop="clearThumbnail">
                            <el-icon>
                              <Delete />
                            </el-icon>
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </el-form-item>
                </el-form>
              </el-col>
            </el-row>
          </div>

          <!-- 适用尺寸 -->
          <div class="dialog-section dialog-section-sizes">
            <div class="dialog-section-title">适用尺寸</div>
            <el-form :model="form" label-width="100px" class="psd-template-form">
              <el-form-item label="选择尺寸" prop="suitableSizes">
                <el-select
                  v-model="form.suitableSizesArray"
                  multiple
                  clearable
                  placeholder="请选择适用的图片尺寸"
                  class="size-select"
                  popper-class="psd-size-select-dropdown"
                  teleported
                  :popper-append-to-body="true"
                  @change="handleSuitableSizesChange"
                >
                  <el-option
                    v-for="config in sizeConfigs"
                    :key="config.key"
                    :value="config.key"
                    :label="getFullLabel(config)"
                  />
                </el-select>

              </el-form-item>

              <el-form-item label="抠图支持" prop="cutoutModes">
                <el-select
                  v-model="form.cutoutModesArray"
                  multiple
                  clearable
                  placeholder="请选择模板支持的抠图类型"
                  class="size-select"
                  popper-class="psd-size-select-dropdown"
                  @change="handleCutoutModesChange"
                >
                  <el-option
                    v-for="item in cutoutModeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <!-- PSD 模板配置 -->
          <div class="dialog-section dialog-section-config">
            <div class="dialog-section-title">PSD 模板配置</div>
            <el-form :model="form" label-width="100px" class="psd-template-form">
              <el-form-item label="配置内容" prop="psdTemplateConfig">
                <el-input
                  v-model="form.psdTemplateConfigText"
                  type="textarea"
                  :rows="6"
                  :autosize="{ minRows: 6, maxRows: 8 }"
                  placeholder='支持 JSON 格式，如：{"images": [], "description": ""}'
                />
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="psd-template-dialog-footer">
          <div class="footer-left">
            <span class="footer-tip">填写完成后请点击“确定”保存，表单验证未通过会在对应项下方提示。</span>
          </div>
          <div class="footer-right">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- AI生成内容弹窗 -->
    <el-dialog v-model="aiGenDialogVisible" title="AI自动生成内容" width="500px" align-center :destroy-on-close="true">
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">

        <span style="color: #f56c6c; font-size: 13px;">
          注意：需要模板有缩略图才能进行AI分析
        </span>
      </div>
      <el-input v-model="aiGenPrompt" type="textarea" :rows="6"
        placeholder="例如：【T恤、男装、短袖】或【儿童地毯、地垫、游戏垫、房间装饰】。重点描述商品名称和相关的类别/兼容性关键词，方便搜索。"
        :autosize="{ minRows: 6, maxRows: 10 }" style="font-size:16px;min-height:120px;width:100%;resize:vertical;" />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
      </template>
    </el-dialog>

    <!-- psd模板配置全屏弹窗 -->
    <el-dialog v-model="psdInfoDialogVisible" title="psd模板配置" fullscreen :destroy-on-close="true">
      <div class="psd-info-fullscreen-content">
        <div class="psd-info-header">
          <div class="psd-info-title">
            <span>模板名称：</span>
            <strong>{{ currentPsdInfoRow?.name || '未知' }}</strong>
          </div>
        </div>
        <div class="psd-info-body">
          <pre class="psd-info-json-fullscreen">{{ formatPsdInfo(currentPsdInfoRow?.psdTemplateConfig) }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="psdInfoDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 拖拽提示气泡（跟随鼠标） -->
    <teleport to="body">
      <div v-show="dragHint.visible" class="drag-hint-bubble"
        :style="{ left: `${dragHint.x}px`, top: `${dragHint.y}px` }">
        <el-icon class="drag-hint-icon">
          <InfoFilled />
        </el-icon>
        <span>{{ dragHint.text }}</span>
      </div>
    </teleport>

  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, onUnmounted, watchEffect, nextTick } from "vue";
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useUserStore } from "@/store/modules/user";
import { sortTypeOptions, defaultSortingValue } from "@/common/sort";
import { ElMessage, ElMessageBox } from "element-plus";
import FolderTree from "@/components/material/FolderTree.vue";
import Sortable from "sortablejs";
// import { getShopProductCategoryList, deleteShopProductCategory, editShopProductCategory, addShopProductCategory } from "@/api/shop";
import {
  Search,
  Plus,
  Delete,
  TopRight,
  Edit,
  CirclePlusFilled,
  CirclePlus,
  ArrowDown,
  InfoFilled,
  RefreshLeft,
  Folder,
  DArrowLeft,
  DArrowRight,
  Rank,
} from "@element-plus/icons-vue";
import { useWindowSize, useLocalStorage } from "@vueuse/core";
import type { VxeGridProps } from "vxe-table";
import { psdTemplateApi } from "@/api/psdTemplate";
import { ShopPlatformApi } from "@/api/shop/platform";
import { ShopCategoryApi } from "@/api/shop/category";
import { ShopApi } from "@/api/shop/shopIndex";
import { uploadToCOS } from "@/api/cos";
import { getPreviewImageUrl } from "@/utils/image";
import { downloadFileByElement } from "@/common/download";
import {
  SIZE_SHAPE_UI_CONFIGS as sizeConfigs,
  getFullLabel,
  getSizeShapeUiConfig,
} from "../index/sizeShapeConfig";
import { useFolderRowDrag } from '@/hooks/useFolderRowDrag';
import { FOLDER_FILTER, convertFolderIdToApiParam } from '@/constants/folder';

const userStore = useUserStore()

const FOLDER_CATEGORY = "psdtemplate";
const cutoutModeOptions = [
  { label: '抠图', value: 'CUTOUT' },
  { label: '非抠图', value: 'NON_CUTOUT' },
];

const getCutoutModeLabel = (mode: string) => {
  const map = {
    CUTOUT: '抠图',
    NON_CUTOUT: '非抠图',
  };
  return map[mode] || mode;
};

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  name: "",
  id: "", // ID搜索
  searchKeyword: "", // 搜索关键字（支持名称、关键词、描述）
  enabled: undefined as boolean | undefined, // 是否可用筛选
  suitableSizesArray: [] as string[], // 适合尺寸筛选（多选）
  cutoutModesArray: [] as string[], // 抠图支持筛选（多选）
  folderId: FOLDER_FILTER.ALL as string | null, // 文件夹ID（默认显示全部）
});

const gridOptions = ref<VxeGridProps<any>>({
  ...(commonGridOptions as VxeGridProps<any>),
  maxHeight: null,
  columns: [
    {
      title: "",
      field: "dragHandle",
      width: 40,
      showOverflow: false,
      align: "center",
      slots: {
        default: "dragHandleSlot"
      }
    },
    { type: "checkbox", width: 50, showOverflow: true },

    {
      title: "缩略图",
      field: "thumbnail",
      width: 180,
      showOverflow: false,
      slots: {
        default: "thumbnailSlot",
      },
    },
    { title: "psd模板名称", field: "name", width: 240, showOverflow: true },
    {
      title: "描述",
      field: "description",
      minWidth: 200,
      showOverflow: true,
    },
    {
      title: "关键词",
      field: "keywords",
      minWidth: 150,
      showOverflow: true,
    },
    {
      title: "支持尺寸",
      field: "suitableSizes",
      minWidth: 160,
      showOverflow: true,
      slots: {
        default: "suitableSizesSlot",
      },
    },
    {
      title: "抠图支持",
      field: "cutoutModes",
      minWidth: 180,
      showOverflow: true,
      slots: {
        default: "cutoutModesSlot",
      },
    },
    {
      title: "psd模板配置",
      field: "psdTemplateConfig",
      minWidth: 200,
      showOverflow: true,
      slots: {
        default: "psdInfoSlot",
      },
    },
        { title: "ID", field: "id", width: 140, showOverflow: true },
    {
      title: "本地路径",
      field: "windowsLocalPath",
      minWidth: 200,
      showOverflow: true,
    },
    {
      title: "URL",
      field: "url",
      minWidth: 220,
      showOverflow: true,
      slots: {
        default: "urlSlot",
      },
    },
    {
      title: "文件大小",
      field: "size",
      width: 100,
      showOverflow: true,
      formatter: ({ cellValue }) => {
        if (!cellValue) return '0 B';
        const k = 1024;
        const ns = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(cellValue) / Math.log(k));
        return parseFloat((cellValue / Math.pow(k, i)).toFixed(2)) + ' ' + ns[i];
      },
    },
    {
      title: "路径状态",
      field: "pathStatus",
      width: 140,
      showOverflow: true,
      slots: {
        default: "pathStatusSlot",
      },
    },
    {
      title: "是否可用",
      field: "enabled",
      width: 100,
      showOverflow: true,
      slots: {
        default: "enabledSlot",
      },
    },

    { title: "创建人", field: "creatorName", minWidth: 100, showOverflow: true }, // 该类目下已经发布的商品数量
    {
      title: "创建时间",
      field: "createTime",
      width: 150,
      showOverflow: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue);
      },
    },
    {
      title: "修改时间",
      field: "updateTime",
      width: 150,
      showOverflow: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue);
      },
    },
    {
      title: "操作",
      fixed: "right",
      showOverflow: false,
      width: 80,
      slots: {
        default: "operationDefaultSlot",
      },
    },
  ],
} as VxeGridProps<any>);

const { height } = useWindowSize();

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 260;
});

const dataSource = ref([]);
const loading = ref(false);
const open = ref(false);
const title = ref("");
const ids = ref([]);
const single = ref(false);
const multiple = ref(true);
const total = ref(0);
const formRef = ref();
const dialogTitle = ref("");
const dialogVisible = ref(false);
const isEdit = ref(true);
const submitLoading = ref(false);

// 拖拽状态（拖模板 -> 文件夹）
const {
  dragState,
  dragHint,
  setupRowDrag,
  handleFolderDragOver,
  handleFolderDragLeave,
  resetAfterDrop
} = useFolderRowDrag({
  gridClass: 'psd-template-dnd-grid',
  itemLabel: '模板',
  dataSource,
  selectedIds: ids
});

async function getList() {
  loading.value = true;

  const { suitableSizesArray, cutoutModesArray, ...restQueryParams } = queryParams;

  let params = {
    ...restQueryParams,
    // 转换文件夹ID为后端API参数
    folderId: convertFolderIdToApiParam(queryParams.folderId),
    suitableSizes: suitableSizesArray?.length ? suitableSizesArray.join(',') : undefined,
    cutoutModes: cutoutModesArray?.length ? cutoutModesArray.join(',') : undefined,
  };

  let res = await psdTemplateApi
    .getPsdTemplatePage({
      ...params,
    })
    .catch(() => { })
    .finally(() => {
      loading.value = false;
    });
  // convert suitableSizes field to array for easier handling
  dataSource.value = (res.list || []).map(item => {
    if (item && typeof item.suitableSizes === 'string') {
      try {
        item.suitableSizes = item.suitableSizes ? item.suitableSizes.split(',') : [];
      } catch (e) {
        item.suitableSizes = [];
      }
    }
    if (item && typeof item.cutoutModes === 'string') {
      try {
        item.cutoutModes = item.cutoutModes ? item.cutoutModes.split(',').map(mode => mode.trim()).filter(Boolean) : [];
      } catch (e) {
        item.cutoutModes = [];
      }
    }
    return item;
  });
  total.value = res.total;
  ids.value = [];

  // 列表渲染完成后挂载拖拽（使用 SortableJS）
  nextTick(setupRowDrag);
}

getList();

// ============= 文件夹相关 =============
const folderTreeCollapsed = useLocalStorage('psd_template_folder_collapsed', false);
const selectedFolderId = ref<string | null>(FOLDER_FILTER.ALL); // 默认选中"全部"

function handleFolderChange(payload: { folderId: string | null }) {
  // 直接使用传入的 folderId，现在使用明确的常量标识
  queryParams.folderId = payload.folderId || FOLDER_FILTER.ALL;
  queryParams.currentPage = 1;
  getList();
}

async function handleFolderDrop(payload: { data: any }) {
  if (!dragState.draggingIds.length) return;

  // 使用新的常量标识处理目标文件夹ID
  let targetFolderId: string | null = null;
  if (payload.data.id === FOLDER_FILTER.NOT_GROUP) {
    targetFolderId = FOLDER_FILTER.NOT_GROUP; // 拖到未分组
  } else if (payload.data.id === FOLDER_FILTER.ALL) {
    // 不允许拖到"全部"
    ElMessage.warning('不能移动到"全部"');
    resetAfterDrop();
    return;
  } else {
    targetFolderId = payload.data.id; // 普通文件夹
  }
  
  const targetPath = payload.data.path || '';
  const movingIds = [...dragState.draggingIds];

  try {
    await psdTemplateApi.batchMove({ 
      ids: movingIds, 
      folderId: convertFolderIdToApiParam(targetFolderId) 
    });
    ElMessage.success(`已移动 ${movingIds.length} 个模板到 ${targetPath || '未分组'}`);

    // Stay in the current folder, just refresh the list
    await getList();
    ids.value = [];
  } catch (error) {
    ElMessage.error((error as Error).message || '移动失败');
  } finally {
    resetAfterDrop();
  }
}

// 操作函数
function handleQuery() {
  queryParams.currentPage = 1;
}

function handleQuerySuitableSizesChange() {
  queryParams.currentPage = 1;
  getList();
}

function handleQueryCutoutModesChange() {
  queryParams.currentPage = 1;
  getList();
}

function resetQuery() {
  getList();
}

function handleDelete(row?) {
  let delIds: any = null;
  if (row) {
    delIds = [row.id];
  } else if (!ids.value.length) {
    return ElMessage.warning("请选择要删除的数据");
  } else {
    delIds = [...ids.value];
  }

  ElMessageBox.confirm("确认删除该数据吗", "删除提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "error",
  })
    .then(async () => {
      console.log("执行删除");
      await psdTemplateApi.deleteShopTemplate({ ids: delIds });
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => { });
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建模板";
  form.value = {
    id: "",
    file: null,
    name: "",
    description: "",
    keywords: "",
    windowsLocalPath: "",
    thumbnail: "",
    thumbnailFile: null,
    psdTemplateConfig: null,
    psdTemplateConfigText: "",
    enabled: false, // 默认不可用
    size: 0,
    suitableSizesArray: [],
    cutoutModesArray: [],
  };
  // 清空预览
  if (thumbnailPreviewUrl.value) {
    URL.revokeObjectURL(thumbnailPreviewUrl.value);
    thumbnailPreviewUrl.value = '';
  }
}

function handleEdit(row) {
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";

  form.value = {
    ...row,
    enabled: row.enabled !== undefined ? row.enabled : false, // 确保enabled有默认值
    suitableSizesArray: Array.isArray(row.suitableSizes) ? row.suitableSizes : (row.suitableSizes ? row.suitableSizes.split(',') : []),
    cutoutModesArray: Array.isArray(row.cutoutModes) ? row.cutoutModes : (row.cutoutModes ? row.cutoutModes.split(',') : []),
  };
  // 清空已选文件列表，只在需要时重新选择文件
  fileList.value = [];
  form.value.file = null;

  // 处理psdTemplateConfig：如果是对象，转换为JSON字符串显示
  if (form.value.psdTemplateConfig) {
    try {
      form.value.psdTemplateConfigText = typeof form.value.psdTemplateConfig === 'string'
        ? form.value.psdTemplateConfig
        : JSON.stringify(form.value.psdTemplateConfig, null, 2);
    } catch (e) {
      form.value.psdTemplateConfigText = '';
    }
  } else {
    form.value.psdTemplateConfigText = '';
  }

  // 清空预览（编辑时显示已有的缩略图）
  if (thumbnailPreviewUrl.value) {
    URL.revokeObjectURL(thumbnailPreviewUrl.value);
    thumbnailPreviewUrl.value = '';
  }
}

function cancel() {
  open.value = false;
}

const form = ref<any>({
  id: "",
  file: null,
  name: "",
  description: "",
  keywords: "",
  windowsLocalPath: "",
  thumbnail: "",
  thumbnailFile: null,
  psdTemplateConfig: null,
  psdTemplateConfigText: "", // 用于表单编辑的文本字段
  enabled: false, // 是否可用，默认不可用
  size: 0,
  cutoutModesArray: [],
});

// AI生成内容相关
const aiGenDialogVisible = ref(false);
const aiGenPrompt = ref('');
const aiDefaultPrompt = `请描述这是什么商品/物品，以及相关的类别关键词。例如：【T恤、男装、短袖】或【儿童地毯、地垫、游戏垫、房间装饰】。重点是商品名称和兼容性关键词和相似商品的关联词，并且尽可能详细一些，方便用户搜索找到。`;
const aiGenDialogLoading = ref(false);
const aiGenRow = ref<any>(null);
const aiTableLoading = ref<Record<string, boolean>>({});

// psd模板配置全屏弹窗相关
const psdInfoDialogVisible = ref(false);
const currentPsdInfoRow = ref<any>(null);

const rules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  // 描述和关键词改为非必填
  // titleTemplateId: [{ required: true, message: "请选择标题模板", trigger: "blur" }],
  // file: [{ required: true, message: "请选择 PSD 文件", trigger: "blur" }], // PSD 文件改为非必填
};

const dialogClose = () => {
  dialogVisible.value = false;
  fileList.value = [];
  // 释放预览URL
  if (thumbnailPreviewUrl.value) {
    URL.revokeObjectURL(thumbnailPreviewUrl.value);
    thumbnailPreviewUrl.value = '';
  }
  submitLoading.value = false;
};

function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id);
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id);
}

const submitForm = async () => {
  submitLoading.value = true;
  await formRef.value.validate().finally(() => {
    submitLoading.value = false;
  });

  try {
    if (isEdit.value) {
      submitLoading.value = true;

      // 如果有新的 PSD 文件，先上传并替换
      let url = form.value.url;
      let key = form.value.key;
      if (form.value.file) {
        const userAccount = (userStore.user as any)?.account || userStore.user?.shortName || userStore.user?.name || 'anonymous'
        const cos = await uploadToCOS({
          file: form.value.file,
          category: 'psd-template',
          account: userAccount,
          entityId: form.value.id, // 编辑时使用现有 ID
          isThumbnail: false
        });
        key = cos.key;
        url = cos.url;
      }

      // 如果有新的缩略图文件，先上传
      let thumbnail = form.value.thumbnail;
      if (form.value.thumbnailFile) {
        const userAccount = (userStore.user as any)?.account || userStore.user?.shortName || userStore.user?.name || 'anonymous'
        const thumbnailCos = await uploadToCOS({
          file: form.value.thumbnailFile,
          category: 'psd-template',
          account: userAccount,
          entityId: form.value.id, // 编辑时使用现有 ID
          isThumbnail: true
        });
        thumbnail = thumbnailCos.url; // 直接存储URL字符串
      }

      // 处理psdTemplateConfig：将文本转换为JSON对象（支持JSON和JS对象格式）
      let psdTemplateConfig = null;
      if (form.value.psdTemplateConfigText && form.value.psdTemplateConfigText.trim()) {
        try {
          psdTemplateConfig = parsePsdInfoText(form.value.psdTemplateConfigText);
        } catch (e: any) {
          ElMessage.error(e.message || 'psd模板配置格式错误，请输入有效的JSON或JavaScript对象格式');
          submitLoading.value = false;
          return;
        }
      }

      await psdTemplateApi.updatePsdTemplate({
        id: form.value.id,
        name: form.value.name,
        description: form.value.description || "",
        keywords: form.value.keywords || "",
        windowsLocalPath: form.value.windowsLocalPath || "",
        url: url || undefined,
        key: key || undefined,
        thumbnail: thumbnail || "", // 确保是字符串
        psdTemplateConfig: psdTemplateConfig,
        enabled: form.value.enabled !== undefined ? form.value.enabled : false,
        size: form.value.size,
        suitableSizes: form.value.suitableSizesArray ? form.value.suitableSizesArray.join(',') : "",
        cutoutModes: form.value.cutoutModesArray ? form.value.cutoutModesArray.join(',') : "",
      });
      ElMessage.success("更新成功");
      // 释放预览URL
      if (thumbnailPreviewUrl.value) {
        URL.revokeObjectURL(thumbnailPreviewUrl.value);
        thumbnailPreviewUrl.value = '';
      }
      getList();
    } else {
      submitLoading.value = true;

      // 上传PSD文件（如果存在）
      let url = "";
      let key = "";
      const userAccount = userStore.user?.account || userStore.user?.shortName || userStore.user?.name || 'anonymous'
      if (form.value.file) {
        const cos = await uploadToCOS({
          file: form.value.file,
          category: 'psd-template',
          account: userAccount,
          // 新增时没有 ID，先上传，创建后再更新路径（如果需要）
          isThumbnail: false
        });
        key = cos.key;
        url = cos.url;
      }

      // 上传缩略图（如果有）
      let thumbnail = "";
      if (form.value.thumbnailFile) {
        const thumbnailCos = await uploadToCOS({
          file: form.value.thumbnailFile,
          category: 'psd-template',
          account: userAccount,
          // 新增时没有 ID，先上传，创建后再更新路径（如果需要）
          isThumbnail: true
        });
        thumbnail = thumbnailCos.url; // 直接存储URL字符串
      }

      // 处理psdTemplateConfig：将文本转换为JSON对象（支持JSON和JS对象格式）
      let psdTemplateConfig = null;
      if (form.value.psdTemplateConfigText && form.value.psdTemplateConfigText.trim()) {
        try {
          psdTemplateConfig = parsePsdInfoText(form.value.psdTemplateConfigText);
        } catch (e: any) {
          ElMessage.error(e.message || 'psd模板配置格式错误，请输入有效的JSON或JavaScript对象格式');
          submitLoading.value = false;
          return;
        }
      }

      await psdTemplateApi.createPsdTemplate({
        name: form.value.name,
        description: form.value.description || "",
        keywords: form.value.keywords || "",
        windowsLocalPath: form.value.windowsLocalPath || "",
        url: url || undefined,
        key: key || undefined,
        thumbnail: thumbnail,
        file: null,
        uploaderId: userStore.user?.id,
        psdTemplateConfig: psdTemplateConfig,
        enabled: form.value.enabled !== undefined ? form.value.enabled : false,
        size: form.value.size,
        suitableSizes: form.value.suitableSizesArray ? form.value.suitableSizesArray.join(',') : "",
        cutoutModes: form.value.cutoutModesArray ? form.value.cutoutModesArray.join(',') : "",
      });
      ElMessage.success("添加成功");
      // 释放预览URL
      if (thumbnailPreviewUrl.value) {
        URL.revokeObjectURL(thumbnailPreviewUrl.value);
        thumbnailPreviewUrl.value = '';
      }
      getList();
    }

    dialogVisible.value = false;
  } catch (e) {
    console.error('提交失败:', e);
    ElMessage.error('操作失败，请重试');
  } finally {
    submitLoading.value = false;
    dialogVisible.value = false;
  }
};

/**
 * @psd文件处理
 */

const fileList = ref([]);
const thumbnailInputRef = ref();
const thumbnailPreviewUrl = ref(''); // 新选择的文件预览URL

// 文件选择改变时的回调
const handleFileChange = (file, files) => {
  fileList.value = files; // 更新文件列表
  form.value.name = file.name;
  form.value.file = file.raw; // 将文件绑定到表单数据
  form.value.size = file.size; // 记录文件大小
};

// 文件移除时的回调
const handleFileRemove = () => {
  fileList.value = []; // 清空文件列表
  form.value.file = null; // 清空表单中的文件
};

// 文件上传前的校验
const beforeUpload = (file) => { };

// 触发缩略图文件选择
const triggerThumbnailSelect = () => {
  thumbnailInputRef.value?.click();
};

// 缩略图文件选择处理
const handleThumbnailFileSelect = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // 校验文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件!');
    event.target.value = ''; // 清空选择
    return;
  }

  // 限制缩略图大小为 10MB
  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    ElMessage.error('缩略图大小不能超过 10MB!');
    event.target.value = '';
    return;
  }

  // 创建预览URL
  if (thumbnailPreviewUrl.value) {
    URL.revokeObjectURL(thumbnailPreviewUrl.value);
  }
  thumbnailPreviewUrl.value = URL.createObjectURL(file);
  form.value.thumbnailFile = file;

  // 清空input，允许重复选择同一文件
  event.target.value = '';
};

// 清除缩略图
const clearThumbnail = () => {
  // 释放预览URL
  if (thumbnailPreviewUrl.value) {
    URL.revokeObjectURL(thumbnailPreviewUrl.value);
    thumbnailPreviewUrl.value = '';
  }
  form.value.thumbnail = "";
  form.value.thumbnailFile = null;
  if (thumbnailInputRef.value) {
    thumbnailInputRef.value.value = '';
  }
};

// AI生成内容相关方法
function handleAiGenerate(row) {
  if (aiTableLoading.value[row.id]) return;
  if (!row.thumbnail) {
    ElMessage.warning('该模板没有缩略图，无法进行AI分析');
    return;
  }
  aiGenRow.value = row;
  aiGenPrompt.value = aiDefaultPrompt;
  aiGenDialogVisible.value = true;
}

async function submitAiGenDialog() {
  if (!aiGenRow.value) return;
  aiGenDialogLoading.value = true;
  aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.value.id]: true };
  try {
    await handleAiAutoGenerate(aiGenRow.value, () => {
      aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.value.id]: false };
      aiGenDialogLoading.value = false;
      aiGenDialogVisible.value = false;
      aiGenRow.value = null;
    }, aiGenPrompt.value);
  } catch (e) {
    aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.value.id]: false };
    aiGenDialogLoading.value = false;
    aiGenDialogVisible.value = false;
    aiGenRow.value = null;
  }
}

async function handleAiAutoGenerate(row, cb, prompt) {
  try {
    // 调用PSD模板的AI补全接口
    const res = await psdTemplateApi.aiCompleteContent(row.id, prompt || '');

    // 更新行数据
    if (res) {
      row.name = res.name || row.name;
      row.description = res.description || row.description;
      row.keywords = res.keywords || row.keywords;
    }

    ElMessage.success('AI自动生成内容成功');
    if (typeof cb === 'function') cb();
    getList();
  } catch (e) {
    ElMessage.error('AI自动生成内容失败');
    if (typeof cb === 'function') cb();
  }
}

// 解析psd模板配置文本（支持JSON和JS对象格式）
function parsePsdInfoText(text: string): any {
  if (!text || !text.trim()) return null;

  const trimmedText = text.trim();

  // 先尝试 JSON.parse（标准JSON格式）
  try {
    return JSON.parse(trimmedText);
  } catch (e) {
    // 如果 JSON.parse 失败，尝试解析 JavaScript 对象格式
    try {
      // 使用 new Function 安全地解析 JavaScript 对象格式
      // 例如：{images: [], description: ""} 或 {images:[],description:""}
      const func = new Function('return ' + trimmedText);
      const result = func();
      // 验证返回的是对象
      if (typeof result === 'object' && result !== null) {
        return result;
      }
      throw new Error('解析结果不是对象');
    } catch (e2) {
      throw new Error('格式错误：请输入有效的JSON格式（如：{"images": []}）或JavaScript对象格式（如：{images: []}）');
    }
  }
}

// 查看psd模板配置
function handleViewPsdInfo(row: any) {
  currentPsdInfoRow.value = row;
  psdInfoDialogVisible.value = true;
}

// 格式化psd模板配置显示（支持后端返回的新数据结构）
function formatPsdInfo(psdInfo: any): string {
  if (!psdInfo) return '无';

  try {
    // 如果是字符串，尝试解析
    let info = typeof psdInfo === 'string' ? JSON.parse(psdInfo) : psdInfo;

    // 确保处理后端返回的新数据结构（包含 artboards, smart_objects 等）
    // 如果已经是对象，直接使用；如果是字符串，解析后使用
    if (typeof info === 'object' && info !== null) {
      // 格式化为可读的JSON字符串
      return JSON.stringify(info, null, 2);
    }

    // 如果解析失败，直接返回字符串
    return String(psdInfo);
  } catch (e) {
    // 如果解析失败，直接返回字符串
    return String(psdInfo);
  }
}

// 获取行样式类名
function getRowClassName({ row }) {
  let className = row.enabled ? 'row-enabled' : 'row-disabled';
  if (dragState.dragging && dragState.draggingIds.includes(String(row.id))) {
    className += ' is-dragging-row';
  }
  return className;
}

// 处理切换是否可用状态
async function handleToggleEnabled(row: any) {
  const newEnabled = !row.enabled;
  try {
    await psdTemplateApi.updatePsdTemplate({
      id: row.id,
      name: row.name,
      description: row.description || "",
      keywords: row.keywords || "",
      windowsLocalPath: row.windowsLocalPath || "",
      url: row.url || undefined,
      key: row.key || undefined,
      thumbnail: row.thumbnail || "",
      psdTemplateConfig: row.psdTemplateConfig,
      enabled: newEnabled,
    });
    row.enabled = newEnabled;
    ElMessage.success(newEnabled ? '已设为可用' : '已设为不可用');
  } catch (e) {
    ElMessage.error('更新状态失败，请重试');
  }
}


// ============= 适用尺寸相关 =============
// 处理适用尺寸变化
function handleSuitableSizesChange(values: string[]) {
  if (form.value) {
    form.value.suitableSizesArray = values;
  }
}

// 处理抠图支持类型变化
function handleCutoutModesChange(values: string[]) {
  if (form.value) {
    form.value.cutoutModesArray = values;
  }
}

// 移除某个适用尺寸
function removeSuitableSize(sizeKey: string) {
  if (form.value && form.value.suitableSizesArray) {
    const index = form.value.suitableSizesArray.indexOf(sizeKey);
    if (index > -1) {
      form.value.suitableSizesArray.splice(index, 1);
    }
  }
}

</script>

<style lang="less" scoped>
.search-form-container {
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  width: 100%;
  box-sizing: border-box;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  :deep(.form-item) {
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .search-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-left: auto;
    flex-shrink: 0;

    .el-button {
      flex-shrink: 0;
    }
  }

  @media (max-width: 1200px) {
    gap: 10px;
    padding: 10px 16px;

    .search-actions {
      gap: 8px;

      .el-button {
        padding: 8px 12px;
        font-size: 13px;
      }
    }
  }

  @media (max-width: 768px) {
    gap: 8px;
    padding: 10px 12px;
    flex-direction: column;
    align-items: stretch;

    :deep(.form-item) {
      width: 100%;
    }

    .search-actions {
      margin-left: 0;
      width: 100%;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  @media (max-width: 480px) {
    gap: 6px;
    padding: 8px 10px;

    :deep(.form-item) {
      width: 100%;
    }

    .search-actions {
      gap: 4px;

      .el-button {
        flex: 1;
        font-size: 12px;
        padding: 6px 8px;
      }
    }
  }
}

.thumbnail-cell {
  display: flex;
  align-items: center;
  padding: 4px;

  .thumbnail-image {
    width: 120px;
    height: auto;
    max-height: 120px;
    min-height: 60px;
    object-fit: contain;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    cursor: pointer;
  }

  .thumbnail-placeholder {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }
}

.psd-template-fullscreen-dialog {
  :deep(.el-dialog) {
    display: flex;
    flex-direction: column;
    height: 100vh;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    flex: 1;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 20px 14px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }
}

.psd-template-dialog-layout {
  height: 100%;
  padding: 0 20px 16px;
  box-sizing: border-box;
}

.psd-template-dialog-main {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
  grid-template-areas:
    "basic assets"
    "sizes config";
  gap: 14px;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.dialog-section {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 14px 16px 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--el-border-color-lighter);
  min-height: 0;
}

.dialog-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}

.dialog-section-basic {
  grid-area: basic;
}

.dialog-section-assets {
  grid-area: assets;
}

.dialog-section-sizes {
  grid-area: sizes;
}

.dialog-section-config {
  grid-area: config;
}

.psd-template-form {
  :deep(.el-form-item) {
    margin-bottom: 10px;
  }
}

.size-select {
  width: 100%;
}

/* list column tags wrap */

/* 修复支持尺寸插槽高度遮挡问题 */
.suitable-sizes-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-start;
  min-height: 28px;
  max-width: 100%;
  overflow: visible;
  line-height: 1.5;
}


.suitable-sizes-cell .size-tag-mini {
  white-space: normal;
  line-height: 1.4 !important;
  padding: 2px 6px !important;
}

.suitable-sizes-cell-compact {
  display: flex;
  align-items: center;
  min-height: 24px;
}

.size-summary-link {
  display: inline-block;
  max-width: 100%;
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suitable-sizes-popover {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 100%;
}

/* ensure table rows and cells can grow with content, and fix cell clipping */
.psd-template-dnd-grid .vxe-body--row {
  height: auto !important;
  min-height: 32px !important;
}
.psd-template-dnd-grid .vxe-body--cell {
  white-space: normal !important;
  height: auto !important;
  min-height: 28px !important;
  overflow: visible !important;
  vertical-align: top !important;
}

.size-option-simple {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  width: 100%;
}

.size-option-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  min-width: 100px;
}

.size-option-ratio {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.size-option-key {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-family: 'Courier New', monospace;
}

// 调整下拉项高度，避免内容被裁切
:deep(.psd-size-select-dropdown) {
  max-height: calc(100vh - 200px) !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

:deep(.el-select-dropdown__wrap) {
  max-height: calc(100vh - 200px) !important;
  overflow-y: auto !important;
}

:deep(.el-select-dropdown__list) {
  max-height: calc(100vh - 200px) !important;
  overflow-y: auto !important;
  padding: 4px 0;
}

:deep(.el-select-dropdown__item) {
  padding: 6px 12px;
  min-height: auto;
  height: auto;
  line-height: 1.4;
  display: flex;
  align-items: center;
  position: relative;
}

:deep(.el-select-dropdown__item:hover) {
  background-color: var(--el-fill-color-light);
}



.psd-template-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.psd-template-dialog-footer .footer-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.psd-template-dialog-footer .footer-right {
  display: flex;
  gap: 8px;
}

@media (max-width: 1200px) {
  .psd-template-dialog-layout {
    height: auto;
    padding: 0 16px 16px;
  }

  .psd-template-dialog-main {
    grid-template-columns: 1fr;
    grid-template-areas:
      "basic"
      "assets"
      "sizes"
      "config";
    overflow-y: auto;
  }
}


// 行样式区分是否可用
:deep(.row-disabled) {
  background-color: var(--el-fill-color-lighter) !important;
  opacity: 0.4;

  &:hover {
    background-color: var(--el-fill-color-light) !important;
    opacity: 0.55;
  }
}

.psd-info-cell {
  display: flex;
  align-items: center;

  .info-icon {
    font-size: 14px;
    margin-right: 4px;
  }

  .info-text {
    line-height: 1;
  }
}

.psd-info-fullscreen-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);

  .psd-info-header {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color);
    background: var(--el-fill-color-lighter);

    .psd-info-title {
      font-size: 16px;
      color: var(--el-text-color-primary);

      strong {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }
  }

  .psd-info-body {
    flex: 1;
    overflow: auto;
    padding: 20px;
    background: var(--el-bg-color);
  }

  .psd-info-json-fullscreen {
    margin: 0;
    padding: 20px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.8;
    color: var(--el-text-color-primary);
    white-space: pre-wrap;
    word-break: break-all;
    font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
    border: 1px solid var(--el-border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    max-width: 100%;
    overflow-x: auto;
  }
}


.thumbnail-upload-container {
  width: 100%;

  .thumbnail-upload-placeholder {
    width: 120px;
    height: 120px;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    background: var(--el-fill-color-lighter);
    padding: 8px;
    box-sizing: border-box;

    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    .upload-icon {
      font-size: 28px;
      color: var(--el-text-color-placeholder);
      margin-bottom: 8px;
      flex-shrink: 0;
    }

    .upload-text {
      font-size: 14px;
      color: var(--el-text-color-regular);
      margin-bottom: 4px;
      text-align: center;
      line-height: 1.4;
      word-break: break-word;
      width: 100%;
    }

    .upload-tip {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      text-align: center;
      line-height: 1.4;
      word-break: break-word;
      width: 100%;
    }
  }

  .thumbnail-preview-wrapper {
    width: 120px;
    min-height: 120px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    background: var(--el-fill-color-lighter);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .thumbnail-preview-image {
      width: 120px;
      height: auto;
      object-fit: contain;
    }

    .thumbnail-action-buttons {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 4px;
      padding: 4px;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);

      .el-button {
        padding: 4px 8px;
        font-size: 12px;

        .el-icon {
          font-size: 12px;
        }
      }
    }
  }
}
</style>
