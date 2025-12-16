<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <!-- 导出按钮 -->
      <div style="flex: 1"></div>

      <form-item label="按名称搜索">
        <el-input
          v-model="queryParams.name"
          clearable
          placeholder="请输入名称"
          style="width: 160px"
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

      <div class="shrink-0">
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
        @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange"
      >
        <template #thumbnailSlot="{ row }">
          <div class="thumbnail-cell">
            <el-image
              v-if="row.thumbnail"
              :src="row.thumbnail"
              :preview-src-list="[row.thumbnail]"
              :initial-index="0"
              preview-teleported
              hide-on-click-modal
              fit="contain"
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
            <span v-else class="text-gray-400">暂无远程链接</span>
          </div>
        </template>

        <template #pathStatusSlot="{ row }">
          <el-tag v-if="row.url && row.windowsLocalPath" type="success" size="small">远程 + 本地</el-tag>
          <el-tag v-else-if="row.url" type="primary" size="small">远程路径</el-tag>
          <el-tag v-else-if="row.windowsLocalPath" type="warning" size="small">本地路径</el-tag>
          <el-tag v-else type="info" size="small">未提供路径</el-tag>
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
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
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
                placeholder="请输入 Windows 本地路径，如：C:\\path\\to\\file 或 \\\\server\\share\\path"
                @blur="normalizeWindowsPath"
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
                  <div class="upload-tip">支持 jpg、png 等图片格式，最大 5MB</div>
                </div>
                <div v-else class="thumbnail-preview-wrapper">
                  <el-image
                    :src="thumbnailPreviewUrl || form.thumbnail"
                    fit="contain"
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
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading"
          >确定</el-button
        >
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

const userStore = useUserStore()

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  name: "",
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
    { title: "套图模板名称", field: "name", width: 240, showOverflow: true },
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
      width: 140,
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
  };
  // 清空已选文件列表，只在需要时重新选择文件
  fileList.value = [];
  form.value.file = null;
  
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
});

// Windows 路径校验函数
const validateWindowsPath = (rule, value, callback) => {
  if (!value || value.trim() === '') {
    callback(); // 允许为空
    return;
  }
  
  const trimmedValue = value.trim();
  
  // 检查是否包含非法字符（除了驱动器字母后的冒号）
  const invalidChars = /[<>"|?*]/;
  
  // 检查冒号：只允许在驱动器字母后（如 C:）
  if (trimmedValue.includes(':')) {
    if (!/^[a-zA-Z]:/.test(trimmedValue)) {
      callback(new Error('路径格式不正确，冒号只能出现在驱动器字母后（如 C:\\）'));
      return;
    }
  }
  
  // 检查其他非法字符
  // 对于绝对路径，移除驱动器部分后再检查
  const pathToCheck = trimmedValue.replace(/^[a-zA-Z]:/, '');
  if (invalidChars.test(pathToCheck)) {
    callback(new Error('路径不能包含以下字符：< > " | ? *'));
    return;
  }
  
  // 检查基本格式
  // 1. 绝对路径：C:\path\to\file
  // 2. UNC 路径：\\server\share\path
  // 3. 相对路径：path\to\file 或 .\path\to\file 或 ..\path\to\file
  const absolutePathRegex = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/;
  const uncPathRegex = /^\\\\[^\\/:*?"<>|\r\n]+(?:\\[^\\/:*?"<>|\r\n]+)*$/;
  const relativePathRegex = /^(?:\.\.?\\)?[^\\/:*?"<>|\r\n]+(?:\\[^\\/:*?"<>|\r\n]+)*$/;
  
  if (absolutePathRegex.test(trimmedValue) || 
      uncPathRegex.test(trimmedValue) || 
      relativePathRegex.test(trimmedValue)) {
    callback();
  } else {
    callback(new Error('请输入合法的 Windows 路径，如：C:\\path\\to\\file 或 \\\\server\\share\\path'));
  }
};

// 规范化 Windows 路径：去除首尾空格和双引号，将 / 替换为 \\
const normalizeWindowsPath = () => {
  if (typeof form.value.windowsLocalPath !== 'string') return;
  let v = form.value.windowsLocalPath.trim();
  if (!v) {
    form.value.windowsLocalPath = '';
    return;
  }
  // 去掉首尾双引号
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  // 将 / 替换为 \（保留用户输入的连续反斜杠，例如 UNC 路径 \\server\share）
  v = v.replace(/\//g, '\\');
  form.value.windowsLocalPath = v;
};

const rules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  windowsLocalPath: [
    { validator: validateWindowsPath, trigger: "blur" }
  ],
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
      
      await psdTemplateApi.updatePsdTemplate({
        id: form.value.id,
        name: form.value.name,
        description: form.value.description || "",
        keywords: form.value.keywords || "",
        windowsLocalPath: form.value.windowsLocalPath || "",
        url: url || undefined,
        key: key || undefined,
        thumbnail: thumbnail || "", // 确保是字符串
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
      
      await psdTemplateApi.createPsdTemplate({
        name: form.value.name,
        description: form.value.description || "",
        keywords: form.value.keywords || "",
        windowsLocalPath: form.value.windowsLocalPath || "",
        url: url || undefined,
        key: key || undefined,
        thumbnail: thumbnail,
        file: null,
        uploaderId: userStore.user?.id
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

  // 校验文件大小
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!');
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
</script>

<style lang="less" scoped>
.thumbnail-cell {
  display: flex;
  align-items: center;
  padding: 4px;
  
  .thumbnail-image {
    height: 120px;
    width: auto;
    max-width: 160px;
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

.thumbnail-upload-container {
  width: 100%;
  
  .thumbnail-upload-placeholder {
    width: 148px;
    height: 148px;
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
    width: 148px;
    height: 148px;
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
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: 100%;
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
