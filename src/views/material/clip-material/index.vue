<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="clip-material-page" :sidebar-width="folderTreeCollapsed ? '28px' : '280px'">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="按名称搜索">
                  <el-input
                    v-model="queryParams.keyword"
                    size="small"
                    placeholder="请输入名称、描述或关键词"
                    clearable
                    @change="(val) => { if (!val) getList(); }"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="排序">
                  <el-select
                    v-model="queryParams.sortingFields"
                    size="small"
                    placeholder="请选择排序方式"
                    @change="getList"
                  >
                    <el-option label="创建时间倒序" value="createTime DESC" />
                    <el-option label="创建时间正序" value="createTime ASC" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="后缀">
                  <el-select
                    v-model="queryParams.suffix"
                    size="small"
                    placeholder="请选择后缀"
                    clearable
                    @change="getList"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="mp4" value="mp4" />
                    <el-option label="mov" value="mov" />
                    <el-option label="avi" value="avi" />
                    <el-option label="mkv" value="mkv" />
                    <el-option label="wmv" value="wmv" />
                    <el-option label="flv" value="flv" />
                    <el-option label="webm" value="webm" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="分类">
                  <el-select
                    v-model="queryParams.category"
                    size="small"
                    placeholder="请选择分类"
                    clearable
                    @change="getList"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="风景" value="风景" />
                    <el-option label="人物" value="人物" />
                    <el-option label="动物" value="动物" />
                    <el-option label="建筑" value="建筑" />
                    <el-option label="动画" value="动画" />
                    <el-option label="其他" value="其他" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="3">
                <el-form-item label="ID精确查询">
                  <el-input
                    v-model="queryParams.id"
                    size="small"
                    placeholder="请输入ID"
                    clearable
                    @change="(val) => { if (!val) getList(); }"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="时间范围">
                  <DateRangePicker
                    @change="
                      (val) => {
                        queryParams.startTime = val.start;
                        queryParams.endTime = val.end;
                        getList();
                      }
                    "
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button size="small" type="primary" :icon="Search" @click="getList">搜索</el-button>
              <el-button
                v-if="isAdmin"
                size="small"
                type="primary"
                @click="() => { uploadModalVisible = true; }"
              >
                上传
              </el-button>
              <el-button size="small" @click="handleMultiDownload">下载 ({{ ids.length }})</el-button>
              <el-button
                v-if="isAdmin"
                size="small"
                type="danger"
                :icon="Delete"
                :disabled="!ids.length"
                @click="handleDelete(null)"
              >
                批量删除 ({{ ids.length }})
              </el-button>
              <el-button v-if="isMobile" size="small" @click="filterDialogVisible = true">筛选</el-button>
            </div>
          </el-form>
        </div>

        <el-dialog v-model="filterDialogVisible" title="筛选" width="90%" align-center>
          <el-form :model="queryParams" label-width="80px">
            <el-form-item label="按名称搜索">
              <el-input
                v-model="queryParams.keyword"
                placeholder="请输入名称、描述或关键词"
                clearable
              />
            </el-form-item>
            <el-form-item label="排序">
              <el-select v-model="queryParams.sortingFields" placeholder="请选择排序方式">
                <el-option label="创建时间倒序" value="createTime DESC" />
                <el-option label="创建时间正序" value="createTime ASC" />
              </el-select>
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="queryParams.category" placeholder="请选择分类">
                <el-option label="全部" value="" />
                <el-option label="风景" value="风景" />
                <el-option label="人物" value="人物" />
                <el-option label="动物" value="动物" />
                <el-option label="建筑" value="建筑" />
                <el-option label="动画" value="动画" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
            <el-form-item label="后缀">
              <el-select v-model="queryParams.suffix" placeholder="请选择后缀" clearable>
                <el-option label="全部" value="" />
                <el-option label="mp4" value="mp4" />
                <el-option label="mov" value="mov" />
                <el-option label="avi" value="avi" />
                <el-option label="mkv" value="mkv" />
                <el-option label="wmv" value="wmv" />
                <el-option label="flv" value="flv" />
                <el-option label="webm" value="webm" />
              </el-select>
            </el-form-item>
            <el-form-item label="ID精确查询">
              <el-input v-model="queryParams.id" placeholder="请输入ID" clearable />
            </el-form-item>
            <el-form-item label="按时间查询">
              <DateRangePicker
                @change="
                  (val) => {
                    queryParams.startTime = val.start;
                    queryParams.endTime = val.end;
                  }
                "
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="filterDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="onMobileFilterSubmit">确定</el-button>
          </template>
        </el-dialog>
      </template>

      <template #sidebar>
        <div class="list-page-panel list-page-panel--flat list-page-sidebar clip-material-sidebar">
          <div class="list-page-sidebar__body clip-material-sidebar__body">
            <div v-show="!folderTreeCollapsed" class="h-full">
              <FolderTree
                v-model="selectedFolderId"
                :folder-category="FOLDER_CATEGORY"
                :show-count="false"
                :drag-state="dragState"
                @change="handleFolderChange"
                @folder-drag-over="handleFolderDragOver"
                @folder-drag-leave="handleFolderDragLeave"
                @folder-drop="handleFolderDrop"
              />
            </div>
          </div>
          <button
            type="button"
            class="clip-material-sidebar__toggle"
            @click="folderTreeCollapsed = !folderTreeCollapsed"
          >
            <el-icon :size="14">
              <DArrowRight v-if="folderTreeCollapsed" />
              <DArrowLeft v-else />
            </el-icon>
          </button>
        </div>
      </template>

      <template #table>
        <div class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat">
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                ref="gridRef"
                class="clip-material-dnd-grid"
                v-bind="gridOptions"
                :data="dataSource"
                :loading="loading"
                @checkbox-change="checkboxChange"
                @checkbox-all="checkboxAllChange"
              >
                <template #dragHandleSlot>
                  <div
                    class="row-drag-handle flex items-center justify-center cursor-grab text-gray-400 hover:text-primary"
                  >
                    <el-icon :size="14">
                      <Rank />
                    </el-icon>
                  </div>
                </template>

                <template #previewDefaultSlot="{ row }">
                  <div class="table-media-cell p-2">
                    <video
                      v-if="row.url && isVideoFile(row.suffix)"
                      :src="row.url"
                      :alt="row.name || '文件素材'"
                      class="block max-h-[120px] max-w-[180px] cursor-pointer rounded-md bg-black/5 object-contain"
                      @click="openVideoPreview(row.url, row.name)"
                      @error="handleVideoError"
                      controls
                      preload="metadata"
                    />
                    <el-image
                      v-else-if="row.url && isImageFile(row.suffix)"
                      :src="row.url"
                      :alt="row.name || '图片素材'"
                      fit="contain"
                      preview-teleported
                      class="h-[120px] w-[180px] cursor-pointer rounded-md border border-solid border-[var(--el-border-color-light)] bg-black/5"
                      @click="openImagePreview(row.url)"
                      @error="handleImageError"
                    />
                    <div
                      v-else-if="row.url && isAudioFile(row.suffix)"
                      class="flex w-full flex-col items-start justify-center rounded-lg bg-[var(--el-fill-color-light)] px-2 py-2"
                    >
                      <audio
                        :src="row.url"
                        controls
                        preload="metadata"
                        class="h-7 w-full"
                        @error="handleAudioError"
                      />
                    </div>
                    <div
                      v-else
                      class="flex h-20 w-30 items-center justify-center rounded-md bg-gray-100 text-gray-500"
                    >
                      <el-icon size="24">
                        <component :is="getFileIcon(row.suffix)" />
                      </el-icon>
                    </div>
                  </div>
                </template>

                <template #categorySlot="{ row }">
                  <el-tag v-if="row.category" :type="getCategoryTagType(row.category)" size="small">
                    {{ row.category }}
                  </el-tag>
                  <span v-else>-</span>
                </template>

                <template #tagsSlot="{ row }">
                  <div v-if="row.tags" class="flex flex-wrap gap-1">
                    <el-tag v-for="tag in row.tags.split(',')" :key="tag" size="small" type="info">
                      {{ tag.trim() }}
                    </el-tag>
                  </div>
                  <span v-else>-</span>
                </template>

                <!-- isPublic display removed -->

                <template #operationDefaultSlot="{ row }">
                  <div class="flex items-center">
                    <el-dropdown
                      class="operation-dropdown"
                      placement="bottom-end"
                      @command="(command) => handleOperationCommand(String(command), row)"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button">操作</el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item v-if="isAdmin" command="edit">
                            <el-icon><Edit /></el-icon>
                            <span>编辑</span>
                          </el-dropdown-item>
                          <el-dropdown-item command="download">
                            <el-icon><Download /></el-icon>
                            <span>下载</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            command="preview"
                            v-if="isVideoFile(row.suffix) || isAudioFile(row.suffix)"
                          >
                            <el-icon
                              ><VideoPlay v-if="isVideoFile(row.suffix)" /><Headset v-else
                            /></el-icon>
                            <span>预览</span>
                          </el-dropdown-item>
                          <!-- toggle public/private removed -->
                          <el-dropdown-item v-if="isAdmin" command="delete" divided>
                            <el-icon><Delete /></el-icon>
                            <span>删除</span>
                          </el-dropdown-item>
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
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            :total="total"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>

    <el-dialog
      v-model="uploadModalVisible"
      title="文件素材上传"
      width="100%"
      style="height: 100%"
      align-center
      :footer="false"
      :destroy-on-close="true"
      class="clip-material-upload-dialog"
      @close="uploadModalClose"
    >
      <div style="height: 100%">
        <clip-material-upload @single-file-uploaded="singleFileUploaded" />
      </div>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑剪辑素材信息"
      width="800px"
      :destroy-on-close="true"
      align-center
    >
      <el-form :model="editForm" label-width="100px" class="px-2">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" placeholder="请输入名称" class="w-full" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="5"
            placeholder="请输入描述"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="editForm.keywords"
            placeholder="请输入关键词（逗号分隔）"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.category" placeholder="请选择分类" class="w-full">
            <el-option label="风景" value="风景" />
            <el-option label="人物" value="人物" />
            <el-option label="动物" value="动物" />
            <el-option label="建筑" value="建筑" />
            <el-option label="动画" value="动画" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="editForm.tags" placeholder="请输入标签（逗号分隔）" class="w-full" />
        </el-form-item>
        <!-- 是否公开 编辑项已移除 -->
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 视频预览弹窗 -->
    <VideoPreview
      :visible="videoPreviewVisible"
      :video-url="currentVideoUrl"
      :video-name="currentVideoName"
      @close="closeVideoPreview"
    />

    <ImagePreview
      :visible="imagePreviewVisible"
      :image-url="currentImageUrl"
      @close="closeImagePreview"
    />
  </ContentWrap>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, nextTick, watchEffect } from "vue";

