<template>
  <div>
    <div class="py-4 flex justify-between gap-4 items-center">
      <!-- 导出按钮 -->
      <div style="flex: 1"></div>
      <form-item label="按套图模板查询">
        <el-select clearable v-model="queryParams.psdTemplateId" placeholder="选择套图模板" style="width: 180px"
          @change="getList">
          <el-option v-for="item in psdTemplateList" :key="item.id" :label="item.templateName" :value="item.id" />
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
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="标题名称" prop="titleName">
              <el-input v-model="form.titleName" placeholder="请输入模板名称"/>

            </el-form-item>
            <!-- <div class="text-xs p-2">
              标题长度最大为 {{ maxTitleLength }}
            </div> -->
          </el-col>
          <el-col :span="24">
            <el-form-item label="套图模板" prop="psdTemplateId">
              <el-select v-model="form.psdTemplateId" placeholder="选择套图模板" style="width:100%">
                <el-option v-for="item in psdTemplateList" :key="item.id" :label="item.templateName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- <el-col :span="24">
            <el-form-item label="类目" prop="categoryId">
              <el-select clearable v-model="form.categoryId" placeholder="选择类目搜索">
                <el-option v-for="item in shopCategoryList" :key="item.id" :label="item.categoryName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col> -->

          <el-col :span="24">
            <el-form-item label="GPT 模板" prop="titleKeyword">
              <el-input v-model="form.titleKeyword" type="textarea" placeholder="请输入GPT 模板"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="GPT 要求" prop="titleDemand">
              <el-input v-model="form.titleDemand" type="textarea" placeholder="请输入GPT 要求"></el-input>
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
import { Search, Plus, Delete } from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { categoryOptions } from "@/views/material/collect";
import { ShopPlatformApi } from "@/api/shop/platform";
import { ShopCategoryApi } from "@/api/shop/category"; // 实际接口导入
import { ShopTemplateApi } from "@/api/shoptemplate";

const maxTitleLength = ref(230)

// 查询条件
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  name: "",
  psdTemplateId: '',
  sortingFields: defaultSortingValue(),
});

const shopCategoryList = ref([])

const psdTemplateList = ref([])

async function initPsdTemplate() {
  let res = await ShopTemplateApi.getShopTemplatePage({
    pageNo: 1,
    pageSize: 99
  })
  psdTemplateList.value = res.list
}

initPsdTemplate()

async function initShopCategory() {
  const res = await ShopCategoryApi.getShopCategoryPage({
    pageNo: 1,
    pageSize: 20,
  })
  shopCategoryList.value = res.list
}

initShopCategory()



const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { title: "ID", field: "id", width: 60, showOverflow: true },
    { title: "模板名称", field: "titleName", width: 160, showOverflow: true },
    { title: "套图模板", field: "psdTemplateName", width: 160, showOverflow: true },
    // {
    //   title: "类目", field: "categoryName", width: 160, showOverflow: true,
    // },
    { title: "标题模板", field: "titleKeyword", minWidth: 200, showOverflow: true },
    { title: "标题要求", field: "titleDemand", minWidth: 200, showOverflow: true },
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

  let res = await getTitleTemplateList({
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
      await deleteTitleTemplate({ ids: delIds });
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

function handleEdit(row) {
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";
  form.value = {
    ...row
  };
}


function cancel() {
  open.value = false;
}

const form = ref({});

const rules = {
  titleName: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  psdTemplateId: [{ required: true, message: "请选择套图模板", trigger: "blur" }],
  // categoryId: [{ required: true, message: "请选择类目", trigger: "blur" }],
  titleKeyword: [
    { required: true, message: "请输入GPT模板", trigger: "blur" },
    { 
      pattern: /^[^"]*$/,
      message: "内容中不能包含英文双引号",
      trigger: "blur"
    }
  ],
  titleDemand: [
    { required: true, message: "请输入GPT要求", trigger: "blur" },
    { 
      pattern: /^[^"]*$/,
      message: "内容中不能包含英文双引号",
      trigger: "blur"
    }
  ],
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
      await editTitleTemplate({
        ...form.value
      })
      getList()
      ElMessage.success("更新成功");
    } else {
      await addTitleTemplate({
        ...form.value,
      });
      ElMessage.success("添加成功");
      getList()
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
