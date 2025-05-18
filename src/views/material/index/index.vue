<template>
  <div>
    <div class="py-4 flex flex-wrap justify-end gap-4 items-center">
      <!-- <el-button type="primary" @click="handleUpload()" :icon="Upload"> 上传素材 </el-button> -->
      <el-switch v-model="showFolder" size="small" active-text="展开" inactive-text="折叠" inline-prompt />
      <el-switch v-model="picMode" size="small" active-text="网格" inactive-text="列表" inline-prompt />
      <span style="font-size: 12px;"> 当前路径 ： <span>{{ currentClickTreeNodeParams.pathString }}</span></span>
      <div v-if="picMode">
        <el-button type="primary" @click="() => {
          const currentPageIds = dataSource.map(info => info.id);
          ids = [...new Set([...ids, ...currentPageIds])];
        }">
          全选 ({{ ids.length }})
        </el-button>

        <el-button type="primary" @click="() => {
          const currentPageIds = dataSource.map(info => info.id);
          ids = ids.filter(id => !currentPageIds.includes(id));
        }">
          取消 ({{ ids.length }})
        </el-button>
      </div>

      <div style="flex: 1"></div>

      <form-item label="按名称搜索">
        <el-input v-model="queryParams.imageName" placeholder="请输入图片名称" style="width: 160px" clearable @change="(val) => {
          if (!val) {
            getList()
          }
        }"></el-input>
      </form-item>
      <el-button type="primary" @click="getList" :icon="Search"> 搜索 </el-button>

      <form-item label="按用户查询">
        <useListSelect v-model="queryParams.creator" @change="getList" style="width: 100px;"></useListSelect>
      </form-item>

      <form-item label="按时间查询">
          <DateRangePicker @change="(val) => {
            queryParams.startTime = val.start
            queryParams.endTime = val.end
            getList()
          }"></DateRangePicker>
      </form-item>

  


      <form-item label="按店铺查询">
        <el-select v-model="queryParams.shopId" placeholder="选择店铺" style="width:120px" @change="getList" clearable>
          <el-option v-for="item in shopList" :key="item.id" :label="item.shopName" :value="item.id" />
        </el-select>
      </form-item>

      <form-item label="图片状态">
        <el-select v-model="queryParams.usageStatus" style="width: 100px" @change="getList">
          <el-option v-for="item in materialStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>

      <form-item label="弃用状态">
        <el-select v-model="queryParams.deprecated" style="width: 100px" @change="getList">
          <el-option v-for="item in deletedOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>

      <form-item label="时间排序">
        <el-select v-model="queryParams.sortingFields" style="width: 160px" @change="getList">
          <el-option v-for="item in sortTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>


      <div class="flex shrink-0">
        <el-button type="default" @click="handleMultiDownload(null)">
          下载 ({{ ids.length }})
        </el-button>

        <el-button type="primary" @click="() => {
          if (!ids.length) {
            return ElMessage.warning('请选择要制作的素材')
          }
          currentRow = null
          genPicturesModalVisible = true
        }">
          制作套图({{ ids.length }})
        </el-button>

        <el-button type="primary" @click="handleMultipleDistribute()">
          分配({{ ids.length }})
        </el-button>

        <!-- <el-button type="warning" @click="handleMultipleCheck(0)">
          取消入库 ({{ ids.length }})</el-button> -->
        <el-button type="danger" @click="handleDelete(null)" :icon="Delete">
          批量删除({{ ids.length }})
        </el-button>
      </div>
    </div>

    <div class="flex gap-4">
      <tree v-if="showFolder" :style="{ height: treeHeight + 80 + 'px', width: folderWidth + 'px' }"
        @node-click="treeNodeClick" @upload="treeUpload"></tree>
      <div class="content-container" :style="{ width: showFolder ? `calc(100% - ${folderWidth + 20}px )` : '100%' }">
        <div v-if="!picMode" class="common-table">
          <vxe-grid ref="gridRef" v-bind="gridOptions" :data="dataSource" :loading="loading"
            @checkbox-change="checkboxChange" @checkbox-all="checkboxAllChange">
            <template #previewDefaultSlot="{ row }">
              <div class="flex items-center justify-center p-2">
                <single-image :src="row.ossObjectName"></single-image>
              </div>
            </template>

            <template #resolutionDefaultSlot="{ row }">
              {{ row.resolutionWidth + ' * ' + row.resolutionHeight }}
            </template>

            <template #originWebDefaultSlot="{ row }">
              {{ getOriginWebLabel(row.originWeb) }}
            </template>

            <template #checkTypeDefaultSlot="{ row }">
              <div>
                <el-tag :color="row.checkType == 1 ? 'success' : 'error'">
                  {{ row.checkType == 1 ? "已入库" : "未入库" }}
                </el-tag>
              </div>
            </template>

            <template #operationDefaultSlot="{ row }">
              <div class="table-operation-column">

                <el-button size="small" type="primary" link @click="handleDetail(row)">
                  详情
                </el-button>
                <el-button size="small" type="primary" link @click="handleDistribute(row)">
                  分配店铺
                </el-button>
                <el-button size="small" type="primary" link @click="() => {
                  currentRow = row
                  genPicturesModalVisible = true
                }">
                  制作套图
                </el-button>

                <!-- <el-button v-if="row.checkType == 0" type="primary" link @click="handleCheck([row.id], 1)" size="small">
                  入库
                </el-button> -->
                <!-- <el-button v-if="row.checkType == 1" type="warning" link @click="handleCheck([row.id], 0)" size="small">
                  取消入库
                </el-button> -->
                <el-button type="default" link @click="handleDownload(row)" size="small">
                  下载
                </el-button>
                <el-button type="danger" v-if="row.deprecated == 0" link @click="handleDrop(row, 1)" danger
                  size="small">
                  标为弃用
                </el-button>
                <el-button v-else type="danger" link @click="handleDrop(row, 0)" danger size="small">
                  取消弃用
                </el-button>
                <el-button type="danger" link @click="handleDelete(row)" danger size="small">
                  删除
                </el-button>
              </div>
            </template>

            <template #searchKeyDefaultSlot="{ row }">
              <el-tag> {{ row.searchKey }} </el-tag>
            </template>
          </vxe-grid>
        </div>

        <div v-else>
          <template v-if="loading">
            <div class="w-full h-8 flex justify-center">...</div>
          </template>

          <template v-else-if="total">
            <div :style="{ height: gridOptions.maxHeight + 'px' }" style="overflow:auto;"
              class="flex justify-center p-4 gap-4 flex-wrap">

              <template v-for="info in dataSource">
                <img-card :is-checked="ids.includes(info.id)" :info="info" :ids="ids" @check="imgCardCheck"
                  @delete="imgCardDelete" @picture="(_info) => {
                    currentRow = _info
                    genPicturesModalVisible = true
                  }"></img-card>
              </template>
            </div>
          </template>

          <el-empty v-if="!loading && !total" :image-size="64" style="padding:48px;">
            <template #description>
              <span style="font-size: 11px;color:#aaa"> 暂无素材 </span>
            </template>
          </el-empty>
        </div>


        <!-- 分页 -->
        <div class=" flex justify-end">
          <pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
            @pagination="getList" />
        </div>
      </div>
    </div>

    <el-dialog v-model="uploadModalVisible" title="素材上传" width="100%" style="height: 100%;" align-center :footer="false"
      :destroy-on-close="true" class="material-upload-dialog" @close="uploadModalClose">
      <div style="height:100%;">
        <list-upload :currentUploadInfo="currentUploadInfo" @single-file-uploaded="singleFileUploaded"></list-upload>
      </div>
    </el-dialog>


    <el-dialog draggable v-model="genPicturesModalVisible" title="制作套图" width="800px" align-center
      :destroy-on-close="true" @close="() => {
        currentGenPictureConfig = []
      }">
      <el-form :model="genPicturesForm" :rules="genPicturesFormRules" ref="genPicturesFormRef" label-width="100">
        <el-row style="padding:1em">
          <el-col :span="24">
            <gen-picture @config-change="configChange"></gen-picture>
          </el-col>
          <el-col class="py-4">
            <el-form-item label="是否制作视频">
              <el-switch v-model="genPicturesForm.isMakeVideo"></el-switch>
            </el-form-item>
          </el-col>
          <el-col :span="24" class="pt-6">
            <span class="preview-label">选择元素 <span> {{ currentRow ? 1 : ids.length }}</span> 个,</span>
            <span class="preview-label">使用 <span> {{ currentGenPictureConfig.length }}</span> 个配置,</span>
            <span class="preview-label"> 共生成 <span style="font-size: 2.4em;"> {{ (currentRow ? 1 : ids.length) *
              currentGenPictureConfig.length
                }}</span> 个套图
            </span>
          </el-col>

          <!-- <el-col :span="24" class="py-4">
            <el-form-item label="协议链接">
              <el-input v-model="testUrl" placeholder="请输入"></el-input>
            </el-form-item>
          </el-col> -->
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="genPicturesModalVisible = false">取消</el-button>
          <el-button type="default" @click="genPicturesSubmitLocal" :loading="genPictureLocalLoading">
            调用本地制作套图
          </el-button>
          <!-- <el-button type="primary" @click="genPicturesSubmit">
            制作套图
          </el-button> -->
        </div>
      </template>
    </el-dialog>
    <el-dialog v-model="distributeDialogVisible" title="素材分配" width="600px" align-center>
      <el-form :model="distributeForm" :rules="distributeFormRules" ref="distributeFormRef" label-width="80">
        <el-row>

          <!-- <el-col :span="24">
            <el-form-item label="选中" prop="shops">

            </el-form-item>
          </el-col> -->

          <el-col :span="24">
            <el-form-item label="选择店铺" prop="shops">
              <el-select v-model="distributeForm.shops" multiple placeholder="选择店铺" style="width:100%">
                <el-option v-for="item in shopList" :key="item.id" :label="item.shopName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="distributeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="distributeSubmit">
            确认分配
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="素材详情" align-center width="1200px">
      <el-form label-position="left" label-width="120px" :model="detailData" label-suffix=" : ">
        <el-row>
          <el-col :span="24">
            <el-form-item label="素材图">
              <img :src="detailData.ossObjectName" style="max-width: 240px;max-height: 240px;" alt="素材预览"
                v-if="detailData.ossObjectName" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="素材名称">
              <!-- <el-input v-model="detailData.imageName" disabled /> -->
              {{ detailData.imageName }}
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上传时间">
              {{ formatDate(detailData.createTime) }}
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="更新时间">
              {{ formatDate(detailData.updateTime) }}
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图片格式">
              {{ detailData.imageFormat }}
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图片分辨率">
              {{ detailData.resolutionWidth + '*' + detailData.resolutionHeight }}
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套图模板">
              <div class="flex gap-2 flex-wrap" v-if="detailData?.psdTemplateList?.length">
                <el-tag v-for="item in detailData.psdTemplateList" effect="dark" round> {{ item }} </el-tag>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标题模板">
              <div class="flex gap-2 flex-wrap" v-if="detailData?.titleTemplateList?.length">
                <el-tag v-for="item in detailData.titleTemplateList" effect="dark" round> {{ item }} </el-tag>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="已分配店铺">
              <div class="flex gap-2 flex-wrap" v-if="detailData?.shopList?.length">
                <el-tag v-for="item in detailData.shopList" effect="dark" round> {{ item.shopName }} </el-tag>
              </div>
              <div v-else>
                <el-button link type="warning" size="small" :icon="TopRight" @click="() => {
                  handleDistribute(currentRow)
                }"> 暂未分配店铺，去分配 </el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="关联商品信息">
              <el-table :data="detailData?.productReqDTOList" style="width: 100%" height="300">
                <el-table-column prop="platformName" label="平台" width="120" />
                <el-table-column prop="shopName" label="店铺" width="120" />
                <el-table-column prop="SUP ID" label="spuId" width="120" />
                <el-table-column prop="SKC ID" label="skcId" width="120" />
                <el-table-column prop="skuNo" label="sku货号" width="120" />
                <el-table-column prop="categoryName" label="类目" width="120" />
                <el-table-column prop="status" label="状态" />
              </el-table>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  watch,
  handleError,
  watchEffect,
} from "vue";