import {
  getClipMaterialList,
  deleteClipMaterial,
  updateClipMaterial,
  batchMoveClipMaterial,
} from "@/api/clip-material";

import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";

import { useDebounceFn, useLocalStorage, useWindowSize } from "@vueuse/core";

import { useUserStore } from "@/store/modules/user";
import clipMaterialUpload from "./clip-material-upload.vue";
import VideoPreview from "./VideoPreview.vue";
import FolderTree from "@/components/material/FolderTree.vue";
import DateRangePicker from "@/components/DateRangePicker.vue";
import Pagination from "@/components/Pagination/index.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import { ElButton, ElNotification, ElMessage, ElMessageBox } from "element-plus";
import {
  Delete,
  Search,
  Edit,
  Download,
  VideoPlay,
  Document,
  Picture,
  Folder,
  Headset,
  DArrowLeft,
  DArrowRight,
  Rank,
} from "@element-plus/icons-vue";
import { downloadFileByElement } from "@/common/download";
import { useFolderRowDrag } from "@/hooks/useFolderRowDrag";
import { FOLDER_FILTER, convertFolderIdToApiParam } from "@/constants/folder";

const userStore = useUserStore();
const FOLDER_CATEGORY = "clipmaterial";

// 判断是否为管理员
const isAdmin = computed(() => userStore.user?.isAdmin ?? false);

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  keyword: "",
  startTime: "",
  endTime: "",
  suffix: "",
  id: "",
  category: "",
  sortingFields: "createTime DESC",
  folderId: FOLDER_FILTER.ALL as string | null,
});

