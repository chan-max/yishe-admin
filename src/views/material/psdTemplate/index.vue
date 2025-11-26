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
            <img 
              v-if="row.thumbnail" 
              :src="row.thumbnail" 
              alt="缩略图"
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
                accept=".psd"
              >
                <el-button type="primary">选择 PSD 文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">只能上传 PSD 文件</div>
                </template>
              </el-upload>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="缩略图">
              <el-upload
                style="width: 100%"
                action="#"
                :limit="1"
                :file-list="thumbnailFileList"
                :on-change="handleThumbnailChange"
                :before-upload="beforeThumbnailUpload"
                :auto-upload="false"
                :on-remove="handleThumbnailRemove"
                accept="image/*"
                list-type="picture-card"
              >
                <template v-if="thumbnailFileList.length === 0">
                  <el-icon v-if="!form.thumbnail"><Plus /></el-icon>
                  <div v-else class="current-thumbnail-preview">
                    <el-image
                      :src="form.thumbnail"
                      fit="cover"
                      class="preview-image"
                    />
                    <div class="preview-mask">
                      <el-button type="danger" link size="small" @click.stop="clearThumbnail">
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-button>
                    </div>
                  </div>
                </template>
                <template #tip>
                  <div class="el-upload__tip">支持 jpg、png 等图片格式，点击可替换当前缩略图</div>
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
import { psdTemplateApi } from "@/api/psdTemplate";
import { ShopPlatformApi } from "@/api/shop/platform";
import { ShopCategoryApi } from "@/api/shop/category";
import { ShopApi } from "@/api/shop/shopIndex";
import { downloadFileByElement } from "@/common/download";
import { getTitleTemplateList } from "@/api/publish";
import { uploadOSSFile } from "@/api/oss";
import { uploadToCOS } from "@/api/cos";

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  name: "",
});

const gridOptions = ref({
  ...commonGridOptions,
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
    thumbnail: "",
    thumbnailFile: null,
  };
  thumbnailFileList.value = [];
}

function handleEdit(row) {
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";

  form.value = {
    ...row,
  };
  
  // 如果有缩略图，显示在预览中
  if (row.thumbnail?.url) {
    thumbnailFileList.value = [];
  } else {
    thumbnailFileList.value = [];
  }
}

function cancel() {
  open.value = false;
}

const form = ref<any>({
  id: "",
  file: null,
  name: "",
  thumbnail: "",
  thumbnailFile: null,
});

const rules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  // titleTemplateId: [{ required: true, message: "请选择标题模板", trigger: "blur" }],
  file: [{ required: true, message: "请选择 PSD 文件", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
  fileList.value = [];
  thumbnailFileList.value = [];
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
      
      // 如果有新的缩略图文件，先上传
      let thumbnail = form.value.thumbnail;
      if (form.value.thumbnailFile) {
        const thumbnailCos = await uploadToCOS({ file: form.value.thumbnailFile });
        thumbnail = thumbnailCos.url; // 直接存储URL字符串
      }
      
      await psdTemplateApi.updatePsdTemplate({
        id: form.value.id,
        name: form.value.name,
        thumbnail: thumbnail || "", // 确保是字符串
      });
      ElMessage.success("更新成功");
      getList();
    } else {
      submitLoading.value = true;
      
      // 上传PSD文件
      const cos = await uploadToCOS({ file: form.value.file });
      const { key, url } = cos;
      
      // 上传缩略图（如果有）
      let thumbnail = "";
      if (form.value.thumbnailFile) {
        const thumbnailCos = await uploadToCOS({ file: form.value.thumbnailFile });
        thumbnail = thumbnailCos.url; // 直接存储URL字符串
      }
      
      await psdTemplateApi.createPsdTemplate({
        name: form.value.name,
        url,
        key,
        thumbnail: thumbnail,
        file: null,
      });
      ElMessage.success("添加成功");
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
const thumbnailFileList = ref([]);

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

// 缩略图文件选择改变时的回调
const handleThumbnailChange = (file, files) => {
  thumbnailFileList.value = files;
  form.value.thumbnailFile = file.raw;
  // 选择新文件后，清空旧的缩略图URL（新文件会覆盖）
  // 注意：这里不清空 form.thumbnail，因为提交时需要知道是否有旧文件要删除
};

// 缩略图文件移除时的回调
const handleThumbnailRemove = () => {
  thumbnailFileList.value = [];
  form.value.thumbnailFile = null;
};

// 缩略图上传前的校验
const beforeThumbnailUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!');
    return false;
  }
  return true;
};

// 清除缩略图
const clearThumbnail = () => {
  form.value.thumbnail = "";
  thumbnailFileList.value = [];
  form.value.thumbnailFile = null;
};
</script>

<style lang="less" scoped>
.thumbnail-cell {
  display: flex;
  align-items: center;
  height: 120px;
  padding: 4px;
  
  .thumbnail-image {
    max-width: 160px;
    max-height: 120px;
    width: auto;
    height: auto;
    object-fit: contain;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      border-color: var(--el-color-primary);
      transform: scale(1.05);
      transition: transform 0.2s;
    }
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

.current-thumbnail-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 6px;
  }
  
  .preview-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
    border-radius: 6px;
    
    &:hover {
      opacity: 1;
    }
  }
}

:deep(.el-upload--picture-card) {
  .current-thumbnail-preview {
    .preview-mask {
      opacity: 0;
    }
    
    &:hover .preview-mask {
      opacity: 1;
    }
  }
}
</style>
@/api/psdTemplate