import {
  getMaterialList,
  deleteAssetLibrary,
  checkAssetLibrary,
  pullAsset,
  materialCreatePictures,
  materialDistribute,
  getMaterialDetail,
  handleDropMaterial,
} from "@/api/material"; // 实际接口导入

import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import CryptoJS from "crypto-js";

import { useDebounceFn, useLocalStorage, useSessionStorage, useWindowSize } from "@vueuse/core";
import { sortTypeOptions, defaultSortingValue } from "@/common/sort";
import { saveAs } from "file-saver";

import { useUserStore } from "@/store/modules/user";
import imgCard from "./imgCard.vue";
import listUpload from "./listUpload.vue";
import { materialConfig, getMaterialConfig, categoryOptions } from "@/views/material/collect/index";
import { ElButton, ElNotification } from "element-plus";
import { Delete, Plus, Search, TopRight, Upload } from "@element-plus/icons-vue";
import tree from './tree.vue'
import { materialStatusOptions } from ".";
import { getPsdTemplateList, getShopList } from "@/api/shop";
import { ShopApi } from "@/api/shop/shopIndex";
import { ShopTemplateApi } from "@/api/shoptemplate";
import { formatDate } from "@/utils/formatTime";
import { getTitleTemplateList } from "@/api/publish";
import { downloadCrossOriginImage, downloadFileByElement } from "@/common/download";
import { useRouter } from "vue-router";
import { ShopCategoryApi } from "@/api/shop/category";
import { getConfigTemplateList } from "@/api/publish/config";
import genPicture from './genPicture.vue'
import { getAccessToken } from "@/utils/auth";
import { getTenantId } from '@/utils/auth'
import useListSelect from '@/components/common/userListSelect.vue'


