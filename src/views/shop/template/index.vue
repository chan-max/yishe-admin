<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="shop-template-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--base" :xs="24" :sm="12" :md="8" :lg="5" :xl="4">
                <el-form-item label="排序方式">
                  <el-select v-model="queryParams.sortingFields" @change="getList">
                    <el-option v-for="item in sortTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button type="primary" :disabled="single" @click="handleAdd" :icon="Plus">新增</el-button>
              <el-button type="danger" :icon="Delete" @click="handleDelete(null)">批量删除</el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                v-bind="gridOptions"
                :data="dataSource"
                :loading="loading"
                @checkbox-change="checkboxChange"
                @checkbox-all="checkboxAllChange"
              >
                <template #operationDefaultSlot="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown class="operation-dropdown" placement="bottom-end">
                      <el-button type="primary" link size="small" class="operation-trigger-button">操作</el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item @click="handleDetail(row)">详情</el-dropdown-item>
                          <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                          <el-dropdown-item @click="handleCopy(row)">复制</el-dropdown-item>
                          <el-dropdown-item divided @click="handleDelete(row)">删除</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </template>
              </vxe-grid>
            </div>
          </div>
        </div>
      </template>

      <template #pagination>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat">
          <pagination
            :total="total"
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>
  </ContentWrap>

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
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, onUnmounted, watchEffect, shallowRef } from "vue";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
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
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";

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
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
});

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    buildOperationColumn("operationDefaultSlot", 132, {
      showOverflow: false,
    }),
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
    currentPage: 1,
    pageSize: 99,
    platformId: platformId,
  });
  shopList.value = res.list
}

// initShopList();

const shopCategoryList = ref([])

async function initShopCategory() {
  const res = await ShopCategoryApi.getShopCategoryPage({
    currentPage: 1,
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
    currentPage: 1,
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

.shop-template-page {
  gap: 10px;
  padding: 8px 0 0;
}

.shop-template-page .list-page-layout__main {
  gap: 10px;
}

.shop-template-page .list-page-filter--flat {
  gap: 10px;
  padding-bottom: 10px;
}

.shop-template-page .list-page-table-panel__pagination--flat {
  padding-top: 10px;
}
</style>
