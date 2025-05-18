<template>
  <div>
    <div class="py-4 flex justify-between gap-6 items-center">
      <div style="flex: 1"></div>
      <!-- <form-item label="只看我的">
        <el-checkbox v-model="queryParams.OnlyMe" @change="getList"></el-checkbox>
      </form-item> -->

      <form-item label="按用户查询">
        <useListSelect v-model="queryParams.creator" @change="getList"></useListSelect>
      </form-item>

      <form-item label="排序方式">
        <el-select v-model="queryParams.sortingFields" style="width: 160px" @change="getList">
          <el-option v-for="item in sortTypeOptions" :label="item.label" :value="item.value" :key="item.value">
          </el-option>
        </el-select>
      </form-item>

      <form-item label="标题状态:">
        <el-select v-model="queryParams.selectTitleComposite" style="width: 120px" @change="getList">
          <el-option v-for="item in titleConfig" :label="item.label" :value="item.type" :key="item.type">
          </el-option>
        </el-select>
      </form-item>

      <form-item label="上传状态:">
        <el-select v-model="queryParams.selectMaterial" style="width: 120px" @change="getList">
          <el-option v-for="item in selectMaterialOptions" :label="item.label" :value="item.value" :key="item.value">
          </el-option>
        </el-select>
      </form-item>
      <div class="flex shrink-0">
        <el-button type="primary" :disabled="single" @click="handleAdd" :icon="Plus"> 新增 </el-button>
        <el-button type="danger" @click="handleDelete(null)" :icon="Delete"> 批量删除 ({{ ids.length }}) </el-button>
      </div>
    </div>

    <!-- 表格展示 -->
    <div class="common-table">
      <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading" @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange">
        <template #completionDefaultSlot="{ row }">
          <div>
            <el-tag :color="getCompletionInfo(row.completion).color" effect="dark" style="border:none">
              {{ getCompletionInfo(row.completion).label }}
            </el-tag>
          </div>
        </template>


        <template #titleTemplateDefaultSlot="{ row }">
          <div>
            <el-tag :color="getTitleStatusInfo(row.titleComposite).color" effect="dark" style="border:none">
              {{ getTitleStatusInfo(row.titleComposite).label }}
            </el-tag>
          </div>
        </template>

        <template #imageFolderDefaultSlot="{ row }">
          <div v-if="row.imageFolder">
            {{ row.imageFolder }}
          </div>
          <div v-else>
            <el-tag type="warning">未上传</el-tag>
          </div>
        </template>

        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column">
            <el-button type="primary" size="small" link @click="handleCopy(row)" title="点击复制该条数据">
              复制
            </el-button>

            <el-button type="primary" link size="small" @click="handleEdit(row)"> 编辑 </el-button>
            <el-button type="primary" size="small" @click="handleUpload(row)" link>
              上传素材图
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" link>
              删除
            </el-button>
          </div>
        </template>
      </vxe-grid>
    </div>

    <!-- 分页 -->
    <div class=" flex justify-end">
      <pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
        @pagination="getList" />
    </div>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" @cancel="dialogClose" :closable="false"
      align-center>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="发布模板" prop="publishTemplateId">
              <el-select v-model="form.publishTemplateId" placeholder="选择发布模板" style="width:100%">
                <el-option v-for="item in publishTemplateList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标题模板" prop="gptTemplateId">
              <el-select v-model="form.gptTemplateId" placeholder="选择标题模板" style="width:100%">
                <el-option v-for="item in titleTemplateList" :key="item.id" :label="item.titleName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- <el-row>
          <el-col :span="12">
            <el-form-item label="SPU ID" prop="skcId">
              <el-input v-model="form.skcId" placeholder="请输入SPU ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="SKU货号">
              <el-input v-model="form.skuNo" :disabled="!isEdit" placeholder="请输入SKU货号" />
            </el-form-item>
          </el-col>
        </el-row> -->

        <!-- <el-row>
          <el-col :span="12">
            <el-form-item label="选择店铺" prop="shopId">
              <el-select v-model="form.shopId" placeholder="请输入店铺名称">
                <el-option v-for="item in shopList" :label="item.shopName" :value="item.id" :key="item.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="选择类目" prop="categoryId">
              <el-select clearable v-model="form.categoryId" placeholder="选择类目">
                <el-option v-for="item in shopCategoryList" :key="item.id" :label="item.categoryName"
                  :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row> -->
      
        <!-- <el-row>
          <el-col :span="12">
            <el-form-item label="轮播图" prop="carouselImages">
              <el-input v-model="form.carouselImages" placeholder="请输入轮播图" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="详情图" prop="detailImages">
              <el-input v-model="form.detailImages" placeholder="请输入详情图" />
            </el-form-item>
          </el-col>
        </el-row> -->


        <el-row v-if="isEdit">
          <el-col :span="24">
            <el-form-item label="标题" prop="title" v-if="isEdit">
              <el-input v-model="form.title" placeholder="请输入标题 (最多200字)" :maxLength="250" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- <el-row>
          <el-col :span="24">
            <el-form-item label="GPT模板" prop="gptTemplate">
              <el-input v-model="form.gptTemplate" type="textarea" show-word-limit placeholder="请输入GPT模板 (最多600字)"
                :maxlength="600" />
            </el-form-item>
          </el-col>
        </el-row> -->

        <!-- <el-row>
          <el-col :span="24">
            <el-form-item label="GPT要求" prop="gptPrompt">
              <el-input v-model="form.gptPrompt" type="textarea" style="width: 100%" show-word-limit
                placeholder="请输入GPT要求 (最多600字)" :maxlength="600" />
            </el-form-item>
          </el-col>
        </el-row> -->
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog title="上传素材图" v-model="uploadModalVisible" width="300px" @cancel="uploadDialogClose"
      @close="uploadDialogClose" :closable="false" align-center>
      <upload @image-uploaded="imageUploaded" :id="currentRow.id"></upload>
      <template #footer>
        <el-button @click="uploadDialogClose"> 关闭 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";