const userStore = useUserStore()

const shopCategoryList = ref([])

async function initShopCategory() {
  const res = await ShopCategoryApi.getShopCategoryPage({
    pageNo: 1,
    pageSize: 20,
  })
  shopCategoryList.value = res.list
}

initShopCategory()

const form = ref({})

getMaterialConfig()

const folderWidth = ref(320)

const showFolder = useLocalStorage('_material_folder_visible', false) // 是否展示文件夹

const queryParams = reactive({
  // materialStatus: '',
  imageName: null,
  shopId: null,
  classificationId: null,
  pageNo: 1,
  pageSize: 20,
  usageStatus: null,
  deprecated: null,
  sortingFields: defaultSortingValue(),
  creator: null, // 创建人查询
  startTime:null,
  endTime:null,
});

// 展示模式
const picMode = useLocalStorage("material_view_mode", false);

watch(picMode, () => {
  ids.value = [];
});

const deletedOptions = ref([
  {
    label: '全部',
    value: null,
  },
  {
    label: '已弃用',
    value: '1'
  },
  {
    label: '未弃用',
    value: '0'
  },
]
)

const gridRef = ref()

function resetCheckStatus() {
  if (gridRef.value?.clearCheckboxRow) {
    gridRef.value?.clearCheckboxRow()
  }
  if (gridRef.value?.clearCheckboxReserve) {
    gridRef.value?.clearCheckboxReserve()
  }
  ids.value = []
}

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: 'id'
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 50, ellipsis: true, reserve: true, },
    {
      title: "图片预览",
      field: "ossObjectName",
      width: "auto",
      slots: {
        default: "previewDefaultSlot",
      },
    },
    { title: "图片名称", field: "imageName", minWidth: 180, className: "font-bold" },
    // { title: "ID", field: "id", width: 60, ellipsis: true },
    { title: "图片格式", field: "imageFormat", width: 80, },
    { title: "商品数量", field: "productCount", width: 80, },
    {
      title: "分辨率", field: "resolution", width: 80,

      slots: {
        default: "resolutionDefaultSlot",
      },

    },

    { title: "上传人", field: "creatorName", width: 80, },
    {
      title: "图片来源",
      field: "originWeb",
      width: 120,
      slots: {
        default: "originWebDefaultSlot",
      },
    },
    // {
    //   title: "搜索词",
    //   field: "searchKey",
    //   minWidth: 240,
    //   slots: {
    //     default: "searchKeyDefaultSlot",
    //   },
    // },
    // {
    //   title: "状态",
    //   field: "checkType",
    //   slots: {
    //     default: "checkTypeDefaultSlot",
    //   },
    //   minWidth: 120,
    // },
    {
      title: "创建时间",
      field: "createTime",
      width: 150,
      ellipsis: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue);
      },
    },
    {
      title: "修改时间",
      field: "updateTime",
      width: 150,
      ellipsis: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue);
      },
    },
    {
      title: "操作",
      fixed: "right",
      width: "auto",
      field: "operation",
      slots: {
        default: "operationDefaultSlot",
      },
    },
  ],

  rowClassName($) {
    return $.row.deprecated == 1 && 'material-deprecated'
  }
});

