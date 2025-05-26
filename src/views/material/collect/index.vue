<template>
  <div>
    <div class=" collect-tab p-4">
      <el-radio-group v-model="activeTab" style="margin-bottom: 24px" size="default">
        <el-radio-button value="1">热销图采集</el-radio-button>
        <el-radio-button value="2">网络爬图</el-radio-button>
        <el-radio-button value="3">AI 生图</el-radio-button>
      </el-radio-group>
      <div v-if="activeTab == '1'">
        <el-empty :image-size="64" style="padding:0px;">
          <template #description>
            <span style="font-size: 11px;color:#aaa"> 功能开发中 </span>
          </template>
        </el-empty>
        <!-- <el-form :model="bestSalesForm" :rules="bestSalesRules" ref="bestSalesFormRef" label-width="100px">
          <div class="flex flex-wrap">
            <el-form-item label="数据来源" name="dataSource">
              <el-select style="width: 180px" v-model="bestSalesForm.dataSource" :options="dataSourceOptions"
                placeholder="请选择数据来源"></el-select>
            </el-form-item>

            <el-form-item label="总销量" name="totalSales">
              <el-input style="width: 180px" v-model="bestSalesForm.totalSales" type="number" step="100" min="0"
                placeholder="请输入总销量" />
            </el-form-item>
            <el-form-item label="类目" name="category">
              <el-select style="width: 180px" v-model="bestSalesForm.category" :options="categoryOptions"
                placeholder="请选择类目"></el-select>
            </el-form-item>

            <el-form-item label="谷歌识图" name="googleImageSearch">
              <el-radio-group v-model="bestSalesForm.googleImageSearch" style="width: 180px">
                <el-radio :value="true">开启</el-radio>
                <el-radio :value="false">关闭</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="一键抠图" name="autoCutout">
              <el-radio-group v-model="bestSalesForm.autoCutout" style="width: 180px">
                <el-radio :value="true">开启</el-radio>
                <el-radio :value="false">关闭</el-radio>
              </el-radio-group>
            </el-form-item>
          </div>
          <div class="flex justify-end">
            <el-button @click="resetBestSalesForm">重置</el-button>
            <el-button class="ml-4" type="primary" @click="doCrawlerBestSales" :loading="bestSalesLoading">{{
              bestSalesLoading ?
                "正在处理数据，请稍等" : "确定" }}</el-button>
          </div>
        </el-form> -->
      </div>

      <div v-if="activeTab == '2'">
        <el-form v-if="materialConfig.crawlerWebsite.length" :model="crawlerForm" :rules="crawlerRules"
          ref="crawlerFormRef" label-width="100px">
          <div class="flex flex-wrap">
            <el-form-item label="目标网站" prop="type">
              <el-select style="width: 180px" v-model="crawlerForm.type" :options="materialConfig.crawlerWebsite"
                placeholder="请选择目标网站">
                <el-option v-for="item in materialConfig.crawlerWebsite" :label="item.label" :value="item.value"
                  :key="item.value"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="搜索词" prop="searchContent" v-if="isCrawlerOperationUsable('searchContent')">
              <el-input style="width: 180px" v-model="crawlerForm.searchContent" placeholder="请输入搜索词" />
            </el-form-item>

            <el-form-item label="点赞量" prop="likedCount" v-if="isCrawlerOperationUsable('likedCount')">
              <el-input v-model="crawlerForm.likedCount" type="number" step="100" min="0" />
            </el-form-item>

            <el-form-item label="下载量" prop="downloadCount" v-if="isCrawlerOperationUsable('downloadCount')">
              <el-input step="10" min="0" type="number" v-model="crawlerForm.downloadCount" placeholder="数量" />
            </el-form-item>

            <el-form-item label="所属类目" prop="category" v-if="isCrawlerOperationUsable('category')">
              <el-select v-model="crawlerForm.category" :options="categoryOptions" placeholder="请选择数据来源"></el-select>
            </el-form-item>
          </div>

          <div class="flex justify-end">
            <el-drawer v-model="showCrawlingStatusDrawer" title="正在进行的爬图任务" direction="rtl">
              <div class="flex flex-col gap-4" style="overflow: auto;">
                <el-button :icon="Refresh" @click="() => {
                  initCrawlerStatus()
                }"> 刷新状态 </el-button>
                <template v-for="item in crawlerStatus">
                  <el-card style="width: 100%;" shadow="hover">
                    <div class="flex flex-col gap-2">
                      <template v-if="item.status == CrawlingStatus.Failed">
                        <div class="flex items-center gap-2">
                          <el-icon size="24px" color="red">
                            <CircleCloseFilled />
                          </el-icon>
                          <span style="text-wrap: nowrap;">爬取失败</span>
                        </div>
                      </template>

                      <template v-if="item.status == CrawlingStatus.Completed">
                        <div class="flex items-center gap-2">
                          <el-icon size="24px" color="green">
                            <CircleCheckFilled />
                          </el-icon>

                          <span style="text-wrap: nowrap;">爬取成功</span>
                        </div>


                      </template>

                      <template v-if="item.status == CrawlingStatus.Started">
                        <div class="flex items-center gap-2">
                          <el-icon size="24px" color="yellow" class="animate-spin">
                            <Loading></Loading>
                          </el-icon>
                          <span style="text-wrap: nowrap;">正在爬取中...</span>
                        </div>
                      </template>
                      <div class="flex gap-2 flex-wrap">
                        <el-tag v-if="item.websiteName" round>
                          网站名称：{{ item.websiteName }}
                        </el-tag>
                        <el-tag v-if="item.searchContent" round>
                          搜索内容： {{ item.searchContent }}
                        </el-tag>
                        <el-tag v-if="item.downloadCount" round>
                          下载数量： {{ item.downloadCount }}
                        </el-tag>

                        <el-tag v-if="item.startTime" round>
                          开始时间: {{ formatDate(item.startTime,) }}
                        </el-tag>

                        <el-tag v-if="item.endTime" round>
                          结束时间: {{ formatDate(item.endTime,) }}
                        </el-tag>
                      </div>
                    </div>
                  </el-card>
                </template>
              </div>
            </el-drawer>
            <el-button v-if="crawlerStatus.length" link @click="() => {
              showCrawlingStatusDrawer = true
            }" type="warning" size="small">
              <template #icon>
                <el-icon size="18" class="animate-spin">
                  <Loading></Loading>
                </el-icon>
              </template>
              查看正在进行的爬图任务</el-button>
            <el-button @click="resetCrawlerForm">重置</el-button>
            <el-button class="ml-4" type="primary" @click="doCrawler" :loading="crawlerLoading">{{ crawlerLoading ?
              "正在处理数据，请稍等" : "确定" }}</el-button>
          </div>
        </el-form>

        <div v-else class="flex items-center justify-center">
          <el-empty :image-size="64" style="padding:0px;">
            <template #description>
              <span style="font-size: 11px;color:#aaa"> 暂无可爬取网站 </span>
            </template>
          </el-empty>
        </div>
      </div>

      <div v-if="activeTab == '3'" class="flex items-center justify-center">
        <el-empty :image-size="64" style="padding:0px;">
          <template #description>
            <span style="font-size: 11px;color:#aaa"> 功能开发中 </span>
          </template>
        </el-empty>
      </div>
    </div>

    <div class="py-4 flex justify-end gap-4 items-center">
      <el-switch v-model="picMode" size="small" active-text="网格" inactive-text="列表" />

      <div v-if="picMode" style="flex-shrink: 0;">
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
      <form-item label="排序方式">
        <el-select v-model="queryParams.sortingFields" style="width: 160px" @change="getList">
          <el-option v-for="item in sortTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </form-item>

      <div class="flex shrink-0">
        <el-button type="default" @click="handleMultiDownload(null)">
          下载 ({{ ids.length }})
        </el-button>

        <el-button type="primary" @click="multipleCheckClick">
          批量入库({{ ids.length }})
        </el-button>
        <el-button type="danger" @click="handleDelete(null)" :icon="Delete">
          批量删除({{ ids.length }})
        </el-button>
      </div>
    </div>

    <div v-if="!picMode" class="common-table">
      <vxe-grid ref="gridRef" v-bind="gridOptions" :data="dataSource" :loading="loading"
        @checkbox-change="checkboxChange" @checkbox-all="checkboxAllChange">
        <template #previewDefaultSlot="{ row }">
          <div class="flex items-center justify-center p-2">
            <single-image :src="row.ossObjectName"></single-image>
          </div>
        </template>

        <template #originWebDefaultSlot="{ row }">
          {{ getOriginWebLabel(row.originWeb) }}
        </template>

        <template #resolutionDefaultSlot="{ row }">
          {{ row.resolutionWidth + ' * ' + row.resolutionHeight }}
        </template>


        <template #operationDefaultSlot="{ row }">
          <div class="table-operation-column">
            <el-button type="primary" link @click="checkClick(row)" size="small">
              入库
            </el-button>
            <el-button type="default" link @click="handleDownload(row)" size="small">
              下载
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)" size="small">
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
          class=" flex justify-center gap-4 flex-wrap p-4">
          <img-card :is-checked="ids.includes(info.id)" v-for="info in dataSource" :info="info" :ids="ids"
            @check="imgCardCheck" @delete="imgCardDelete" @checkType="checkClick"></img-card>
        </div>
      </template>

      <el-empty v-if="!loading && !total" :image-size="64" style="padding:12px;">
        <template #description>
          <span style="font-size: 11px;color:#aaa"> 暂无素材 </span>
        </template>
      </el-empty>
    </div>

    <!-- 分页 -->
    <div class=" flex justify-end">
      <pagination :total="total" v-model:page="queryParams.currentPage" v-model:limit="queryParams.pageSize"
        @pagination="getList" />
    </div>

    <el-dialog title="素材入库" v-model="materialCheckModalVisible" @close="materialCheckModalCancel" width="600px"
      :closable="true" align-center>
      <el-form label-width="100px" ref="materialCheckFormRef" :rules="materialCheckRules" :model="materialCheckForm">
        <el-row>
          <!-- 类目 -->

          <el-form-item label="序号前缀:">
            <template v-if="userStore.user.shortName">
              <el-tag>{{ userStore.user.shortName }}</el-tag>
            </template>
            <template v-else>
              <el-button size="small" type="warning" :icon="TopRight" link @click="() => {
                $router.push({
                  path: '/user/profile'
                })
              }"> 暂未设置，去用户中心设置 </el-button>
            </template>
          </el-form-item>

          <el-col :span="24">
            <el-form-item label="起始序号:" prop="materialOrder">
              <el-input v-model="materialCheckForm.materialOrder" type="number" :min="maxOrder + 1"
                placeholder="非必填,不填写时不会处理"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="素材分类:" prop="classificationIds">
              <div class="flex items-center gap-4 ">

                <template v-if="materialCheckForm.materialCategoryDisplayLabel">
                  <span class="text-xs font-bold opacity-70">{{ materialCheckForm.materialCategoryDisplayLabel }}
                  </span>
                  <el-button link size="small" type="danger" @click="() => {
                    materialCheckForm.materialCategoryDisplayLabel = ''
                    materialCheckForm.classificationIds = ''
                  }"> 清空 </el-button>
                </template>

                <el-button type="primary" @click="materialCategoryClick"> 选择分类 </el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="materialCheckModalVisible = false">取消</el-button>
        <el-button type="primary" @click="ensureCheck" :disabled="materialCheckLoading"> 确定入库 </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="materialCheckDrawerVisible" title="选择素材分类" direction="rtl" size="480" :with-header="true"
      :modal="true">
      <tree :showUpload="false" @node-click="treeNodeClick"></tree>

    </el-drawer>

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
  getMaterialRawList,
  deleteMaterialRaw,
  storageMaterialRaw,
  getCrawlingStatus,
  getMaterialMaxOrder,
} from "@/api/material"; // 实际接口导入
import { getRoleLabel, getRoleColor, roleConfig } from "@/common/user";
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import CryptoJS from "crypto-js";
import { pwdKey } from "/@/enums/config";
import { useLocalStorage } from "@vueuse/core";
import { sortTypeOptions, defaultSortingValue } from "@/common/sort";
import { saveAs } from "file-saver";
import { useUserStore } from "@/store/modules/user";
import imgCard from "./imgCard.vue";
import { materialConfig, getMaterialConfig, categoryOptions } from "./index";
import { useWindowSize } from "@vueuse/core";
import { ElNotification } from "element-plus";
import { api as viewerApi } from "v-viewer";
import { CircleCheckFilled, CircleCloseFilled, CloseBold, Delete, Loading, Refresh, TopRight } from "@element-plus/icons-vue";
import tree from '@/views/material/index/tree.vue'
import { downloadFileByElement } from "@/common/download";
import { formatDate } from '@/utils/formatTime'
import { number } from "vue-types";

