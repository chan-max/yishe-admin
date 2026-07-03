<template>
  <ContentWrap :plain="true">
    <ListPageLayout
      class="clip-material-page"
      :sidebar-width="folderTreeCollapsed ? '28px' : '280px'"
    >
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
                    @change="
                      (val) => {
                        if (!val) getList();
                      }
                    "
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
                    <el-option
                      v-for="option in suffixOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
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
                    @change="
                      (val) => {
                        if (!val) getList();
                      }
                    "
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
              <el-button
                size="small"
                type="primary"
                :icon="Search"
                :loading="loading"
                @click="getList"
                >搜索</el-button
              >
              <el-button
                v-if="isAdmin"
                size="small"
                type="primary"
                @click="
                  () => {
                    uploadModalVisible = true;
                  }
                "
              >
                上传
              </el-button>
              <el-button size="small" @click="handleMultiDownload"
                >下载 ({{ ids.length }})</el-button
              >
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
              <el-button
                v-if="isAdmin"
                size="small"
                type="success"
                :disabled="!ids.length"
                @click="openClipMaterialUserTransferDialog('copy')"
              >
                分享给用户 ({{ ids.length }})
              </el-button>
              <el-button
                v-if="isAdmin"
                size="small"
                type="warning"
                :disabled="!ids.length"
                @click="openClipMaterialUserTransferDialog('move')"
              >
                转移给用户 ({{ ids.length }})
              </el-button>
              <el-button v-if="isMobile" size="small" @click="filterDialogVisible = true"
                >筛选</el-button
              >
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
                <el-option
                  v-for="option in suffixOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
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
        <div
          class="list-page-panel list-page-panel--flat list-page-sidebar clip-material-sidebar folder-sidebar-shell"
        >
          <div class="list-page-sidebar__body clip-material-sidebar__body folder-sidebar-body">
            <div
              v-show="!folderTreeCollapsed"
              class="clip-material-sidebar__tree folder-sidebar-tree"
            >
              <FolderTree
                v-model="selectedFolderId"
                width="100%"
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
            class="clip-material-sidebar__toggle folder-sidebar-toggle"
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
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat"
        >
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
                  <TableRowDragHandle />
                </template>

                <template #previewDefaultSlot="{ row }">
                  <div class="table-media-cell table-file-cell p-2">
                    <video
                      v-if="row.url && isVideoFile(row.suffix)"
                      :src="row.url"
                      :alt="row.name || '文件资源'"
                      class="table-file-cell__video"
                      @click="openFilePreview(row)"
                      @error="handleVideoError"
                      controls
                      preload="metadata"
                    />
                    <img
                      v-else-if="row.url && isImageFile(row.suffix)"
                      :src="row.url"
                      :alt="row.name || '图片文件'"
                      class="table-file-cell__image"
                      @click="openFilePreview(row)"
                      @error="handleImageError"
                    />
                    <div
                      v-else-if="row.url && isAudioFile(row.suffix)"
                      class="table-file-audio-card"
                      @click="openFilePreview(row)"
                    >
                      <div class="table-file-audio-card__meta">
                        <el-icon size="18"><Headset /></el-icon>
                        <span class="table-file-audio-card__title">{{
                          row.name || "音频文件"
                        }}</span>
                        <span class="table-file-audio-card__suffix">{{
                          String(row.suffix || "").toUpperCase()
                        }}</span>
                      </div>
                      <div class="table-file-audio-card__player-wrap" @click.stop>
                        <audio
                          :src="row.url"
                          controls
                          preload="metadata"
                          class="table-file-audio-card__player"
                          @error="handleAudioError"
                        />
                      </div>
                    </div>
                    <div
                      v-else-if="row.url && isPdfFile(row.suffix)"
                      class="table-file-doc-card table-file-doc-card--pdf"
                      @click="openFilePreview(row)"
                    >
                      <el-icon size="24"><Document /></el-icon>
                      <div class="table-file-doc-card__title">{{ row.name || "PDF 文件" }}</div>
                      <div class="table-file-doc-card__tip">点击预览 PDF</div>
                    </div>
                    <div
                      v-else-if="row.url && isTextFile(row.suffix)"
                      class="table-file-doc-card table-file-doc-card--text"
                      @click="openFilePreview(row)"
                    >
                      <el-icon size="24"><Document /></el-icon>
                      <div class="table-file-doc-card__title">{{ row.name || "文本文件" }}</div>
                      <div class="table-file-doc-card__tip">
                        {{ String(row.suffix || "FILE").toUpperCase() }} · 点击预览
                      </div>
                    </div>
                    <div v-else class="table-file-doc-card">
                      <el-icon size="24">
                        <component :is="getFileIcon(row.suffix)" />
                      </el-icon>
                      <div class="table-file-doc-card__title">{{ row.name || "文件资源" }}</div>
                      <div class="table-file-doc-card__tip">
                        {{ String(row.suffix || "FILE").toUpperCase() }}
                      </div>
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
                      <el-button type="primary" link size="small" class="operation-trigger-button"
                        >操作</el-button
                      >
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
                          <el-dropdown-item command="preview" v-if="isPreviewableFile(row.suffix)">
                            <el-icon
                              ><VideoPlay v-if="isVideoFile(row.suffix)" /><Headset
                                v-else-if="isAudioFile(row.suffix)" /><Document
                                v-else-if="isPdfFile(row.suffix) || isTextFile(row.suffix)" /><Picture v-else
                            /></el-icon>
                            <span>预览</span>
                          </el-dropdown-item>
                          <el-dropdown-item v-if="isAdmin" command="copy-to-user">
                            <el-icon><Document /></el-icon>
                            <span>分享给用户</span>
                          </el-dropdown-item>
                          <el-dropdown-item v-if="isAdmin" command="move-to-user">
                            <el-icon><Folder /></el-icon>
                            <span>转移给用户</span>
                          </el-dropdown-item>
                          <!-- toggle public/private removed -->
                          <el-dropdown-item
                            v-if="isAdmin"
                            command="delete"
                            divided
                            class="operation-menu-item--danger"
                          >
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
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat"
        >
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
      title="文件资源上传"
      width="calc(100vw - 32px)"
      top="16px"
      :footer="false"
      :destroy-on-close="true"
      class="clip-material-upload-dialog"
      @close="uploadModalClose"
    >
      <div class="clip-material-upload-dialog__content">
        <clip-material-upload @single-file-uploaded="singleFileUploaded" />
      </div>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑文件资源信息"
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

    <VideoPreview
      :visible="videoPreviewVisible"
      :file-url="currentPreviewUrl"
      :file-name="currentPreviewName"
      :file-suffix="currentPreviewSuffix"
      @close="closeVideoPreview"
    />

    <el-dialog
      v-model="clipMaterialUserTransferDialogVisible"
      :title="clipMaterialUserTransferDialogTitle"
      width="560px"
      align-center
      :close-on-click-modal="false"
      @closed="resetClipMaterialUserTransferDialog"
    >
      <div class="sticker-user-transfer-dialog">
        <el-alert
          :type="clipMaterialUserTransferAction === 'copy' ? 'success' : 'warning'"
          :closable="false"
          show-icon
          :title="
            clipMaterialUserTransferAction === 'copy'
              ? '复制文件资源并分享给目标用户，原资源会保留。'
              : '转移文件资源给目标用户，会变更资源归属并同步调整 COS 路径。'
          "
        />

        <el-form label-width="96px" class="sticker-user-transfer-form">
          <el-form-item label="目标用户" required>
            <el-select
              v-model="clipMaterialUserTransferTargetUserId"
              class="sticker-user-transfer-form__select"
              filterable
              clearable
              :loading="clipMaterialUserTransferUsersLoading"
              placeholder="请选择目标用户"
            >
              <el-option
                v-for="item in clipMaterialUserTransferUserOptions"
                :key="item.id"
                :label="item.label"
                :value="item.id"
              >
                <div class="sticker-user-transfer-option">
                  <div class="sticker-user-transfer-option__main">
                    <span>{{ item.name || item.account || `用户 #${item.id}` }}</span>
                    <el-tag v-if="item.isAdmin" size="small" type="warning">管理员</el-tag>
                  </div>
                  <span class="sticker-user-transfer-option__meta">
                    {{ item.account || `ID ${item.id}` }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="资源数量">
            <el-tag type="info">{{ clipMaterialUserTransferIds.length }}</el-tag>
          </el-form-item>

          <el-form-item label="选中资源">
            <div class="sticker-user-transfer-preview">
              <el-tag
                v-for="item in clipMaterialUserTransferPreviewItems"
                :key="item.id"
                size="small"
                effect="plain"
              >
                {{ item.label }}
              </el-tag>
              <span
                v-if="clipMaterialUserTransferIds.length > clipMaterialUserTransferPreviewItems.length"
                class="sticker-user-transfer-preview__more"
              >
                等 {{ clipMaterialUserTransferIds.length }} 条
              </span>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="clipMaterialUserTransferDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="clipMaterialUserTransferSubmitting"
          @click="submitClipMaterialUserTransfer"
        >
          {{ clipMaterialUserTransferSubmitText }}
        </el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, nextTick, watchEffect } from "vue";

