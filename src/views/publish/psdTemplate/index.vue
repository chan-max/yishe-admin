<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <!-- 导出按钮 -->
      <div style="flex: 1"></div>

      <form-item label="按店铺查询">
        <el-select clearable v-model="queryParams.shopId" placeholder="选择店铺" style="width: 180px" @change="getList">
          <el-option v-for="item in shopList" :key="item.id" :label="item.shopName" :value="item.id" />
        </el-select>
      </form-item>

      <form-item label="按类目查询">
        <el-select clearable v-model="queryParams.categoryId" placeholder="选择类目" style="width: 180px" @change="getList">
          <el-option v-for="item in categoryList" :key="item.id" :label="item.categoryName" :value="item.id" />
        </el-select>
      </form-item>
      <!-- <form-item label="按名称搜索">
        <el-input v-model="queryParams.name" clearable placeholder="请输入名称" style="width: 160px"></el-input>
      </form-item>
      <el-button type="primary" @click="getList" :icon="Search"> 搜索 </el-button> -->

      <form-item label="排序方式">
        <el-select v-model="queryParams.sortingFields" style="width: 160px" @change="getList">
          <el-option v-for="item in sortTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>

      <div class="shrink-0">
        <!-- 修改按钮 -->
        <el-button type="primary" :disabled="single" @click="handleAdd" :icon="Plus"> 新增 </el-button>
        <!-- 删除按钮 -->
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)"> 批量删除 </el-button>
      </div>
    </div>

    <!-- 表格展示 -->
    <div class="common-table">
      <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading" @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange">

        <template #titleTemplateNameDefaultSlot="{ row }">
          <div v-if="row.titleTemplateId" class="flex items-center gap-2">
            <span>
              {{ row.titleTemplateName }}
            </span>
          </div>
          <div v-else> <el-button type="danger" @click="handleEdit(row)" link size="small"> 未选择标题,点击选择 </el-button>
          </div>
        </template>

        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="primary" link size="small" @click="() => {
              downloadFileByElement(row.psdUrl, row.templateName)
            }">
              下载源文件
            </el-button>

            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </div>
        </template>
      </vxe-grid>
    </div>

    <!-- 分页 -->
    <div class="py-4 flex justify-end">
      <pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
        @pagination="getList" />
    </div>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" @close="dialogClose" align-center>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="模板名称" prop="templateName">
              <el-input v-model="form.templateName" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="选择店铺" prop="shopId">
              <el-select v-model="form.shopId">
                <el-option v-for="item in shopList" :key="item.id" :label="item.shopName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="选择类目" prop="categoryId">
              <el-select v-model="form.categoryId">
                <el-option v-for="item in categoryList" :key="item.id" :label="item.categoryName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- <el-col :span="24">
            <el-form-item label="SPU ID" prop="productId">
              <el-input v-model="form.productId" placeholder="请输入" />
            </el-form-item>
          </el-col> -->

          <el-col :span="24">
            <el-form-item label="轮播图" prop="_carouselImages">
              <!-- <el-input v-model="form.carouselImages" placeholder="请输入轮播图" /> -->

              <el-select v-model="form._carouselImages" multiple placeholder="请输入轮播图">
                <el-option v-for="item in 20" :value="item">{{ item }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="详情图" prop="_detailImages">
              <!-- <el-input v-model="form.detailImages" placeholder="请输入详情图" /> -->
              <el-select v-model="form._detailImages" multiple placeholder="请输入详情图">
                <el-option v-for="item in 20" :value="item">{{ item }}</el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模板路径" prop="psdLocalPath">
              <el-input v-model="form.psdLocalPath" placeholder="请输入模板路径" />
            </el-form-item>
          </el-col>


          <!-- <el-col :span="24" v-if="isEdit">
            <el-form-item label="标题模板" prop="titleTemplateId">
              <el-select v-model="form.titleTemplateId" placeholder="选择标题模板" style="width:100%">
                <el-option v-for="item in titleTemplateList" :key="item.id" :label="item.titleName" :value="item.id" />
                <template #empty>
                  <el-button link type="primary" size="small" :icon="TopRight" @click="() => {
                    $router.push({
                      name: 'TitleTemplate'
                    })
                  }"> 暂无标题,去添加 </el-button>
                </template>
              </el-select>
            </el-form-item>
          </el-col> -->
          <!-- <el-col :span="24" v-if="!isEdit">
            <el-form-item label="模板文件" prop="file">
              <el-upload style="width: 100%;" action="#" :limit="1" :file-list="fileList" :on-change="handleFileChange"
                :before-upload="beforeUpload" :auto-upload="false" :on-remove="handleFileRemove" accept=".psd">
                <el-button type="primary">选择 PSD 文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">只能上传 PSD 文件</div>
                </template>
              </el-upload>
            </el-form-item>
          </el-col> -->
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
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
// import { getShopProductCategoryList, deleteShopProductCategory, editShopProductCategory, addShopProductCategory } from "@/api/shop"; 
import { Search, Plus, Delete, TopRight, Edit, CirclePlusFilled, CirclePlus } from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { ShopTemplateApi } from "@/api/shoptemplate";
import { ShopPlatformApi } from "@/api/shop/platform";
import { ShopCategoryApi } from "@/api/shop/category";
import { ShopApi } from "@/api/shop/shopIndex";
import { downloadFileByElement } from "@/common/download";
import { getTitleTemplateList } from "@/api/publish";
import { uploadOSSFile } from "@/api/oss";

