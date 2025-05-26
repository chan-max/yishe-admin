<template>
  <div>
    <div class="py-4 flex justify-end gap-4 items-center">
      <div style="flex: 1"></div>
      <!-- <form-item label="只看我的">
        <el-checkbox v-model="queryParams.OnlyMe" @change="getList"></el-checkbox>
      </form-item> -->

      <form-item label="按用户查询">
        <useListSelect v-model="queryParams.creator" @change="getList"></useListSelect>
      </form-item>
      <form-item label="排序方式">
        <el-select v-model="queryParams.sortingFields" style="width: 160px" @change="getList">
          <el-option v-for="item in sortTypeOptions" :label="item.label" :value="item.value"
            :key="item.value"></el-option>
        </el-select>
      </form-item>

      <form-item label="标题状态:">
        <el-select v-model="queryParams.selectTitleComposite" style="width: 120px" @change="getList">
          <el-option v-for="item in titleConfig" :label="item.label" :value="item.type" :key="item.type">
          </el-option>
        </el-select>
      </form-item>

      <form-item label="上传状态">
        <el-select v-model="queryParams.selectCompletion" style="width: 120px" @change="getList">
          <el-option v-for="item in completionOptions" :label="item.label" :value="item.value"
            :key="item.value"></el-option>
        </el-select>
      </form-item>

      <div class="flex">
        <el-button type="primary" @click="handleMultiplePublish(null)"> 批量发布({{ ids.length }}) </el-button>
        <el-button type="danger" @click="handleDelete(null)"> 批量删除 ({{ ids.length }}) </el-button>
      </div>
    </div>

    <!-- 表格展示 -->
    <div class="common-table">
      <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading" @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange">
        <template #imageListDefaultSlot="{ row }">
          <div>
            <div v-if="row.imageList && row.imageList.length"
              class="flex flex-col items-center gap-1 cursor-pointer preview-image"
              @click="previewImageList(row.imageList)">
              <div class="font-bold" style="font-size: 9px">
                共
                <span style="font-size: 1.5em; color: var(--erp-primary-color)">{{
                  row.imageList.length
                }}</span>
                张 ,点击预览
              </div>
            </div>
            <div v-else class="font-bold text-gray ">暂无套图</div>
          </div>
        </template>
        
        <template #completionDefaultSlot="{ row }">
          <div>
            <el-tag :color="getCompletionInfo(row.completion).color" effect="dark" style="border:none;">
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
 
        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column justify-end">
            <el-button v-if="disabledRow(row)" type="warning" link size="small" disabled>缺少发布内容</el-button>
            <template v-else-if="row.hasComposite !== 2">
              <el-button type="text" size="small" disabled> 请先上传套图 </el-button>
            </template>
            <template v-else-if="row.completion == 1">
              <el-button type="warning" link size="small" :loading="true">
                {{ "上传中" }}
              </el-button>
            </template>
            <template v-else-if="row.completion == 2">
              <el-button type="primary" link size="small" disabled> 已完成 </el-button>
            </template>
            <template v-else>
              <el-button type="primary" link size="small" @click="handleUpload(row)">
                {{ "上传并发布" }}
              </el-button>
            </template>

            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </div>
        </template>

        <template #hasCompositeDefaultSlot="{ row }">
          <div>
            <el-tag :color="getCompositeInfo(row.hasComposite).color" effect="dark" style="border:none;">
              {{ getCompositeInfo(row.hasComposite).label }}
            </el-tag>
          </div>
        </template>
      </vxe-grid>
    </div>

    <!-- 分页 -->
    <div class=" flex justify-end">
      <pagination :total="total" v-model:page="queryParams.currentPage" v-model:limit="queryParams.pageSize"
        @pagination="getList" />
    </div>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px" @close="dialogClose"
      :close-on-click-modal="false" center>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <!-- 第一行，两个输入框 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <!-- SKC ID -->
            <el-form-item label="SPU ID" prop="skcId">
              <el-input v-model="form.skcId" placeholder="请输入SPU ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- SKU货号 -->
            <el-form-item label="SKU货号" prop="skuNo">
              <el-input v-model="form.skuNo" placeholder="请输入SKU货号" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第二行，两个输入框 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <!-- 店铺名称 -->
            <el-form-item label="店铺名称" prop="shopName">
              <el-input v-model="form.shopName" placeholder="请输入店铺名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- 类目 -->
            <el-form-item label="类目" prop="category">
              <el-input v-model="form.category" placeholder="请输入类目" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第三行，两个输入框 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <!-- 轮播图 -->
            <el-form-item label="轮播图" prop="carouselImages">
              <el-input v-model="form.carouselImages" placeholder="请输入轮播图" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- 详情图 -->
            <el-form-item label="详情图" prop="detailImages">
              <el-input v-model="form.detailImages" placeholder="请输入详情图" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第四行，单个输入框 -->
        <el-row v-if="isEdit">
          <el-col :span="24">
            <!-- 标题 -->
            <el-form-item label="标题" prop="titleTemplate" v-if="isEdit">
              <el-input v-model="form.titleTemplate" placeholder="请输入标题 (最多200字)" :maxlength="200" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第五行，单个输入框 -->
        <el-row>
          <el-col :span="24">
            <!-- GPT模板 -->
            <el-form-item label="GPT模板" prop="gptTemplate">
              <el-input v-model="form.gptTemplate" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }"
                placeholder="请输入GPT模板 (最多600字)" :maxlength="600" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第六行，单个输入框 -->
        <el-row>
          <el-col :span="24">
            <!-- GPT要求 -->
            <el-form-item label="GPT要求" prop="gptPrompt">
              <el-input v-model="form.gptPrompt" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }"
                placeholder="请输入GPT要求 (最多600字)" :maxlength="600" />
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
import {
  getAutoPublishList,
  addAutoPublish,
  updateAutoPublish,
  deleteAutoPublish,
  updateAndPublish,
} from "@/api/publish"; // 实际接口导入
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";