import {
  getFileResourceList,
  deleteFileResource,
  updateFileResource,
  batchMoveFileResource,
  copyFileResourceToUser,
  moveFileResourceToUser,
} from "@/api/file-resource";
import { getUserList } from "@/api/user";

import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";

import { useDebounceFn, useLocalStorage, useWindowSize } from "@vueuse/core";

import { useUserStore } from "@/store/modules/user";
import clipMaterialUpload from "./clip-material-upload.vue";
import VideoPreview from "./VideoPreview.vue";
import FolderTree from "@/components/material/FolderTree.vue";
import TableRowDragHandle from "@/components/TableRowDragHandle/index.vue";
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
} from "@element-plus/icons-vue";
import { downloadFileByElement } from "@/common/download";
import { useFolderRowDrag } from "@/hooks/useFolderRowDrag";
import { FOLDER_FILTER, convertFolderIdToApiParam } from "@/constants/folder";

const userStore = useUserStore();
const FOLDER_CATEGORY = "fileresource";
const suffixOptions = [
  { label: "mp4", value: "mp4" },
  { label: "mov", value: "mov" },
  { label: "mp3", value: "mp3" },
  { label: "wav", value: "wav" },
  { label: "pdf", value: "pdf" },
  { label: "png", value: "png" },
  { label: "jpg", value: "jpg" },
  { label: "webp", value: "webp" },
];

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
    { title: "资源名称", field: "name", minWidth: 180, className: "font-bold" },
    { title: "描述", field: "description", minWidth: 200 },
    { title: "关键词", field: "keywords", minWidth: 160 },
    { title: "后缀", field: "suffix", width: 80 },
    { title: "分类", field: "category", width: 100, slots: { default: "categorySlot" } },
    { title: "标签", field: "tags", minWidth: 150, slots: { default: "tagsSlot" } },
    {
      title: "上传者",
      field: "uploader",
      width: 140,
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
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
type ClipMaterialUserTransferAction = "copy" | "move";
type ClipMaterialUserTransferUserOption = {
  id: string;
  name?: string;
  account?: string;
  label: string;
  isAdmin?: boolean;
};
const clipMaterialUserTransferDialogVisible = ref(false);
const clipMaterialUserTransferSubmitting = ref(false);
const clipMaterialUserTransferUsersLoading = ref(false);
const clipMaterialUserTransferUsersLoaded = ref(false);
const clipMaterialUserTransferAction = ref<ClipMaterialUserTransferAction>("copy");
const clipMaterialUserTransferIds = ref<string[]>([]);
const clipMaterialUserTransferTargetUserId = ref("");
const clipMaterialUserTransferUserOptions = ref<ClipMaterialUserTransferUserOption[]>([]);
const clipMaterialUserTransferDialogTitle = computed(() =>
  clipMaterialUserTransferAction.value === "copy" ? "分享文件资源给用户" : "转移文件资源给用户",
);
const clipMaterialUserTransferSubmitText = computed(() =>
  clipMaterialUserTransferAction.value === "copy" ? "确认分享" : "确认转移",
);
const clipMaterialUserTransferPreviewItems = computed(() =>
  clipMaterialUserTransferIds.value.slice(0, 5).map((id) => {
    const row = dataSource.value.find((item: any) => String(item.id) === String(id));
    return {
      id: String(id),
      label: row?.name || `ID: ${id}`,
    };
  }),
);

const {
  dragState,
  setupRowDrag,
  handleFolderDragOver,
  handleFolderDragLeave,
  resetAfterDrop,
  markExternalFolderDropHandled,
} = useFolderRowDrag({
  gridClass: "clip-material-dnd-grid",
  dataSource,
  selectedIds: ids,
  onDropToFolder: handleFolderDrop,
});

// 上传相关
const uploadModalVisible = ref(false);
const folderTreeCollapsed = useLocalStorage("clip_material_folder_collapsed", false);
const selectedFolderId = ref<string | null>(FOLDER_FILTER.ALL);

function uploadModalClose() {}

async function getList() {
  loading.value = true;
  let res = await getFileResourceList({
    ...queryParams,
    folderId: convertFolderIdToApiParam(queryParams.folderId),
  }).finally(() => {
    loading.value = false;
  });
  dataSource.value = res.list;
  total.value = res.total;
  nextTick(setupRowDrag);
}

function ensureClipMaterialAdminOperation() {
  if (!isAdmin.value) {
    ElMessage.warning("仅管理员可执行该操作");
    return false;
  }
  return true;
}

async function loadClipMaterialTransferUserOptions() {
  if (clipMaterialUserTransferUsersLoaded.value || clipMaterialUserTransferUsersLoading.value) {
    return;
  }

  clipMaterialUserTransferUsersLoading.value = true;
  try {
    const res = await getUserList({
      currentPage: 1,
      pageSize: 1000,
    });
    const list = Array.isArray(res?.list) ? res.list : [];
    clipMaterialUserTransferUserOptions.value = list.map((item: any) => ({
      id: String(item.id),
      name: item.name || "",
      account: item.account || "",
      label: item.name || item.account || `用户 #${item.id}`,
      isAdmin: !!item.isAdmin,
    }));
    clipMaterialUserTransferUsersLoaded.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || "加载用户列表失败");
  } finally {
    clipMaterialUserTransferUsersLoading.value = false;
  }
}

