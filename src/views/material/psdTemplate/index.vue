<template>
  <div>
    <div class="search-form-container">
      <div class="search-form-left">
        <form-item label="ID搜索">
          <el-input
            v-model="queryParams.id"
            clearable
            placeholder="请输入模板ID"
            style="width: 200px"
            @keyup.enter="getList"
          ></el-input>
        </form-item>
        <form-item label="搜索">
          <el-input
            v-model="queryParams.searchKeyword"
            clearable
            placeholder="请输入名称、关键词或描述"
            style="width: 200px"
            @keyup.enter="getList"
          ></el-input>
        </form-item>
        <el-button type="primary" @click="getList" :icon="Search"> 搜索 </el-button>

        <form-item label="排序方式">
          <el-select
            v-model="queryParams.sortingFields"
            style="width: 160px"
            @change="getList"
          >
            <el-option
              v-for="item in sortTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </form-item>

        <form-item label="是否可用">
          <el-select
            v-model="queryParams.enabled"
            style="width: 140px"
            clearable
            placeholder="全部"
            @change="getList"
          >
            <el-option label="可用" :value="true" />
            <el-option label="不可用" :value="false" />
          </el-select>
        </form-item>
      </div>

      <div class="search-form-right">
        <!-- 修改按钮 -->
        <el-button type="primary" :disabled="single" @click="handleAdd" :icon="Plus">
          新增
        </el-button>
        <!-- 删除按钮 -->
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)">
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 表格展示 -->
    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        :row-class-name="getRowClassName"
        @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange"
      >
        <template #thumbnailSlot="{ row }">
          <div class="thumbnail-cell">
            <el-image
              v-if="row.thumbnail"
              :src="getPreviewImageUrl(row.thumbnail, { width: 200, quality: 80, format: 'webp' })"
              :preview-src-list="[row.thumbnail]"
              :initial-index="0"
              preview-teleported
              hide-on-click-modal
              fit="contain"
              :lazy="true"
              class="thumbnail-image"
            />
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
            <el-button
              v-if="row.psdTemplateConfig"
              type="primary"
              link
              size="small"
              @click="handleViewPsdInfo(row)"
            >
              <el-icon class="info-icon"><InfoFilled /></el-icon>
              <span class="info-text">配置</span>
            </el-button>
            <span v-else class="text-gray-400 text-xs">无</span>
          </div>
        </template>

        <template #pathStatusSlot="{ row }">
          <el-tag v-if="row.url && row.windowsLocalPath" type="success" size="small">远程 + 本地</el-tag>
          <el-tag v-else-if="row.url" type="primary" size="small">远程路径</el-tag>
          <el-tag v-else-if="row.windowsLocalPath" type="warning" size="small">本地路径</el-tag>
          <el-tag v-else type="info" size="small">未提供路径</el-tag>
        </template>

        <template #enabledSlot="{ row }">
          <el-tag
            v-if="row.enabled"
            type="success"
            size="small"
            effect="dark"
          >
            可用
          </el-tag>
          <el-tag
            v-else
            type="info"
            size="small"
            effect="plain"
          >
            不可用
          </el-tag>
        </template>

        <template #operationDefaultSlot="{ row }">
          <el-dropdown trigger="click">
            <el-button type="primary" link size="small">
              操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                <el-dropdown-item @click="handleToggleEnabled(row)">
                  {{ row.enabled ? '设为不可用' : '设为可用' }}
                </el-dropdown-item>
                <el-dropdown-item 
                  @click="handleAiGenerate(row)"
                  :disabled="!row.thumbnail || aiTableLoading[row.id]"
                >
                  <span v-if="aiTableLoading[row.id]">AI生成中...</span>
                  <span v-else>AI生成内容</span>
                </el-dropdown-item>
                <el-dropdown-item @click="() => downloadFileByElement(row.url, row.name)">
                  下载源文件
                </el-dropdown-item>
                <el-dropdown-item 
                  divided 
                  class="dropdown-item-danger" 
                  @click="handleDelete(row)"
                >
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
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      @close="dialogClose"
      align-center
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="关键词" prop="keywords">
              <el-input
                v-model="form.keywords"
                placeholder="请输入关键词，多个关键词用逗号分隔"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="请输入模板描述"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="Windows 本地路径" prop="windowsLocalPath">
              <el-input
                v-model="form.windowsLocalPath"
                placeholder="请输入 Windows 本地路径（将按原样保存）"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模板文件" prop="file">
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
                <el-button type="primary">选择 PSD 文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    {{ isEdit ? '如需替换 PSD 文件，请重新上传；不上传则保留原文件' : '只能上传 PSD 文件（可选）' }}
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="psd模板配置" prop="psdTemplateConfig">
              <el-input
                v-model="form.psdTemplateConfigText"
                type="textarea"
                :rows="8"
                :autosize="{ minRows: 8, maxRows: 15 }"
                placeholder='请输入psd模板配置（支持JSON或JS对象格式），例如：{"images": [], "description": ""} 或 {images: [], description: ""}'
              />
              <div class="el-form-item__tip" style="margin-top: 4px; color: #909399; font-size: 12px;">
                提示：支持JSON格式（键需引号）或JavaScript对象格式（键无需引号），例如：{"images": []} 或 {images: []}
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="24">
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
                  <el-icon class="upload-icon"><Plus /></el-icon>
                  <div class="upload-text">点击上传缩略图</div>
                  <div class="upload-tip">支持 jpg、png 等图片格式</div>
                </div>
                <div v-else class="thumbnail-preview-wrapper">
                  <el-image
                    :src="thumbnailPreviewUrl || form.thumbnail"
                    fit="contain"
                    :lazy="true"
                    class="thumbnail-preview-image"
                  />
                  <div class="thumbnail-action-buttons">
                    <el-button type="primary" size="small" @click.stop="triggerThumbnailSelect">
                      <el-icon><Edit /></el-icon>
                      替换
                    </el-button>
                    <el-button type="danger" size="small" @click.stop="clearThumbnail">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="是否可用">
              <el-switch
                v-model="form.enabled"
                :active-value="true"
                :inactive-value="false"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <!-- AI生成内容弹窗 -->
    <el-dialog
      v-model="aiGenDialogVisible"
      title="AI自动生成内容"
      width="500px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">
        请描述这张 PSD 模板对应的“商品是什么、物品是什么”，这是最重要的。同时提供相关的类别关键词和兼容性关键词（如：T恤/男装/短袖、地毯/地垫/房间装饰），以便用户通过搜索商品类别能找到这个模板。
        <br />
        <span style="color: #f56c6c; font-size: 13px;">
          注意：需要模板有缩略图才能进行AI分析
        </span>
      </div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="例如：【T恤、男装、短袖】或【儿童地毯、地垫、游戏垫、房间装饰】。重点描述商品名称和相关的类别/兼容性关键词，方便搜索。"
        :autosize="{ minRows: 6, maxRows: 10 }"
        style="font-size:16px;min-height:120px;width:100%;resize:vertical;"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
      </template>
    </el-dialog>

    <!-- psd模板配置全屏弹窗 -->
    <el-dialog
      v-model="psdInfoDialogVisible"
      title="psd模板配置"
      fullscreen
      :destroy-on-close="true"
    >
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

  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, onUnmounted, watchEffect } from "vue";
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useUserStore } from "@/store/modules/user";
import { sortTypeOptions, defaultSortingValue } from "@/common/sort";
import { ElMessage, ElMessageBox } from "element-plus";
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
} from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import type { VxeGridProps } from "vxe-table";
import { psdTemplateApi } from "@/api/psdTemplate";
import { ShopPlatformApi } from "@/api/shop/platform";
import { ShopCategoryApi } from "@/api/shop/category";
import { ShopApi } from "@/api/shop/shopIndex";
import { downloadFileByElement } from "@/common/download";
import { getTitleTemplateList } from "@/api/publish";
import { uploadOSSFile } from "@/api/oss";
import { uploadToCOS } from "@/api/cos";
import { generateUUID } from "@/utils";
import { getPreviewImageUrl } from "@/utils/image";