const { height } = useWindowSize();

const treeHeight = ref()

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 240;
  treeHeight.value = height.value - 260;
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
const currentRow = ref();
const submitLoading = ref(false);

const rules = {
  name: [{ required: true, message: "", trigger: "blur" }],
};

function getOriginWebLabel(value) {
  return materialConfig.value.crawlerWebsite.find((item) => item.value == value)?.label;
}

const genPicturesModalVisible = ref(false);



// 处理上传

const uploadModalVisible = ref(false);

function uploadModalClose() {

}

async function getList() {
  loading.value = true;
  let res = await getMaterialList({
    ...queryParams,
  }).finally(() => {
    loading.value = false;
  });

  dataSource.value = res.list;
  total.value = res.total;
  // ids.value = [];
}

function imgCardDelete(row) {
  handleDelete(row);
}

// function imgCardCheckType(row, checkType) {
//   handleSimgleCheck(row, checkType);
// }

function imgCardCheck(id: string, isChecked: boolean) {
  if (isChecked) {
    ids.value.push(id);
  } else {
    ids.value = ids.value.filter((selectedId) => selectedId !== id);
  }
}

getList();

// 操作函数
function handleQuery() {
  queryParams.pageNo = 1;
}

function resetQuery() {
  getList();
}

// 下载
function handleMultiDownload() {
  if (!ids.value.length) {
    return ElMessage.warning("请选择要下载的数据");
  }

  // 处理图片下载
  try {
    ids.value.forEach(async (id, index) => {
      let row = dataSource.value.find((item) => {
        return item.id == id;
      });

      if (!row) {
        return;
      }
      // saveAs(row.ossObjectName, row.imageName);

      setTimeout(() => {
        downloadFileByElement(row.ossObjectName, row.imageName);
      }, 500 * index);

      // await downloadCrossOriginImage(row.ossObjectName, row.imageName)
      // ElNotification.success(`图片${row.imageName}下载成功`);
    });
  } catch (e) { }
}