import {
  getAutoPublishList,
  addAutoPublish,
  updateAutoPublish,
  deleteAutoPublish,
  getTitleTemplateList,
  getPublishTemplateList,
} from "@/api/publish"; // 实际接口导入
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { getAccessToken } from "@/utils/auth";
import { useUserStore, useUserStoreWithOut } from "@/store/modules/user";
import { getCompletionInfo } from "@/common/material";
import { getTitleStatusInfo, titleConfig } from "@/common/title";
import { ElMessage } from 'element-plus'
import { sortTypeOptions,defaultSortingValue} from "@/common/sort";
import { ShopEnum } from "@/common/shop";
import { useWindowSize } from '@vueuse/core'
import upload from './upload.vue'
import { ShopCategoryApi } from "@/api/shop/category";
import { Delete, Plus } from "@element-plus/icons-vue";
import { ShopApi } from "@/api/shop/shopIndex";
import { getUserPage } from "@/api/system/user";
import useListSelect from '@/components/common/userListSelect.vue'
// 查询条件
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  selectMaterial: null,
  sortingFields: defaultSortingValue(),
  selectTitleComposite: '',
  // OnlyMe: false,
  creator: null, // 按用户查询
});


const selectMaterialOptions = ref([
  {
    label: "全部",
    value: null,
  },
  {
    label: "未上传",
    value: false,
  },
  {
    label: "已上传",
    value: true,
  },
]);

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { title: "ID", field: "id", width: 50, showOverflow: true },
    { title: "SPU ID", field: "skcId", width: 100, showOverflow: true },
    { title: "SKU货号", field: "skuNo", width: 100, showOverflow: true },
    { title: "店铺名称", field: "shopName", width: 100, showOverflow: true },
    {
      title: "创建人",
      field: "creatorName",
      width: 100,
      showOverflow: true,
    },
    {
      title: "素材图名称",
      field: "imageFolder",
      width: 100,
      showOverflow: true,
      slots: {
        default: "imageFolderDefaultSlot",
      },
    },
    { title: "类目", field: "categoryName", width: 100, showOverflow: true },
    {
      title: "标题状态",
      field: "titleComposite",
      width: 80,
      showOverflow: true,
      slots: {
        default: "titleTemplateDefaultSlot",
      },
    },
    {
      title: "标题",
      field: "title",
      width: 220,
      showOverflow: true,
    },

    {
      title: "完成度",
      field: "completion",
      width: 80,
      showOverflow: true,

      slots: {
        default: "completionDefaultSlot",
      },
    },
    { title: "GPT模板", field: "gptTemplate", width: 120, showOverflow: true },
    { title: "GPT要求", field: "gptPrompt", width: 120, showOverflow: true },
    { title: "轮播图", field: "carouselImages", width: 80, showOverflow: true },
    { title: "详情图", field: "detailImages", width: 80, showOverflow: true },
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
  gridOptions.value.maxHeight = height.value - 240;
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
  let res = await getAutoPublishList({
    ...queryParams,
  }).finally(() => {
    loading.value = false;
  });
  dataSource.value = res.list;
  total.value = res.total;
  ids.value = [];
}

