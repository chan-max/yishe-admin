<template>
  <div>
    <div class="py-4 flex flex-wrap justify-end gap-4 items-center">
      <div style="flex: 1"></div>
      <!-- <form-item label="只看我的">
        <el-checkbox v-model="queryParams.OnlyMe" @change="getList"></el-checkbox>
      </form-item> -->

      <form-item label="按用户查询">
        <useListSelect v-model="queryParams.creator" @change="getList" style="width: 100px;"></useListSelect>
      </form-item>

      <form-item label="套图状态">
        <el-select v-model="queryParams.selectHasComposite" style="width: 100px" @change="() => {
          queryParams.currentPage = 1;
          getList();
        }">
          <el-option v-for="item in compositeOptions" :label="item.label" :value="item.value" :key="item.value">
          </el-option>
        </el-select>
      </form-item>


      <form-item label="标题状态:">
        <el-select v-model="queryParams.selectTitleComposite" clearable style="width: 100px" @change="getList">
          <el-option v-for="item in titleConfig" :label="item.label" :value="item.type" :key="item.type">
          </el-option>
        </el-select>
      </form-item>

      <form-item label="发布状态">
        <el-select v-model="queryParams.selectPublishComposite" clearable style="width: 100px" @change="getList">
          <el-option v-for="item in completionOptions" :label="item.label" :value="item.value"
            :key="item.value"></el-option>
        </el-select>
      </form-item>
      <form-item label="排序方式">
        <el-select v-model="queryParams.sortingFields" clearable style="width: 140px" @change="getList">
          <el-option v-for="item in sortTypeOptions" :label="item.label" :value="item.value"
            :key="item.value"></el-option>
        </el-select>
      </form-item>
      <!-- <folderUpload>
      </folderUpload> -->
      <div class="flex">
        <el-button type="warning" @click="handleMultipleRemakeTitle"> 批量重试标题({{ ids.length }}) </el-button>
        <el-button type="warning" @click="handleMultipleRemakePicture"> 批量重试套图({{ ids.length }}) </el-button>
        <el-button type="primary" @click="handleMultiplePublish"> 批量发布({{ ids.length }}) </el-button>
        <el-button type="danger" @click="handleDelete(null)" :icon="Delete"> 批量删除({{ ids.length }}) </el-button>
      </div>
    </div>

    <!-- 表格展示 -->
    <div class="common-table">
      <vxe-grid v-bind="gridOptions" :data="dataSource" :loading="loading" @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange">

        <template #titleTemplateHeaderSlot="$">
          <div class="flex items-center gap-2">
            {{ $.column.title }}
            <!-- <el-checkbox v-model="config.titleTemplateUnShowOverflow" label="Option 1" size="large" /> -->
            <el-switch size="small" v-model="config.titleTemplateUnShowOverflow" inline-prompt active-text="完整显示"
              inactive-text="省略显示"></el-switch>
          </div>
        </template>

        <template #videoUrlDefaultSlot="{ row }">
          <div v-if="row.videoUrl">
            <el-button type="primary" link size="small" @click="previewVideo(row.videoUrl)">
              <span>
                查看视频
              </span>
            </el-button>
          </div>


          <el-button v-else type="default" disabled link size="small" @click="previewVideo(row.videoUrl)">
            暂无视频
          </el-button>
        </template>

        <template #imageListDefaultSlot="{ row }">
          <div>
            <div v-if="row.imageList && row.imageList.length" class="" @click="previewImageList(row.imageList)">
              <el-button size="small" link type="default">
                <span style="font-size: 9px;">
                  共
                  <span style="font-size: 1.5em;color:var(--el-color-primary);" class="font-bold">{{
                    row.imageList.length
                  }}</span>
                  张 ,点击预览
                </span>
                <!-- <el-icon class="mx-2" size="16px">
                  <View></View>
                </el-icon> -->

              </el-button>
            </div>
            <div v-else class="font-bold text-gray ">暂无套图</div>
          </div>
        </template>

        <template #completionDefaultSlot="{ row }">
          <div>
            <el-tag :color="getCompletionInfo(row.publishComposite).color" effect="dark" style="border:none;">
              {{ getCompletionInfo(row.publishComposite).label }}
            </el-tag>
          </div>
        </template>

        <template #hasCompositeDefaultSlot="{ row }">
          <div>
            <el-tag :color="getCompositeInfo(row.hasComposite).color" effect="dark" style="border:none;">
              {{ getCompositeInfo(row.hasComposite).label }}
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
            <!-- <el-button type="primary" link size="small" @click="handleMakeVideo(row)">制作视频</el-button> -->
            <el-button type="primary" link size="small" @click="handleTitleEdit(row)">编辑</el-button>
            <!-- <el-button type="primary" link size="small" @click="() => {
              currentRow = row
              uploadPicturesModalVisible = true
            }">替换套图</el-button> -->

            <el-button type="primary" link size="small" @click="() => {
              currentRow = row
              remakeTitle()
            }">重试标题</el-button>

            <el-button type="primary" link size="small" @click="() => {
              currentRow = row
              retryPictureModelVisible = true
            }">重试套图</el-button>

            <el-button :disabled="!(row.hasComposite == '2' && row.titleComposite == '2')" type="primary" link
              size="small" @click="() => {
                currentRow = row
                publishModalVisible = true
              }">发布</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </div>
        </template>
      </vxe-grid>
    </div>

    <!-- 分页 -->
    <div class=" flex justify-end">
      <pagination :total="total" v-model:page="queryParams.currentPage" v-model:limit="queryParams.pageSize"
        @pagination="getList" />
    </div>

    <el-dialog v-model="publishModalVisible" title="确认发布？" width="600px" align-center>
      <!-- <el-form :model="publishForm" :rules="publishFormRules" ref="publishFormRef" label-width="100">
        <el-row>
          <el-col :span="24">
            <el-form-item label="商品模板" prop="publishTemplateId">
              <el-select v-model="form.publishTemplateId" multiple placeholder="请选择商品模板">
                <el-option v-for="item in publishTemplateList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="">
              <div>
                <div>
                  <span class="preview-label">已选择套图 <span> {{ currentRow ? 1 : ids.length }}</span> 个,</span>
                  <span class="preview-label"> 发布模板 <span> {{ form.publishTemplateId.length }} </span> 个, </span>
                  <span class="preview-label"> 共发布 <span> {{ (currentRow ? 1 : ids.length) *
                    form.publishTemplateId.length
                      }}</span>     
                  </span>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form> -->

      <div>
        已选中 {{ (currentRow ? [currentRow.id] : [...ids]).join(',') }}
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="publishModalVisible = false">取消</el-button>
          <el-button type="primary" @click="publishSubmit" :loading="publishLoading">
            确认发布
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="titleEditModalVisible" title="修改" width="800px" align-center>
      <el-form :model="titleEditForm" :rules="titleEditFormRules" ref="titleEditFormRef" label-width="100">

              <el-row>
          <el-col :span="12">
            <el-form-item label="轮播图" prop="carouselImages">
              <el-input v-model="titleEditForm.carouselImages" placeholder="请输入轮播图" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="详情图" prop="detailImages">
              <el-input v-model="titleEditForm.detailImages" placeholder="请输入详情图" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="原标题 :">
              <span class="font-bold" style="font-size: 13px;line-height:16px; color:#999;width:100%;">
                {{ titleEditForm.copy }}
              </span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="新标题 :" prop="title">
              <el-input v-model="titleEditForm.title" placeholder="请输入新标题" type="textarea" spellcheck="false"
                maxlength="250" show-word-limit :autosize="{ minRows: 3, maxRows: 7 }"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="titleEditModalVisible = false">取消</el-button>
          <el-button type="primary" @click="titleEditSubmit">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>


    <el-dialog v-model="uploadPicturesModalVisible" title="替换套图" align-center @close="() => {
      uploadPicturesFileList = []
    }">
      <div class="my-4">
        <el-alert title="新套图会替换原来的所有套图，请谨慎操作" type="warning" />
      </div>

      <el-upload :file-list="uploadPicturesFileList" class="upload-pictures" action="#" list-type="picture-card"
        :on-change="handleUploadPicturesChange" :auto-upload="false" :on-preview="handlePreview" multiple :limit="150"
        :on-exceed="handleUploadPicturesExceed">
        <el-icon>
          <Plus></Plus>
        </el-icon>
        <template #file="{ file }">
          <div>
            <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
            <span class="el-upload-list__item-actions">
              <span class="el-upload-list__item-delete" @click="handleRemove(file)">
                <el-icon>
                  <Delete />
                </el-icon>
              </span>
            </span>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadPicturesModalVisible = false">取消</el-button>
          <el-button type="primary" @click="uploadPicturesSubmit">
            确定上传
          </el-button>
        </div>
      </template>
    </el-dialog>


    <el-dialog v-model="retryPictureModelVisible" title="重新制作套图" width="480px" align-center>
      <el-form label-width="100">
        <el-row>
          <el-col :span="24">
            <el-form-item label="是否制作视频">
              <el-switch v-model="retryPictureForm.isMakeVideo"></el-switch>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div>
          <el-button @click="retryPictureModelVisible = false">取消</el-button>
          <el-button type="primary" @click="remakePicture">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVideoUrlVisible" width="800" destroy-on-close>
      <div class="p-2">{{ currentPreviewVideoUrl }}</div>
      <div style="width:760px;height:400px;">
        <video width="100%" height="100%" controls>
          <source :src="currentPreviewVideoUrl" type="video/mp4">
        </video>
        <!-- <video-preview></video-preview> -->
      </div>
      <template #footer>
        <div>
          <el-button @click="previewVideoUrlVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";