// 移动端相关
const isMobile = computed(() => window.innerWidth <= 768);
const filterDialogVisible = ref(false);

function onMobileFilterSubmit() {
  filterDialogVisible.value = false;
  getList();
}

const gridRef = ref();

function resetCheckStatus() {
  if (gridRef.value?.clearCheckboxRow) {
    gridRef.value?.clearCheckboxRow();
  }
  if (gridRef.value?.clearCheckboxReserve) {
    gridRef.value?.clearCheckboxReserve();
  }
  ids.value = [];
}

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: [
    {
      title: "",
      field: "dragHandle",
      width: 40,
      align: "center",
      slots: { default: "dragHandleSlot" },
    },
    { type: "checkbox", width: 50, ellipsis: true, reserve: true },
    {
      title: "文件预览",
      field: "url",
      width: 400,
      slots: { default: "previewDefaultSlot" },
    },
    { title: "素材名称", field: "name", minWidth: 180, className: "font-bold" },
    { title: "描述", field: "description", minWidth: 200 },
    { title: "关键词", field: "keywords", minWidth: 160 },
    { title: "后缀", field: "suffix", width: 80 },
    { title: "分类", field: "category", width: 100, slots: { default: "categorySlot" } },
    { title: "标签", field: "tags", minWidth: 150, slots: { default: "tagsSlot" } },
    { title: "ID", field: "id", width: 80 },
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
    buildOperationColumn("operationDefaultSlot"),
  ],
});

