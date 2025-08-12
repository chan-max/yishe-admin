<template>
  <div>
    <div class="pb-4 flex flex-wrap justify-end gap-4 items-center search-bar">
      <!-- 这里放所有搜索/过滤表单项和按钮，结构与crawler-material.vue一致，参数不变 -->
      <form-item class="date-range-picker">
        <DateRangePicker
          @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end; getList() }"
        />
      </form-item>
      <div class="flex shrink-0 gap-2">
        <el-button 
          type="success" 
          @click="handleBatchAiGenerate"
          :disabled="!ids.length"
          :loading="batchAiLoading"
        >
          批量AI补全 ({{ ids.length }})
        </el-button>
      </div>
    </div>

    <!-- 表格展示 -->
    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange"
      >
        <template #thumbnailDefaultSlot="{ row }">
          <div class="flex items-center justify-center p-2">
            <img
              v-if="row.thumbnail"
              :src="row.thumbnail"
              :alt="row.name || '字体缩略图'"
              style="width:80px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer; border-radius:4px;"
              @click="openThumbnailPreview(row.thumbnail, row.name)"
              @error="handleThumbnailError"
            />
            <div v-else class="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
              无缩略图
            </div>
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

        <template #operationDefaultSlot="{ row }">
          <div class="flex items-center">
            <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)" class="operation-dropdown">
              <el-button type="primary" link size="small">
                操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="preview">
                    <el-icon><View /></el-icon>
                    预览
                  </el-dropdown-item>
                  <el-dropdown-item command="font-params">
                    <el-icon><Picture /></el-icon>
                    制作文字图
                  </el-dropdown-item>
                  <el-dropdown-item command="download">
                    <el-icon><Download /></el-icon>
                    下载源文件
                  </el-dropdown-item>
                  <el-dropdown-item command="ai-generate">
                    <el-icon><MagicStick /></el-icon>
                    AI自动生成内容
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-icon v-if="aiTableLoading?.[row?.id]" class="is-loading ml-2" style="color:#67C23A;font-size:18px;" />
          </div>
        </template>

        <template #urlDefaultSlot="{ row }">
          <div class="flex items-center gap-2">
            <span class="truncate flex-1">{{ row.url }}</span>
            <el-button type="primary" link size="small" @click="copyUrl(row.url)" class="shrink-0">
              复制
            </el-button>
          </div>
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
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24" v-if="!isEdit">
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
                accept=".ttf,.otf,.woff,.woff2"
              >
                <el-button type="primary">选择字体文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">只能上传字体文件（.ttf, .otf, .woff, .woff2）</div>
                </template>
              </el-upload>
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

    <FontPreview
      v-model="previewVisible"
      :font-url="currentRow.url"
    />

    <!-- 字体参数设置弹窗 -->
    <el-dialog
      title="制作文字图"
      v-model="fontParamsVisible"
      width="500px"
      @close="handleFontParamsClose"
      align-center
    >
      <el-form :model="fontParamsForm" :rules="fontParamsRules" ref="fontParamsFormRef" label-width="100px">
        <el-form-item label="文字内容" prop="text">
          <el-input v-model="fontParamsForm.text" placeholder="请输入文字内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fontParamsVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFontParams" :loading="fontParamsLoading">确定</el-button>
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
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">请输入你希望AI分析的内容风格或角度（如：偏艺术描述、简洁风格、突出字体特点等）</div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="如：请用艺术化语言描述字体风格..."
        style="font-size:16px;min-height:120px;width:100%;resize:vertical;"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量AI补全弹窗 -->
    <el-dialog
      v-model="batchAiDialogVisible"
      title="批量AI补全内容"
      width="600px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">
        将为选中的 <strong>{{ ids.length }}</strong> 个字体模板进行AI内容补全
      </div>
      <el-input
        v-model="batchAiPrompt"
        type="textarea"
        :rows="6"
        placeholder="请输入统一的AI分析提示词（可选）..."
        style="font-size:16px;min-height:120px;width:100%;resize:vertical;"
      />
      
      <!-- 进度显示 -->
      <div v-if="batchProgress.total > 0" style="margin-top: 16px;">
        <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span>处理进度</span>
          <span>{{ batchProgress.processed }}/{{ batchProgress.total }}</span>
        </div>
        <el-progress 
          :percentage="Math.round((batchProgress.processed / batchProgress.total) * 100)"
          :status="batchProgress.processed === batchProgress.total ? 'success' : ''"
        />
        <div style="margin-top: 8px; font-size: 12px; color: #909399;">
          成功: {{ batchProgress.success }} | 失败: {{ batchProgress.failed }}
        </div>
      </div>
      
      <div style="margin-top: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px; font-size: 14px; color: #606266;">
        <div style="margin-bottom: 8px;"><strong>操作说明：</strong></div>
        <div>• 系统将分批处理，每批5个，避免API限流</div>
        <div>• 处理过程中会显示进度和结果</div>
        <div>• 失败的项会单独记录，不影响其他项</div>
        <div style="margin-top: 8px; color: #e6a23c;"><strong>注意事项：</strong></div>
        <div>• 确保选中的字体模板都有缩略图</div>
        <div>• 如果AI分析失败，可能是图片内容不清晰或格式不支持</div>
        <div>• 系统会自动重试失败的项，提高成功率</div>
        <div>• 建议提示词示例："请分析字体风格，重点关注设计特点和适用场景"</div>
      </div>
      <template #footer>
        <el-button @click="batchAiDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchAiDialogLoading" @click="submitBatchAiDialog">开始批量补全</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <ImagePreview
      :visible="imagePreviewVisible"
      :image-url="currentImageUrl"
      @close="closeImagePreview"
    />
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
  Loading,
  ArrowDown,
  View,
  Picture,
  Download,
  MagicStick,
} from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";