import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";

import { getAccessToken, getTenantId } from "@/utils/auth";
import { useUserStore } from "@/store/modules/user";
import { getCompositeInfo, compositeConfig } from "@/common/ps";

import { getCompletionInfo, completionConfig } from "@/common/material";
import { sortTypeOptions, defaultSortingValue } from "@/common/sort";
import { preview } from "@/components/PreviewImage/index";
import { useLocalStorage, useWindowSize } from "@vueuse/core";
import { getPublishTemplateList, getTitleTemplateList, remakePictureApi, remakeTitleApi } from "@/api/publish";
import { getPsdTemplateList } from "@/api/shop";
import { picturesPublish } from "@/api/pictures";
import {
  getAutoPublishList,
  addAutoPublish,
  updateAutoPublish,
  deleteAutoPublish,
  getPsTemplates,
  updatePsTemplate,
  getPsTemplatesName,
  psSetOfImages,
  updateAndPublish,
} from "@/api/publish"; // 实际接口导入
import { Delete, Plus, View, ZoomIn } from '@element-plus/icons-vue'
import { singleImagePreview } from '@/common/index'
import folderUpload from './uploadFolder.vue'
import { getTitleStatusInfo, titleConfig } from "@/common/title";
import useListSelect from '@/components/common/userListSelect.vue'
import { useEventBus } from "@vueuse/core";
import { ElNotification } from "element-plus";
import videoPreview from './video.vue'

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