function handleDelete(row?) {
  let delIds: any = null;
  if (row) {
    delIds = [row.id];
  } else {
    delIds = [...ids.value];
    if (!delIds.length) {
      return ElMessage.warning("请选择要删除的数据");
    }
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
      delIds = delIds.map((id) => String(id));
      await deleteAssetLibrary({ materialIds: delIds });
      ElNotification.success("删除成功");
      resetCheckStatus()
      getList();
    })
    .catch(() => {
    })
}
function checkboxChange(e) {
  ids.value = [...e.records.map((item) => item.id), ...e.reserves.map((item) => item.id)];
}

function checkboxAllChange(e) {
  ids.value = [...e.records.map((item) => item.id), ...e.reserves.map((item) => item.id)];
}

function handleDownload(row) {
  // 处理图片下载
  try {
    // saveAs(row.ossObjectName, row.imageName);
    downloadFileByElement(row.ossObjectName, row.imageName);
    ElNotification.success(`图片${row.imageName}下载成功`);
  } catch (e) { }
}

async function handleDrop(row, deprecated) {
  await handleDropMaterial({
    materialIds: [row.id]
    , deprecated
  })

  if (deprecated == 0) {
    ElMessage.success('已取消弃用')
  }

  if (deprecated == 1) {
    ElMessage.success('已标记为弃用')
  }

  getList()
}


