<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <!-- 导出按钮 -->
      <div style="flex: 1"></div>

      <form-item label="排序方式">
        <el-select v-model="queryParams.sortingFields" style="width: 160px" @change="getList">
          <el-option v-for="item in sortTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>

      <!-- <form-item label="按名称搜索">
        <el-input v-model="queryParams.name" clearable placeholder="请输入模板名称" style="width: 160px"></el-input>
      </form-item> -->
      <!-- <el-button type="primary" @click="getList" :icon="Search"> 搜索 </el-button> -->

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
        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column">
            <el-button type="primary" link size="small" @click="handleDetail(row)">
              详情
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="primary" link size="small" @click="handleCopy(row)">
              复制
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

    <el-dialog class="platform-detail-dialog" title="商品模板详情" v-model="detailDialogVisible" width="100%"
      style="height: 100%;" align-center @cancel="dialogClose" :destroy-on-close="true">
      <div style="height: calc(100%);overflow:auto;">
        <component :is="activeComponent" :currentRow="currentRow" :detailData="detailData"></component>
      </div>

      <!-- <template #footer>
        <el-button @click="detailDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template> -->
    </el-dialog>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" @close="dialogClose" @cancel="dialogClose"
      align-center>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="平台" prop="platformId">
              <el-select v-model="form.platformId" @change="initShopList">
                <el-option v-for="item in platformList" :key="item.id" :label="item.platformName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="店铺" prop="shopId">
              <el-select v-model="form.shopId" placeholder="选择店铺" style="width:100%">
                <el-option v-for="item in shopList" :key="item.id" :value="item.id" :label="item.shopName">
                  <div class="flex items-center gap-2">
                    {{ item.shopName }} <el-tag size="small" type="warning" round> {{ item.platformName }} </el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模板名称" prop="templateName">
              <el-input v-model="form.templateName" placeholder="请输入模板名称"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="类目" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="选择类目">
                <el-option v-for="item in shopCategoryList" :key="item.id" :label="item.categoryName"
                  :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>

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
import { getPsdTemplateList, addPsdTemplate, editPsdTemplate, deletePsdTemplate } from "@/api/shop"; // 实际接口导入
import { Search, Plus, Delete } from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { ShopPlatformEnum } from '@/common/shop'
import { getProductTemplateList, addProductTemplate, updateProductTemplate, deleteProductTemplate, getProductTemplateDetail } from '@/api/publish/template'
import { ShopApi } from "@/api/shop/shopIndex";
import { ShopCategoryApi } from "@/api/shop/category";
import temu from './templates/temu/temu.vue'
import { ShopPlatformApi } from "@/api/shop/platform";

const activePlatform = ref('temu')
const platformOptions = ref([
  {
    label: 'Temu',
    value: 'temu',
    component: temu
  },
  {
    label: 'Tiktok',
    value: 'tiktok'
  },
])

// 查询条件
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
});

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { title: "ID", field: "id", width: 180, showOverflow: true },
    { title: "平台名称", field: "platformName", minWidth: 160, showOverflow: true },
    { title: "模板名称", field: "templateName", minWidth: 160, showOverflow: true },
    { title: "店铺名称", field: "shopName", minWidth: 160, showOverflow: true },
    { title: "类目", field: "categoryName", minWidth: 160, showOverflow: true },
    { title: "创建人", field: "creatorName", width: 120, showOverflow: true },
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

const detailDialogVisible = ref(false)

// 店铺的下拉多选
const shopList = ref([
])

async function initShopList(platformId?) {
  const res = await ShopApi.getShopPage({
    pageNo: 1,
    pageSize: 99,
    platformId: platformId,
  });
  shopList.value = res.list
}

// initShopList();

const shopCategoryList = ref([])

async function initShopCategory() {
  const res = await ShopCategoryApi.getShopCategoryPage({
    pageNo: 1,
    pageSize: 20,
  })

  shopCategoryList.value = res.list;
}

initShopCategory()

async function getList() {
  loading.value = true;

  let params = {
    ...queryParams,
  };

  let res = await getProductTemplateList({
    ...params,
  }).catch(() => {

  }).finally(() => {
    loading.value = false;
  });
  dataSource.value = res.list
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
      await deleteProductTemplate({ ids: delIds });
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => {
    })
}


function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建商品模板";
  form.value = {};
}

function handleEdit(row) {
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";

  if (form.value.platformId) {
    initShopList(form.value.platformId)
  }

  form.value = {
    ...row
  };
}



function cancel() {
  open.value = false;
}


const form = ref({
  templateName: '',
  platformId: '',
  shopId: '',
  categoryId: '',
});

const rules = {
  platformId: [{ required: true, message: "请选择平台", trigger: "blur" }],
  templateName: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  shopId: [{ required: true, message: "请选择店铺", trigger: "blur" }],
  categoryId: [{ required: true, message: "请选择类目", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
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
      await updateProductTemplate({
        ...form.value,
      });
      ElMessage.success("更新成功");
    } else {
      await addProductTemplate({
        ...form.value,
        templateTemu: {}
      });
      ElMessage.success("添加成功");
    }

    dialogVisible.value = false;
  } catch (e) {
  } finally {
    submitLoading.value = false;
    dialogVisible.value = false;
  }
  getList();
};


// 初始化平台
const platformList = ref([])

initPlatformList()

async function initPlatformList() {
  const res = await ShopPlatformApi.getShopPlatformPage({
    pageNo: 1,
    pageSize: 99
  })

  platformList.value = res.list
}


function handleCopy(row) {

}

const activeComponent = shallowRef()

const detailData = ref({})
async function handleDetail(row) {
  // 根据不同平台使用不同组件
  currentRow.value = row
  const res = await getProductTemplateDetail({
    publishTemplateId: currentRow.value.id
  })

  console.log('获取平台配置详情', res)
  detailData.value = res
  activeComponent.value = temu
  detailDialogVisible.value = true
}
</script>

<style lang="less">
.platform-detail-dialog {
  .el-dialog__body {
    height: calc(100% - 40px);
  }
}
</style>