const config = useLocalStorage('_erp_picture-index', {
  titleTemplateUnShowOverflow: true
})

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
  selectTitleComposite: null,
  creator: null,
  selectHasComposite: null,
});

const { height } = useWindowSize();

const gridOptions = computed(() => {
  return {
    ...commonGridOptions,
    id: 'gridOptionsPublishPictures',
    rowConfig: {
      keyField: 'id'
    },
    checkboxConfig: {
      highlight: true,
      reserve: true,
    },
    maxHeight: height.value - 240,
    columns: [

      { type: "checkbox", width: 50, showOverflow: true },
      { title: "ID", field: "id", width: 50, showOverflow: true },
      { title: "SKU货号", field: "skuNo", width: 100, showOverflow: true },
      { title: "店铺", field: "shopName", width: 100, showOverflow: true },
      { title: "类目", field: "categoryName", width: 100, showOverflow: true },
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
        width: "160",
        slots: {
          default: "imageListDefaultSlot",
        },
      },
      { title: "轮播图", field: "carouselImages", width: 80, showOverflow: true },
      { title: "详情图", field: "detailImages", width: 80, showOverflow: true },
      {
        title: "视频",
        field: "videoUrl",
        width: 'auto',
        slots: {
          default: "videoUrlDefaultSlot",
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
        title: "标题", field: "title", minWidth: 220,
        showOverflow: !config.value.titleTemplateUnShowOverflow,
        slots: {
          header: 'titleTemplateHeaderSlot',
        }
      },
      {
        title: "发布状态",
        field: "publishComposite",
        width: 80,
        showOverflow: true,
        slots: {
          default: "completionDefaultSlot",
        },
      },
      {
        title: "创建人",
        field: "creatorName",
        width: 100,
        showOverflow: true,
      },
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
  }
})




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
const currentRow = ref({} as any);
const submitLoading = ref(false);


const publishTemplateList = ref([])

async function initPublishTemplate() {
  let res = await getPublishTemplateList({
    currentPage: 1,
    pageSize: 99
  })
  publishTemplateList.value = res.list
}
// initPublishTemplate()

async function getList() {
  loading.value = true;
  let res = await getAutoPublishList({
    ...queryParams,
  }).finally(() => {
    loading.value = false;
  });

  dataSource.value = res.list;
  total.value = res.total;
  // ids.value = [];
}

getList();

// 操作函数
function handleQuery() {
  queryParams.currentPage = 1;
}


// 发布弹窗
const publishModalVisible = ref(false)

const publishForm = ref({
  publishTemplateId: ''
})

const publishFormRules = {
  publishTemplateId: [{ required: true, message: "请选择商品模板", trigger: "blur" }],
};

const publishFormRef = ref()

const publishLoading = ref(false)

async function publishSubmit() {
  // 发布提交
  // await publishFormRef.value.validate()
  // 单条上传

  let data = {
    publishIdList: currentRow.value ? [currentRow.value.id] : [...ids.value],
    // publishTemplateId: publishForm.value.publishTemplateId,
  }

  publishLoading.value = true

  console.log('确认发布')
  await picturesPublish(
    data
  ).then(() => {
    ElMessage.warning('商品发布中')
  }).catch((e) => {
    ElMessage.error('发布失败')
  }).finally(() => {
    publishLoading.value = false
    publishModalVisible.value = false
  })
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

const userStore = useUserStore()




function previewImageList(list) {
  preview(0, list);
}


function cancel() {
  open.value = false;
}

const form = ref({
  publishTemplateId: ''
});



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



function handleMultiplePublish() {
  currentRow.value = null
  if (!ids.value.length) {
    return ElMessage.warning("请选择要发布的数据");
  }
  publishModalVisible.value = true
}

// function handleMultiplePublish() {
//   if (!ids.value.length) {
//     return ElMessage.warning("请选择要发布的数据");
//   }

//   const err = ids.value.some((id) => {
//     let item = dataSource.value.find((row) => row.id == id);

//     if (item.hasComposite != 2) {
//       return true;
//     }
//   });

//   if (err) {
//     return ElMessage.error("选中数据存在未制作的套图，请重新选择");
//   }

//   ElMessageBox.confirm("确认上传该记录吗？", "提示", {
//     confirmButtonText: '确定',
//     cancelButtonText: '取消',
//     type: 'warning'
//   }).then(async () => {
//     await updateAndPublish({ publishIdList: [...ids.value] }).catch(() => { });
//     await ElMessage.info("发布进行中");
//     getList();
//   })
// }

// 标题编辑相关
const titleEditModalVisible = ref(false)

const titleEditForm = ref({
  copy: '',
  title: '',
  carouselImages:'',
  detailImages:'',
})

const titleEditFormRef = ref()


const titleEditFormRules = {
  title: [{ required: true, message: "请输入标题", trigger: "blur" }],
  carouselImages: [{ required: true, message: "轮播图不能为空", trigger: "blur" }],
  detailImages: [{ required: true, message: "详情图不能为空", trigger: "blur" }],
}

function handleTitleEdit(row) {
  currentRow.value = row
  titleEditModalVisible.value = true
  titleEditForm.value = {
    id: row.id,
    title: row.title,
    copy: row.title,
    carouselImages:row.carouselImages,
    detailImages:row.detailImages,
  }
}


async function titleEditSubmit() {
  await titleEditFormRef.value.validate()
  await updateAutoPublish({
    ...titleEditForm.value
  }).then(() => {
    ElMessage.success('标题修改成功')
    getList()
  }).catch(() => {
    ElMessage.error('标题修改失败')
  }).finally(() => {
    titleEditModalVisible.value = false
  })
}

const submitForm = async () => {
};

/**
 * @重新上传素材图相关
*/
const uploadPicturesModalVisible = ref(false)

// 存储上传的文件列表
const uploadPicturesFileList = ref([]);

const uploadPicturesForm = ref({})

const uploadPicturesFormRules = {
}

const uploadPicturesFormRef = ref()

// 文件变化时的回调
const handleUploadPicturesChange = (file, files) => {
  uploadPicturesFileList.value = files; // 更新文件列表
};

function handleRemove(file) {
  uploadPicturesFileList.value.splice(uploadPicturesFileList.value.indexOf(file as any), 1)
}

// 超出文件限制时的回调
const handleUploadPicturesExceed = () => {
  ElMessage.warning('最多只能上传 10 个文件');
};

// 手动上传文件
const uploadPicturesSubmit = async () => {
  if (uploadPicturesFileList.value.length === 0) {
    ElMessage.warning('请先选择文件');
    return;
  }
  const formData = new FormData(); // 创建 FormData 对象
  uploadPicturesFileList.value.forEach((file) => {
    formData.append('files', file.raw); // 将文件添加到 FormData
  });

  try {
    // 调用上传接口
    const response = await uploadFiles(formData);
    ElMessage.success('上传成功');
    console.log('上传结果:', response);
  } catch (error) {
    ElMessage.error('上传失败');
    console.error('上传失败:', error);
  }
};

const handlePreview = (file) => {
  singleImagePreview(file.url)
};

// 模拟上传接口
const uploadFiles = async (formData) => {
  // 这里替换为你的上传接口
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟接口返回
      resolve({ code: 200, message: '上传成功' });
    }, 1000);
  });
};