const userStore = useUserStore()

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  name: "",
  id: "", // ID搜索
  searchKeyword: "", // 搜索关键字（支持名称、关键词、描述）
  enabled: undefined as boolean | undefined, // 是否可用筛选
});

const gridOptions = ref<VxeGridProps<any>>({
  ...(commonGridOptions as VxeGridProps<any>),
  maxHeight: null,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { title: "ID", field: "id", width: 140, showOverflow: true },
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
      title: "psd模板配置",
      field: "psdTemplateConfig",
      minWidth: 200,
      showOverflow: true,
      slots: {
        default: "psdInfoSlot",
      },
    },
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

async function getList() {
  loading.value = true;

  let params = {
    ...queryParams,
  };

  let res = await psdTemplateApi
    .getPsdTemplatePage({
      ...params,
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false;
    });
  dataSource.value = res.list;
  total.value = res.total;
  ids.value = [];
}

getList();

// 操作函数
function handleQuery() {
  queryParams.currentPage = 1;
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
    .catch(() => {});
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
});

// AI生成内容相关
const aiGenDialogVisible = ref(false);
const aiGenPrompt = ref('');
const aiDefaultPrompt = '请描述这是什么商品/物品，以及相关的类别关键词。例如：【T恤、男装、短袖】或【儿童地毯、地垫、游戏垫、房间装饰】。重点是商品名称和兼容性关键词，方便用户搜索找到。';
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
        const keyWithExtension = `${new Date().getTime()}_1s_${generateUUID()}.psd`;
        const cos = await uploadToCOS({ file: form.value.file, key: keyWithExtension });
        key = cos.key;
        url = cos.url;
      }

      // 如果有新的缩略图文件，先上传
      let thumbnail = form.value.thumbnail;
      if (form.value.thumbnailFile) {
        const thumbnailCos = await uploadToCOS({ file: form.value.thumbnailFile });
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
      if (form.value.file) {
        // 生成带.psd后缀的key
        const keyWithExtension = `${new Date().getTime()}_1s_${generateUUID()}.psd`;
        const cos = await uploadToCOS({ file: form.value.file, key: keyWithExtension });
        key = cos.key;
        url = cos.url;
      }
      
      // 上传缩略图（如果有）
      let thumbnail = "";
      if (form.value.thumbnailFile) {
        const thumbnailCos = await uploadToCOS({ file: form.value.thumbnailFile });
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
};

// 文件移除时的回调
const handleFileRemove = () => {
  fileList.value = []; // 清空文件列表
  form.value.file = null; // 清空表单中的文件
};

// 文件上传前的校验
const beforeUpload = (file) => {};

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
  return row.enabled ? 'row-enabled' : 'row-disabled';
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

</script>

<style lang="less" scoped>
.search-form-container {
  padding: 16px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  box-sizing: border-box;

  .search-form-left {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    
    :deep(.form-item) {
      margin-bottom: 0;
      flex-shrink: 0;
    }
    
    .el-button {
      flex-shrink: 0;
    }
  }

  .search-form-right {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }

  // 小屏幕时，按钮组换行并左对齐
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;

    .search-form-left {
      width: 100%;
      justify-content: flex-start;
    }

    .search-form-right {
      width: 100%;
      justify-content: flex-start;
    }
  }

  // 超小屏幕时，输入框宽度自适应
  @media (max-width: 480px) {
    .search-form-left {
      :deep(.el-input) {
        width: 100% !important;
        max-width: 100%;
      }

      :deep(.el-select) {
        width: 100% !important;
        max-width: 100%;
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

:deep(.dropdown-item-danger) {
  color: var(--el-color-danger) !important;
  
  &:hover {
    color: var(--el-color-danger) !important;
    background-color: var(--el-color-danger-light-9) !important;
  }
}

// 行样式区分是否可用
:deep(.row-enabled) {
  // 可用行使用默认样式
}

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
@/api/psdTemplate