/**
 * @树相关
*/

const currentUploadInfo = ref({
  path: '',
  id: '',
  ids: []
})

async function treeUpload(params) {
  const { id, pathArr, ids } = params
  currentUploadInfo.value.path = pathArr.join(' > ')
  currentUploadInfo.value.id = id
  currentUploadInfo.value.ids = ids
  uploadModalVisible.value = true;
}

const currentClickTreeNodeParams = ref({})

function treeNodeClick(params) {
  currentClickTreeNodeParams.value = params
  queryParams.classificationId = params.id
  getList()
}

/**
 * @group 店铺分配
*/

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

const distributeForm = ref({
  shops: []
})
const distributeFormRules = {
  shops: [{ required: true, message: "请选择要分配的店铺", trigger: "blur" }],
}

const distributeDialogVisible = ref(false)
const isSingleDistribute = ref(false)
const distributeFormRef = ref()

function handleMultipleDistribute() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要分配的素材')
  }
  isSingleDistribute.value = false
  distributeDialogVisible.value = true
}

function handleDistribute(row) {
  currentRow.value = row
  isSingleDistribute.value = true
  distributeDialogVisible.value = true
}

const delayUpdateList = useDebounceFn(() => {
  getList()
}, 1999)

function singleFileUploaded() {
  console.log('单个文件上传')
  delayUpdateList()
}

async function distributeSubmit() {
  await distributeFormRef.value.validate();
  let data = {
    materialIds: currentRow.value ? [currentRow.value.id] : [...ids.value],
    shopIds: distributeForm.value.shops,
  }

  console.log('店铺分配', data)

  await materialDistribute(
    data
  ).then(() => {
    ElMessage.success('店铺分配成功')

    // 当打开详情页
    if (detailDialogVisible.value && currentRow.value) {
      initDetailData(currentRow.value)
    }

    distributeDialogVisible.value = false
    resetCheckStatus()
  }).catch(() => {
    ElMessage.error('店铺分配失败')
  })
}

// function wsHandler(data) {
//   if (data["notifyGroup"] === "crawler_group") {
//     if (data["notifyType"] === "change_crawler") {
//       if (data["notifyData"] == "true") {
//         ElNotification.success("图片爬取成功");
//         getList();
//       } else {
//         ElNotification.error("图片爬取失败");
//       }
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


const psdTemplateList = ref([])

async function initPsdTemplate() {
  let res = await ShopTemplateApi.getShopTemplatePage({
    pageNo: 1,
    pageSize: 99
  })
  psdTemplateList.value = res.list
}

initPsdTemplate()


const titleTemplateList = ref([])

async function initTitleTemplate() {
  let res = await getTitleTemplateList({
    pageNo: 1,
    pageSize: 99
  })
  titleTemplateList.value = res.list
}
initTitleTemplate()


/**
 * @group
*/