/**
 * @批量替换套图
*/

function handleMultipleUploadPictures() {

}


onMounted(() => {
  const eventBus = useEventBus('erp')

  eventBus.on((params: any) => {
    // 这里只更新页面即可
    if (params.type == 'make_publish_title') {
      ElNotification.warning(`标题状态更新 ${params.content.notifyId}`)
    }

    if (params.type == 'make_publish_image') {
      ElNotification.warning(`套图状态更新 ${params.content.notifyId}`)
    }

    if (params.type == 'publish_upload') {
      ElNotification.warning(`发布状态更新 ${params.content.notifyId}`)
    }

    if (params.type == 'make_publish_title') {
      // getList()
      let target = dataSource.value.find((item) => item.id == params.content.notifyId)

      if (!target) {
        return
      }

      target.title = params.content.notifyData
      target.titleComposite = params.content.notifyCode
      // titleComposite

    }

    if (params.type == 'make_publish_image') {
      // getList()
      let target = dataSource.value.find((item) => item.id == params.content.notifyId)

      if (!target) {
        return
      }

      if (params.content.notifyData) {
        const notifyData = JSON.parse(params.content.notifyData)

        if (params.content.notifyData) {
          target.imageList = notifyData.imageList
          target.videoUrl = notifyData.video
        }
      }
      target.hasComposite = params.content.notifyCode
      // hasComposite
    }

    if (params.type == 'publish_upload') {
      // getList()
      // publishComposite
      let target = dataSource.value.find((item) => item.id == params.content.notifyId)

      if (!target) {
        return
      }
      target.publishComposite = params.content.notifyCode
    }
  })
})