import { ShopPlatformApi } from "@/api/shop/platform";
import { ShopCategoryApi } from "@/api/shop/category";
import { ShopApi } from "@/api/shop/shopIndex";
import { downloadFileByElement } from "@/common/download";
import { getTitleTemplateList } from "@/api/publish";
import { uploadOSSFile } from "@/api/oss";
import { uploadToCOS } from "@/api/cos";
import { PsdPreview } from '@/components/PsdPreview'
import { fontTemplateApi } from "@/api/fontTemplate";
import { ImagePreview } from '@/components/ImagePreview';

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
});

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { 
      title: "缩略图", 
      field: "thumbnail", 
      width: 120,
      slots: {
        default: "thumbnailDefaultSlot"
      }
    },
    { title: "ID", field: "id", width: 140, showOverflow: true },
    { 
      title: "文件地址", 
      field: "url", 
      width: 300,
      slots: {
        default: "urlDefaultSlot"
      }
    },
    { title: "字体名称", field: "name", width: 240, showOverflow: true },
    { title: "描述", field: "description", minWidth: 200, showOverflow: true },
    { title: "关键字", field: "keywords", minWidth: 160, showOverflow: true },
    { title: "分类", field: "category", width: 120, showOverflow: true },
    { title: "创建人", field: "creatorName", minWidth: 100, showOverflow: true },
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
      width: "auto",
      slots: {
        default: "operationDefaultSlot",
      },
    },
  ],
});



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
const currentRow = ref({});
const submitLoading = ref(false);
const previewVisible = ref(false)
const currentPreviewUrl = ref('')

// 字体参数相关
const fontParamsVisible = ref(false);
const fontParamsLoading = ref(false);
const fontParamsFormRef = ref();
const fontParamsForm = ref({
  text: '',
  fontId: null
});

const fontParamsRules = {
  text: [{ required: true, message: '请输入文字内容', trigger: 'blur' }]
};

// AI生成内容相关
const aiGenDialogVisible = ref(false);
const aiGenPrompt = ref('');
const aiGenDialogLoading = ref(false);
const aiTableLoading = ref<Record<string, boolean>>({});
let aiGenRow = null;