const { height } = useWindowSize();

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 260;
});

const dataSource = ref([]);
const loading = ref(false);
const ids = ref<any[]>([]);
const total = ref(0);

const { dragState, setupRowDrag, handleFolderDragOver, handleFolderDragLeave, resetAfterDrop } =
  useFolderRowDrag({
    gridClass: "clip-material-dnd-grid",
    dataSource,
    selectedIds: ids,
  });

// 上传相关
const uploadModalVisible = ref(false);
const folderTreeCollapsed = useLocalStorage("clip_material_folder_collapsed", false);
const selectedFolderId = ref<string | null>(FOLDER_FILTER.ALL);

function uploadModalClose() {}

async function getList() {
  loading.value = true;
  let res = await getClipMaterialList({
    ...queryParams,
    folderId: convertFolderIdToApiParam(queryParams.folderId),
  }).finally(() => {
    loading.value = false;
  });
  dataSource.value = res.list;
  total.value = res.total;
  nextTick(setupRowDrag);
}

getList();

// 下载
function handleMultiDownload() {
  if (!ids.value.length) {
    return ElMessage.warning("请选择要下载的数据");
  }

  // 处理文件下载
  try {
    ids.value.forEach(async (id, index) => {
      let row = dataSource.value.find((item) => {
        return item.id == id;
      });

      if (!row) {
        return;
      }
      setTimeout(async () => {
        try {
          const downloadUrl = row.url;
          const fileName = row.name || `file_${id}.${row.suffix || "unknown"}`;

          if (!downloadUrl) {
            ElMessage.error(`文件 ${fileName} 下载失败：缺少下载链接`);
            return;
          }

          // 使用新的下载函数
          await downloadFileByElement(downloadUrl, fileName);
          ElNotification.success(`文件 ${fileName} 下载成功`);
        } catch (error) {
          console.error("下载失败:", error);
          ElMessage.error(`文件下载失败：${error.message}`);
        }
      }, 500 * index);
    });
  } catch (e) {
    console.error("批量下载失败:", e);
    ElMessage.error("批量下载失败");
  }
}

function handleDelete(row?) {
  let delIds: any = null;

  if (row) {
    delIds = [row.id];
  } else if (!ids.value.length) {
    return ElMessage.warning("请选择要删除的数据");
  } else {
    delIds = [...ids.value];
  }

  console.log("准备删除的ID:", delIds);
  console.log("ids.value:", ids.value);

  ElMessageBox.confirm("确认删除该文件素材吗", "删除提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "error",
  })
    .then(async () => {
      try {
        console.log("发送删除请求，ID:", delIds);
        const result = await deleteClipMaterial({ ids: delIds });
        console.log("删除结果:", result);
        ElNotification.success("删除成功");
        resetCheckStatus();
        getList();
      } catch (error) {
        console.error("删除失败:", error);
        ElMessage.error(`删除失败: ${error.message || "未知错误"}`);
      }
    })
    .catch(() => {});
}

function checkboxChange(e) {
  console.log("checkboxChange事件:", e);
  console.log("records:", e.records);
  console.log("reserves:", e.reserves);
  const records = Array.isArray(e.records) ? e.records : [];
  const reserves = Array.isArray(e.reserves) ? e.reserves : [];
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)];
  console.log("最终的ids:", ids.value);
}

