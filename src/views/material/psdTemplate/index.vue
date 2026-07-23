<template>
  <ContentWrap :plain="true">
    <ListPageLayout
      class="psd-template-page"
      :sidebar-width="folderTreeCollapsed ? '28px' : '280px'"
    >
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="ID搜索">
                  <el-input
                    v-model="queryParams.id"
                    size="small"
                    clearable
                    placeholder="请输入模板ID"
                    @keyup.enter="getList"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="5">
                <el-form-item label="搜索">
                  <el-input
                    v-model="queryParams.searchKeyword"
                    size="small"
                    clearable
                    placeholder="请输入名称、关键词或描述"
                    @keyup.enter="getList"
                  />
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="4">
                <el-form-item label="排序方式">
                  <el-select v-model="queryParams.sortingFields" size="small" @change="getList">
                    <el-option
                      v-for="item in sortTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--narrow" :xs="24" :sm="12" :md="8" :lg="3">
                <el-form-item label="是否可用">
                  <el-select
                    v-model="queryParams.enabled"
                    size="small"
                    clearable
                    placeholder="全部"
                    @change="getList"
                  >
                    <el-option label="可用" :value="true" />
                    <el-option label="不可用" :value="false" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="12" :lg="5">
                <el-form-item label="适合尺寸">
                  <el-select
                    v-model="queryParams.suitableSizesArray"
                    size="small"
                    clearable
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="请选择适合尺寸"
                    popper-class="psd-size-select-dropdown"
                    @change="handleQuerySuitableSizesChange"
                  >
                    <el-option
                      v-for="config in sizeConfigs"
                      :key="config.key"
                      :label="getFullLabel(config)"
                      :value="config.key"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="12" :lg="5">
                <el-form-item label="抠图支持">
                  <el-select
                    v-model="queryParams.cutoutModesArray"
                    size="small"
                    clearable
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="请选择抠图支持"
                    popper-class="psd-size-select-dropdown"
                    @change="handleQueryCutoutModesChange"
                  >
                    <el-option
                      v-for="item in cutoutModeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="list-page-search-form__actions">
              <el-button
                size="small"
                type="primary"
                @click="getList"
                :icon="Search"
                :loading="loading"
                >搜索</el-button
              >
              <el-button
                size="small"
                type="primary"
                :disabled="single"
                @click="handleAdd"
                :icon="Plus"
              >
                新增
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                :disabled="loading"
                @click="handleDelete(null)"
              >
                批量删除
              </el-button>
              <el-button
                v-if="isAdmin"
                size="small"
                type="success"
                :disabled="!ids.length"
                @click="openPsdTemplateUserTransferDialog('copy')"
              >
                分享给用户 ({{ ids.length }})
              </el-button>
              <el-button
                v-if="isAdmin"
                size="small"
                type="warning"
                :disabled="!ids.length"
                @click="openPsdTemplateUserTransferDialog('move')"
              >
                转移给用户 ({{ ids.length }})
              </el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #sidebar>
        <div
          class="list-page-panel list-page-panel--flat list-page-sidebar psd-template-sidebar folder-sidebar-shell"
        >
          <div class="list-page-sidebar__body folder-sidebar-body">
            <div v-show="!folderTreeCollapsed" class="folder-sidebar-tree">
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
            class="folder-sidebar-toggle"
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
            <div class="content-container" style="flex: 1; min-width: 0; overflow: hidden">
              <!-- 表格展示 -->
              <div class="common-table">
                <vxe-grid
                  class="psd-template-dnd-grid dnd-text-selectable"
                  v-bind="gridOptions"
                  :data="dataSource"
                  :loading="loading"
                  :row-class-name="getRowClassName"
                  @checkbox-change="checkboxChange"
                  @checkbox-all="checkboxAllChange"
                >
                  <template #dragHandleSlot>
                    <TableRowDragHandle />
                  </template>
                  <template #thumbnailSlot="{ row }">
                    <div class="thumbnail-cell">
                      <el-image
                        v-if="row.thumbnail"
                        :src="
                         row.thumbnail || 
                          getPreviewImageUrl(row.thumbnail, {
                            width: 150,
                            height: 150,
                            quality: 80,
                            format: 'webp',
                          })
                        "
                        :preview-src-list="[row.thumbnail]"
                        :initial-index="0"
                        preview-teleported
                        hide-on-click-modal
                        fit="contain"
                        :lazy="true"
                        class="thumbnail-image"
                      />
                      <span v-else class="thumbnail-placeholder">暂无缩略图</span>
                    </div>
                  </template>

                  <template #titleNameDefaultSlot="{ row }">
                    <div v-if="row.titleTemplateId" class="flex items-center gap-2">
                      <span>
                        {{ row.titleName }}
                      </span>
                    </div>
                    <div v-else>
                      <el-button type="danger" @click="handleEdit(row)" link size="small">
                        未选择标题,点击选择
                      </el-button>
                    </div>
                  </template>

                  <template #urlSlot="{ row }">
                    <div class="flex items-center gap-1">
                      <a
                        v-if="row.url"
                        :href="row.url"
                        target="_blank"
                        rel="noopener"
                        class="text-primary"
                      >
                        {{ row.url }}
                      </a>
                      <span v-else class="text-gray-400">无</span>
                    </div>
                  </template>

                  <template #psdInfoSlot="{ row }">
                    <div class="psd-info-cell">
                      <el-button
                        v-if="row.psdTemplateConfig"
                        type="primary"
                        link
                        size="small"
                        @click="handleViewPsdInfo(row)"
                      >
                        <el-icon class="info-icon">
                          <InfoFilled />
                        </el-icon>
                        <span class="info-text">配置</span>
                      </el-button>
                      <span v-else class="text-gray-400 text-xs">无</span>
                    </div>
                  </template>

                  <template #psdFileInfoSlot="{ row }">
                    <div class="psd-info-cell">
                      <el-button
                        v-if="row.psdFileInfo"
                        type="primary"
                        link
                        size="small"
                        @click="handleViewPsdFileInfo(row)"
                      >
                        <el-icon class="info-icon">
                          <InfoFilled />
                        </el-icon>
                        <span class="info-text">文件信息</span>
                      </el-button>
                      <span v-else class="text-gray-400 text-xs">无</span>
                    </div>
                  </template>

                  <template #suitableSizesSlot="{ row }">
                    <div class="suitable-sizes-cell-compact">
                      <template v-if="row.suitableSizes && row.suitableSizes.length > 0">
                        <el-popover placement="top" :width="360" trigger="hover">
                          <template #reference>
                            <span class="size-summary-link">
                              {{
                                (row.suitableSizes || [])
                                  .slice(0, 2)
                                  .map((sizeKey) => getSizeShapeUiConfig(sizeKey)?.label || sizeKey)
                                  .join(" / ")
                              }}
                              <span v-if="row.suitableSizes.length > 2">
                                等{{ row.suitableSizes.length }}个</span
                              >
                            </span>
                          </template>
                          <div class="suitable-sizes-popover">
                            <el-tag
                              v-for="sizeKey in row.suitableSizes"
                              :key="sizeKey"
                              size="small"
                              class="size-tag-mini"
                              :style="{
                                backgroundColor: getSizeShapeUiConfig(sizeKey)?.color + '20',
                                borderColor: getSizeShapeUiConfig(sizeKey)?.color,
                                color: getSizeShapeUiConfig(sizeKey)?.color,
                              }"
                            >
                              {{ getSizeShapeUiConfig(sizeKey)?.label || sizeKey }}
                            </el-tag>
                          </div>
                        </el-popover>
                      </template>
                      <span v-else class="text-gray-400 text-xs">未设置</span>
                    </div>
                  </template>

                  <template #cutoutModesSlot="{ row }">
                    <div class="suitable-sizes-cell-compact">
                      <template v-if="row.cutoutModes && row.cutoutModes.length > 0">
                        <el-tag
                          v-for="mode in row.cutoutModes"
                          :key="mode"
                          size="small"
                          class="size-tag-mini"
                          type="info"
                        >
                          {{ getCutoutModeLabel(mode) }}
                        </el-tag>
                      </template>
                      <span v-else class="text-gray-400 text-xs">未设置</span>
                    </div>
                  </template>

                  <template #pathStatusSlot="{ row }">
                    <el-tag v-if="row.url && row.windowsLocalPath" type="success" size="small"
                      >远程 + 本地</el-tag
                    >
                    <el-tag v-else-if="row.url" type="primary" size="small">远程路径</el-tag>
                    <el-tag v-else-if="row.windowsLocalPath" type="warning" size="small"
                      >本地路径</el-tag
                    >
                    <el-tag v-else type="info" size="small">未提供路径</el-tag>
                  </template>

                  <template #enabledSlot="{ row }">
                    <el-tag v-if="row.enabled" type="success" size="small" effect="dark">
                      可用
                    </el-tag>
                    <el-tag v-else type="info" size="small" effect="plain"> 不可用 </el-tag>
                  </template>

                  <template #operationDefaultSlot="{ row }">
                    <el-dropdown trigger="click" class="operation-dropdown">
                      <el-button type="primary" link size="small" class="operation-trigger-button"
                        >操作</el-button
                      >
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                          <el-dropdown-item @click="handleToggleEnabled(row)">
                            {{ row.enabled ? "设为不可用" : "设为可用" }}
                          </el-dropdown-item>
                          <el-dropdown-item
                            @click="handleAiGenerate(row)"
                            :disabled="!row.thumbnail || aiTableLoading[row.id]"
                          >
                            <span v-if="aiTableLoading[row.id]">AI生成中...</span>
                            <span v-else>AI生成内容</span>
                          </el-dropdown-item>
                          <el-dropdown-item
                            :disabled="!row.url"
                            @click="() => downloadFileByElement(row.url, row.name)"
                          >
                            下载源文件
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="isAdmin"
                            @click="() => openPsdTemplateUserTransferDialog('copy', row)"
                          >
                            分享给用户
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="isAdmin"
                            @click="() => openPsdTemplateUserTransferDialog('move', row)"
                          >
                            转移给用户
                          </el-dropdown-item>
                          <el-dropdown-item
                            divided
                            class="dropdown-item-danger"
                            @click="handleDelete(row)"
                          >
                            删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </template>
                </vxe-grid>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #pagination>
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel__pagination list-page-table-panel__pagination--flat"
        >
          <pagination
            :total="total"
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      fullscreen
      :destroy-on-close="false"
      class="psd-template-fullscreen-dialog"
      @close="dialogClose"
    >
      <div class="psd-template-dialog-layout">
        <div class="psd-template-dialog-main">
          <!-- 基础信息区域 - 紧凑排列在上方 -->
          <div class="dialog-section dialog-section-basic">
            <div class="dialog-section-title">基础信息</div>
            <el-form
              :model="form"
              :rules="rules"
              ref="formRef"
              label-width="90px"
              class="psd-template-form"
            >
              <!-- 第一行：模板名称 + 是否可用 -->
              <el-row :gutter="16">
                <el-col :span="16">
                  <el-form-item label="模板名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入模板名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="是否可用">
                    <el-switch
                      v-model="form.enabled"
                      :active-value="true"
                      :inactive-value="false"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 第二行：关键词 + 本地路径 -->
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="关键词" prop="keywords">
                    <el-input
                      v-model="form.keywords"
                      placeholder="多个关键词用逗号分隔"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="本地路径" prop="windowsLocalPath">
                    <el-input
                      v-model="form.windowsLocalPath"
                      placeholder="Windows 本地路径"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 第三行：描述 - 全宽 -->
              <el-row :gutter="16">
                <el-col :span="24">
                  <el-form-item label="描述" prop="description">
                    <el-input
                      v-model="form.description"
                      type="textarea"
                      :rows="3"
                      placeholder="请输入模板描述"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <div class="dialog-section dialog-section-assets">
            <div class="dialog-section-title">文件</div>
            <div class="asset-layout">
              <el-form :model="form" label-width="92px" class="psd-template-form asset-form">
                <el-form-item label="PSD 文件" prop="file" class="asset-form-item">
                  <div class="asset-block">
                    <el-upload
                      class="psd-file-upload"
                      action="#"
                      :limit="1"
                      :file-list="fileList"
                      :on-change="handleFileChange"
                      :before-upload="beforeUpload"
                      :auto-upload="false"
                      :on-remove="handleFileRemove"
                      accept=".psd"
                    >
                      <el-button type="primary">选择文件</el-button>
                      <template #tip>
                        <div class="el-upload__tip">
                          {{ isEdit ? "可选，替换则重新上传" : "可选" }}
                        </div>
                      </template>
                    </el-upload>
                    <div v-if="psdFileInfo" class="asset-file-meta">
                      <div class="asset-file-meta__grid">
                        <div class="asset-file-meta__item asset-file-meta__item--full">
                          <span class="asset-file-meta__label">文件名</span>
                          <span class="asset-file-meta__value">{{ psdFileInfo.name }}</span>
                        </div>
                        <div class="asset-file-meta__item">
                          <span class="asset-file-meta__label">大小</span>
                          <span class="asset-file-meta__value">{{ psdFileInfo.sizeLabel }}</span>
                        </div>
                        <div class="asset-file-meta__item">
                          <span class="asset-file-meta__label">像素尺寸</span>
                          <span class="asset-file-meta__value">{{ psdFileInfo.dimensionsLabel }}</span>
                        </div>
                        <div class="asset-file-meta__item">
                          <span class="asset-file-meta__label">格式</span>
                          <span class="asset-file-meta__value">{{ psdFileInfo.formatLabel }}</span>
                        </div>
                        <div class="asset-file-meta__item">
                          <span class="asset-file-meta__label">颜色模式</span>
                          <span class="asset-file-meta__value">{{ psdFileInfo.colorModeLabel }}</span>
                        </div>
                        <div class="asset-file-meta__item">
                          <span class="asset-file-meta__label">色深 / 通道</span>
                          <span class="asset-file-meta__value">{{ psdFileInfo.depthLabel }} / {{ psdFileInfo.channelLabel }}</span>
                        </div>
                        <div class="asset-file-meta__item">
                          <span class="asset-file-meta__label">修改时间</span>
                          <span class="asset-file-meta__value">{{ psdFileInfo.modifiedAtLabel }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-form-item>

                <el-form-item label="缩略图" class="asset-form-item">
                  <div class="asset-block">
                    <div class="thumbnail-upload-container">
                      <input
                        ref="thumbnailInputRef"
                        type="file"
                        accept="image/*"
                        style="display: none"
                        @change="handleThumbnailFileSelect"
                      />
                      <div
                        v-if="!thumbnailPreviewUrl && !form.thumbnail"
                        class="thumbnail-upload-placeholder"
                        @click="triggerThumbnailSelect"
                      >
                        <el-icon class="upload-icon">
                          <Plus />
                        </el-icon>
                        <div class="upload-text">上传</div>
                      </div>
                      <div v-else class="thumbnail-preview-wrapper">
                        <el-image
                          :src="
                            getPreviewImageUrl(thumbnailPreviewUrl || form.thumbnail, {
                              width: 180,
                              height: 180,
                              quality: 85,
                              format: 'webp',
                            })
                          "
                          fit="contain"
                          :lazy="true"
                          class="thumbnail-preview-image"
                        />
                        <div class="thumbnail-action-buttons">
                          <el-button
                            type="primary"
                            size="small"
                            @click.stop="triggerThumbnailSelect"
                          >
                            <el-icon>
                              <Edit />
                            </el-icon>
                          </el-button>
                          <el-button type="danger" size="small" @click.stop="clearThumbnail">
                            <el-icon>
                              <Delete />
                            </el-icon>
                          </el-button>
                        </div>
                      </div>
                      <div
                        v-if="thumbnailFileInfo"
                        class="asset-file-meta asset-file-meta--thumbnail"
                      >
                        <div class="asset-file-meta__grid">
                          <div class="asset-file-meta__item asset-file-meta__item--full">
                            <span class="asset-file-meta__label">文件名</span>
                            <span class="asset-file-meta__value">{{ thumbnailFileInfo.name }}</span>
                          </div>
                          <div class="asset-file-meta__item">
                            <span class="asset-file-meta__label">类型</span>
                            <span class="asset-file-meta__value">{{ thumbnailFileInfo.typeLabel }}</span>
                          </div>
                          <div class="asset-file-meta__item">
                            <span class="asset-file-meta__label">大小</span>
                            <span class="asset-file-meta__value">{{ thumbnailFileInfo.sizeLabel }}</span>
                          </div>
                          <div class="asset-file-meta__item">
                            <span class="asset-file-meta__label">像素尺寸</span>
                            <span class="asset-file-meta__value">{{ thumbnailFileInfo.dimensionsLabel }}</span>
                          </div>
                          <div class="asset-file-meta__item">
                            <span class="asset-file-meta__label">修改时间</span>
                            <span class="asset-file-meta__value">{{ thumbnailFileInfo.modifiedAtLabel }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>

          <div class="dialog-section dialog-section-sizes">
            <div class="dialog-section-title">适用范围</div>
            <el-form :model="form" label-width="100px" class="psd-template-form">
              <el-form-item label="选择尺寸" prop="suitableSizes">
                <el-select
                  v-model="form.suitableSizesArray"
                  multiple
                  clearable
                  placeholder="请选择适用的图片尺寸"
                  class="size-select"
                  popper-class="psd-size-select-dropdown"
                  teleported
                  :popper-append-to-body="true"
                  @change="handleSuitableSizesChange"
                >
                  <el-option
                    v-for="config in sizeConfigs"
                    :key="config.key"
                    :value="config.key"
                    :label="getFullLabel(config)"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="抠图支持" prop="cutoutModes">
                <el-select
                  v-model="form.cutoutModesArray"
                  multiple
                  clearable
                  placeholder="请选择模板支持的抠图类型"
                  class="size-select"
                  popper-class="psd-size-select-dropdown"
                  @change="handleCutoutModesChange"
                >
                  <el-option
                    v-for="item in cutoutModeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <div class="dialog-section dialog-section-config">
            <div class="dialog-section-title">模板配置</div>
            <el-form :model="form" label-width="90px" class="psd-template-form">
              <el-row :gutter="16">
                <!-- PSD信息 - 较小 -->
                <el-col :span="12">
                  <el-form-item label="PSD信息" prop="psdFileInfo">
                    <el-input
                      v-model="form.psdFileInfoText"
                      type="textarea"
                      :rows="8"
                      :autosize="{ minRows: 8, maxRows: 12 }"
                      placeholder='建议 JSON 格式，如：{"canvas":"2000x2000px","smartObjects":[{"name":"主图","size":"1200x1200px"}],"notes":""}'
                    />
                  </el-form-item>
                </el-col>

                <!-- 配置内容 - 更大，占据更多空间 -->
                <el-col :span="12">
                  <el-form-item prop="psdTemplateConfig">
                    <template #label>
                      <span class="psd-config-label">
                        <span>配置内容</span>
                        <el-tooltip content="查看多图与智能对象匹配教程" placement="top">
                          <el-button
                            link
                            type="primary"
                            class="psd-config-help-button"
                            aria-label="查看配置教程"
                            @click="psdTemplateConfigGuideVisible = true"
                          >
                            <el-icon><InfoFilled /></el-icon>
                          </el-button>
                        </el-tooltip>
                      </span>
                    </template>
                    <el-input
                      v-model="form.psdTemplateConfigText"
                      type="textarea"
                      :rows="16"
                      :autosize="{ minRows: 16, maxRows: 24 }"
                      placeholder='填写 smart_objects 配置；点击“配置内容”旁的信息图标查看教程'
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="psd-template-dialog-footer">
          <div class="footer-right">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitForm" :loading="submitLoading">
              {{ isEdit ? "保存并后台上传" : "创建并后台上传" }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="psdTemplateConfigGuideVisible"
      title="PSD 模板配置教程"
      width="760px"
      append-to-body
      destroy-on-close
      class="psd-config-guide-dialog"
    >
      <div class="psd-config-guide">
        <section class="psd-config-guide__section">
          <h3>匹配方式</h3>
          <p>
            图片按照组图序号依次绑定 <code>smart_objects</code> 配置；
            <code>smart_object_name</code> 用于将该配置匹配到 PSD 中的实际智能对象。
          </p>
          <div class="psd-config-guide__flow">
            <span>组图第 N 张</span>
            <el-icon><DArrowRight /></el-icon>
            <span>配置第 N 项</span>
            <el-icon><DArrowRight /></el-icon>
            <span>指定名称的智能对象</span>
          </div>
        </section>

        <section class="psd-config-guide__section">
          <h3>顺序示例</h3>
          <p>PSD 中有智能对象 <code>a</code>、<code>b</code>、<code>c</code>，需要按以下方式放图：</p>
          <div class="psd-config-guide__mapping">
            <div><strong>第 1 张图</strong><span>智能对象 b</span></div>
            <div><strong>第 2 张图</strong><span>智能对象 c</span></div>
            <div><strong>第 3 张图</strong><span>智能对象 a</span></div>
          </div>
        </section>

        <section class="psd-config-guide__section">
          <h3>配置示例</h3>
          <pre class="psd-config-guide__code"><code>{{ psdTemplateConfigGuideExample }}</code></pre>
          <p class="psd-config-guide__note">
            不需要填写 <code>image_path</code>，制作套图时会按组图顺序自动注入。智能对象名称会先精确匹配，
            再尝试包含匹配；仍未命中时才按 PSD 智能对象发现顺序兜底。
          </p>
        </section>
      </div>

      <template #footer>
        <el-button :icon="DocumentCopy" @click="copyPsdTemplateConfigGuideExample">
          复制示例
        </el-button>
        <el-button type="primary" @click="applyPsdTemplateConfigGuideExample">填入配置</el-button>
        <el-button @click="psdTemplateConfigGuideVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="psdFileInfoDialogVisible"
      title="PSD文件信息"
      fullscreen
      :destroy-on-close="true"
    >
      <div class="psd-info-fullscreen-content">
        <div class="psd-info-header">
          <div class="psd-info-title">
            <span>模板名称：</span>
            <strong>{{ currentPsdFileInfoRow?.name || "未知" }}</strong>
          </div>
        </div>
        <div class="psd-info-body">
          <pre class="psd-info-json-fullscreen">{{
            formatPsdInfo(currentPsdFileInfoRow?.psdFileInfo)
          }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="psdFileInfoDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- AI生成内容弹窗 -->
    <el-dialog
      v-model="aiGenDialogVisible"
      title="AI自动生成内容"
      width="500px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; font-size: 15px; color: #888">
        <span style="font-size: 13px; color: #f56c6c"> 注意：需要模板有缩略图才能进行AI分析 </span>
      </div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="例如：【T恤、男装、短袖】或【儿童地毯、地垫、游戏垫、房间装饰】。重点描述商品名称和相关的类别/兼容性关键词，方便搜索。"
        :autosize="{ minRows: 6, maxRows: 10 }"
        style="width: 100%; min-height: 120px; font-size: 16px; resize: vertical"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <!-- psd模板配置全屏弹窗 -->
    <el-dialog
      v-model="psdInfoDialogVisible"
      title="psd模板配置"
      fullscreen
      :destroy-on-close="true"
    >
      <div class="psd-info-fullscreen-content">
        <div class="psd-info-header">
          <div class="psd-info-title">
            <span>模板名称：</span>
            <strong>{{ currentPsdInfoRow?.name || "未知" }}</strong>
          </div>
        </div>
        <div class="psd-info-body">
          <pre class="psd-info-json-fullscreen">{{
            formatPsdInfo(currentPsdInfoRow?.psdTemplateConfig)
          }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="psdInfoDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </ContentWrap>

  <el-dialog
    v-model="psdTemplateUserTransferDialogVisible"
    :title="psdTemplateUserTransferDialogTitle"
    width="560px"
    align-center
    :close-on-click-modal="false"
    @closed="resetPsdTemplateUserTransferDialog"
  >
    <div class="sticker-user-transfer-dialog">
      <el-alert
        :type="psdTemplateUserTransferAction === 'copy' ? 'success' : 'warning'"
        :closable="false"
        show-icon
        :title="
          psdTemplateUserTransferAction === 'copy'
            ? '复制模板并分享给目标用户，原模板会保留。'
            : '转移模板给目标用户，会变更模板归属并同步调整 COS 路径。'
        "
      />

      <el-form label-width="96px" class="sticker-user-transfer-form">
        <el-form-item label="目标用户" required>
          <el-select
            v-model="psdTemplateUserTransferTargetUserId"
            class="sticker-user-transfer-form__select"
            filterable
            clearable
            :loading="psdTemplateUserTransferUsersLoading"
            placeholder="请选择目标用户"
          >
            <el-option
              v-for="item in psdTemplateUserTransferUserOptions"
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

        <el-form-item label="模板数量">
          <el-tag type="info">{{ psdTemplateUserTransferIds.length }}</el-tag>
        </el-form-item>

        <el-form-item label="选中模板">
          <div class="sticker-user-transfer-preview">
            <el-tag
              v-for="item in psdTemplateUserTransferPreviewItems"
              :key="item.id"
              size="small"
              effect="plain"
            >
              {{ item.label }}
            </el-tag>
            <span
              v-if="psdTemplateUserTransferIds.length > psdTemplateUserTransferPreviewItems.length"
              class="sticker-user-transfer-preview__more"
            >
              等 {{ psdTemplateUserTransferIds.length }} 条
            </span>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="psdTemplateUserTransferDialogVisible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="psdTemplateUserTransferSubmitting"
        @click="submitPsdTemplateUserTransfer"
      >
        {{ psdTemplateUserTransferSubmitText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, watchEffect, nextTick } from "vue";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useUserStore } from "@/store/modules/user";
import { sortTypeOptions, defaultSortingValue } from "@/common/sort";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import FolderTree from "@/components/material/FolderTree.vue";
import TableRowDragHandle from "@/components/TableRowDragHandle/index.vue";
// import { getShopProductCategoryList, deleteShopProductCategory, editShopProductCategory, addShopProductCategory } from "@/api/shop";
import {
  Search,
  Plus,
  Delete,
  Edit,
  InfoFilled,
  DocumentCopy,
  DArrowLeft,
  DArrowRight,
} from "@element-plus/icons-vue";
import { useWindowSize, useLocalStorage } from "@vueuse/core";
import type { VxeGridProps } from "vxe-table";
import { psdTemplateApi } from "@/api/psdTemplate";
import { uploadToCOS } from "@/api/cos";
import { getUserList } from "@/api/user";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { getPreviewImageUrl } from "@/utils/image";
import { downloadFileByElement } from "@/common/download";
import {
  SIZE_SHAPE_UI_CONFIGS as sizeConfigs,
  getFullLabel,
  getSizeShapeUiConfig,
} from "../index/sizeShapeConfig";
import { useFolderRowDrag } from "@/hooks/useFolderRowDrag";
import { FOLDER_FILTER, convertFolderIdToApiParam } from "@/constants/folder";
import { isQueuedAiTaskResult, notifyQueuedAiTask, unwrapAiTaskResult } from "@/utils/aiTask";
import {
  createGlobalUploadTask,
  updateGlobalUploadTask,
  type GlobalUploadTask,
} from "@/services/globalUploadTasks";

const userStore = useUserStore();
const isAdmin = computed(() => userStore.user?.isAdmin ?? false);

const FOLDER_CATEGORY = "psdtemplate";
const cutoutModeOptions = [
  { label: "抠图", value: "CUTOUT" },
  { label: "非抠图", value: "NON_CUTOUT" },
];
const psdTemplateConfigGuideExample = JSON.stringify(
  {
    defaults: {
      resize_mode: "contain",
      tile_size: 512,
    },
    smart_objects: [
      { smart_object_name: "b", resize_mode: "contain" },
      { smart_object_name: "c", resize_mode: "contain" },
      { smart_object_name: "a", resize_mode: "contain" },
    ],
    verbose: true,
  },
  null,
  2,
);

const getCutoutModeLabel = (mode: string) => {
  const map = {
    CUTOUT: "抠图",
    NON_CUTOUT: "非抠图",
  };
  return map[mode] || mode;
};

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  name: "",
  id: "", // ID搜索
  searchKeyword: "", // 搜索关键字（支持名称、关键词、描述）
  enabled: undefined as boolean | undefined, // 是否可用筛选
  suitableSizesArray: [] as string[], // 适合尺寸筛选（多选）
  cutoutModesArray: [] as string[], // 抠图支持筛选（多选）
  folderId: FOLDER_FILTER.ALL as string | null, // 文件夹ID（默认显示全部）
});

const gridOptions = ref<VxeGridProps<any>>({
  ...(commonGridOptions as VxeGridProps<any>),
  maxHeight: null,
  columns: [
    {
      title: "",
      field: "dragHandle",
      width: 40,
      showOverflow: false,
      align: "center",
      slots: {
        default: "dragHandleSlot",
      },
    },
    { type: "checkbox", width: 50, showOverflow: true },
    {
      title: "缩略图",
      field: "thumbnail",
      width: 180,
      showOverflow: false,
      slots: {
        default: "thumbnailSlot",
      },
    },
    { title: "psd模板名称", field: "name", width: 240, showOverflow: true },
    {
      title: "描述",
      field: "description",
      minWidth: 200,
      showOverflow: true,
    },
    {
      title: "关键词",
      field: "keywords",
      minWidth: 150,
      showOverflow: true,
    },
    {
      title: "支持尺寸",
      field: "suitableSizes",
      minWidth: 160,
      showOverflow: true,
      slots: {
        default: "suitableSizesSlot",
      },
    },
    {
      title: "抠图支持",
      field: "cutoutModes",
      minWidth: 180,
      showOverflow: true,
      slots: {
        default: "cutoutModesSlot",
      },
    },
    {
      title: "psd模板配置",
      field: "psdTemplateConfig",
      minWidth: 200,
      showOverflow: true,
      slots: {
        default: "psdInfoSlot",
      },
    },
    {
      title: "PSD文件信息",
      field: "psdFileInfo",
      minWidth: 200,
      showOverflow: true,
      slots: {
        default: "psdFileInfoSlot",
      },
    },
    { title: "ID", field: "id", width: 140, showOverflow: true },
    {
      title: "本地路径",
      field: "windowsLocalPath",
      minWidth: 200,
      showOverflow: true,
    },
    {
      title: "URL",
      field: "url",
      minWidth: 220,
      showOverflow: true,
      slots: {
        default: "urlSlot",
      },
    },
    {
      title: "上传者",
      field: "uploader",
      width: 140,
      showOverflow: true,
      formatter: ({ row }) => row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    {
      title: "文件大小",
      field: "size",
      width: 100,
      showOverflow: true,
      formatter: ({ cellValue }) => {
        if (!cellValue) return "0 B";
        const k = 1024;
        const ns = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(cellValue) / Math.log(k));
        return parseFloat((cellValue / Math.pow(k, i)).toFixed(2)) + " " + ns[i];
      },
    },
    {
      title: "路径状态",
      field: "pathStatus",
      width: 140,
      showOverflow: true,
      slots: {
        default: "pathStatusSlot",
      },
    },
    {
      title: "是否可用",
      field: "enabled",
      width: 100,
      showOverflow: true,
      slots: {
        default: "enabledSlot",
      },
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
    buildOperationColumn("operationDefaultSlot", undefined, {
      showOverflow: false,
    }),
  ],
} as VxeGridProps<any>);

const { height } = useWindowSize();

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 260;
});

const dataSource = ref([]);
const loading = ref(false);
const ids = ref([]);
const single = ref(false);
const total = ref(0);
const formRef = ref();
const dialogTitle = ref("");
const dialogVisible = ref(false);
const isEdit = ref(true);
const submitLoading = ref(false);
type PsdTemplateUserTransferAction = "copy" | "move";
type PsdTemplateUserTransferUserOption = {
  id: string;
  name?: string;
  account?: string;
  label: string;
  isAdmin?: boolean;
};
const psdTemplateUserTransferDialogVisible = ref(false);
const psdTemplateUserTransferSubmitting = ref(false);
const psdTemplateUserTransferUsersLoading = ref(false);
const psdTemplateUserTransferUsersLoaded = ref(false);
const psdTemplateUserTransferAction = ref<PsdTemplateUserTransferAction>("copy");
const psdTemplateUserTransferIds = ref<string[]>([]);
const psdTemplateUserTransferTargetUserId = ref("");
const psdTemplateUserTransferUserOptions = ref<PsdTemplateUserTransferUserOption[]>([]);
const psdTemplateUserTransferDialogTitle = computed(() =>
  psdTemplateUserTransferAction.value === "copy" ? "分享模板给用户" : "转移模板给用户",
);
const psdTemplateUserTransferSubmitText = computed(() =>
  psdTemplateUserTransferAction.value === "copy" ? "确认分享" : "确认转移",
);
const psdTemplateUserTransferPreviewItems = computed(() =>
  psdTemplateUserTransferIds.value.slice(0, 5).map((id) => {
    const row = dataSource.value.find((item: any) => String(item.id) === String(id));
    return {
      id: String(id),
      label: row?.name || `ID: ${id}`,
    };
  }),
);

// 拖拽状态（拖模板 -> 文件夹）
const {
  dragState,
  setupRowDrag,
  handleFolderDragOver,
  handleFolderDragLeave,
  resetAfterDrop,
  markExternalFolderDropHandled,
} = useFolderRowDrag({
  gridClass: "psd-template-dnd-grid",
  dataSource,
  selectedIds: ids,
  onDropToFolder: handleFolderDrop,
});

async function getList() {
  loading.value = true;

  const { suitableSizesArray, cutoutModesArray, ...restQueryParams } = queryParams;

  let params = {
    ...restQueryParams,
    // 转换文件夹ID为后端API参数
    folderId: convertFolderIdToApiParam(queryParams.folderId),
    suitableSizes: suitableSizesArray?.length ? suitableSizesArray.join(",") : undefined,
    cutoutModes: cutoutModesArray?.length ? cutoutModesArray.join(",") : undefined,
  };

  let res = await psdTemplateApi
    .getPsdTemplatePage({
      ...params,
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false;
    });
  // convert suitableSizes field to array for easier handling
  dataSource.value = (res.list || []).map((item) => {
    if (item && typeof item.suitableSizes === "string") {
      try {
        item.suitableSizes = item.suitableSizes ? item.suitableSizes.split(",") : [];
      } catch (e) {
        item.suitableSizes = [];
      }
    }
    if (item && typeof item.cutoutModes === "string") {
      try {
        item.cutoutModes = item.cutoutModes
          ? item.cutoutModes
              .split(",")
              .map((mode) => mode.trim())
              .filter(Boolean)
          : [];
      } catch (e) {
        item.cutoutModes = [];
      }
    }
    return item;
  });
  total.value = res.total;
  ids.value = [];

  // 列表渲染完成后挂载拖拽
  nextTick(setupRowDrag);
}

function ensurePsdTemplateAdminOperation() {
  if (!isAdmin.value) {
    ElMessage.warning("仅管理员可执行该操作");
    return false;
  }
  return true;
}

async function loadPsdTemplateTransferUserOptions() {
  if (psdTemplateUserTransferUsersLoaded.value || psdTemplateUserTransferUsersLoading.value) {
    return;
  }

  psdTemplateUserTransferUsersLoading.value = true;
  try {
    const res = await getUserList({
      currentPage: 1,
      pageSize: 1000,
    });
    const list = Array.isArray(res?.list) ? res.list : [];
    psdTemplateUserTransferUserOptions.value = list.map((item: any) => ({
      id: String(item.id),
      name: item.name || "",
      account: item.account || "",
      label: item.name || item.account || `用户 #${item.id}`,
      isAdmin: !!item.isAdmin,
    }));
    psdTemplateUserTransferUsersLoaded.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || "加载用户列表失败");
  } finally {
    psdTemplateUserTransferUsersLoading.value = false;
  }
}

function resetPsdTemplateUserTransferDialog() {
  psdTemplateUserTransferSubmitting.value = false;
  psdTemplateUserTransferAction.value = "copy";
  psdTemplateUserTransferIds.value = [];
  psdTemplateUserTransferTargetUserId.value = "";
}

async function openPsdTemplateUserTransferDialog(
  action: PsdTemplateUserTransferAction,
  row?: any,
) {
  if (!ensurePsdTemplateAdminOperation()) {
    return;
  }

  const targetIds = row
    ? [String(row.id)]
    : (Array.isArray(ids.value) ? ids.value : []).map((id) => String(id)).filter(Boolean);

  if (!targetIds.length) {
    ElMessage.warning("请选择要操作的模板");
    return;
  }

  psdTemplateUserTransferAction.value = action;
  psdTemplateUserTransferIds.value = Array.from(new Set(targetIds));
  psdTemplateUserTransferTargetUserId.value = "";
  await loadPsdTemplateTransferUserOptions();
  psdTemplateUserTransferDialogVisible.value = true;
}

async function submitPsdTemplateUserTransfer() {
  if (!ensurePsdTemplateAdminOperation()) {
    return;
  }

  if (!psdTemplateUserTransferIds.value.length) {
    ElMessage.warning("请选择要操作的模板");
    return;
  }

  if (!psdTemplateUserTransferTargetUserId.value) {
    ElMessage.warning("请选择目标用户");
    return;
  }

  psdTemplateUserTransferSubmitting.value = true;
  const actionLabel = psdTemplateUserTransferAction.value === "copy" ? "分享" : "转移";

  try {
    const payload = {
      ids: psdTemplateUserTransferIds.value,
      targetUserId: psdTemplateUserTransferTargetUserId.value,
    };
    const res =
      psdTemplateUserTransferAction.value === "copy"
        ? await psdTemplateApi.copyToUser(payload)
        : await psdTemplateApi.moveToUser(payload);
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
      psdTemplateUserTransferDialogVisible.value = false;
      ids.value = [];
      await getList();
    } else if (failedCount > 0) {
      ElMessage.error(`${actionLabel}失败 ${failedCount} 条`);
    } else {
      ElMessage.warning("未处理任何模板，请稍后重试");
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
    psdTemplateUserTransferSubmitting.value = false;
  }
}

getList();

// ============= 文件夹相关 =============
const folderTreeCollapsed = useLocalStorage("psd_template_folder_collapsed", false);
const selectedFolderId = ref<string | null>(FOLDER_FILTER.ALL); // 默认选中"全部"

function handleFolderChange(payload: { folderId: string | null }) {
  // 直接使用传入的 folderId，现在使用明确的常量标识
  queryParams.folderId = payload.folderId || FOLDER_FILTER.ALL;
  queryParams.currentPage = 1;
  getList();
}

async function handleFolderDrop(payload: { data: any }) {
  markExternalFolderDropHandled();
  if (!dragState.draggingIds.length) return;

  // 使用新的常量标识处理目标文件夹ID
  let targetFolderId: string | null = null;
  if (payload.data.id === FOLDER_FILTER.NOT_GROUP) {
    targetFolderId = FOLDER_FILTER.NOT_GROUP; // 拖到未分组
  } else if (payload.data.id === FOLDER_FILTER.ALL) {
    // 不允许拖到"全部"
    ElMessage.warning('不能移动到"全部"');
    resetAfterDrop();
    return;
  } else {
    targetFolderId = payload.data.id; // 普通文件夹
  }

  const targetPath = payload.data.path || "";
  const movingIds = [...dragState.draggingIds];

  try {
    await psdTemplateApi.batchMove({
      ids: movingIds,
      folderId: convertFolderIdToApiParam(targetFolderId),
    });
    ElMessage.success(`已移动 ${movingIds.length} 个模板到 ${targetPath || "未分组"}`);

    // Stay in the current folder, just refresh the list
    await getList();
    ids.value = [];
  } catch (error) {
    ElMessage.error((error as Error).message || "移动失败");
  } finally {
    resetAfterDrop();
  }
}

function handleQuerySuitableSizesChange() {
  queryParams.currentPage = 1;
  getList();
}

function handleQueryCutoutModesChange() {
  queryParams.currentPage = 1;
  getList();
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

  ElMessageBox.confirm("确认删除该数据吗", "删除提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "error",
  })
    .then(async () => {
      console.log("执行删除");
      await psdTemplateApi.deleteShopTemplate({ ids: delIds });
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => {});
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建模板";
  originalPsdSize.value = 0;
  form.value = {
    id: "",
    file: null,
    name: "",
    description: "",
    keywords: "",
    windowsLocalPath: "",
    thumbnail: "",
    thumbnailFile: null,
    psdFileInfo: createDefaultPsdFileInfo(),
    psdFileInfoText: stringifyPsdInfo(createDefaultPsdFileInfo()),
    psdTemplateConfig: createDefaultPsdTemplateConfig(),
    psdTemplateConfigText: stringifyPsdTemplateConfig(createDefaultPsdTemplateConfig()),
    enabled: false, // 默认不可用
    size: 0,
    suitableSizesArray: [],
    cutoutModesArray: [],
  };
  resetSelectedFileState();
  resetThumbnailLocalState();
}

function handleEdit(row) {
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";
  originalPsdSize.value = Number(row.size || 0);

  form.value = {
    ...row,
    enabled: row.enabled !== undefined ? row.enabled : false, // 确保enabled有默认值
    suitableSizesArray: Array.isArray(row.suitableSizes)
      ? row.suitableSizes
      : row.suitableSizes
        ? row.suitableSizes.split(",")
        : [],
    cutoutModesArray: Array.isArray(row.cutoutModes)
      ? row.cutoutModes
      : row.cutoutModes
        ? row.cutoutModes.split(",")
        : [],
  };
  resetSelectedFileState();

  // 处理psdTemplateConfig：如果是对象，转换为JSON字符串显示
  form.value.psdFileInfoText = stringifyPsdInfo(form.value.psdFileInfo || createDefaultPsdFileInfo());

  if (form.value.psdTemplateConfig) {
    try {
      form.value.psdTemplateConfigText =
        typeof form.value.psdTemplateConfig === "string"
          ? form.value.psdTemplateConfig
          : JSON.stringify(form.value.psdTemplateConfig, null, 2);
    } catch (e) {
      form.value.psdTemplateConfigText = "";
    }
  } else {
    form.value.psdTemplateConfigText = "";
  }

  resetThumbnailLocalState();
}

const form = ref<any>({
  id: "",
  file: null,
  name: "",
  description: "",
  keywords: "",
  windowsLocalPath: "",
  thumbnail: "",
  thumbnailFile: null,
  psdFileInfo: null,
  psdFileInfoText: "",
  psdTemplateConfig: null,
  psdTemplateConfigText: "", // 用于表单编辑的文本字段
  enabled: false, // 是否可用，默认不可用
  size: 0,
  cutoutModesArray: [],
});

// AI生成内容相关
const aiGenDialogVisible = ref(false);
const aiGenPrompt = ref("");
const aiDefaultPrompt = `请描述这是什么商品/物品，以及相关的类别关键词。例如：【T恤、男装、短袖】或【儿童地毯、地垫、游戏垫、房间装饰】。重点是商品名称和兼容性关键词和相似商品的关联词，并且尽可能详细一些，方便用户搜索找到。`;
const aiGenDialogLoading = ref(false);
const aiGenRow = ref<any>(null);
const aiTableLoading = ref<Record<string, boolean>>({});

// psd模板配置全屏弹窗相关
const psdInfoDialogVisible = ref(false);
const currentPsdInfoRow = ref<any>(null);
const psdFileInfoDialogVisible = ref(false);
const currentPsdFileInfoRow = ref<any>(null);
const psdTemplateConfigGuideVisible = ref(false);

const rules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  // 描述和关键词改为非必填
  // titleTemplateId: [{ required: true, message: "请选择标题模板", trigger: "blur" }],
  // file: [{ required: true, message: "请选择 PSD 文件", trigger: "blur" }], // PSD 文件改为非必填
};