// 查询条件
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
});

const categoryList = ref([])

initcategoryList()

async function initcategoryList() {
  const res = await ShopCategoryApi.getShopCategoryPage({
    pageNo: 1,
    pageSize: 99
  })
  categoryList.value = res.list
}


const shopList = ref([])

initShopList()

async function initShopList() {
  const res = await ShopApi.getShopPage({
    pageNo: 1,
    pageSize: 99
  })
  shopList.value = res.list
}

/**
 * @初始化标题模板
*/

const titleTemplateList = ref([])

async function initTitleTemplate(psdTemplateId?) {
  let res = await getTitleTemplateList({
    pageNo: 1,
    pageSize: 99,
    psdTemplateId
  })
  titleTemplateList.value = res.list
}
initTitleTemplate()


const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { title: "ID", field: "id", width: 140, showOverflow: true },
    { title: "套图模板名称", field: "templateName", width: 240, showOverflow: true },
    { title: "模板路径", field: "psdLocalPath", minWidth: 180, showOverflow: true },
    // { title: "源文件名称", field: "fileName", width: 120, showOverflow: true },
    // {
    //   title: "当前使用标题", field: "titleTemplateName", width: 240, showOverflow: true,
    //   slots: {
    //     default: 'titleTemplateNameDefaultSlot'
    //   }
    // },
    { title: "所属店铺", field: "shopName", minWidth: 100, showOverflow: true },
    { title: "类目", field: "categoryName", minWidth: 100, showOverflow: true },
    // { title: "SPU ID", field: "productId", minWidth: 100, showOverflow: true },
    { title: "轮播图", field: "carouselImages", minWidth: 100, showOverflow: true },
    { title: "详情图", field: "detailImages", minWidth: 100, showOverflow: true },
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
const currentRow = ref({});
const submitLoading = ref(false);

async function getList() {
  loading.value = true;

  let params = {
    ...queryParams,
    name: String(queryParams.name || ""),
  };

  let res = await ShopTemplateApi.getShopTemplatePage({
    ...params,
  }).catch(() => {

  }).finally(() => {
    loading.value = false;
  });
  dataSource.value = res.list;
  total.value = res.total;
  ids.value = [];
}

getList();

// 操作函数
function handleQuery() {
  queryParams.pageNo = 1;
}

function resetQuery() {
  getList();
}