const userStore = useUserStore();



getMaterialConfig();

const materialCheckForm: any = ref({
  materialOrder: '', // 素材排序
  classificationIds: '', // 素材分类
  materialCategoryDisplayLabel: '' // 素材分类显示的label
});

const activeTab = ref('2');

function isCrawlerOperationUsable(key) {
  let item: any = materialConfig.value.crawlerWebsite.find((item: any) => {
    return item.value == crawlerForm.value.type;
  });

  if (!item) {
    return false;
  }

  return item.operation[key];
}

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
});



// 展示模式
const picMode = useLocalStorage("material_view_mode", false);

watch(picMode, () => {
  ids.value = [];
});


// 素材入库弹窗
const materialCheckModalVisible = ref(false);

// 素材入库分类抽屉
const materialCheckDrawerVisible = ref(false)

function materialCheckModalCancel() {
  materialCheckModalVisible.value = false;
  materialCheckForm.value = {}
}

function materialCategoryClick() {
  materialCheckDrawerVisible.value = true
}

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
  maxHeight: 1,
  rowConfig: {
    keyField: 'id'
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    { type: "checkbox", width: 50, ellipsis: true },
    // { title: "ID", field: "id", width: 60, ellipsis: true },
    {
      title: "图片预览",
      field: "ossObjectName",
      width: "auto",
      slots: {
        default: "previewDefaultSlot",
      },
    },
    { title: "图片名称", field: "imageName", minWidth: 180, className: "font-bold" },
    {
      title: "分辨率", field: "resolution", width: 80,

      slots: {
        default: "resolutionDefaultSlot",
      },

    },
    {
      title: "图片来源",
      field: "originWeb",
      width: 120,
      slots: {
        default: "originWebDefaultSlot",
      },
    },
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
});

