<template>
  <div>
    <div class="py-4 flex flex-wrap justify-end gap-4 items-center ">
      <form-item :label="`批量设置 (${ids.length}) `">
        <div class="flex flex-nowrap">

          <el-select v-model="multipleTemplateSelect" style="width: 240px" clearable>
            <el-option v-for="item in psdTemplateList" :label="item.templateName" :value="item.id" :key="item.id">
            </el-option>
          </el-select>

          <!-- <el-cascader :clearable="false" v-model="multipleTemplateSelect" :options="templateTree" placeholder="批量设置模板"
            :props="{ label: 'name', value: 'name', children: 'files' }" /> -->
          <el-button type="primary" @click="handleMultipleUpdateTemplate(null)" class="ml-4">
            确定
          </el-button>
        </div>
      </form-item>
      <div style="flex: 1"></div>
      <!-- <form-item label="只看我的">
        <el-checkbox v-model="queryParams.OnlyMe" @change="getList"></el-checkbox>
      </form-item> -->

      <form-item label="按用户查询">
        <useListSelect v-model="queryParams.creator" @change="getList"></useListSelect>
      </form-item>

      <form-item label="标题状态:">
        <el-select v-model="queryParams.selectTitleComposite" style="width: 120px" @change="getList">
          <el-option v-for="item in titleConfig" :label="item.label" :value="item.type" :key="item.type">
          </el-option>
        </el-select>
      </form-item>

      <form-item label="排序方式">
        <el-select v-model="queryParams.sortingFields" style="width: 160px" @change="getList">
          <el-option v-for="item in sortTypeOptions" :label="item.label" :value="item.value"
            :key="item.value"></el-option>
        </el-select>
      </form-item>


      <form-item label="套图状态">
        <el-select v-model="queryParams.selectHasComposite" style="width: 120px" @change="selectHasCompositeChange">
          <el-option v-for="item in compositeOptions" :label="item.label" :value="item.value" :key="item.value">
          </el-option>
        </el-select>
      </form-item>

      <div class="flex shrink-0">
        <el-button type="primary" @click="handleGenerate(null)"> 批量制作({{ ids.length }}) </el-button>
        <el-button type="danger" @click="handleDelete(null)"> 批量删除({{ ids.length }}) </el-button>
      </div>
    </div>

    <!-- 表格展示 -->
    <div class="common-table">
      <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading" @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange">
        <template #hasCompositeDefaultSlot="{ row }">
          <div>
            <el-tag :color="getCompositeInfo(row.hasComposite).color" effect="dark" style="border:none;">
              {{ getCompositeInfo(row.hasComposite).label }}
            </el-tag>
          </div>
        </template>

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
                <!-- <eye-outlined /> -->
              </div>
            </div>
            <div v-else class="font-bold text-gray ">暂无套图</div>
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
          <span v-if="row.imageFolder">
            {{ row.imageFolder }}
          </span>
          <span v-else>
            <el-tag type="warning">请先上传素材图</el-tag>
          </span>
        </template>

        <template #shopAndTemplateDefaultSlot="{ row }">
          <!-- <el-cascader style="width: 100%" @change="cascaderChange($event, row.id)" :bordered="false" :clearable="false"
            v-model="row.shopTemplate" :options="templateTree" :placeholder="renderCascaderPlaceholder(row)"
            :props="{ label: 'name', value: 'name', children: 'files' }" /> -->
          <el-select v-model="row.shopTemplateId" style="width: 100%" clearable @change="selectPsd($event, row.id)">
            <el-option v-for="item in psdTemplateList" :label="item.templateName" :value="item.id" :key="item.id">
            </el-option>
          </el-select>
        </template>
        <template #operationDefaultSlot="{ row }">
          <div class="flex table-operation-column justify-end">
            <template v-if="row.hasComposite == 1">
              <el-button size="small" :loading="true" type="warning">
                {{ "制作中" }}
              </el-button>
            </template>
            <template v-else>
              <el-button type="primary" link size="small" @click="handleGenerate(row)">
                制作套图
              </el-button>
            </template>

            <el-button type="danger" link size="small" @click="handleDelete(row)">
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
import { ref, reactive, computed, onMounted, onUnmounted, onBeforeMount } from "vue";
import {
  getAutoPublishList,
  addAutoPublish,
  updateAutoPublish,
  deleteAutoPublish,
  getPsTemplates,
  updatePsTemplate,
  getPsTemplatesName,
  psSetOfImages,
} from "@/api/publish"; // 实际接口导入
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { getAccessToken } from "@/utils/auth";
import { useUserStore } from "@/store/modules/user";
import { sortTypeOptions,defaultSortingValue} from "@/common/sort";

import { getCompositeInfo, compositeConfig } from "@/common/ps";
import { preview } from "@/components/PreviewImage/index";
import { useWindowSize } from "@vueuse/core";
import { getTitleStatusInfo, titleConfig } from "@/common/title";
import { ShopTemplateApi } from "@/api/shoptemplate";
import useListSelect from '@/components/common/userListSelect.vue'

// 查询条件
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  selectHasComposite: null,
  sortingFields: defaultSortingValue(),
  OnlyMe: false,
  selectTitleComposite: '',
  creator: ''
});