const dialogClose = () => {
  dialogVisible.value = false;
  psdTemplateConfigGuideVisible.value = false;
  resetSelectedFileState();
  resetThumbnailLocalState();
  submitLoading.value = false;
};

function checkboxChange(e) {
  ids.value = e.records.map((item) => item.id);
}

function checkboxAllChange(e) {
  ids.value = e.records.map((item) => item.id);
}

const buildPsdTemplateSubmitSnapshot = () => {
  let psdFileInfo = null;
  if (form.value.psdFileInfoText && form.value.psdFileInfoText.trim()) {
    psdFileInfo = parsePsdInfoText(form.value.psdFileInfoText);
  }

  let psdTemplateConfig = null;
  if (form.value.psdTemplateConfigText && form.value.psdTemplateConfigText.trim()) {
    psdTemplateConfig = parsePsdInfoText(form.value.psdTemplateConfigText);
  }

  return {
    isEdit: isEdit.value,
    id: form.value.id,
    file: form.value.file as File | null,
    thumbnailFile: form.value.thumbnailFile as File | null,
    name: form.value.name,
    description: form.value.description || "",
    keywords: form.value.keywords || "",
    windowsLocalPath: form.value.windowsLocalPath || "",
    url: form.value.url || "",
    thumbnail: form.value.thumbnail || "",
    psdFileInfo,
    psdTemplateConfig,
    enabled: form.value.enabled !== undefined ? form.value.enabled : false,
    size: form.value.size,
    suitableSizes: form.value.suitableSizesArray ? form.value.suitableSizesArray.join(",") : "",
    cutoutModes: form.value.cutoutModesArray ? form.value.cutoutModesArray.join(",") : "",
    userId: userStore.user?.id,
    userAccount:
      (userStore.user as any)?.account ||
      userStore.user?.shortName ||
      userStore.user?.name ||
      "anonymous",
    uploadUserId: (userStore.user as any)?.id || (userStore as any).userInfo?.id,
  };
};