// 批量AI补全相关
const batchAiLoading = ref(false);
const batchAiDialogVisible = ref(false);
const batchAiPrompt = ref('');
const batchAiDialogLoading = ref(false);
const batchProgress = ref({
  total: 0,
  processed: 0,
  success: 0,
  failed: 0
});

// 图片预览相关状态
const imagePreviewVisible = ref(false);
const currentImageUrl = ref('');

async function getList() {
  loading.value = true;

  let params = {
    ...queryParams,
  };

  let res = await fontTemplateApi
    .getFontTemplatePage({
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
      await fontTemplateApi.deleteShopTemplate({ ids: delIds });
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => {});
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建模板";
  form.value = {};
}

function handleEdit(row) {
  currentRow.value = row;
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";

  form.value = {
    ...row,
  };
}

function cancel() {
  open.value = false;
}

const form = ref({
  file: null,
  name: "",
});

const rules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  // titleTemplateId: [{ required: true, message: "请选择标题模板", trigger: "blur" }],
  file: [{ required: true, message: "请选择 PSD 文件", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
  fileList.value = [];
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
      await fontTemplateApi.updatePsdTemplate({
        id: form.value.id,
        name: form.value.name,
      });
      ElMessage.success("更新成功");
      getList();
    } else {
      submitLoading.value = true;
      const cos = await uploadToCOS({ file: form.value.file });
      const { key, url } = cos;
      await fontTemplateApi.createFontTemplate({
        name: form.value.name,
        url,
        file: null,
      });
      ElMessage.success("添加成功");
      getList();
    }

    dialogVisible.value = false;
  } catch (e) {
  } finally {
    submitLoading.value = false;
    dialogVisible.value = false;
  }
};

/**
 * @psd文件处理
 */

const fileList = ref([]);

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
const beforeUpload = (file) => {
  const isFont = /\.(ttf|otf|woff|woff2)$/.test(file.name.toLowerCase());
  if (!isFont) {
    ElMessage.error('只能上传字体文件！');
    return false;
  }
  return true;
};

function handlePreview(row) {
  previewVisible.value = true
  currentRow.value = row
}

function handleFontParams(row) {
  fontParamsForm.value.fontId = row.id;
  fontParamsVisible.value = true;
}

function handleFontParamsClose() {
  fontParamsForm.value = {
    text: '',
    fontId: null
  };
  fontParamsVisible.value = false;
}

async function submitFontParams() {
  if (!fontParamsFormRef.value) return;
  
  try {
    await fontParamsFormRef.value.validate();
    fontParamsLoading.value = true;
    
    // 这里调用后端API
    await fontTemplateApi.genImage({
      fontId: fontParamsForm.value.fontId,
      text: fontParamsForm.value.text
    });
    
    ElMessage.success('生成成功');
    fontParamsVisible.value = false;
  } catch (error) {
    console.error('生成失败:', error);
  } finally {
    fontParamsLoading.value = false;
  }
}

const copyUrl = (url: string) => {
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('复制成功');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
};

// AI生成内容相关方法
function handleAiGenerate(row) {
  if (aiTableLoading.value[row.id]) return;
  aiGenRow = row;
  aiGenPrompt.value = '';
  aiGenDialogVisible.value = true;
}

async function submitAiGenDialog() {
  if (!aiGenRow) return;
  aiGenDialogLoading.value = true;
  aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: true };
  try {
    await handleAiAutoGenerate(aiGenRow, () => {
      aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false };
      aiGenDialogLoading.value = false;
      aiGenDialogVisible.value = false;
      aiGenRow = null;
    }, aiGenPrompt.value);
  } catch (e) {
    aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false };
    aiGenDialogLoading.value = false;
    aiGenDialogVisible.value = false;
    aiGenRow = null;
  }
}