const { height } = useWindowSize();

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 400;
});

const dataSource = ref([]);
const loading = ref(false);
const open = ref(false);
const title = ref("新增");
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

const dataSourceOptions = ref([])

const crawlerForm = ref({
  searchContent: "",
  downloadCount: 10,
  likedCount: 0,
  type: 2,
  websiteName: "",
});

// 重置爬图网站
function resetCrawlerForm() {
  crawlerForm.value = {
    searchContent: "",
    downloadCount: 10,
    likedCount: 0,
    type: 2,
    websiteName: "",
  };
}

const crawlerFormRef = ref();
const crawlerLoading = ref(false);

const bestSalesForm = ref({
  searchContent: "",
  downloadCount: 10,
  likedCount: 0,
  type: 2,
  websiteName: "",
});

function resetBestSalesForm() {
  bestSalesForm.value = {
    searchContent: "",
    downloadCount: 10,
    likedCount: 0,
    type: 2,
    websiteName: "",
  };
}

const bestSalesFormRef = ref();
const bestSalesLoading = ref(false);

const bestSalesRules = {
  searchContent: [{ required: true, message: "请输入搜索词", trigger: "blur" }],
  type: [{ required: true, message: "请选择目标网站", trigger: "blur" }],
  downloadCount: [{ required: true, message: "请输入下载数量", trigger: "blur" }],
  likedCount: [{ required: true, message: "请输入点赞数量", trigger: "blur" }],
};