function checkboxAllChange(e) {
  console.log("checkboxAllChange事件:", e);
  console.log("records:", e.records);
  console.log("reserves:", e.reserves);
  const records = Array.isArray(e.records) ? e.records : [];
  const reserves = Array.isArray(e.reserves) ? e.reserves : [];
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)];
  console.log("最终的ids:", ids.value);
}

async function handleDownload(row) {
  // 处理文件下载
  try {
    const downloadUrl = row.url;
    const fileName = row.name || `file_${row.id}.${row.suffix || "unknown"}`;

    if (!downloadUrl) {
      ElMessage.error(`文件 ${fileName} 下载失败：缺少下载链接`);
      return;
    }

    // 使用新的下载函数
    await downloadFileByElement(downloadUrl, fileName);
    ElNotification.success(`文件 ${fileName} 下载成功`);
  } catch (error) {
    console.error("下载失败:", error);
    ElMessage.error(`文件下载失败：${error.message}`);
  }
}

const delayUpdateList = useDebounceFn(() => {
  getList();
}, 1999);

function handleFolderChange(payload: { folderId: string | null; node?: any }) {
  selectedFolderId.value = payload.folderId || FOLDER_FILTER.ALL;
  queryParams.folderId = selectedFolderId.value;
  queryParams.currentPage = 1;
  getList();
}

async function handleFolderDrop(payload: { data: any }) {
  if (!dragState.draggingIds.length) return;

  let targetFolderId: string | null = null;
  if (payload.data.id === FOLDER_FILTER.ALL) {
    ElMessage.warning("不能移动到全部");
    resetAfterDrop();
    return;
  }

  if (payload.data.id === FOLDER_FILTER.NOT_GROUP) {
    targetFolderId = FOLDER_FILTER.NOT_GROUP;
  } else {
    targetFolderId = payload.data.id;
  }

  const movingIds = dragState.draggingIds.map((id) => String(id));
  const targetPath = payload.data.path || "";

  try {
    await batchMoveClipMaterial({
      ids: movingIds,
      folderId: convertFolderIdToApiParam(targetFolderId) as string | null,
    });
    ElMessage.success(`已移动 ${movingIds.length} 个素材到 ${targetPath || "未分类"}`);
    resetCheckStatus();
    await getList();
  } catch (error) {
    ElMessage.error((error as Error).message || "移动失败");
  } finally {
    resetAfterDrop();
  }
}

function singleFileUploaded() {
  console.log("单个文件上传");
  delayUpdateList();
}

// 编辑相关
const editDialogVisible = ref(false);
const editForm = ref({
  id: "",
  name: "",
  description: "",
  keywords: "",
  category: "",
  tags: "",
  folderId: null as string | null,
});
const editLoading = ref(false);

// 批量操作loading状态
// batch public/private removed

function handleEdit(row) {
  editForm.value = {
    id: row.id,
    name: row.name,
    description: row.description,
    keywords: row.keywords,
    category: row.category || "",
    tags: row.tags || "",
    folderId: row.folderId ?? row.folder?.id ?? null,
  };
  editDialogVisible.value = true;
}

async function submitEdit() {
  editLoading.value = true;
  try {
    await updateClipMaterial(editForm.value);
    ElNotification.success("保存成功");
    editDialogVisible.value = false;
    getList();
  } catch (e) {
    ElNotification.error("保存失败");
  } finally {
    editLoading.value = false;
  }
}

// 视频预览相关状态
const videoPreviewVisible = ref(false);
const currentVideoUrl = ref("");
const currentVideoName = ref("");
const imagePreviewVisible = ref(false);
const currentImageUrl = ref("");

function openVideoPreview(videoUrl: string, videoName?: string) {
  currentVideoUrl.value = videoUrl;
  currentVideoName.value = videoName || "剪辑素材";
  videoPreviewVisible.value = true;
}

function closeVideoPreview() {
  videoPreviewVisible.value = false;
  currentVideoUrl.value = "";
  currentVideoName.value = "";
}

function openImagePreview(imageUrl: string) {
  currentImageUrl.value = imageUrl;
  imagePreviewVisible.value = true;
}