const runPsdTemplateSaveTask = async (
  task: GlobalUploadTask,
  snapshot: ReturnType<typeof buildPsdTemplateSubmitSnapshot>,
) => {
  try {
    let url = snapshot.url;
    let thumbnail = snapshot.thumbnail;

    if (snapshot.file) {
      updateGlobalUploadTask(task.id, { stage: "正在上传 PSD 文件", progress: 30 });
      const cos = await uploadToCOS({
        file: snapshot.file,
        category: "psd-template",
        account: snapshot.userAccount,
        userId: snapshot.uploadUserId,
        entityId: snapshot.isEdit ? snapshot.id : undefined,
        isThumbnail: false,
      });
      url = cos.url;
    }

    if (snapshot.thumbnailFile) {
      updateGlobalUploadTask(task.id, { stage: "正在上传缩略图", progress: 65 });
      const thumbnailCos = await uploadToCOS({
        file: snapshot.thumbnailFile,
        category: "psd-template",
        account: snapshot.userAccount,
        userId: snapshot.uploadUserId,
        entityId: snapshot.isEdit ? snapshot.id : undefined,
        isThumbnail: true,
      });
      thumbnail = thumbnailCos.url;
    }

    updateGlobalUploadTask(task.id, {
      stage: snapshot.isEdit ? "正在保存模板" : "正在创建模板",
      progress: 85,
    });

    if (snapshot.isEdit) {
      await psdTemplateApi.updatePsdTemplate({
        id: snapshot.id,
        name: snapshot.name,
        description: snapshot.description,
        keywords: snapshot.keywords,
        windowsLocalPath: snapshot.windowsLocalPath,
        url: url || undefined,
        thumbnail: thumbnail || "",
        psdFileInfo: snapshot.psdFileInfo,
        psdTemplateConfig: snapshot.psdTemplateConfig,
        enabled: snapshot.enabled,
        size: snapshot.size,
        suitableSizes: snapshot.suitableSizes,
        cutoutModes: snapshot.cutoutModes,
      });
    } else {
      await psdTemplateApi.createPsdTemplate({
        name: snapshot.name,
        description: snapshot.description,
        keywords: snapshot.keywords,
        windowsLocalPath: snapshot.windowsLocalPath,
        url: url || undefined,
        thumbnail,
        file: null,
        userId: snapshot.userId,
        psdFileInfo: snapshot.psdFileInfo,
        psdTemplateConfig: snapshot.psdTemplateConfig,
        enabled: snapshot.enabled,
        size: snapshot.size,
        suitableSizes: snapshot.suitableSizes,
        cutoutModes: snapshot.cutoutModes,
      });
    }

    updateGlobalUploadTask(task.id, { status: "success", stage: "已完成", progress: 100 });
    ElNotification.success({
      title: snapshot.isEdit ? "PSD模板已更新" : "PSD模板已创建",
      message: snapshot.name || "未命名模板",
      duration: 3500,
    });
    await getList();
  } catch (error: any) {
    const message = error?.message || "操作失败，请重试";
    console.error("PSD模板后台保存失败:", error);
    updateGlobalUploadTask(task.id, { status: "error", stage: message, error: message, progress: 100 });
    ElNotification.error({
      title: "PSD模板上传失败",
      message,
      duration: 6000,
    });
  }
};