async function handleAiAutoGenerate(row, cb, prompt) {
  try {
    // 调用字体模板的AI补全接口
    const res = await fontTemplateApi.aiCompleteContent(row.id, prompt || '');
    
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

// 批量AI补全内容
async function handleBatchAiGenerate() {
  if (!ids.value.length) {
    ElMessage.warning('请先选择要批量操作的数据');
    return;
  }

  batchAiPrompt.value = '';
  batchAiDialogVisible.value = true;
}

async function submitBatchAiDialog() {
  if (!ids.value.length) return;
  
  batchAiDialogLoading.value = true;
  
  // 初始化进度
  batchProgress.value = {
    total: ids.value.length,
    processed: 0,
    success: 0,
    failed: 0
  };
  
  try {
    // 显示确认信息
    ElMessage.info(`开始处理 ${ids.value.length} 个字体模板，请耐心等待...`);
    
    const res = await fontTemplateApi.batchAiCompleteContent({
      ids: ids.value,
      prompt: batchAiPrompt.value,
      batchSize: 5
    });
    
    // 更新最终进度
    batchProgress.value.processed = res.processed;
    batchProgress.value.success = res.success;
    batchProgress.value.failed = res.failed;
    
    if (res.success > 0) {
      // 显示详细结果
      let message = `批量AI补全完成：成功 ${res.success} 个，失败 ${res.failed} 个`;
      
      if (res.failed > 0 && res.errors && res.errors.length > 0) {
        message += `\n失败项目：${res.errors.slice(0, 3).map(e => e.id).join(', ')}${res.errors.length > 3 ? '...' : ''}`;
      }
      
      ElMessage.success(message);
      
      // 刷新列表
      getList();
      // 清空选择
      ids.value = [];
      // 延迟关闭弹窗，让用户看到最终结果
      setTimeout(() => {
        batchAiDialogVisible.value = false;
        // 重置进度
        batchProgress.value = { total: 0, processed: 0, success: 0, failed: 0 };
      }, 3000);
    } else {
      ElMessage.error('批量AI补全失败，请检查网络连接和AI服务状态');
    }
  } catch (error) {
    console.error('批量AI补全失败:', error);
    
    // 根据错误类型显示不同的提示
    let errorMessage = '批量AI补全失败';
    if (error.response?.status === 500) {
      errorMessage = '服务器内部错误，请稍后重试';
    } else if (error.response?.status === 429) {
      errorMessage = '请求过于频繁，请稍后重试';
    } else if (error.message?.includes('timeout')) {
      errorMessage = '请求超时，请检查网络连接';
    }
    
    ElMessage.error(errorMessage);
    // 重置进度
    batchProgress.value = { total: 0, processed: 0, success: 0, failed: 0 };
  } finally {
    batchAiDialogLoading.value = false;
  }
}

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'edit':
      handleEdit(row);
      break;
    case 'preview':
      handlePreview(row);
      break;
    case 'font-params':
      handleFontParams(row);
      break;
    case 'download':
      downloadFileByElement(row.url, row.name);
      break;
    case 'ai-generate':
      handleAiGenerate(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
    default:
      console.warn('未知的操作命令:', command);
  }
}

// 缩略图预览相关方法
function openThumbnailPreview(thumbnailUrl: string, fontName?: string) {
  currentImageUrl.value = thumbnailUrl;
  imagePreviewVisible.value = true;
}

function handleThumbnailError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'w-20 h-20 bg-red-100 rounded flex items-center justify-center text-red-400 text-xs';
    errorDiv.textContent = '加载失败';
    parent.appendChild(errorDiv);
  }
}

function closeImagePreview() {
  imagePreviewVisible.value = false;
  currentImageUrl.value = '';
}
</script>

<style scoped>
.pb-4.flex, .search-bar {
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.pb-4.flex > *, .search-bar > * {
  margin-bottom: 0;
}
@media (max-width: 600px) {
  .pb-4.flex, .search-bar {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    padding-bottom: 8px !important;
  }
  .pb-4.flex > *, .search-bar > * {
    width: 100% !important;
    min-width: 0 !important;
    margin-right: 0 !important;
    margin-bottom: 8px !important;
  }
  .el-input,
  .el-select,
  .el-button,
  .el-date-editor {
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }
  .content-container {
    padding: 0 4px !important;
  }
  .common-table {
    overflow-x: auto;
  }
}

.operation-dropdown {
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .el-icon {
      margin-right: 4px;
    }
  }
}
</style>