getList();

async function imageUploaded() {
  uploadModalVisible.value = false
  getList()
  ElMessage.success('素材上传成功,正在生成标题')
}


const titleTemplateList = ref([])

async function initTitleTemplate() {
  let res = await getTitleTemplateList({
    pageNo: 1,
    pageSize: 99
  })
  titleTemplateList.value = res.list
}
initTitleTemplate()

const publishTemplateList = ref([])

async function initPublishTemplate() {
  let res = await getPublishTemplateList({
    pageNo: 1,
    pageSize: 99
  })
  publishTemplateList.value = res.list
}
initPublishTemplate()

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
    return;
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
      await deleteAutoPublish({ ids: delIds });
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => {
    })

}

// 店铺的下拉多选
const shopList = ref([

])

async function initShopList() {
  const res = await ShopApi.getShopPage({
    pageNo: 1,
    pageSize: 99
  });
  shopList.value = res.list
}

initShopList();

const shopCategoryList = ref([])

async function initShopCategory() {
  const res = await ShopCategoryApi.getShopCategoryPage({
    pageNo: 1,
    pageSize: 20,
  })

  shopCategoryList.value = res.list;
}

initShopCategory()


// function wsHandler(data) {
//   if (data["notifyGroup"] === "generator_title_group") {
//     if (data["notifyType"] === "change_title") {
//       let { notifyId, notifyData } = data;     let target = dataSource.value.find((item) => {
//         return item.id == notifyId;
//       });
//  
//       target.titleTemplate = notifyData;
//       message.success("标题已更新");
//     }
//   }
// }

// const userStore = useUserStore();

// onMounted(() => {
//   userStore.ws.onMessage(wsHandler);
// });

// onUnmounted(() => {
//   userStore.ws.offMessage(wsHandler);
// });

async function handleCopy(row) {
  let form = {
    gptTemplateId: row.gptTemplateId,
    publishTemplateId: row.publishTemplateId,
  };
  await addAutoPublish(form);
  ElMessage.success("复制成功");
  getList();
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建";

  let lastestRecord = dataSource.value[0];

  if (lastestRecord) {
    form.value = {
      gptTemplateId: lastestRecord ? lastestRecord.gptTemplateId : "",
      publishTemplateId: lastestRecord ? lastestRecord.publishTemplateId : "",
    };
  } else {
    form.value = {};
  }
}

async function handleEdit(row) {
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";
  currentRow.value = row;
  form.value = {
    ...row,
  };
}


function cancel() {
  open.value = false;
}

const form = ref({
  publishTemplateId:'',
  gptTemplateId:'',
  title: "",
});

const rules = {
  publishTemplateId: [{ required: true, message: "请选择发布模板", trigger: "blur" }],
  gptTemplateId: [{ required: true, message: "请选择标题模板", trigger: "blur" }],
  title: [{ required: true, message: "标题不能为空", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
};

const uploadDialogClose = () => {
  uploadModalVisible.value = false;
};

function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id);
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id);
}

const uploadModalVisible = ref(false);

function handleUpload(row) {
  currentRow.value = row;
  uploadModalVisible.value = true;
}

const submitForm = async () => {
  submitLoading.value = true;
  await formRef.value.validate().finally(() => {
    submitLoading.value = false;
  });
  try {
    if (isEdit.value) {
      await updateAutoPublish({
        ...form.value,
      });
      ElMessage.success("更新成功");
    } else {
      await addAutoPublish({
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