const submitForm = async () => {
  submitLoading.value = true;
  try {
    await formRef.value.validate();
    const snapshot = buildPsdTemplateSubmitSnapshot();
    const task = createGlobalUploadTask(snapshot.name, {
      source: "PSD模板",
      stage: "等待上传 PSD 模板",
      progress: 5,
    });

    dialogVisible.value = false;
    ElNotification.info({
      title: "已开始后台上传",
      message: "上传进度会显示在右下角任务面板，可继续操作页面。",
      duration: 4500,
    });
    void runPsdTemplateSaveTask(task, snapshot);
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message || "表单校验失败");
    }
  } finally {
    submitLoading.value = false;
  }
};

/**
 * @psd文件处理
 */

const fileList = ref([]);
const thumbnailInputRef = ref();
const thumbnailPreviewUrl = ref(""); // 新选择的文件预览URL
const originalPsdSize = ref(0);
const psdFileInfo = ref<PsdFileInfo | null>(null);
const thumbnailFileInfo = ref<ImageFileInfo | null>(null);

type PsdFileInfo = {
  name: string;
  size: number;
  width?: number;
  height?: number;
  format: string;
  colorMode?: string;
  depth?: number;
  channels?: number;
  modifiedAt?: number;
  sizeLabel: string;
  dimensionsLabel: string;
  formatLabel: string;
  colorModeLabel: string;
  depthLabel: string;
  channelLabel: string;
  modifiedAtLabel: string;
};