async function remakeTitle() {
  ElMessageBox.confirm(
    "确认重新制作标题吗",
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info',
    }
  )
    .then(async () => {
      await remakeTitleApi({ publishIdList: currentRow.value ? [currentRow.value.id] : [...ids.value] })
      ElMessage.warning('标题制作中')
    })
    .catch(() => {
    })
}

const retryPictureModelVisible = ref(false)

const retryPictureForm = ref({
  isMakeVideo: false,
});

async function remakePicture() {
  const res = await remakePictureApi({ publishIdList: currentRow.value ? [currentRow.value.id] : [...ids.value], isMakeVideo: retryPictureForm.value.isMakeVideo, isLocalMakeImage: true })

  const accessToken = getAccessToken()
  const tenantId = getTenantId()
  const clientData = {
    token: accessToken,
    tenantId: tenantId,
    ...res,
    // ...userStore.oss.config,
  }

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
  retryPictureModelVisible.value = false
}

function handleMultipleRemakeTitle() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要制作的数据')
  }
  currentRow.value = null
  remakeTitle()
}

function handleMultipleRemakePicture() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要制作的数据')
  }
  currentRow.value = null
  retryPictureModelVisible.value = true
}

/**
 * @预览视频
*/

const previewVideoUrlVisible = ref(false)
const currentPreviewVideoUrl = ref('')
function previewVideo(url) {
  currentPreviewVideoUrl.value = url
  previewVideoUrlVisible.value = true
}

function handleMakeVideo(row) {

}
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

.upload-pictures {

  .el-upload-list__item,
  .el-upload--picture-card {
    width: 108px !important;
    height: 108px !important;
  }
}

.preview-label {
  span {
    font-size: 1.4em;
    color: var(--el-color-primary);
    font-weight: bold;
  }
}
</style>
