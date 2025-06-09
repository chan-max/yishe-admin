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
        />
      </form-item>
      <el-button type="primary" @click="handleSearch" :icon="Search"> 搜索 </el-button>

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

        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="primary" link size="small" @click="handlePreview(row)">
              预览
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="
                () => {
                  downloadFileByElement(row.url, row.name);
                }
              "
            >
              下载源文件
            </el-button>

            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </div>
        </template>

        <template #urlDefaultSlot="{ row }">
          <div class="flex items-center gap-2">
            <el-carousel 
              v-if="row.images && row.images.length > 0"
              :interval="3000"
              height="120px"
              indicator-position="none"
              :arrow="row.images.length > 1 ? 'always' : 'never'"
              class="w-48 custom-carousel"
            >
              <el-carousel-item v-for="(url, index) in row.images" :key="index">
                <el-image 
                  :src="url"
                  :preview-src-list="row.images"
                  :initial-index="index"
                  :preview-teleported="true"
                  :hide-on-click-modal="false"
                  :preview-class="'custom-image-preview'"
                  class="w-full h-full object-cover rounded cursor-pointer"
                  fit="cover"
                />
                <div class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                  {{ index + 1 }}/{{ row.images.length }}
                </div>
              </el-carousel-item>
            </el-carousel>
            <span v-else class="text-gray-400">暂无图片</span>
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
      width="100%"
      :fullscreen="true"
      @close="dialogClose"
      align-center
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品类型" prop="type">
              <el-input v-model="form.type" placeholder="请输入商品类型" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="商品描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入商品描述" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="促销价格" prop="salePrice">
              <el-input-number v-model="form.salePrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品规格" prop="specifications">
              <el-input v-model="form.specifications" placeholder="请输入商品规格" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品标签" prop="tags">
              <el-input v-model="form.tags" placeholder="请输入商品标签，多个标签用逗号分隔" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="是否绝版" prop="isLimitedEdition">
              <el-switch
                v-model="form.isLimitedEdition"
                :active-value="1"
                :inactive-value="0"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="商品图片" prop="images">
              <ProductImageUpload 
                v-model="form.images" 
                :max-count="10" 
                @files-change="handleFilesChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览 -->
    <el-dialog v-model="previewVisible" title="预览">
      <img :src="previewUrl" alt="Preview" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useUserStore } from "@/store/modules/user";
import { sortTypeOptions, defaultSortingValue } from "@/common/sort";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  Plus,
  Delete,
  TopRight,
  Edit,
  CirclePlusFilled,
  CirclePlus,
} from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { downloadFileByElement } from "@/common/download";
import { uploadToCOS } from "@/api/cos";
import { createProduct, getProductList, updateProduct, deleteProduct } from "@/api/product";
import { getTitleTemplateList } from "@/api/publish";
import { uploadOSSFile } from "@/api/shop/platform";
import { ShopCategoryApi } from "@/api/shop/category";
import { ShopApi } from "@/api/shop/shopIndex";
import { PsdPreview } from "@/components/PsdPreview";
import { fontTemplateApi } from "@/api/fontTemplate";
import ProductImageUpload from '@/components/ProductImageUpload.vue'

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  name: '',
  search: '',
});

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { title: "ID", field: "id", width: 140, showOverflow: true },
    {
      title: "商品图片",
      field: "images",
      width: 300,
      slots: {
        default: "urlDefaultSlot",
      },
    },
    { title: "商品名称", field: "name", width: 240, showOverflow: true },
    { title: "商品类型", field: "type", width: 120, showOverflow: true },
    { title: "价格", field: "price", width: 100, showOverflow: true },
    { title: "促销价格", field: "salePrice", width: 100, showOverflow: true },
    { title: "库存", field: "stock", width: 100, showOverflow: true },
    { 
      title: "是否绝版", 
      field: "isLimitedEdition", 
      width: 100, 
      showOverflow: true,
      formatter: ({ cellValue }) => cellValue === 1 ? '是' : '否'
    },
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

const dataSource = ref([]);
const loading = ref(false);
const open = ref(false);
const ids = ref([]);
const single = ref(false);
const total = ref(0);
const formRef = ref();
const dialogTitle = ref("");
const dialogVisible = ref(false);
const isEdit = ref(true);
const currentRow = ref({});
const submitLoading = ref(false);
const previewVisible = ref(false);
const previewUrl = ref('');
const fileList = ref([]);
const pendingFiles = ref([]);
const existingImages = ref([]);

interface ProductForm {
  id?: string;
  name: string;
  description: string;
  type: string;
  images: string[];
  price: number;
  salePrice: number;
  stock: number;
  specifications: string;
  tags: string;
  isActive: boolean;
  isLimitedEdition: number;
  createTime?: Date;
  updateTime?: Date;
  file: any;
}

const form = ref<ProductForm>({
  name: '',
  description: '',
  type: '',
  images: [] as string[],
  price: 0,
  salePrice: 0,
  stock: 0,
  specifications: '',
  tags: '',
  isActive: true,
  isLimitedEdition: 0,
  file: null,
});

const rules = {
  name: [{ required: true, message: "请输入商品名称", trigger: "blur" }],
  description: [{ required: true, message: "请输入商品描述", trigger: "blur" }],
  type: [{ required: true, message: "请选择商品类型", trigger: "blur" }],
  price: [{ required: true, message: "请输入商品价格", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
  fileList.value = [];
  pendingFiles.value = [];
  existingImages.value = [];
  submitLoading.value = false;
};

function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id);
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id);
}