function getOriginWebLabel(value) {
  let item: any = materialConfig.value.crawlerWebsite.find((item: any) => {
    return item.value == value;
  });

  if (item) {
    return item.label;
  }

  return "--";
}

async function doCrawlerBestSales() {

}

const crawlerRules = {
  searchContent: [{ required: true, message: "请输入搜索词", trigger: "blur" }],
  type: [{ required: true, message: "请选择目标网站", trigger: "blur" }],
  downloadCount: [{ required: true, message: "请输入下载数量", trigger: "blur" }],
  likedCount: [{ required: true, message: "请输入点赞数量", trigger: "blur" }],
};

async function doCrawler() {
  await crawlerFormRef.value.validate();
  crawlerLoading.value = true;

  let info = materialConfig.value.crawlerWebsite.find((item) => {
    return item.value == crawlerForm.value.type;
  });
  crawlerForm.value.websiteName = info.label;
  await pullAsset({
    ...crawlerForm.value,
  })
    .then(() => {
      ElMessageBox({
        title: '通知',
        message: '图片正在爬取中，请稍等',
        type: 'success',
      })
      initCrawlerStatus()
    })
    .catch((e) => {
      ElMessage.error("图片爬取失败");
      initCrawlerStatus()
    })
    .finally(() => {
      crawlerLoading.value = false;
    })
}


