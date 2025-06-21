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
   
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>

            <el-button 
              :type="row.isPublish ? 'warning' : 'success'" 
              link 
              size="small" 
              @click="handleTogglePublish(row)"
            >
              {{ row.isPublish ? '下架' : '发布' }}
            </el-button>

            <el-button type="success" link size="small" @click="handlePublish(row)">
              发布到社交媒体
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

          <el-col :span="24">
            <el-form-item label="关键词" prop="keywords">
              <el-input v-model="form.keywords" placeholder="请输入关键词，多个关键词用逗号分隔" />
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

          <el-col :span="12">
            <el-form-item label="商品番号" prop="code">
              <div class="flex gap-2">
                <el-input v-model="form.code" placeholder="请输入商品番号" />
                <el-button type="primary" @click="handleGenerateCode">生成番号</el-button>
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="商品图片" prop="images">
              <ProductImageUpload 
                ref="productImageUploadRef"
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

    <!-- 发布弹窗 -->
    <el-dialog
      title="发布到多媒体平台"
      v-model="publishDialogVisible"
      width="100%"
      :fullscreen="true"
      @close="publishDialogClose"
      align-center
    >
      <div class="p-4">
        <h3 class="text-lg font-medium mb-4">选择发布平台</h3>
        
        <!-- 平台选择 -->
        <el-checkbox-group v-model="selectedPlatforms" class="mb-6">
          <el-checkbox label="douyin">抖音</el-checkbox>
          <el-checkbox label="xiaohongshu">小红书</el-checkbox>
          <el-checkbox label="weibo">微博</el-checkbox>
        </el-checkbox-group>
        <!-- 平台表单 -->
        <div v-for="platform in selectedPlatforms" :key="platform" class="mb-8">
          <el-card class="platform-form">
            <template #header>
              <div class="flex items-center">
                <span class="text-lg font-medium">{{ getPlatformName(platform) }}</span>
              </div>
            </template>
            
            <el-form :model="publishForm[platform]" label-width="80px">
              <el-form-item label="名称" required>
                <el-input 
                  v-model="publishForm[platform]!.name" 
                  :placeholder="`请输入${getPlatformName(platform)}名称`"
                />
              </el-form-item>
              
              <el-form-item label="描述" required>
                <el-input 
                  v-model="publishForm[platform]!.description" 
                  type="textarea" 
                  :rows="4"
                  :placeholder="`请输入${getPlatformName(platform)}描述`"
                />
              </el-form-item>

              <el-form-item label="商品图片">
                <el-checkbox-group v-model="publishForm[platform]!.selectedImages">
                  <div class="flex flex-wrap gap-4">
                    <div v-for="(url, index) in publishForm[platform]!.images" :key="index" class="relative">
                      <el-checkbox 
                        :value="url"
                        class="absolute top-2 left-2 z-10"
                      />
                      <el-image 
                        :src="url"
                        class="w-32 h-32 object-cover rounded"
                        :preview-src-list="publishForm[platform]!.images"
                        :initial-index="index"
                      />
                      <div class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
                        {{ index + 1 }}/{{ publishForm[platform]!.images.length }}
                      </div>
                    </div>
                  </div>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </div>

      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePublishSubmit" :loading="publishLoading">确定发布</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览 -->
    <el-dialog v-model="previewVisible" title="预览">
      <img :src="previewUrl" alt="Preview" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
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
import { publishToSocialMedia } from "@/api/client";
import { generateProductCode } from "@/common/code";

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
  rowClassName: ({ row }) => {
    return row.isPublish ? '' : 'unpublished-row';
  },
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    // { title: "ID", field: "id", width: 140, showOverflow: true },
    {
      title: "商品图片",
      field: "images",
      width: 300,
      slots: {
        default: "urlDefaultSlot",
      },
    },
    { title: "商品名称", field: "name", width: 240, showOverflow: true },
    { title: "商品描述", field: "description", width: 240, showOverflow: true },
    { title: "关键词", field: "keywords", width: 200, showOverflow: true },
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
    { 
      title: "发布状态", 
      field: "isPublish", 
      width: 100, 
      showOverflow: true,
      formatter: ({ cellValue }) => cellValue ? '已发布' : '未发布'
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
const publishDialogVisible = ref(false);
const publishLoading = ref(false);
const currentPublishRow = ref<{ 
  id?: string; 
  name?: string;
  description?: string;
  images?: string[];
}>({});
const productImageUploadRef = ref();

// 定义平台表单类型
interface PlatformForm {
  name: string;
  description: string;
  images: string[];
  selectedImages: string[];
}

interface PublishForm {
  douyin: PlatformForm | null;
  xiaohongshu: PlatformForm | null;
  weibo: PlatformForm | null;
}

// 发布相关的状态
const selectedPlatforms = ref<string[]>([]);
const publishForm = ref<PublishForm>({
  douyin: null,
  xiaohongshu: null,
  weibo: null
});

// 监听平台选择变化
watch(selectedPlatforms, (newPlatforms) => {
  // 重置所有平台表单为null
  Object.keys(publishForm.value).forEach(platform => {
    publishForm.value[platform as keyof PublishForm] = null;
  });
  
  // 为选中的平台初始化表单
  newPlatforms.forEach(platform => {
    const images = currentPublishRow.value?.images || [];
    publishForm.value[platform as keyof PublishForm] = {
      name: currentPublishRow.value?.name || '',
      description: currentPublishRow.value?.description || '',
      images: images,
      selectedImages: [...images]
    };
  });
});

interface ProductForm {
  id?: string;
  code: string;
  name: string;
  description: string;
  keywords: string;
  type: string;
  images: string[];
  price: number;
  salePrice: number;
  stock: number;
  specifications: string;
  tags: string;
  isActive: boolean;
  isLimitedEdition: number;
  isPublish?: boolean;
  createTime?: Date;
  updateTime?: Date;
  file: any;
}

const form = ref<ProductForm>({
  code: '',
  name: '',
  description: '',
  keywords: '',
  type: '',
  images: [] as string[],
  price: 0,
  salePrice: 0,
  stock: 0,
  specifications: '',
  tags: '',
  isActive: true,
  isLimitedEdition: 0,
  isPublish: false,
  file: null,
});

const rules = {
  name: [{ required: true, message: "请输入商品名称", trigger: "blur" }],
  description: [{ required: false, message: "请输入商品描述", trigger: "blur" }],
  type: [{ required: false, message: "请选择商品类型", trigger: "blur" }],
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
    // 确保价格是数字类型
    formData.price = Number(formData.price);
    formData.salePrice = Number(formData.salePrice);
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
          console.log('error' ,error)
          ElMessage.error(`图片 ${file.name} 上传失败`);
          throw error; // 抛出错误，中断整个上传过程
        }
      });
      
      try {
        const results = await Promise.all(uploadPromises);
        newImageUrls = results.filter(url => url !== null);
      } catch (error) {
        console.log('error' ,error)
        ElMessage.error('图片上传失败，请重试');
        return; // 如果上传失败，直接返回，不继续执行创建/更新操作
      }
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
    productImageUploadRef.value?.reset(); // 重置图片上传组件
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
    code: '',
    name: '',
    description: '',
    keywords: '',
    type: '',
    images: [] as string[],
    price: 0,
    salePrice: 0,
    stock: 0,
    specifications: '',
    tags: '',
    isActive: true,
    isLimitedEdition: 0,
    isPublish: false,
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

