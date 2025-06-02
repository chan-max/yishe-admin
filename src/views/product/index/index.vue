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
      <el-button type="primary" @click="getList" :icon="Search"> 搜索 </el-button>

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
            <span class="truncate flex-1">{{ row.url }}</span>
            <el-button
              type="primary"
              link
              size="small"
              @click="copyUrl(row.url)"
              class="shrink-0"
            >
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
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="商品描述" prop="description">
              <el-input v-model="form.description" type="textarea" placeholder="请输入商品描述" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="商品类型" prop="type">
              <el-input v-model="form.type" placeholder="请输入商品类型" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="促销价格" prop="salePrice">
              <el-input-number v-model="form.salePrice" :min="0" :precision="2" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" :precision="0" />
            </el-form-item>
          </el-col>

          <el-col :span="24" v-if="!isEdit">
            <el-form-item label="商品图片" prop="file">
              <el-upload
                style="width: 100%"
                action="#"
                :limit="1"
                :file-list="fileList"
                :on-change="handleFileChange"
                :before-upload="beforeUpload"
                :auto-upload="false"
                :on-remove="handleFileRemove"
                accept="image/*"
              >
                <el-button type="primary">选择图片</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    只能上传图片文件
                  </div>
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

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  name: '',
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

const form = ref({
  id: '',
  name: '',
  description: '',
  type: '',
  images: '',
  price: 0,
  salePrice: 0,
  stock: 0,
  specifications: '',
  tags: '',
  isActive: true,
  createTime: new Date(),
  updateTime: new Date(),
  file: null,
});

const rules = {
  name: [{ required: true, message: "请输入商品名称", trigger: "blur" }],
  description: [{ required: true, message: "请输入商品描述", trigger: "blur" }],
  type: [{ required: true, message: "请选择商品类型", trigger: "blur" }],
  price: [{ required: true, message: "请输入商品价格", trigger: "blur" }],
  file: [{ required: false, message: "请选择商品图片", trigger: "blur" }],
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
    const formData = { ...form.value };
    delete formData.file; // 移除file字段，因为它不是ProductVO的一部分

    if (isEdit.value) {
      submitLoading.value = true;
      await updateProduct(formData);
      ElMessage.success("更新成功");
      getList();
    } else {
      submitLoading.value = true;
      const cos = await uploadToCOS({ file: form.value.file });
      const { url } = cos;
      await createProduct({
        ...formData,
        images: url,
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
    ElMessage.error("只能上传字体文件！");
    return false;
  }
  return true;
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

async function getList() {
  loading.value = true;

  let params = {
    ...queryParams,
  };

  let res = await getProductList({
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
      await deleteProduct(delIds[0]);
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => {});
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建商品";
  form.value = {
    id: '',
    name: '',
    description: '',
    type: '',
    images: '',
    price: 0,
    salePrice: 0,
    stock: 0,
    specifications: '',
    tags: '',
    isActive: true,
    createTime: new Date(),
    updateTime: new Date(),
    file: null,
  };
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
</script>

<style lang="less"></style>