async function getList() {
  loading.value = true;
  let res = await getMaterialRawList({
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
  queryParams.currentPage = 1;
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
    ids.value.forEach((id, index) => {
      let row = dataSource.value.find((item) => {
        return item.id == id;
      });

      if (!row) {
        return;
      }
      // downloadFileByElement(row.ossObjectName, row.imageName);

      setTimeout(() => {
        downloadFileByElement(row.ossObjectName, row.imageName);
      }, 500 * index);
    });
  } catch (e) { }
}


const isMultipleStorage = ref(true);

// 单个入库
function checkClick(row) {
  currentRow.value = row;
  isMultipleStorage.value = false;
  materialCheckModalVisible.value = true;
  initMaterialOrder()
}

function multipleCheckClick() {
  isMultipleStorage.value = true;
  if (!ids.value.length) {
    return ElMessage.warning("请选择需要处理的数据");
  }

  materialCheckModalVisible.value = true;
  initMaterialOrder()
}


const materialCheckFormRef = ref()
const materialCheckRules = {
  materialOrder: [{
    required: true, trigger: "change",
    validator: (rule: any, value: any, callback: any) => {
      value = Number(value)
      if (!value) {
        return callback(new Error('请输入序号'))
      }
      if (!Number.isInteger(value)) {
        callback(new Error('请输入数字'))
      } else {
        if (value <= maxOrder.value) {
          callback(new Error(`起始序号必须大于当前最大序号 (${maxOrder.value})`))
        } else {
          callback()
        }
      }
    }
  }],
  classificationIds: [{ required: true, message: "请选择素材分类", trigger: "change" }],
}

// 确认如入库

const materialCheckLoading = ref(false)

async function ensureCheck() {
  await materialCheckFormRef.value.validate();
  if (isMultipleStorage.value) {
    handleCheck([...ids.value]);
  } else {
    if (!currentRow.value?.id) {
      return;
    }
    handleCheck([currentRow.value?.id]);
  }
}


async function handleCheck(ids) {
  try {
    materialCheckLoading.value = true
    await storageMaterialRaw({
      ids: ids,
      shortName: userStore.user.shortName,
      imageNum: Number(materialCheckForm.value.materialOrder),
      classificationIds: materialCheckForm.value.classificationIds,
    })

    ElMessage.success("操作成功");
    resetCheckStatus()
    materialCheckModalVisible.value = false;
    getList();
  } catch (e) {
    ElMessage.error("操作失败");
  } finally {
    materialCheckLoading.value = false
    materialCheckModalVisible.value = false;
  }
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
      await deleteMaterialRaw({
        ids: delIds,
      });
      ElMessage.success("删除成功");
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
    downloadFileByElement(row.ossObjectName, row.imageName);
    ElNotification.success(`图片${row.imageName}下载成功`);
  } catch (e) { }
}





function wsHandler(data) {
  if (data["notifyGroup"] === "crawler_group") {
    if (data["notifyType"] === "change_crawler") {
      if (data["notifyData"] == "true") {
        ElNotification.success("图片爬取成功");
        getList();
      } else {
        ElNotification.error("图片爬取失败");
      }
    }
  }
}

function treeNodeClick(params) {
  const { pathString, id, ids } = params
  materialCheckForm.value.classificationIds = ids
  materialCheckForm.value.materialCategoryDisplayLabel = pathString
}


/**
 * @爬虫状态
*/

const showCrawlingStatusDrawer = ref(false)

const crawlerStatus = ref([

])

enum CrawlingStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Started = 'STARTED'
}

// 初始化查询状态
async function initCrawlerStatus() {
  const res = await getCrawlingStatus()
  crawlerStatus.value = res
  ElNotification.success('爬图状态已更新')
}

initCrawlerStatus()

/**
 * @初始化素材已使用的序号
*/

const maxOrder = ref(0)

async function initMaterialOrder() {
  var res = await getMaterialMaxOrder({
    shortName: userStore.user.shortName
  })

  if (!res) {
    res = 0
  }

  materialCheckForm.value.materialOrder = res + 1
  maxOrder.value = res
}


// onMounted(() => {
//   userStore.ws.onMessage(wsHandler);
// });

// onUnmounted(() => {
//   userStore.ws.offMessage(wsHandler);
// });
</script>

<style scoped></style>

<style>
.material-row-no-check {
  background-color: rgba(255, 0, 0, 0.1);
}

.collect-tab {
  box-shadow: rgba(0, 0, 0, 0.05) 0px 0px 0px 1px;
  border-radius: 6px;
}
</style>