// 处理发布/下架切换
async function handleTogglePublish(row) {
  const action = row.isPublish ? '下架' : '发布';
  try {
    await ElMessageBox.confirm(
      `确认${action}商品"${row.name}"吗？`,
      `${action}确认`,
      {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    
    // 调用更新接口，传递isPublish参数
    await updateProduct({
      ...row,
      isPublish: !row.isPublish
    });
    
    ElMessage.success(`${action}成功`);
    getList(); // 重新获取列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`);
    }
  }
}

// 处理发布按钮点击
function handlePublish(row) {
  currentPublishRow.value = row;
  publishDialogVisible.value = true;
  
  // 默认选中所有平台
  selectedPlatforms.value = ['douyin', 'xiaohongshu', 'weibo'];
}

// 获取平台名称
const getPlatformName = (platform: string) => {
  const platformNames = {
    douyin: '抖音',
    xiaohongshu: '小红书',
    weibo: '微博'
  };
  return platformNames[platform] || platform;
};

// 关闭发布弹窗
function publishDialogClose() {
  publishDialogVisible.value = false;
  publishLoading.value = false;
  selectedPlatforms.value = [];
  // 重置所有平台表单为null
  Object.keys(publishForm.value).forEach(platform => {
    publishForm.value[platform as keyof PublishForm] = null;
  });
}

// 修改发布提交方法
async function handlePublishSubmit() {
  publishLoading.value = true;
  try {
    // 验证表单
    if (selectedPlatforms.value.length === 0) {
      ElMessage.warning('请至少选择一个发布平台');
      return;
    }

    // 验证每个选中平台的表单
    for (const platform of selectedPlatforms.value) {
      const form = publishForm.value[platform as keyof PublishForm];
      if (!form || !form.name || !form.description) {
        ElMessage.warning(`请完善${getPlatformName(platform)}的发布内容`);
        return;
      }
      if (form.selectedImages.length === 0) {
        ElMessage.warning(`请至少选择一张${getPlatformName(platform)}的图片`);
        return;
      }
    }

    // 构建发布数据
    const publishData = {
      productId: currentPublishRow.value.id,
      platforms: selectedPlatforms.value.map(platform => ({
        platform,
        name: publishForm.value[platform as keyof PublishForm]!.name,
        description: publishForm.value[platform as keyof PublishForm]!.description,
        images: publishForm.value[platform as keyof PublishForm]!.selectedImages
      }))
    };

    await publishToSocialMedia(publishData)
    
    ElMessage.success('发布成功');
    publishDialogVisible.value = false;
  } catch (error) {
    ElMessage.error('发布失败');
  } finally {
    publishLoading.value = false;
  }
}

// 添加生成番号的处理函数
const handleGenerateCode = () => {
  form.value.code = generateProductCode();
};
</script>

<style lang="less">
.custom-carousel {
  position: relative;
  padding: 0 20px;
  
  .el-carousel__container {
    margin: 0 -20px;
  }

  .el-carousel__arrow {
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
  .el-carousel__arrow--left {
    left: 0;
  }
  .el-carousel__arrow--right {
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

// 未发布商品行的样式
.unpublished-row {
  opacity: 0.4;
  
  &:hover {
    opacity: 0.8;
  }
  
  .el-button {
    opacity: 0.8;
    
    &:hover {
      opacity: 1;
    }
  }
}
</style>