function closeImagePreview() {
  imagePreviewVisible.value = false;
  currentImageUrl.value = "";
}

function handleVideoError(event: Event) {
  const video = event.target as HTMLVideoElement;
  console.warn("视频加载失败:", video.src);
}

function handleAudioError(event: Event) {
  const audio = event.target as HTMLAudioElement;
  console.warn("音频加载失败:", audio.src);
}

function handleImageError(event: Event) {
  const image = event.target as HTMLImageElement;
  console.warn("图片加载失败:", image.src);
}

function normalizeSuffix(suffix: string): string {
  return String(suffix || "")
    .trim()
    .toLowerCase();
}

// 判断是否为视频文件
function isVideoFile(suffix: string): boolean {
  const videoSuffixes = ["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm", "m4v", "3gp", "ogv"];
  return videoSuffixes.includes(normalizeSuffix(suffix));
}

// 判断是否为音频文件
function isAudioFile(suffix: string): boolean {
  const audioSuffixes = ["mp3", "wav", "aac", "ogg", "oga", "m4a", "flac", "wma", "opus", "amr"];
  return audioSuffixes.includes(normalizeSuffix(suffix));
}

// 判断是否为图片文件
function isImageFile(suffix: string): boolean {
  const imageSuffixes = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff", "tif"];
  return imageSuffixes.includes(normalizeSuffix(suffix));
}

// 获取文件图标
function getFileIcon(suffix: string) {
  const videoSuffixes = ["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm", "m4v", "3gp", "ogv"];
  const audioSuffixes = ["mp3", "wav", "aac", "ogg", "oga", "m4a", "flac", "wma", "opus", "amr"];
  const imageSuffixes = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff", "tif"];
  const documentSuffixes = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf"];
  const normalizedSuffix = normalizeSuffix(suffix);

  if (videoSuffixes.includes(normalizedSuffix)) {
    return VideoPlay;
  } else if (audioSuffixes.includes(normalizedSuffix)) {
    return Headset;
  } else if (imageSuffixes.includes(normalizedSuffix)) {
    return Picture;
  } else if (documentSuffixes.includes(normalizedSuffix)) {
    return Document;
  } else {
    return Folder;
  }
}

// 分类标签颜色
function getCategoryTagType(category: string) {
  const typeMap = {
    风景: "success",
    人物: "primary",
    动物: "warning",
    建筑: "info",
    动画: "danger",
    其他: "",
  };
  return typeMap[category] || "";
}

// public/private toggle and batch functions removed

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case "edit":
      handleEdit(row);
      break;
    case "download":
      handleDownload(row);
      break;
    case "preview":
      if (isVideoFile(row.suffix)) {
        openVideoPreview(row.url, row.name);
      }
      // 音频文件在列表中已直接显示播放控件，无需额外预览弹窗
      break;

    case "delete":
      handleDelete(row);
      break;
    default:
      console.warn("未知的操作命令:", command);
  }
}
</script>

<style lang="less">
.clip-material-page {
  gap: 10px;
  padding: 8px 0 0;
}

.clip-material-page .list-page-layout__main {
  gap: 10px;
}

.clip-material-page .list-page-filter--flat {
  gap: 10px;
  padding-bottom: 10px;
}

.clip-material-page .list-page-table-panel__pagination--flat {
  padding-top: 10px;
}

.clip-material-upload-dialog {
  .el-dialog__body {
    height: calc(100% - 40px);
  }
}

.clip-material-sidebar {
  position: relative;
  min-height: 100%;
}

.clip-material-sidebar__body {
  padding-right: 18px;
}

.clip-material-sidebar__toggle {
  position: absolute;
  top: 50%;
  right: -14px;
  z-index: 5;
  display: flex;
  height: 52px;
  width: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 0;
  border-radius: 0 12px 12px 0;
  background: var(--list-page-surface-bg);
  color: rgba(255, 255, 255, 0.72);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
  transform: translateY(-50%);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.clip-material-sidebar__toggle:hover {
  background: var(--list-page-surface-bg-soft);
  color: #fff;
}

@media (max-width: 1024px) {
  .clip-material-sidebar__body {
    padding-right: 12px;
  }

  .clip-material-sidebar__toggle {
    top: auto;
    right: 14px;
    bottom: 14px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    transform: none;
  }
}
</style>
