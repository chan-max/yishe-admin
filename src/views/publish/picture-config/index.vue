<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <!-- 导出按钮 -->
      <div style="flex: 1"></div>
      <form-item label="按名称搜索">
        <el-input v-model="queryParams.name" clearable placeholder="请输入名称" style="width: 160px"></el-input>
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
      <!-- <pagination :total="total" v-model:page="queryParams.currentPage" v-model:limit="queryParams.pageSize"
        @pagination="getList" /> -->
    </div>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" @close="dialogClose" @cancel="dialogClose"
      align-center>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="配置名称" prop="remark">
              <el-input v-model="form.remark" placeholder="请输入配置名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="店铺" prop="shopId">
              <el-select v-model="form.shopId" placeholder="选择店铺" style="width:100%" @change="shopIdChange">

                <el-option v-for="item in shopList" :key="item.id" :value="item.id" :label="item.shopName"
                  :disabled="isShopIdDisabled(item.id)">
                  <div class="flex items-center gap-2">
                    {{ item.shopName }} <el-tag size="small" type="warning" round> {{ item.platformName }} </el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="类目" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="选择类目搜索" @change="categoryIdChange">
                <el-option v-for="item in shopCategoryList" :key="item.id" :label="item.categoryName" :value="item.id"
                  :disabled="isCategoryIdDisabled(item.id)" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="套图模板" prop="psdTemplateId">
              <el-select v-model="form.psdTemplateId" placeholder="选择套图模板" style="width:100%"
                @change="psdTemplateIdChange">
                <el-option v-for="item in psdTemplateList" :disabled="isPsdTemplateIdDisabled(item.id)" :key="item.id"
                  :label="item.templateName" :value="item.id" />
                <template #empty>
                  <template v-if="form.shopId && form.categoryId">
                    <el-button link type="primary" size="small" :icon="TopRight" @click="() => {
                      $router.push({
                        name: 'PsdTemplate'
                      })
                    }"> 该店铺类目下没有套图模板，去添加 </el-button>
                  </template>

                  <template v-if="!form.shopId && !form.categoryId">
                    <el-button type="warning" link size="small"> 请先选择店铺和类目 </el-button>
                  </template>

                  <template v-if="form.shopId && !form.categoryId">
                    <el-button type="warning" link size="small"> 请选择分类 </el-button>
                  </template>

                  <template v-if="!form.shopId && form.categoryId">
                    <el-button type="warning" link size="small"> 请选择店铺 </el-button>
                  </template>
                </template>

              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="标题模板" prop="titleTemplateId">
              <el-select v-model="form.titleTemplateId" placeholder="选择标题模板" style="width:100%">
                <el-option v-for="item in titleTemplateList" :key="item.id" :label="item.titleName" :value="item.id" />
                <template v-if="form.psdTemplateId" #empty>
                  <el-button link type="primary" size="small" :icon="TopRight" @click="() => {
                    $router.push({
                      name: 'TitleTemplate'
                    })
                  }"> 暂无标题,去添加 </el-button>
                </template>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="发布模板" prop="publishTemplateId">
              <el-select v-model="form.publishTemplateId" placeholder="选择发布模板" style="width:100%">
                <el-option v-for="item in publishTemplateList" :key="item.id" :label="item.templateName"
                  :value="item.id" />
                <template #empty>
                  <template v-if="form.shopId && form.categoryId">
                    <el-button link type="primary" size="small" :icon="TopRight" @click="() => {
                      $router.push({
                        name: 'ShopTemplate'
                      })
                    }"> 该店铺类目下没有套图模板，去添加 </el-button>
                  </template>

                  <template v-if="!form.shopId && !form.categoryId">
                    <el-button type="warning" link size="small"> 请先选择店铺和类目 </el-button>
                  </template>

                  <template v-if="form.shopId && !form.categoryId">
                    <el-button type="warning" link size="small"> 请选择分类 </el-button>
                  </template>

                  <template v-if="!form.shopId && form.categoryId">
                    <el-button type="warning" link size="small"> 请选择店铺 </el-button>
                  </template>
                </template>

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
import { getTitleTemplateList, addTitleTemplate, editTitleTemplate, deleteTitleTemplate } from "@/api/publish"; // 实际接口导入
import { addConfigTemplate, deleteConfigTemplate, updateConfigTemplate, getConfigTemplateList } from "@/api/publish/config";
import { Search, Plus, Delete, TopRight } from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { categoryOptions } from "@/views/material/collect";
import { ShopPlatformApi } from "@/api/shop/platform";
import { ShopCategoryApi } from "@/api/shop/category"; // 实际接口导入
import { ShopApi } from "@/api/shop/shopIndex";
import { psdTemplateApi } from "@/api/psdTemplate";
import { getProductTemplateList, } from '@/api/publish/template'


// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  name: "",
  categoryId: '',
  sortingFields: defaultSortingValue(),
});


/**
 * @psd套图列表
*/
const psdTemplateList = ref([])

async function initPsdTemplate() {

  let shopId = form.value.shopId;
  let categoryId = form.value.categoryId

  if (!shopId || !categoryId) {
    return
  }

  let res = await psdTemplateApi.getPsdTemplatePage({
    currentPage: 1,
    pageSize: 99,
    shopId,
    categoryId
  })
  psdTemplateList.value = res.list
}