// 选择模板
const genPicturesForm = ref({
  isMakeVideo: false,
});



const genPicturesFormRules = {
  psdTemplateId: [{ required: true, message: "请选择套图模板", trigger: "blur" }],
  titleTemplateId: [{ required: true, message: "请选择标题模板", trigger: "blur" }],
}

const genPicturesFormRef = ref();
const router = useRouter() // 路由

const testUrl = ref(`erp://?id=id&name=name`)

const genPictureLocalLoading = ref(false)

async function genPicturesSubmitLocal() {
  if (!currentGenPictureConfig.value.length) {
    return ElMessage.warning('请至少选择一个套图配置')
  }

  let data = {
    assetIdList: currentRow.value ? [currentRow.value.id] : [...ids.value],
    templateList: currentGenPictureConfig.value,
    isMakeVideo: genPicturesForm.value.isMakeVideo,
    isLocalMakeImage: true
  }

  genPictureLocalLoading.value = true

  const res = await materialCreatePictures(data)
  const accessToken = getAccessToken()
  const tenantId = getTenantId()
  const clientData = {
    token: accessToken,
    tenantId: tenantId,
    ...res,
    // ...userStore.oss.config,
  }
  genPictureLocalLoading.value = false

  ElMessageBox.confirm(
    "确认启用本地制作套图吗",
    '提示',
    {
      closeOnClickModal: false,
      showCancelButton: false,
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'primary',
    }
  )
    .then(async () => {
      openApp()
      ElNotification.success({
        duration: 5000,
        title: '套图正在制作中!',
      })
      genPicturesModalVisible.value = false
    }).catch(() => {
    })

  function openApp() {
    // var url = `ossLink://?data=${encodeURIComponent(JSON.stringify(clientData))}`

    var data = (encodeURIComponent(JSON.stringify(clientData)))

    var url = `ossLink://?data=${data}`
    // var url = `erp://?id=id&name=name`
    console.log(url)
    window.location.href = url;
  }
}

async function genPicturesSubmit() {
  // 制作套图提交
  // await genPicturesFormRef.value.validate();

  if (!currentGenPictureConfig.value.length) {
    return ElMessage.warning('请至少选择一个套图配置')
  }

  let data = {
    assetIdList: currentRow.value ? [currentRow.value.id] : [...ids.value],
    templateList: currentGenPictureConfig.value,
    isMakeVideo: genPicturesForm.value.isMakeVideo,
    isLocalMakeImage: false
  }

  const res = await materialCreatePictures(data)

  ElNotification.success({
    duration: 5000,
    title: '套图正在制作中!',
    message: () =>
      h(ElButton, {
        type: 'primary',
        link: true,
        onClick() {
          // 跳转到套图管理
          router.push({
            name: 'PictureIndex'
          })
        }
      }, '去套图管理查看'),
  })
  genPicturesModalVisible.value = false
}
/**
 * 查看素材详情
*/

const detailData = ref({
})

async function initDetailData(row) {
  const res = await getMaterialDetail({
    id: row.id
  })
  detailData.value = res
}

const detailDialogVisible = ref(false);
async function handleDetail(row) {
  currentRow.value = row
  await initDetailData(row)
  detailDialogVisible.value = true
}


/**
 * @制作套图时的配置
*/

const currentGenPictureConfig = ref([])

function configChange(config) {
  currentGenPictureConfig.value = config
  console.log('发布配置', config)
}
</script>


<style scoped>
.table-header {
  border-radius: 4px;
  box-shadow: rgba(17, 17, 26, 0.15) 0px 1px 0px;
}

h1 {
  font-size: 1rem;
}
</style>

<style lang="less">
.material-upload-dialog {
  .el-dialog__body {
    height: calc(100% - 40px);
  }
}

.preview-label {
  span {
    font-size: 1.8em;
    color: var(--el-color-primary);
    font-weight: bold;
  }
}

.material-deprecated {
  background-color: rgba(255, 0, 0, .25);
}
</style>