// 处理文件列表变化
const handleFilesChange = (files) => {
  pendingFiles.value = files.filter(file => file.raw).map(file => file.raw)
}

const submitForm = async () => {
  submitLoading.value = true;
  try {
    await formRef.value.validate();
    
    const formData = { ...form.value };
    // 确保isLimitedEdition是数字类型
    formData.isLimitedEdition = Number(formData.isLimitedEdition);
    delete formData.file;
    delete formData.createTime;
    delete formData.updateTime;

    // 上传所有待上传的图片到COS
    let newImageUrls: string[] = [];
    if (pendingFiles.value.length > 0) {
      const uploadPromises = pendingFiles.value.map(async (file) => {
        try {
          const result = await uploadToCOS({ file });
          return result.url;
        } catch (error) {
          ElMessage.error(`图片 ${file.name} 上传失败`);
          return null;
        }
      });
      
      const results = await Promise.all(uploadPromises);
      newImageUrls = results.filter(url => url !== null);
    }

    // 合并已有图片和新上传的图片URL
    formData.images = [...form.value.images, ...newImageUrls];

    if (isEdit.value) {
      // 修改时保留id
      await updateProduct(formData);
      ElMessage.success("更新成功");
    } else {
      // 创建时删除id
      delete formData.id;
      await createProduct(formData);
      ElMessage.success("添加成功");
    }

    dialogVisible.value = false;
    resetQuery(); // 重置查询参数
    getList(); // 重新获取列表
  } catch (e) {
    console.error('提交表单错误:', e);
    ElMessage.error("操作失败");
  } finally {
    submitLoading.value = false;
  }
};

function handlePreview(row) {
  // 暂时不实现预览功能
}

const copyUrl = (url: string) => {
  navigator.clipboard
    .writeText(url)
    .then(() => {
      ElMessage.success("复制成功");
    })
    .catch(() => {
      ElMessage.error("复制失败");
    });
};

getList() 
async function getList() {
  loading.value = true;

  let params = {
    currentPage: queryParams.currentPage,
    pageSize: queryParams.pageSize,
    search: queryParams.name,
    sortingFields: queryParams.sortingFields,
  };

  try {
    let res = await getProductList(params);
    dataSource.value = res.list || [];
    total.value = res.total || 0;
    ids.value = [];
  } catch (error) {
    ElMessage.error("获取列表失败");
    dataSource.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// 重置查询参数
const resetQuery = () => {
  queryParams.currentPage = 1;
  queryParams.pageSize = 20;
  queryParams.name = '';
  queryParams.search = '';
  queryParams.sortingFields = defaultSortingValue();
};

// 搜索按钮点击事件
const handleSearch = () => {
  queryParams.currentPage = 1; // 搜索时重置到第一页
  getList();
};

function handleDelete(row?) {
  let delIds: string[] = [];
  if (row) {
    delIds = [row.id];
  } else if (!ids.value.length) {
    return ElMessage.warning("请选择要删除的数据");
  } else {
    delIds = [...ids.value];
  }

  ElMessageBox.confirm(`确认删除选中的${delIds.length}条数据吗`, "删除提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "error",
  })
    .then(async () => {
      try {
        await deleteProduct(delIds);
        ElMessage.success("删除成功");
        getList();
      } catch (error) {
        ElMessage.error("删除失败");
      }
    })
    .catch(() => {});
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建商品";
  form.value = {
    name: '',
    description: '',
    type: '',
    images: [] as string[],
    price: 0,
    salePrice: 0,
    stock: 0,
    specifications: '',
    tags: '',
    isActive: true,
    isLimitedEdition: 0,
    file: null,
  };
  fileList.value = [];
  pendingFiles.value = [];
}

function handleEdit(row) {
  currentRow.value = row;
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑商品";

  // 确保images是字符串数组
  const images = Array.isArray(row.images) ? row.images : [];
  
  form.value = {
    ...row,
    images,
  };
  
  // 处理图片列表
  if (images.length > 0) {
    fileList.value = images.map((url, index) => ({
      name: `图片${index + 1}`,
      url: url
    }));
    pendingFiles.value = [];
  } else {
    fileList.value = [];
    pendingFiles.value = [];
  }
}
</script>

<style lang="less">
.custom-carousel {
  position: relative;
  padding: 0 20px;
  
  :deep(.el-carousel__container) {
    margin: 0 -20px;
  }

  :deep(.el-carousel__arrow) {
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    &:hover {
      background-color: rgba(0, 0, 0, 0.5);
    }
    i {
      font-size: 14px;
    }
  }
  :deep(.el-carousel__arrow--left) {
    left: 0;
  }
  :deep(.el-carousel__arrow--right) {
    right: 0;
  }
}

.custom-image-preview {
  .el-image-viewer__wrapper {
    .el-image-viewer__btn {
      opacity: 0.8;
      &:hover {
        opacity: 1;
      }
    }
    .el-image-viewer__actions {
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 4px;
    }
    .el-image-viewer__canvas {
      img {
        max-width: 90vw;
        max-height: 90vh;
      }
    }
  }
}
</style>