type ImageFileInfo = {
  name: string;
  typeLabel: string;
  sizeLabel: string;
  dimensionsLabel: string;
  modifiedAtLabel: string;
};

const PSD_COLOR_MODE_MAP: Record<number, string> = {
  0: "位图",
  1: "灰度",
  2: "索引颜色",
  3: "RGB",
  4: "CMYK",
  7: "多通道",
  8: "双色调",
  9: "Lab",
};

const formatBytes = (size = 0) => {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let currentSize = size;
  let unitIndex = 0;

  while (currentSize >= 1024 && unitIndex < units.length - 1) {
    currentSize /= 1024;
    unitIndex += 1;
  }

  return `${currentSize.toFixed(currentSize >= 10 || unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

const formatDateTime = (timestamp?: number) => {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString("zh-CN", { hour12: false });
};

const formatDimensions = (width?: number, height?: number) => {
  if (!width || !height) return "—";
  return `${width} × ${height} px`;
};

const getPsdFormatLabel = (file: File, version?: number) => {
  if (version === 2) return "PSB";
  if (version === 1) return "PSD";
  return file.name.toLowerCase().endsWith(".psb") ? "PSB" : "PSD";
};

const clearThumbnailPreviewUrl = () => {
  if (thumbnailPreviewUrl.value) {
    URL.revokeObjectURL(thumbnailPreviewUrl.value);
    thumbnailPreviewUrl.value = "";
  }
};

const resetThumbnailLocalState = () => {
  clearThumbnailPreviewUrl();
  form.value.thumbnailFile = null;
  thumbnailFileInfo.value = null;
  if (thumbnailInputRef.value) {
    thumbnailInputRef.value.value = "";
  }
};

const resetSelectedFileState = () => {
  fileList.value = [];
  form.value.file = null;
  form.value.size = originalPsdSize.value;
  psdFileInfo.value = null;
};

const readPsdHeader = async (file: File) => {
  const headerBuffer = await file.slice(0, 26).arrayBuffer();
  if (headerBuffer.byteLength < 26) {
    throw new Error("文件头不完整");
  }

  const view = new DataView(headerBuffer);
  const signature = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );

  if (signature !== "8BPS") {
    throw new Error("不是有效的 PSD 文件");
  }

  return {
    version: view.getUint16(4, false),
    channels: view.getUint16(12, false),
    height: view.getUint32(14, false),
    width: view.getUint32(18, false),
    depth: view.getUint16(22, false),
    colorMode: view.getUint16(24, false),
  };
};

const buildPsdFileInfo = async (file: File): Promise<PsdFileInfo> => {
  const baseInfo: PsdFileInfo = {
    name: file.name,
    size: file.size,
    format: getPsdFormatLabel(file),
    modifiedAt: file.lastModified,
    sizeLabel: formatBytes(file.size),
    dimensionsLabel: "解析失败",
    formatLabel: getPsdFormatLabel(file),
    colorModeLabel: "解析失败",
    depthLabel: "解析失败",
    channelLabel: "解析失败",
    modifiedAtLabel: formatDateTime(file.lastModified),
  };

  try {
    const header = await readPsdHeader(file);
    return {
      ...baseInfo,
      width: header.width,
      height: header.height,
      format: getPsdFormatLabel(file, header.version),
      colorMode: PSD_COLOR_MODE_MAP[header.colorMode] || `模式 ${header.colorMode}`,
      depth: header.depth,
      channels: header.channels,
      dimensionsLabel: formatDimensions(header.width, header.height),
      formatLabel: getPsdFormatLabel(file, header.version),
      colorModeLabel: PSD_COLOR_MODE_MAP[header.colorMode] || `模式 ${header.colorMode}`,
      depthLabel: `${header.depth} bit`,
      channelLabel: `${header.channels} 通道`,
    };
  } catch (error) {
    return baseInfo;
  }
};

function createDefaultPsdFileInfo(fileInfo?: PsdFileInfo | null) {
  return {
    fileName: fileInfo?.name || "",
    canvas: fileInfo?.width && fileInfo?.height ? `${fileInfo.width}x${fileInfo.height}px` : "",
    colorMode: fileInfo?.colorMode || "",
    smartObjects: [
      {
        name: "",
        size: "",
        notes: "",
      },
    ],
    notes: "",
  };
}

function stringifyPsdInfo(info: any) {
  return JSON.stringify(info, null, 2);
}

const readImageDimensions = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };
    img.onerror = () => reject(new Error("图片尺寸解析失败"));
    img.src = src;
  });

const buildImageFileInfo = async (file: File, previewUrl: string): Promise<ImageFileInfo> => {
  const baseInfo: ImageFileInfo = {
    name: file.name,
    typeLabel: file.type || "未知",
    sizeLabel: formatBytes(file.size),
    dimensionsLabel: "解析失败",
    modifiedAtLabel: formatDateTime(file.lastModified),
  };

  try {
    const dimensions = await readImageDimensions(previewUrl);
    return {
      ...baseInfo,
      dimensionsLabel: formatDimensions(dimensions.width, dimensions.height),
    };
  } catch (error) {
    return baseInfo;
  }
};

// 文件选择改变时的回调
const handleFileChange = async (file, files) => {
  const rawFile = file?.raw as File | undefined;
  fileList.value = files; // 更新文件列表

  if (!rawFile) {
    psdFileInfo.value = null;
    return;
  }

  form.value.name = file.name;
  form.value.file = rawFile; // 将文件绑定到表单数据
  form.value.size = rawFile.size; // 记录文件大小

  const nextInfo = await buildPsdFileInfo(rawFile);
  if (form.value.file === rawFile) {
    psdFileInfo.value = nextInfo;
    form.value.psdFileInfo = createDefaultPsdFileInfo(nextInfo);
    form.value.psdFileInfoText = stringifyPsdInfo(form.value.psdFileInfo);
  }
};

// 文件移除时的回调
const handleFileRemove = () => {
  resetSelectedFileState();
};

// 文件上传前的校验
const beforeUpload = () => {};

// 触发缩略图文件选择
const triggerThumbnailSelect = () => {
  thumbnailInputRef.value?.click();
};

// 缩略图文件选择处理
const handleThumbnailFileSelect = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // 校验文件类型
  if (!file.type.startsWith("image/")) {
    ElMessage.error("只能上传图片文件!");
    event.target.value = ""; // 清空选择
    return;
  }

  // 限制缩略图大小为 10MB
  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    ElMessage.error("缩略图大小不能超过 10MB!");
    event.target.value = "";
    return;
  }

  // 创建预览URL
  clearThumbnailPreviewUrl();
  const previewUrl = URL.createObjectURL(file);
  thumbnailPreviewUrl.value = previewUrl;
  form.value.thumbnailFile = file;

  const nextInfo = await buildImageFileInfo(file, previewUrl);
  if (form.value.thumbnailFile === file) {
    thumbnailFileInfo.value = nextInfo;
  }

  // 清空input，允许重复选择同一文件
  event.target.value = "";
};

// 清除缩略图
const clearThumbnail = () => {
  resetThumbnailLocalState();
  form.value.thumbnail = "";
};

// AI生成内容相关方法
function handleAiGenerate(row) {
  if (aiTableLoading.value[row.id]) return;
  if (!row.thumbnail) {
    ElMessage.warning("该模板没有缩略图，无法进行AI分析");
    return;
  }
  aiGenRow.value = row;
  aiGenPrompt.value = aiDefaultPrompt;
  aiGenDialogVisible.value = true;
}

async function submitAiGenDialog() {
  if (!aiGenRow.value) return;
  aiGenDialogLoading.value = true;
  aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.value.id]: true };
  try {
    await handleAiAutoGenerate(
      aiGenRow.value,
      () => {
        aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.value.id]: false };
        aiGenDialogLoading.value = false;
        aiGenDialogVisible.value = false;
        aiGenRow.value = null;
      },
      aiGenPrompt.value,
    );
  } catch (e) {
    aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.value.id]: false };
    aiGenDialogLoading.value = false;
    aiGenDialogVisible.value = false;
    aiGenRow.value = null;
  }
}

async function handleAiAutoGenerate(row, cb, prompt) {
  try {
    // 调用PSD模板的AI补全接口
    const res = await psdTemplateApi.aiCompleteContent(row.id, prompt || "");
    const resultData = unwrapAiTaskResult(res);

    if (isQueuedAiTaskResult(resultData)) {
      notifyQueuedAiTask(resultData);
      if (typeof cb === "function") cb();
      return;
    }

    // 更新行数据
    if (resultData) {
      row.name = resultData.name || row.name;
      row.description = resultData.description || row.description;
      row.keywords = resultData.keywords || row.keywords;
    }

    ElMessage.success("AI自动生成内容成功");
    if (typeof cb === "function") cb();
    getList();
  } catch (e) {
    ElMessage.error("AI自动生成内容失败");
    if (typeof cb === "function") cb();
  }
}

// 解析psd模板配置文本（支持JSON和JS对象格式）
function parsePsdInfoText(text: string): any {
  if (!text || !text.trim()) return null;

  const trimmedText = text.trim();

  // 先尝试 JSON.parse（标准JSON格式）
  try {
    return JSON.parse(trimmedText);
  } catch (e) {
    // 如果 JSON.parse 失败，尝试解析 JavaScript 对象格式
    try {
      // 使用 new Function 安全地解析 JavaScript 对象格式
      // 例如：{images: [], description: ""} 或 {images:[],description:""}
      const func = new Function("return " + trimmedText);
      const result = func();
      // 验证返回的是对象
      if (typeof result === "object" && result !== null) {
        return result;
      }
      throw new Error("解析结果不是对象");
    } catch (e2) {
      throw new Error(
        '格式错误：请输入有效的JSON格式（如：{"images": []}）或JavaScript对象格式（如：{images: []}）',
      );
    }
  }
}

function createDefaultPsdTemplateConfig() {
  return {
    psd_path: "",
    smart_objects: [
      {
        image_path: "",
        resize_mode: "contain",
        background_image_path: "",
        tile_size: 512,
      },
    ],
    verbose: true,
  };
}

function stringifyPsdTemplateConfig(config: any) {
  return JSON.stringify(config, null, 2);
}

async function copyPsdTemplateConfigGuideExample() {
  try {
    await navigator.clipboard.writeText(psdTemplateConfigGuideExample);
    ElMessage.success("配置示例已复制");
  } catch {
    ElMessage.error("复制失败");
  }
}

async function applyPsdTemplateConfigGuideExample() {
  const currentText = String(form.value.psdTemplateConfigText || "").trim();
  const defaultText = stringifyPsdTemplateConfig(createDefaultPsdTemplateConfig()).trim();
  if (
    currentText &&
    currentText !== defaultText &&
    currentText !== psdTemplateConfigGuideExample.trim()
  ) {
    try {
      await ElMessageBox.confirm("填入示例会覆盖当前配置内容，是否继续？", "覆盖配置", {
        confirmButtonText: "继续",
        cancelButtonText: "取消",
        type: "warning",
      });
    } catch {
      return;
    }
  }

  form.value.psdTemplateConfigText = psdTemplateConfigGuideExample;
  psdTemplateConfigGuideVisible.value = false;
  ElMessage.success("示例已填入配置内容");
}

// 查看psd模板配置
function handleViewPsdInfo(row: any) {
  currentPsdInfoRow.value = row;
  psdInfoDialogVisible.value = true;
}

function handleViewPsdFileInfo(row: any) {
  currentPsdFileInfoRow.value = row;
  psdFileInfoDialogVisible.value = true;
}

// 格式化psd模板配置显示（支持后端返回的新数据结构）
function formatPsdInfo(psdInfo: any): string {
  if (!psdInfo) return "无";

  try {
    // 如果是字符串，尝试解析
    let info = typeof psdInfo === "string" ? JSON.parse(psdInfo) : psdInfo;

    // 确保处理后端返回的新数据结构（包含 artboards, smart_objects 等）
    // 如果已经是对象，直接使用；如果是字符串，解析后使用
    if (typeof info === "object" && info !== null) {
      // 格式化为可读的JSON字符串
      return JSON.stringify(info, null, 2);
    }

    // 如果解析失败，直接返回字符串
    return String(psdInfo);
  } catch (e) {
    // 如果解析失败，直接返回字符串
    return String(psdInfo);
  }
}

// 获取行样式类名
function getRowClassName({ row }) {
  let className = row.enabled ? "row-enabled" : "row-disabled";
  if (dragState.dragging && dragState.draggingIds.includes(String(row.id))) {
    className += " is-dragging-row";
  }
  return className;
}

// 处理切换是否可用状态
async function handleToggleEnabled(row: any) {
  const newEnabled = !row.enabled;
  try {
    await psdTemplateApi.updatePsdTemplate({
      id: row.id,
      name: row.name,
      description: row.description || "",
      keywords: row.keywords || "",
      windowsLocalPath: row.windowsLocalPath || "",
      url: row.url || undefined,
      thumbnail: row.thumbnail || "",
      psdFileInfo: row.psdFileInfo,
      psdTemplateConfig: row.psdTemplateConfig,
      enabled: newEnabled,
    });
    row.enabled = newEnabled;
    ElMessage.success(newEnabled ? "已设为可用" : "已设为不可用");
  } catch (e) {
    ElMessage.error("更新状态失败，请重试");
  }
}

// ============= 适用尺寸相关 =============
// 处理适用尺寸变化
function handleSuitableSizesChange(values: string[]) {
  if (form.value) {
    form.value.suitableSizesArray = values;
  }
}

// 处理抠图支持类型变化
function handleCutoutModesChange(values: string[]) {
  if (form.value) {
    form.value.cutoutModesArray = values;
  }
}

</script>

<style lang="less" scoped>
.psd-template-page {
  gap: 10px;
  padding: 8px 0 0;
}

.psd-template-page .list-page-layout__main {
  gap: 10px;
}

.psd-template-page .list-page-filter--flat {
  gap: 10px;
  padding-bottom: 10px;
}

.psd-template-page .list-page-table-panel__pagination--flat {
  padding-top: 10px;
}

.psd-template-sidebar {
  min-height: 100%;
}

.search-form-container {
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  width: 100%;
  box-sizing: border-box;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  :deep(.form-item) {
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .search-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-left: 0;
    flex-shrink: 0;

    .el-button {
      flex-shrink: 0;
    }
  }

  @media (max-width: 1200px) {
    gap: 10px;
    padding: 10px 16px;

    .search-actions {
      gap: 8px;

      .el-button {
        padding: 8px 12px;
        font-size: 13px;
      }
    }
  }

  @media (max-width: 768px) {
    gap: 8px;
    padding: 10px 12px;
    flex-direction: column;
    align-items: stretch;

    :deep(.form-item) {
      width: 100%;
    }

    .search-actions {
      margin-left: 0;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
  }

  @media (max-width: 480px) {
    gap: 6px;
    padding: 8px 10px;

    :deep(.form-item) {
      width: 100%;
    }

    .search-actions {
      gap: 4px;

      .el-button {
        flex: 1;
        font-size: 12px;
        padding: 6px 8px;
      }
    }
  }
}

.thumbnail-cell {
  display: flex;
  align-items: center;
  padding: 4px;

  .thumbnail-image {
    width: 120px;
    height: auto;
    max-height: 120px;
    min-height: 60px;
    object-fit: contain;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    cursor: pointer;
  }

  .thumbnail-placeholder {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }
}

.psd-template-fullscreen-dialog {
  :deep(.el-dialog) {
    display: flex;
    flex-direction: column;
    height: 100vh;
    margin: 0;
  }

  :deep(.el-dialog__header) {
    padding: 16px 20px 10px;
    margin-right: 0;
  }

  :deep(.el-dialog__body) {
    flex: 1;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }

  :deep(.el-dialog__footer) {
    padding: 10px 20px 14px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.psd-template-dialog-layout {
  height: 100%;
  padding: 0 20px 16px;
  box-sizing: border-box;
}

.psd-template-dialog-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: auto;
}

.dialog-section {
  border-radius: 8px;
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-extra-light);
  min-height: 0;
}

.dialog-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  line-height: 1.2;
}

.dialog-section-basic {
  flex-shrink: 0;
}

.dialog-section-assets {
  flex-shrink: 0;
}

.dialog-section-sizes {
  flex-shrink: 0;
}

.psd-config-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.psd-config-help-button {
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 15px;
}

.psd-config-guide {
  color: var(--el-text-color-regular);
}

.psd-config-guide__section {
  padding: 0 0 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    padding-bottom: 0;
    margin-bottom: 0;
    border-bottom: 0;
  }

  h3 {
    margin: 0 0 8px;
    color: var(--el-text-color-primary);
    font-size: 15px;
    line-height: 1.4;
  }

  p {
    margin: 0 0 10px;
    line-height: 1.7;
  }

  code {
    padding: 1px 4px;
    border-radius: 3px;
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
    font-family: Monaco, Menlo, Consolas, monospace;
  }
}

.psd-config-guide__flow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--el-text-color-primary);
  font-weight: 500;

  .el-icon {
    color: var(--el-text-color-placeholder);
  }
}

.psd-config-guide__mapping {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);

  > div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 10px 12px;
    border-right: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-right: 0;
    }
  }

  span {
    color: var(--el-text-color-secondary);
  }
}

.psd-config-guide__code {
  max-height: 360px;
  padding: 14px;
  margin: 0 0 10px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-extra-light);
  font-family: Monaco, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre;

  code {
    padding: 0;
    color: inherit;
    background: transparent;
  }
}

.psd-config-guide__note {
  margin-bottom: 0 !important;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.dialog-section-config {
  flex: 1;
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.dialog-section-config .psd-template-form {
  flex: 1;
  min-height: 0;
}

.psd-template-form {
  display: flex;
  flex-direction: column;
  gap: 12px;

  :deep(.el-form-item__label) {
    color: var(--el-text-color-secondary);
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__content) {
    min-width: 0;
  }

  :deep(.el-input),
  :deep(.el-select),
  :deep(.el-textarea) {
    width: 100%;
  }

  :deep(.el-row) {
    row-gap: 12px;
  }
}

.asset-layout {
  min-width: 0;
}

.asset-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
}

.asset-form-item {
  margin-bottom: 0 !important;
}

.asset-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;

  .asset-file-meta {
    margin-top: 0;
  }
}

.size-select {
  width: 100%;
}

/* list column tags wrap */

/* 修复支持尺寸插槽高度遮挡问题 */
.suitable-sizes-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-start;
  min-height: 28px;
  max-width: 100%;
  overflow: visible;
  line-height: 1.5;
}

.suitable-sizes-cell .size-tag-mini {
  white-space: normal;
  line-height: 1.4 !important;
  padding: 2px 6px !important;
}

.suitable-sizes-cell-compact {
  display: flex;
  align-items: center;
  min-height: 24px;
}

.size-summary-link {
  display: inline-block;
  max-width: 100%;
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suitable-sizes-popover {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 100%;
}

/* ensure table rows and cells can grow with content, and fix cell clipping */
.psd-template-dnd-grid .vxe-body--row {
  height: auto !important;
  min-height: 32px !important;
}
.psd-template-dnd-grid .vxe-body--cell {
  white-space: normal !important;
  height: auto !important;
  min-height: 28px !important;
  overflow: visible !important;
  vertical-align: top !important;
}

.size-option-simple {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  width: 100%;
}

.size-option-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  min-width: 100px;
}

.size-option-ratio {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.size-option-key {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-family: "Courier New", monospace;
}

// 调整下拉项高度，避免内容被裁切
:deep(.psd-size-select-dropdown) {
  max-height: calc(100vh - 200px) !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

:deep(.el-select-dropdown__wrap) {
  max-height: calc(100vh - 200px) !important;
  overflow-y: auto !important;
}

:deep(.el-select-dropdown__list) {
  max-height: calc(100vh - 200px) !important;
  overflow-y: auto !important;
  padding: 4px 0;
}

:deep(.el-select-dropdown__item) {
  padding: 6px 12px;
  min-height: auto;
  height: auto;
  line-height: 1.4;
  display: flex;
  align-items: center;
  position: relative;
}

:deep(.el-select-dropdown__item:hover) {
  background-color: var(--el-fill-color-light);
}

.psd-template-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}

.psd-template-dialog-footer .footer-right {
  display: flex;
  gap: 8px;
}

@media (max-width: 1200px) {
  .psd-template-dialog-layout {
    height: auto;
    padding: 0 16px 16px;
  }

  .psd-template-dialog-main {
    height: auto;
  }

  .psd-config-guide__mapping {
    grid-template-columns: 1fr;

    > div {
      border-right: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: 0;
      }
    }
  }
}

// 行样式区分是否可用
:deep(.row-disabled) {
  background-color: var(--el-fill-color-lighter) !important;
  opacity: 0.4;

  &:hover {
    background-color: var(--el-fill-color-light) !important;
    opacity: 0.55;
  }
}

.psd-info-cell {
  display: flex;
  align-items: center;

  .info-icon {
    font-size: 14px;
    margin-right: 4px;
  }

  .info-text {
    line-height: 1;
  }
}

.psd-info-fullscreen-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);

  .psd-info-header {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color);
    background: var(--el-fill-color-lighter);

    .psd-info-title {
      font-size: 16px;
      color: var(--el-text-color-primary);

      strong {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }
  }

  .psd-info-body {
    flex: 1;
    overflow: auto;
    padding: 20px;
    background: var(--el-bg-color);
  }

  .psd-info-json-fullscreen {
    margin: 0;
    padding: 20px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.8;
    color: var(--el-text-color-primary);
    white-space: pre-wrap;
    word-break: break-all;
    font-family: "Courier New", "Consolas", "Monaco", monospace;
    border: 1px solid var(--el-border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    max-width: 100%;
    overflow-x: auto;
  }
}

.asset-file-meta {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 8px;

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 12px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__item--full {
    grid-column: 1 / -1;
  }

  &__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__value {
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    word-break: break-word;
  }
}

.thumbnail-upload-container {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;

  .thumbnail-upload-placeholder {
    width: 120px;
    height: 120px;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    padding: 8px;
    box-sizing: border-box;

    &:hover {
      border-color: var(--el-color-primary);
    }

    .upload-icon {
      font-size: 28px;
      color: var(--el-text-color-placeholder);
      margin-bottom: 8px;
      flex-shrink: 0;
    }

    .upload-text {
      font-size: 14px;
      color: var(--el-text-color-regular);
      margin-bottom: 4px;
      text-align: center;
      line-height: 1.4;
      word-break: break-word;
      width: 100%;
    }

    .upload-tip {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      text-align: center;
      line-height: 1.4;
      word-break: break-word;
      width: 100%;
    }
  }

  .thumbnail-preview-wrapper {
    width: 120px;
    min-height: 120px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .thumbnail-preview-image {
      width: 120px;
      height: auto;
      object-fit: contain;
    }

    .thumbnail-action-buttons {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 4px;
      padding: 4px;
      background: rgba(0, 0, 0, 0.4);

      .el-button {
        padding: 4px 8px;
        font-size: 12px;

        .el-icon {
          font-size: 12px;
        }
      }
    }
  }

  .asset-file-meta--thumbnail {
    flex: 1;
    min-width: min(260px, 100%);
    margin-top: 0;
  }
}

@media (max-width: 768px) {
  .asset-file-meta {
    &__grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .thumbnail-upload-container {
    flex-direction: column;
  }
}
</style>