const compositeOptions = computed(() => {
  return compositeConfig
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


const psdTemplateList = ref([])

async function initPsdTemplate() {
  let res = await ShopTemplateApi.getShopTemplatePage({
    pageNo: 1,
    pageSize: 99
  })
  psdTemplateList.value = res.list
}

initPsdTemplate()

onBeforeMount(() => {
  initTemplates();
  // initTemplatesName();
});

const templateTree = ref([]);

// 获取树
async function initTemplates() {
  let tree = await getPsTemplates(null);
  templateTree.value = tree;
}

const selectedTemplatesName = ref([]);

// 获取选择的
async function initTemplatesName() {
  let tree = await getPsTemplatesName({
    productIdList: dataSource.value.map((item) => item.id)
  });
  selectedTemplatesName.value = tree;

  tree.forEach((item) => {
    dataSource.value.forEach((row) => {
      if (row.id == item.id) {
        row.shopTemplate = item.templateName;
      }
    });
  });
}

async function selectPsd(val){
  debugger
}

// 选择时触发
async function cascaderChange(e, id) {
  const res = await updatePsTemplate({
    shopTemplate: `${e[0]}/${e[1]}`,
    id: id,
  }).then(() => {
    ElMessage.success("店铺模板更新成功");
  }).catch(() => {
    ElMessage.error("店铺模板更新失败");
  });
}


const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { title: "ID", field: "id", width: 50, showOverflow: true },
    {
      title: "店铺及模板",
      field: "shopAndTemplate",
      width: 240,
      slots: {
        default: "shopAndTemplateDefaultSlot",
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
      title: "创建人",
      field: "creatorName",
      width: 100,
      showOverflow: true,
    },
    {
      title: "素材图名称",
      field: "imageFolder",
      width: 160,
      showOverflow: true,
      slots: {
        default: "imageFolderDefaultSlot",
      },
    },
    { title: "类目", field: "categoryName", width: 80, showOverflow: true },
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
    // { title: "标题", field: "titleTemplate", width: 220, showOverflow: true },
    // { title: "完成度", field: "completion", width: 80, showOverflow: true },
    // { title: "GPT模板", field: "gptTemplate", width: 120, showOverflow: true },
    // { title: "GPT要求", field: "gptPrompt", width: 120, showOverflow: true },
    { title: "轮播图", field: "carouselImages", minWidth: 160, showOverflow: true },
    { title: "详情图", field: "detailImages", minWidth: 160, showOverflow: true },
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
  dataSource.value.forEach((row) => {
    row._shopTemplate = row.shopTemplate; // 备份
  });

  initTemplatesName();

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

function handleGenerate(row?) {
  if (row) {
    handleImageUploadIds([row.id]);
  } else {
    if (!ids.value?.length) {
      return ElMessage.warning("请至少选择一条记录");
    }
    handleImageUploadIds([...ids.value]);
  }
}

async function handleImageUploadIds(ids) {
  // 批量处理图片

  let imageFolderError = ids.some((id) => {
    let row = dataSource.value.find((row) => row.id == id);
    return !row.imageFolder?.trim();
  });

  if (imageFolderError) {
    return ElMessage.error("选中的数据中存在图片文件夹名称为空的记录，请先完善数据");
  }

  let templateError = ids.some((id) => {
    let row = dataSource.value.find((row) => row.id == id);
    return !row.shopTemplate;
  });

  if (templateError) {
    return ElMessage.error("选中记录存在店铺及模板为空的无数据");
  }

  await psSetOfImages({ ids: [...ids] });
  ElMessage.info("套图正在制作中");

  getList();

  // 根据id选择

  ids.forEach((id) => {
    setRowProcessingStatus(id, true);
  });
}

function previewImageList(list) {
  preview(0, list);
}

function setRowProcessingStatus(id, isProcessing) {
  let targetRow = dataSource.value.find((item) => item.id == id);

  if (!targetRow) {
    return;
  }

  targetRow.isProcessing = isProcessing;
}

// function wsHandler(data) {
//   if (data["notifyGroup"] === "ps_image_group") {
//     if (data["notifyType"] === "change_has_composite") {
//       let id = data.notifyId;
//       let msgType = data.notifyData;
//       let target = dataSource.value.find((item) => {
//         return item.id == id;
//       });

//       if (!target) {
//         return;
//       }

//       target.hasComposite = Number(msgType);

//       notification.info({
//         placement: "topRight",
//         message: "更新信息",

//         description: `${target.id}套图状态已更新`,
//       });
//       getList();
//       setRowProcessingStatus(id, false);
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

// 批量选取模板
// 批量选择模板的选择值
const multipleTemplateSelect = ref();

function handleMultipleUpdateTemplate() {
  if (!ids.value.length) {
    return ElMessage.warning("请先选择要设置模板的数据");
  }

  if (!multipleTemplateSelect.value) {
    return ElMessage.warning("请选择要批量更新的模板");
  }

  ElMessageBox.confirm(`确认将这些数据的模板更新为  ${multipleTemplateSelect.value[1]}  吗`, '模板更新提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'priamry'
  }).then(async () => {
    await Promise.all(
      ids.value.map((id) => {
        return new Promise(async (resolve, reject) => {
          let e = multipleTemplateSelect.value;
          const res = await updatePsTemplate({
            shopTemplate: `${e[0]}/${e[1]}`,
            id: id,
          }).catch(() => {
            reject();
            ElMessage.error(`数据 ${id}店铺模板更新失败`);
          });
          resolve(null);
        });
      })
    );

    ElMessage.success("批量更新成功");
    getList();
  })
}

function selectHasCompositeChange() {
  queryParams.pageNo = 1;
  getList();
}

function renderCascaderPlaceholder(row) {
  let templateItem = selectedTemplatesName.value?.find((item) => item.id == row.id);
  if (!templateItem) {
    return "请选择模板";
  }
  return templateItem.templateName;
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
      await updateAutoPublish({
        ...form.value,
      });
      // Elmessa.success("更新成功");
    } else {
      await addAutoPublish({
        ...form.value,
      });
      // message.success("添加成功");
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
.preview-image {
  transition: all 0.1s;
}

.preview-image:hover {
  transform: scale(1.05);
}
</style>