function resetClipMaterialUserTransferDialog() {
  clipMaterialUserTransferSubmitting.value = false;
  clipMaterialUserTransferAction.value = "copy";
  clipMaterialUserTransferIds.value = [];
  clipMaterialUserTransferTargetUserId.value = "";
}

async function openClipMaterialUserTransferDialog(
  action: ClipMaterialUserTransferAction,
  row?: any,
) {
  if (!ensureClipMaterialAdminOperation()) {
    return;
  }

  const targetIds = row
    ? [String(row.id)]
    : (Array.isArray(ids.value) ? ids.value : []).map((id) => String(id)).filter(Boolean);

  if (!targetIds.length) {
    ElMessage.warning("请选择要操作的文件资源");
    return;
  }

  clipMaterialUserTransferAction.value = action;
  clipMaterialUserTransferIds.value = Array.from(new Set(targetIds));
  clipMaterialUserTransferTargetUserId.value = "";
  await loadClipMaterialTransferUserOptions();
  clipMaterialUserTransferDialogVisible.value = true;
}

async function submitClipMaterialUserTransfer() {
  if (!ensureClipMaterialAdminOperation()) {
    return;
  }

  if (!clipMaterialUserTransferIds.value.length) {
    ElMessage.warning("请选择要操作的文件资源");
    return;
  }

  if (!clipMaterialUserTransferTargetUserId.value) {
    ElMessage.warning("请选择目标用户");
    return;
  }

  clipMaterialUserTransferSubmitting.value = true;
  const actionLabel = clipMaterialUserTransferAction.value === "copy" ? "分享" : "转移";

  try {
    const payload = {
      ids: clipMaterialUserTransferIds.value,
      targetUserId: clipMaterialUserTransferTargetUserId.value,
    };
    const res =
      clipMaterialUserTransferAction.value === "copy"
        ? await copyFileResourceToUser(payload)
        : await moveFileResourceToUser(payload);
    const result = res || {};

    const successCount = Array.isArray(result?.list)
      ? result.list.length
      : Number(result?.total || 0);
    const failedCount = Array.isArray(result?.failed) ? result.failed.length : 0;
    const warningCount = Array.isArray(result?.warnings) ? result.warnings.length : 0;

    if (successCount > 0) {
      ElNotification.success(
        `${actionLabel}成功 ${successCount} 条${failedCount ? `，失败 ${failedCount} 条` : ""}${warningCount ? `，警告 ${warningCount} 条` : ""}`,
      );
      clipMaterialUserTransferDialogVisible.value = false;
      resetCheckStatus();
      await getList();
    } else if (failedCount > 0) {
      ElMessage.error(`${actionLabel}失败 ${failedCount} 条`);
    } else {
      ElMessage.warning("未处理任何文件资源，请稍后重试");
    }

    if (failedCount > 0) {
      ElNotification.warning({
        title: `${actionLabel}失败详情`,
        message: result.failed
          .slice(0, 3)
          .map((item: any) => `${item.id}: ${item.message}`)
          .join("；"),
        duration: 6000,
      });
    }

    if (warningCount > 0) {
      ElNotification.warning({
        title: `${actionLabel}完成，但有警告`,
        message: result.warnings
          .slice(0, 3)
          .map((item: any) => `${item.id}: ${item.message}`)
          .join("；"),
        duration: 6000,
      });
    }
  } catch (error: any) {
    ElMessage.error(error?.message || `${actionLabel}失败`);
  } finally {
    clipMaterialUserTransferSubmitting.value = false;
  }
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

  ElMessageBox.confirm("确认删除该文件资源吗", "删除提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "error",
  })
    .then(async () => {
      try {
        console.log("发送删除请求，ID:", delIds);
        const result = await deleteFileResource({ ids: delIds });
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
  markExternalFolderDropHandled();
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
    await batchMoveFileResource({
      ids: movingIds,
      folderId: convertFolderIdToApiParam(targetFolderId) as string | null,
    });
    ElMessage.success(`已移动 ${movingIds.length} 个文件资源到 ${targetPath || "未分类"}`);
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
    await updateFileResource(editForm.value);
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
const currentPreviewUrl = ref("");
const currentPreviewName = ref("");
const currentPreviewSuffix = ref("");

function openFilePreview(row: { url?: string; name?: string; suffix?: string }) {
  currentPreviewUrl.value = row?.url || "";
  currentPreviewName.value = row?.name || "文件资源";
  currentPreviewSuffix.value = row?.suffix || "";
  videoPreviewVisible.value = true;
}

function closeVideoPreview() {
  videoPreviewVisible.value = false;
  currentPreviewUrl.value = "";
  currentPreviewName.value = "";
  currentPreviewSuffix.value = "";
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

function isPdfFile(suffix: string): boolean {
  return normalizeSuffix(suffix) === "pdf";
}

// 判断是否为图片文件
function isImageFile(suffix: string): boolean {
  const imageSuffixes = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff", "tif"];
  return imageSuffixes.includes(normalizeSuffix(suffix));
}

// 判断是否为文本/代码文件
function isTextFile(suffix: string): boolean {
  const textSuffixes = [
    "txt", "md", "json", "xml", "csv", "log",
    "js", "ts", "jsx", "tsx", "vue", "html", "htm", "css", "scss", "less",
    "py", "java", "c", "cpp", "h", "hpp", "cs", "go", "rs", "rb", "php", "sh", "bat",
    "yml", "yaml", "toml", "ini", "cfg", "conf", "env",
    "sql", "graphql", "prisma",
  ];
  return textSuffixes.includes(normalizeSuffix(suffix));
}

function isExcelFile(suffix: string): boolean {
  return ['xls', 'xlsx'].includes(normalizeSuffix(suffix));
}

function isPreviewableFile(suffix: string): boolean {
  return isVideoFile(suffix) || isAudioFile(suffix) || isImageFile(suffix) || isPdfFile(suffix) || isTextFile(suffix) || isExcelFile(suffix);
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
      openFilePreview(row);
      break;
    case "copy-to-user":
      openClipMaterialUserTransferDialog("copy", row);
      break;
    case "move-to-user":
      openClipMaterialUserTransferDialog("move", row);
      break;
    case "delete":
      handleDelete(row);
      break;
    default:
      console.warn("未知的操作命令:", command);
  }
}
</script>

<style lang="less" scoped>
:deep(.clip-material-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.clip-material-page .list-page-layout__body),
:deep(.clip-material-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.clip-material-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.clip-material-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

:deep(.clip-material-upload-dialog) {
  .el-dialog {
    display: flex;
    width: calc(100vw - 32px) !important;
    max-width: calc(100vw - 32px);
    height: calc(100vh - 32px);
    max-height: calc(100vh - 32px);
    flex-direction: column;
    margin: 16px auto !important;
    border-radius: 18px;
    overflow: hidden;
  }

  .el-dialog__header {
    padding: 18px 24px 16px;
    margin-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }

  .el-dialog__body {
    display: flex;
    flex: 1;
    min-height: 0;
    padding: 12px 14px 14px;
    overflow: hidden;
    background: var(--el-bg-color-page);
  }

  .el-dialog__body > div {
    flex: 1;
    min-height: 0;
  }
}

:global(.clip-material-upload-dialog.el-dialog) {
  display: flex;
  width: calc(100vw - 32px) !important;
  max-width: calc(100vw - 32px);
  height: calc(100vh - 32px);
  max-height: calc(100vh - 32px);
  flex-direction: column;
  margin-top: 16px !important;
  margin-bottom: 16px !important;
  border-radius: 18px;
  overflow: hidden;
}

:global(.clip-material-upload-dialog.el-dialog .el-dialog__header) {
  padding: 18px 24px 16px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

:global(.clip-material-upload-dialog.el-dialog .el-dialog__body) {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 12px 14px 14px;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.clip-material-upload-dialog__content {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.clip-material-sidebar {
  position: relative;
  min-height: 100%;
}

.clip-material-sidebar__body {
  min-height: 0;
  padding: 0;
}

.clip-material-sidebar__tree {
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.table-file-cell {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.table-file-cell__video,
.table-file-cell__image {
  display: block;
  width: 180px;
  max-width: 180px;
  max-height: 120px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
  object-fit: contain;
  cursor: pointer;
}

.table-file-audio-card,
.table-file-doc-card {
  min-height: 120px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-blank);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.table-file-audio-card {
  width: min(100%, 320px);
  min-height: 128px;
  padding: 14px 16px;
  box-sizing: border-box;
  cursor: pointer;
  background: linear-gradient(
    180deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-fill-color-blank) 100%
  );
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.table-file-audio-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 10px 24px rgba(64, 158, 255, 0.12);
  transform: translateY(-1px);
}

.table-file-audio-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  color: var(--el-text-color-primary);
}

.table-file-audio-card__title,
.table-file-doc-card__title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.table-file-audio-card__suffix {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.table-file-audio-card__player {
  width: calc(100% / 0.92);
  min-width: 0;
  height: 40px;
  display: block;
  transform: scale(0.92);
  transform-origin: left center;
  will-change: transform;
}

.table-file-audio-card__player-wrap {
  width: 100%;
  overflow: hidden;
}

.table-file-audio-card__player::-webkit-media-controls-panel {
  padding-inline: 4px;
}

.table-file-audio-card__player::-webkit-media-controls-current-time-display,
.table-file-audio-card__player::-webkit-media-controls-time-remaining-display {
  font-size: 11px;
  min-width: auto;
}

.table-file-audio-card__player::-webkit-media-controls-timeline {
  margin-inline: 4px;
}

.table-file-doc-card {
  width: 180px;
  align-items: center;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.table-file-doc-card--pdf {
  cursor: pointer;
  background: linear-gradient(
    180deg,
    var(--el-color-danger-light-9) 0%,
    var(--el-fill-color-blank) 100%
  );
}

.table-file-doc-card__tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 1360px) {
  :deep(.clip-material-upload-dialog) {
    .el-dialog__body {
      overflow-y: auto;
      overscroll-behavior: contain;
    }
  }
}

@media (max-width: 1024px) {
  :deep(.clip-material-upload-dialog) {
    .el-dialog {
      width: calc(100vw - 12px) !important;
      max-width: calc(100vw - 12px);
      height: calc(100vh - 12px);
      max-height: calc(100vh - 12px);
      margin: 6px auto !important;
      border-radius: 14px;
    }

    .el-dialog__header {
      padding: 14px 16px;
    }

    .el-dialog__body {
      padding: 12px;
    }
  }

  :global(.clip-material-upload-dialog.el-dialog) {
    width: calc(100vw - 12px) !important;
    max-width: calc(100vw - 12px);
    height: calc(100vh - 12px);
    max-height: calc(100vh - 12px);
    margin-top: 6px !important;
    margin-bottom: 6px !important;
    border-radius: 14px;
  }

  :global(.clip-material-upload-dialog.el-dialog .el-dialog__header) {
    padding: 14px 16px;
  }

  :global(.clip-material-upload-dialog.el-dialog .el-dialog__body) {
    padding: 12px;
  }

  .clip-material-sidebar__body {
    padding: 0;
  }
}
</style>