function handleDelete(row?) {
  let delIds: any = null;
  if (row) {
    delIds = [row.id];
  } else if (!ids.value.length) {
    return ElMessage.warning('请选择要删除的数据');
  } else {
    delIds = [...ids.value];
  }

  ElMessageBox.confirm(
    "确认删除该数据吗",
    '删除提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'error',
    }
  )
    .then(async () => {
      console.log("执行删除");
      await ShopTemplateApi.deleteShopTemplate({ ids: delIds });
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => {
    })
}


function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建模板";
  form.value = {};
}

function handleEdit(row) {
  currentRow.value = row
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";
  initTitleTemplate(row.id)

  let _carouselImages = row.carouselImages.slice(1, -1).split(',').map((item) => Number(item))
  let _detailImages = row.detailImages.slice(1, -1).split(',').map((item) => Number(item))

  form.value = {
    ...row,
    _carouselImages: _carouselImages,
    _detailImages: _detailImages,
  };
}

function cancel() {
  open.value = false;
}

const form = ref({
  categoryId: '',
  shopId: '',
  file: null,
  templateName: '',
  titleTemplateId: '',
  _carouselImages: [],
  carouselImages: '',
  _detailImages: [],
  detailImages: '',
  productId: '',
  psdLocalPath: '',
});

const rules = {
  templateName: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  categoryId: [{ required: true, message: "请选择类目", trigger: "blur" }],
  shopId: [{ required: true, message: "请选择店铺", trigger: "blur" }],
  productId: [{ required: true, message: "请输入 SPU ID", trigger: "blur" }],
  _carouselImages: [{ required: true, message: "请输入轮播图", trigger: "blur" }],
  _detailImages: [{ required: true, message: "请输入详情图", trigger: "blur" }],
  psdLocalPath: [
    {
      required: true,
      message: "请输入本地psd模板",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (value && (value.startsWith('"') || value.endsWith('"'))) {
          callback(new Error('首尾不能为双引号'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  // titleTemplateId: [{ required: true, message: "请选择标题模板", trigger: "blur" }],
  file: [{ required: true, message: "请选择 PSD 文件", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
  fileList.value = []
  submitLoading.value = false
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
      submitLoading.value = true
      await ShopTemplateApi.updateShopTemplate({
        // ...form.value,
        id: form.value.id,
        templateName: form.value.templateName,
        shopId: form.value.shopId,
        categoryId: form.value.categoryId,
        titleTemplateId: form.value.titleTemplateId,
        // carouselImages: form.value.carouselImages,
        // detailImages: form.value.detailImages,
        carouselImages: `[${form.value._carouselImages.join(',')}]`,
        detailImages: `[${form.value._detailImages.join(',')}]`,
        productId: form.value.productId,
        psdLocalPath: form.value.psdLocalPath,
      });
      ElMessage.success("更新成功");
      getList();
    } else {
      // let formData = new FormData()
      // formData.append('templateName',form.value.templateName);
      // formData.append('categoryId',form.value.categoryId);
      // formData.append('shopId',form.value.shopId);
      // formData.append('file',form.value.file);
      // await ShopTemplateApi.createShopTemplate(formData);

      submitLoading.value = true
      // const ossRes = await uploadOSSFile(form.value.file, 'psdPath')
      // const { name, url } = ossRes
      await ShopTemplateApi.createShopTemplate({
        ...form.value,
        file: null,
        // psdUrl: url,
        // ossPath: name,
        carouselImages: `[${form.value._carouselImages.join(',')}]`,
        detailImages: `[${form.value._detailImages.join(',')}]`,
        psdLocalPath: form.value.psdLocalPath,
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

const fileList = ref([])

// 文件选择改变时的回调
const handleFileChange = (file, files) => {
  fileList.value = files; // 更新文件列表
  form.value.templateName = file.name
  form.value.file = file.raw; // 将文件绑定到表单数据
};

// 文件移除时的回调
const handleFileRemove = () => {
  fileList.value = []; // 清空文件列表
  form.value.file = null; // 清空表单中的文件
};


// 文件上传前的校验
const beforeUpload = (file) => {
};
</script>

<style lang="less"></style>