import { getAccessToken } from "@/utils/auth";
import { useUserStore } from "@/store/modules/user";
import { getCompositeInfo, compositeConfig } from "@/common/ps";

import { getCompletionInfo, completionConfig } from "@/common/material";
import { sortTypeOptions,defaultSortingValue} from "@/common/sort";
import { preview } from "@/components/PreviewImage/index";
import { useWindowSize } from "@vueuse/core";
import { getTitleStatusInfo, titleConfig } from "@/common/title";
import useListSelect from '@/components/common/userListSelect.vue'

const completionOptions = computed(() => {
  return completionConfig
    .map((item) => {
      return {
        label: item.label,
        value: item.type,
      };
    })
    .concat({
      label: "全部",
      value: null,
    });
});

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  selectCompletion: null,
  sortingFields: defaultSortingValue(),
  OnlyMe: false,
  selectTitleComposite:'',
  creator:''
});

// 当前行缺少内容
function disabledRow(row) {
  return !row.skcId || !row.skuNo || !row.shopName || !row.category || !row.titleTemplate;
}


const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { title: "ID", field: "id", width: 50, showOverflow: true },
    { title: "SPU ID", field: "skcId", width: 100, showOverflow: true },
    { title: "SKU货号", field: "skuNo", width: 100, showOverflow: true },
    { title: "店铺名称", field: "shopName", width: 100, showOverflow: true },
    { title: "素材图名称", field: "imageFolder", width: 100, showOverflow: true },
    {
      title: "创建人",
      field: "creatorName",
      width: 100,
      showOverflow: true,
    },
    { title: "类目", field: "categoryName", width: 60, showOverflow: true },
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
      field: "titleTemplate",
      width: 220,
      showOverflow: true,
    },
    {
      title: "套图状态",
      field: "hasComposite",
      width: 100,
      showOverflow: true,
      slots: {
        default: "hasCompositeDefaultSlot",
      },
    },
    {
      title: "套图预览",
      field: "imageList",
      minWidth: "120",
      slots: {
        default: "imageListDefaultSlot",
      },
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
const title = ref("新增角色");
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

// function wsHandler(data) {
//   if (data["notifyGroup"] === "auto_public_group") {
//     if (data["notifyType"] === "change_completion") {
//       let { notifyId, notifyData } = data;
//       let target = dataSource.value.find((item) => {
//         return item.id == notifyId;
//       });
//       target.completion = notifyData;
//       message.success("发布情况更新", notifyData);
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

function previewImageList(list) {
  preview(0, list);
}



function cancel() {
  open.value = false;
}

const form = ref({
  skcId: "",
  skuNo: "",
  shopName: "",
  category: "",
  carouselImages: "",
  detailImages: "",
  titleTemplate: "",
  gptTemplate: "",
  gptPrompt: "",
});

const rules = {
  skcId: [{ required: true, message: "SPU ID不能为空", trigger: "blur" }],
  skuNo: [{ required: true, message: "SKU货号不能为空", trigger: "blur" }],
  shopName: [{ required: true, message: "店铺名称不能为空", trigger: "blur" }],
  category: [{ required: true, message: "类目不能为空", trigger: "blur" }],
  carouselImages: [{ required: true, message: "轮播图不能为空", trigger: "blur" }],
  detailImages: [{ required: true, message: "详情图不能为空", trigger: "blur" }],
  titleTemplate: [{ required: true, message: "标题不能为空", trigger: "blur" }],
  gptTemplate: [{ required: true, message: "GPT模板不能为空", trigger: "blur" }],
  gptPrompt: [{ required: true, message: "GPT要求不能为空", trigger: "blur" }],
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

  ElMessageBox.confirm("确认上传该记录吗？", "提示", {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await updateAndPublish({ publishIdList: [row.id] }).catch(() => {
      ElMessage.error("发布失败");
    });
    ElMessage.info("发布进行中");
    getList();
  })

}

function handleMultiplePublish() {
  if (!ids.value.length) {
    return ElMessage.warning("请选择要发布的数据");
  }

  const err = ids.value.some((id) => {
    let item = dataSource.value.find((row) => row.id == id);

    if (item.hasComposite != 2) {
      return true;
    }
  });

  if (err) {
    return ElMessage.error("选中数据存在未制作的套图，请重新选择");
  }

  ElMessageBox.confirm("确认上传该记录吗？", "提示", {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await updateAndPublish({ publishIdList: [...ids.value] }).catch(() => { });
    await ElMessage.info("发布进行中");
    getList();
  })
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

<style lang="less">
.material-upload {
  display: flex;
  justify-content: center !important;

  .ant-upload-select-picture-card {
    width: 160px;
    height: 160px;
  }
}

.preview-image {
  transition: all 0.1s;
}

.preview-image:hover {
  transform: scale(1.05);
}
</style>