/**
 * @psd模板是否可用，psd模板在列表中只能出现一个
*/

function isPsdTemplateIdDisabled(psdTemplateId) {
  return dataSource.value.some((item) => {
    return item.psdTemplateId == psdTemplateId
  })
}

/**
 * @同店铺和同类目只能有一个
*/

/**
 * @店铺是否禁用
*/

function isShopIdDisabled(shopId) {

  if (!form.value.categoryId) {
    return false
  }

  let someCategoryIdShopIdSame = dataSource.value.some((row) => {
    return row.categoryId == form.value.categoryId && row.shopId == shopId
  })

  if (someCategoryIdShopIdSame) {
    return true
  }

  return false

}

/**
 * @类目是否禁用
*/

function isCategoryIdDisabled(categoryId) {
  if (!form.value.shopId) {
    return false
  }


  let someCategoryIdShopIdSame = dataSource.value.some((row) => {
    return row.categoryId == categoryId && row.shopId == form.value.shopId
  })

  if (someCategoryIdShopIdSame) {
    return true
  }

  return false
}


/**
 * @店铺类目列表
*/

const shopCategoryList = ref([])

async function initShopCategory() {
  const res = await ShopCategoryApi.getShopCategoryPage({
    currentPage: 1,
    pageSize: 20,
  })
  shopCategoryList.value = res.list
}

initShopCategory()

// 店铺的下拉多选
const shopList = ref([
])

async function initShopList() {
  const res = await ShopApi.getShopPage({
    currentPage: 1,
    pageSize: 99
  });
  shopList.value = res.list
}

initShopList();


function psdTemplateIdChange(psdTemplateId) {
  initTitleTemplate(psdTemplateId)
  form.value.titleTemplateId = null
}

const titleTemplateList = ref([])

async function initTitleTemplate(psdTemplateId?) {
  let res = await getTitleTemplateList({
    currentPage: 1,
    pageSize: 99,
    psdTemplateId
  })
  titleTemplateList.value = res.list
}


const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { title: "ID", field: "id", width: 60, showOverflow: true },
    { title: "配置名称", field: "remark", width: 160, showOverflow: true },
    { title: "店铺", field: "shopName", minWidth: 100, showOverflow: true },
    {
      title: "类目", field: "categoryName", width: 160, showOverflow: true,
    },
    { title: "套图模板", field: "psdTemplateName", minWidth: 100, showOverflow: true },
    { title: "标题模板", field: "titleTemplateName", minWidth: 100, showOverflow: true },
    { title: "发布模板名称", field: "publishTemplateName", minWidth: 100, showOverflow: true },
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

  let res = await getConfigTemplateList({
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
      await deleteConfigTemplate({ ids: delIds });
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => {
    })
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建";
  form.value = {};
}

async function handleEdit(row) {
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";

  form.value = {
    ...row
  };
  initPsdTemplate()
  initPublishTemplate()
  initTitleTemplate(form.value.psdTemplateId)
}


function cancel() {
  open.value = false;
}

const form = ref({
  psdTemplateId: '',
  titleTemplateId: '',
  publishTemplateId: '',
  categoryId: '',
  shopId: '',
});

const rules = {
  remark: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
  categoryId: [{ required: true, message: "请选择类目", trigger: "blur" }],
  shopId: [{ required: true, message: "请选择店铺", trigger: "blur" }],
  psdTemplateId: [{ required: true, message: "请选择套图模板", trigger: "blur" }],
  titleTemplateId: [{ required: true, message: "请选择标题模板", trigger: "blur" }],

  publishTemplateId: [{ required: true, message: "请选择发布模板", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
  form.value = {}
  formRef.value.clearValidate()
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
      await updateConfigTemplate({
        ...form.value,
      });
      ElMessage.success("更新成功");
    } else {

      let row = shopList.value.find((item) => item.id == form.value.shopId)

      await addConfigTemplate({
        ...form.value,
        platformId: row && row.platformId
      });
      ElMessage.success("添加成功");
    }

    getList()
    dialogVisible.value = false;
  } catch (e) {
  } finally {
    submitLoading.value = false;
    dialogVisible.value = false;
  }

  getList();
};

async function shopIdChange(shopId) {
  initPsdTemplate()
  initPublishTemplate()
  form.value.psdTemplateId = null
  form.value.publishTemplateId = null
  form.value.titleTemplateId = null
}

async function categoryIdChange(categoryId) {
  initPsdTemplate()
  initPublishTemplate()
  form.value.psdTemplateId = null
  form.value.publishTemplateId = null
  form.value.titleTemplateId = null
}


const publishTemplateList = ref([])
async function initPublishTemplate() {
  let shopId = form.value.shopId;
  let categoryId = form.value.categoryId

  if (!shopId || !categoryId) {
    return
  }
  const res = await getProductTemplateList({
    shopId: shopId,
    categoryId: categoryId
  })
  publishTemplateList.value = res.list
}
</script>

<style lang="less"></style>
@/api/psdTemplate