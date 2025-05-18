<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <!-- 导出按钮 -->
      <div style="flex: 1"></div>
      <form-item label="平台">
        <el-select v-model="queryParams.platformId" style="width: 160px" @change="getList" clearable>
          <el-option v-for="item in platformList" :key="item.id" :label="item.platformName" :value="item.id" />
        </el-select>
      </form-item>

      <form-item label="按名称搜索">
        <el-input v-model="queryParams.shopName" clearable placeholder="请输入名称" style="width: 160px" @change="(val) => {
          if(!val){
            getList()
          }
        }"></el-input>
      </form-item>
      <el-button type="primary" @click="getList" :icon="Search"> 搜索 </el-button>

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
        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
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

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" @cancel="dialogClose" align-center>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="所属平台" prop="platformId">
              <el-select v-model="form.platformId">
                <el-option v-for="item in platformList" :key="item.id" :label="item.platformName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="店铺名称" prop="shopName">
              <el-input v-model="form.shopName" placeholder="请输入" />
            </el-form-item>
          </el-col>
 
          <el-col :span="24">
            <el-form-item label="店铺ID" prop="shopId">
              <el-input v-model="form.shopId" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="APP KEY" prop="appKey">
              <el-input v-model="form.appKey" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="APP Secret" prop="appSecret">
              <el-input v-model="form.appSecret" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="access_token" prop="accessToken">
              <el-input v-model="form.accessToken" placeholder="请输入" />
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
import { sortTypeOptions,defaultSortingValue} from "@/common/sort";
import { ElMessage, ElMessageBox } from "element-plus";
import { ShopApi } from "@/api/shop/shopIndex"; // 实际接口导入
import { ShopPlatformApi } from "@/api/shop/platform";
import { Search, Plus, Delete } from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { ShopPlatformEnum } from '@/common/shop'

// 查询条件
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  shopName: null,
  sortingFields: defaultSortingValue(),
  platformId: '' // 店铺平台
});

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { title: "ID", field: "id", width: 140, showOverflow: true },
    { title: "店铺名称", field: "shopName", minWidth: 160, showOverflow: true },
    { title: "平台", field: "platformName", width: 180, showOverflow: true },

 
    { title: "负责人", field: "operatorName", width: 100, showOverflow: true },
    { title: "商品数量", field: "goodsNum", width: 100, showOverflow: true },

    { title: "APP KEY", field: "appKey", minWidth: 160, showOverflow: true },
    { title: "APP SECRET", field: "appSecret",minWidth: 160,showOverflow: true },
    { title: "ACCESS TOKEN", field: "accessToken", minWidth: 160, showOverflow: true },

    // { title: "创建人", field: "creatorName", width: 100, showOverflow: true },
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
  };

  let res = await ShopApi.getShopPage({
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

const platformList = ref([])

initPlatformList()

async function initPlatformList() {
  const res = await ShopPlatformApi.getShopPlatformPage({
    pageNo: 1,
    pageSize: 99
  })

  platformList.value = res.list
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
      await ShopApi.deleteShop({ ids: delIds });
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => {
    })
}


function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建店铺";
  form.value = {};
}

function handleEdit(row) {
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "修改店铺";
  form.value = {
    ...row
  };
}



function cancel() {
  open.value = false;
}

const form = ref({
  shopName: '',
  platformId: '',


  shopId: '',
  appKey: '',
  appSecret: '',
  accessToken: '',
});

const rules = {
  shopName: [{ required: true, message: "请输入店铺名称", trigger: "blur" }],
  platformId: [{ required: true, message: "请选择店铺平台", trigger: "blur" }],

  shopId: [{ required: false, message: "请输入店铺ID", trigger: "blur" }],
  appKey: [{ required: false, message: "请输入", trigger: "blur" }],
  appSecret: [{ required: false, message: "请输入", trigger: "blur" }],
  accessToken: [{ required: false, message: "请输入", trigger: "blur" }],
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
      await ShopApi.updateShop({
        ...form.value,
      });
      ElMessage.success("更新成功");
    } else {
      await ShopApi.createShop({
        ...form.value,
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
</script>

<style lang="less"></style>
