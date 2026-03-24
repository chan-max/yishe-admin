<template>
  <ContentWrap class="psd-set-page">
    <div class="flex pb-4 flex-wrap justify-end gap-4 items-center search-bar">
      <div style="flex: 1"></div>
      <form-item label="ID">
        <el-input
          v-model="queryParams.id"
          placeholder="套图ID"
          style="width: 200px"
          clearable
          @change="handleIdChange"
        />
      </form-item>
      <form-item label="关键词">
        <el-input
          v-model="queryParams.keyword"
          placeholder="名称/描述/关键词"
          style="width: 200px"
          clearable
          @change="handleKeywordChange"
        />
      </form-item>
      <form-item label="状态">
        <el-select
          v-model="queryParams.status"
          placeholder="全部状态"
          style="width: 160px"
          clearable
          @change="getList"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </form-item>
      <form-item label="排序方式">
        <el-select v-model="queryParams.sortingFields" style="width: 160px" @change="getList">
          <el-option
            v-for="item in sortTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </form-item>
      <form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 360px"
          :shortcuts="dateShortcuts"
          @change="handleDateRangeChange"
        />
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
      <div class="flex items-center" style="margin-left: auto">
        <el-dropdown trigger="click" :disabled="!selectedIds.length" style="margin-right: 8px">
          <el-button plain :disabled="!selectedIds.length" :loading="batchUpdatingStatus">
            批量改状态 ({{ selectedIds.length }})
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="() => handleBatchUpdateStatus('pending')">
                待制作
              </el-dropdown-item>
              <el-dropdown-item @click="() => handleBatchUpdateStatus('processing')">
                制作中
              </el-dropdown-item>
              <el-dropdown-item @click="() => handleBatchUpdateStatus('completed')">
                已完成
              </el-dropdown-item>
              <el-dropdown-item @click="() => handleBatchUpdateStatus('failed')">
                失败
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          type="success"
          plain
          :disabled="!selectedIds.length"
          :loading="batchGeneratingProducts"
          @click="handleBatchGenerateProduct"
        >
          生成产品 ({{ selectedIds.length }})
        </el-button>
        <el-button
          type="primary"
          plain
          :disabled="!selectedIds.length"
          :loading="publishConfigSubmitting"
          @click="handleBatchCreatePublishTask"
        >
          生成发布任务 ({{ selectedIds.length }})
        </el-button>
        <el-button type="danger" plain @click="handleBatchDelete" :disabled="!selectedIds.length">
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="onSelectionChange"
        @checkbox-all="onSelectionChange"
      >
        <template #idSlot="{ row }">
          <div class="flex items-center gap-2 cursor-pointer group" @click="copyId(row.id)">
            <span class="text-sm">{{ row.id }}</span>
            <el-icon class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <DocumentCopy />
            </el-icon>
          </div>
        </template>
        <template #stickersCountSlot="{ row }">
          <div class="flex items-center gap-2">
            <el-tag
              :type="getStickersCount(row) > 1 ? 'success' : 'info'"
              size="small"
              effect="plain"
              class="material-association-tag"
            >
              <span class="tag-text">{{
                getStickersCount(row) === 1 ? "单素材" : `多素材(${getStickersCount(row)})`
              }}</span>
            </el-tag>
          </div>
        </template>
        <template #statusSlot="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="plain" size="small">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
        <template #imagesSlot="{ row }">
          <div class="flex items-start">
            <div class="flex flex-col items-center w-40">
              <el-carousel
                v-if="row.images && row.images.length > 0"
                :interval="3000"
                height="100px"
                indicator-position="none"
                :arrow="row.images.length > 1 ? 'always' : 'never'"
                class="w-full custom-carousel"
              >
                <el-carousel-item v-for="(url, index) in row.images" :key="index">
                  <el-image
                    :src="url"
                    :preview-src-list="row.images"
                    :initial-index="index"
                    :preview-teleported="true"
                    :hide-on-click-modal="false"
                    :lazy="true"
                    loading="lazy"
                    class="w-full h-full object-contain rounded cursor-pointer"
                    fit="contain"
                  />
                  <div
                    class="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl"
                  >
                    {{ Number(index) + 1 }}/{{ row.images.length }}
                  </div>
                </el-carousel-item>
              </el-carousel>

              <span v-else class="text-gray-400 text-xs">无</span>

              <el-tooltip
                v-if="row.images && row.images.length > 0"
                content="批量下载该套图的所有图片"
                placement="top"
              >
                <el-button
                  type="primary"
                  link
                  size="small"
                  class="!text-[11px] !px-0 !h-auto mt-1"
                  @click.stop="handleDownloadPsdSetImages(row)"
                >
                  全部下载
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </template>
        <template #configSlot="{ row }">
          <div class="flex items-center gap-2">
            <el-tag
              v-if="row.stickerPsdSetConfig"
              type="info"
              size="small"
              effect="plain"
              class="cursor-pointer"
              @click="() => handleViewConfig(row)"
            >
              已配置
            </el-tag>
            <span v-else class="text-gray-400 text-xs">未配置</span>
          </div>
        </template>
        <!-- 关联信息插槽：合并显示贴纸详情和PSD模板详情 -->
        <template #operationSlot="{ row }">
          <el-dropdown trigger="click" class="operation-dropdown">
            <el-button type="primary" link size="small">
              操作<el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </el-button>
            <template #dropdown>
              <div class="op-menu">
                <div class="op-menu-item" @click="() => handleViewDetail(row)">
                  <span class="op-menu-label">查看详情</span>
                </div>

                <div class="op-menu-item" @click="() => handleEditConfigDirectly(row)">
                  <span class="op-menu-label">编辑配置</span>
                </div>

                <div class="op-divider"></div>

                <el-tooltip
                  content="需要客户端连接"
                  placement="right"
                  :disabled="isClientConnected || startingProductionId === row.id"
                >
                  <div
                    class="op-menu-item"
                    @click="() => handleStartProduction(row)"
                    :class="{
                      'is-disabled': !isClientConnected || startingProductionId === row.id,
                    }"
                  >
                    <span class="op-menu-label">开始制作</span>
                  </div>
                </el-tooltip>

                <div class="op-divider"></div>

                <div class="op-menu-section">
                  <div class="op-menu-section-title">状态标记</div>
                  <div class="op-menu-item" @click="() => updateRowStatus(row, 'pending')">
                    <span class="op-menu-label">待制作</span>
                  </div>
                  <div class="op-menu-item" @click="() => updateRowStatus(row, 'processing')">
                    <span class="op-menu-label">制作中</span>
                  </div>
                  <div class="op-menu-item" @click="() => updateRowStatus(row, 'completed')">
                    <span class="op-menu-label">已完成</span>
                  </div>
                  <div class="op-menu-item" @click="() => updateRowStatus(row, 'failed')">
                    <span class="op-menu-label">失败</span>
                  </div>
                </div>

                <div class="op-divider"></div>

                <div
                  class="op-menu-item"
                  @click="() => handleToProduct(row)"
                  :class="{ 'is-disabled': generatingProductId === row.id }"
                >
                  <span class="op-menu-label">生成产品</span>
                </div>
                <div class="op-menu-item" @click="() => handleCreatePublishTask(row)">
                  <span class="op-menu-label">生成发布任务</span>
                </div>
                <div class="op-menu-item" @click="() => handleViewPublishTasks(row)">
                  <span class="op-menu-label">查看发布任务</span>
                </div>

                <div class="op-divider"></div>

                <div class="op-menu-item danger" @click="() => handleDelete(row)">
                  <span class="op-menu-label">删除</span>
                </div>
              </div>
            </template>
          </el-dropdown>
        </template>
      </vxe-grid>
    </div>

    <el-dialog
      v-model="detailDialogVisible"
      fullscreen
      :show-close="true"
      :destroy-on-close="false"
      class="psd-set-detail-dialog"
      @closed="handleCloseDetailDialog"
    >
      <template #header>
        <div class="psd-set-detail-header">
          <div>
            <div class="psd-set-detail-title">{{ detailData?.name || "套图详情" }}</div>
            <div class="psd-set-detail-subtitle">查看套图结果、来源素材、模板、配置与元信息</div>
          </div>
          <div class="psd-set-detail-header__tags" v-if="detailData">
            <el-tag :type="statusTagType(detailData.status)" effect="plain">{{
              statusLabel(detailData.status)
            }}</el-tag>
            <el-tag type="info" effect="plain">图片 {{ detailImages.length }}</el-tag>
            <el-tag type="info" effect="plain">素材 {{ detailStickers.length }}</el-tag>
            <el-tag type="warning" effect="plain">自动任务 {{ detailAutomationCount }}</el-tag>
          </div>
        </div>
      </template>

      <div v-loading="detailLoading" class="psd-set-detail-layout" v-if="detailData">
        <div class="psd-set-detail-main">
          <section class="psd-set-detail-panel">
            <div class="detail-header">
              <span class="detail-label">概览</span>
            </div>
            <div class="psd-set-detail-summary">
              <div class="psd-set-detail-summary__item">
                <span class="info-label">套图ID</span>
                <span class="info-value cursor-pointer" @click="copyId(detailData.id)">{{
                  detailData.id || "-"
                }}</span>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">状态</span>
                <el-tag :type="statusTagType(detailData.status)" size="small" effect="plain">
                  {{ statusLabel(detailData.status) }}
                </el-tag>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">上传者</span>
                <span class="info-value">{{
                  detailData?.uploader?.account ||
                  detailData?.uploader?.name ||
                  detailData?.uploaderId ||
                  "-"
                }}</span>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">制作耗时</span>
                <span class="info-value">{{
                  formatProcessingTime(detailData.processingTime)
                }}</span>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatTimestamp(detailData.createTime) }}</span>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">更新时间</span>
                <span class="info-value">{{ formatTimestamp(detailData.updateTime) }}</span>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">发布任务数</span>
                <span class="info-value">{{ detailPublishTaskCount }}</span>
              </div>
              <div class="psd-set-detail-summary__item">
                <span class="info-label">自动动作数</span>
                <span class="info-value">{{ detailAutomationCount }}</span>
              </div>
            </div>
            <div class="psd-set-detail-text-grid">
              <div class="psd-set-detail-text-card">
                <div class="info-label">描述</div>
                <div class="info-value">{{ detailData.description || "-" }}</div>
              </div>
              <div class="psd-set-detail-text-card">
                <div class="info-label">关键词</div>
                <div class="info-value">{{ detailData.keywords || "-" }}</div>
              </div>
              <div class="psd-set-detail-text-card">
                <div class="info-label">状态说明</div>
                <div class="info-value">{{ detailData.statusMessage || "-" }}</div>
              </div>
            </div>
          </section>

          <section class="psd-set-detail-panel">
            <div class="detail-header">
              <span class="detail-label">结果图片</span>
              <span class="text-xs text-gray-500">{{ detailImages.length }} 张</span>
            </div>
            <div class="psd-set-detail-image-grid">
              <div v-for="(img, idx) in detailImages" :key="idx" class="psd-set-detail-image-card">
                <el-image
                  v-if="img"
                  :src="img"
                  :preview-src-list="detailImages"
                  :initial-index="idx"
                  :preview-teleported="true"
                  :hide-on-click-modal="false"
                  class="psd-set-detail-image"
                  fit="contain"
                  loading="lazy"
                />
              </div>
              <span v-if="!detailImages.length" class="text-gray-400 text-sm">无套图图片</span>
            </div>
          </section>

          <section class="psd-set-detail-panel">
            <div class="detail-header">
              <span class="detail-label">素材信息</span>
              <span class="text-xs text-gray-500">{{ detailStickers.length }} 项</span>
            </div>
            <div v-if="detailStickers.length" class="detail-sticker-list">
              <div v-for="sticker in detailStickers" :key="sticker.id" class="detail-sticker-card">
                <el-image
                  v-if="sticker.url"
                  :src="sticker.url"
                  :preview-src-list="detailStickers.map((s) => s.url).filter(Boolean)"
                  :initial-index="detailStickers.findIndex((s) => s.id === sticker.id)"
                  :preview-teleported="true"
                  :hide-on-click-modal="false"
                  fit="contain"
                  class="detail-thumb-image"
                />
                <span v-else class="text-gray-400 text-xs">无图</span>
                <div class="detail-sticker-meta">
                  <div
                    v-if="sticker.id"
                    class="detail-sticker-id cursor-pointer"
                    @click="copyId(sticker.id)"
                  >
                    ID: {{ sticker.id }}
                    <el-icon class="copy-icon"><DocumentCopy /></el-icon>
                  </div>
                  <div class="detail-sticker-name">{{ sticker.name || "未命名贴纸" }}</div>
                  <div class="detail-sticker-desc">{{ sticker.description || "-" }}</div>
                  <div class="detail-sticker-keywords">{{ sticker.keywords || "-" }}</div>
                </div>
              </div>
            </div>
            <span v-else class="text-gray-400 text-sm">无贴纸</span>
          </section>
        </div>

        <aside class="psd-set-detail-side">
          <section class="psd-set-detail-panel">
            <div class="detail-header">
              <span class="detail-label">PSD模板</span>
            </div>
            <div v-if="detailData.psdTemplate" class="psd-set-detail-side-card">
              <el-image
                v-if="detailData.psdTemplate.thumbnail"
                :src="
                  getPreviewImageUrl(detailData.psdTemplate.thumbnail, {
                    width: 360,
                    quality: 80,
                    format: 'webp',
                  })
                "
                :preview-src-list="[detailData.psdTemplate.thumbnail]"
                :preview-teleported="true"
                :hide-on-click-modal="false"
                fit="contain"
                class="psd-set-detail-template-image"
              />
              <div
                class="detail-sticker-id cursor-pointer"
                @click="copyId(detailData.psdTemplate.id)"
              >
                ID: {{ detailData.psdTemplate.id || "-" }}
                <el-icon class="copy-icon"><DocumentCopy /></el-icon>
              </div>
              <div class="detail-sticker-name">
                {{ detailData.psdTemplate.name || "未命名模板" }}
              </div>
              <div class="detail-sticker-desc">{{ detailData.psdTemplate.description || "-" }}</div>
              <div class="psd-set-detail-meta-list">
                <div>
                  <span class="info-label">关键词</span
                  ><span class="info-value">{{ detailData.psdTemplate.keywords || "-" }}</span>
                </div>
                <div>
                  <span class="info-label">云资源</span
                  ><span class="info-value break-all">{{ detailData.psdTemplate.url || "-" }}</span>
                </div>
                <div>
                  <span class="info-label">本地路径</span
                  ><span class="info-value break-all">{{
                    detailData.psdTemplate.windowsLocalPath || "-"
                  }}</span>
                </div>
              </div>
            </div>
            <span v-else class="text-gray-400 text-sm">无模板</span>
          </section>

          <section class="psd-set-detail-panel">
            <div class="detail-header">
              <span class="detail-label">关联概况</span>
            </div>
            <div class="psd-set-detail-meta-list">
              <div>
                <span class="info-label">来源贴纸 ID</span>
                <span class="info-value break-all">{{ detailStickerIdsText }}</span>
              </div>
              <div>
                <span class="info-label">自动动作</span>
                <span class="info-value">{{ detailAutomationText }}</span>
              </div>
              <div>
                <span class="info-label">发布任务</span>
                <span class="info-value">{{
                  detailPublishTaskCount ? `${detailPublishTaskCount} 条` : "暂无"
                }}</span>
              </div>
            </div>
          </section>

          <section class="psd-set-detail-panel">
            <div class="detail-header">
              <span class="detail-label">套图配置</span>
              <el-button
                v-if="detailData?.stickerPsdSetConfig"
                type="info"
                size="small"
                @click="configPreviewMode = !configPreviewMode"
              >
                {{ configPreviewMode ? "收起" : "展开" }}
              </el-button>
            </div>
            <div
              v-if="configPreviewMode && detailData?.stickerPsdSetConfig"
              class="config-preview-container"
            >
              <pre class="config-preview">{{ formattedConfig }}</pre>
            </div>
            <div v-else-if="detailData?.stickerPsdSetConfig" class="config-display">
              <el-tag type="info" size="small">已配置</el-tag>
            </div>
            <span v-else class="text-gray-400 text-sm">未配置</span>
          </section>

          <section class="psd-set-detail-panel">
            <div class="detail-header">
              <span class="detail-label">元信息</span>
            </div>
            <div v-if="detailMetaFormatted" class="config-preview-container">
              <pre class="config-preview">{{ detailMetaFormatted }}</pre>
            </div>
            <span v-else class="text-gray-400 text-sm">无元信息</span>
          </section>
        </aside>
      </div>
    </el-dialog>

    <!-- 编辑配置对话框 -->
    <el-dialog
      v-model="configEditDialogVisible"
      title="编辑配置信息"
      width="60%"
      align-center
      :destroy-on-close="true"
    >
      <div v-loading="configEditDialogLoading" class="config-edit-dialog-content">
        <div v-if="configEditDialogData" class="config-edit-info">
          <div class="config-edit-info-item">
            <span class="config-edit-info-label">套图名称：</span>
            <span class="config-edit-info-value">{{ configEditDialogData.name || "-" }}</span>
          </div>
          <div class="config-edit-info-item">
            <span class="config-edit-info-label">套图ID：</span>
            <span class="config-edit-info-value">{{ configEditDialogData.id || "-" }}</span>
          </div>
        </div>
        <div class="config-editor-container">
          <el-input
            v-model="configEditDialogValue"
            type="textarea"
            :rows="16"
            placeholder='请输入JSON格式的配置信息，例如：&#10;{&#10;  "key1": "value1",&#10;  "key2": "value2"&#10;}'
            class="config-textarea"
            @input="handleConfigInputChange"
          />
          <div v-if="configEditDialogError" class="config-error">
            <el-icon>
              <WarningFilled />
            </el-icon>
            <span>{{ configEditDialogError }}</span>
          </div>
          <div v-else-if="configEditDialogValue.trim()" class="config-success">
            <el-icon>
              <CircleCheck />
            </el-icon>
            <span>JSON格式正确</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleCancelConfigEditDialog">取消</el-button>
        <el-button type="primary" :loading="configEditDialogSaving" @click="handleSaveConfigDialog">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看配置对话框 -->
    <el-dialog
      v-model="configViewDialogVisible"
      title="查看配置信息"
      width="60%"
      align-center
      :destroy-on-close="true"
    >
      <div v-loading="configViewDialogLoading" class="config-view-dialog-content">
        <div v-if="configViewDialogData" class="config-view-info">
          <div class="config-view-info-item">
            <span class="config-view-info-label">套图名称：</span>
            <span class="config-view-info-value">{{ configViewDialogData.name || "-" }}</span>
          </div>
          <div class="config-view-info-item">
            <span class="config-view-info-label">套图ID：</span>
            <span class="config-view-info-value">{{ configViewDialogData.id || "-" }}</span>
          </div>
        </div>
        <div v-if="configViewFormatted" class="config-view-container">
          <pre class="config-view-content">{{ configViewFormatted }}</pre>
        </div>
        <div v-else class="config-view-empty">
          <span class="text-gray-400">未配置</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="configViewDialogVisible = false">关闭</el-button>
        <el-button
          v-if="configViewDialogData?.stickerPsdSetConfig"
          type="primary"
          @click="handleEditFromView"
        >
          编辑配置
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="generateProductDialogVisible"
      fullscreen
      :show-close="true"
      :destroy-on-close="false"
      class="generate-product-dialog"
      @close="handleCloseGenerateProductDialog"
    >
      <template #header>
        <div class="generate-product-dialog-header">
          <div>
            <div class="generate-product-dialog-title">套图生成产品</div>
            <div class="generate-product-dialog-subtitle">
              已选择 {{ generateProductTargetIds.length }} 个套图，配置商品信息生成提示词
            </div>
          </div>
        </div>
      </template>

      <div v-loading="generateProductDialogLoading" class="generate-product-dialog-body">
        <div class="generate-product-panel">
          <div class="generate-product-panel-title">基础配置</div>
          <el-form label-position="top">
            <el-form-item label="AI 提示词">
              <el-select
                v-model="generateProductForm.promptId"
                filterable
                clearable
                placeholder="请选择提示词"
                class="w-full"
              >
                <el-option
                  v-for="item in generateProductPromptOptions"
                  :key="item.id"
                  :label="item.title"
                  :value="item.id"
                >
                  <div class="generate-product-option">
                    <span>{{ item.title }}</span>
                    <span class="generate-product-option-id">#{{ item.id }}</span>
                  </div>
                </el-option>
              </el-select>
              <div class="generate-product-tip">
                用于生成商品的名称、描述、关键词等信息，与发布平台无关。
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <div class="generate-product-dialog-footer">
          <el-button @click="handleCloseGenerateProductDialog">取消</el-button>
          <el-button
            type="primary"
            :loading="generateProductSubmitting"
            @click="handleSubmitGenerateProduct"
          >
            确定生成产品
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="publishConfigDialogVisible"
      fullscreen
      :show-close="true"
      :destroy-on-close="false"
      class="generate-product-dialog publish-config-dialog"
      @close="handleClosePublishConfigDialog"
    >
      <template #header>
        <div class="generate-product-dialog-header">
          <div>
            <div class="generate-product-dialog-title">套图生成发布任务</div>
            <div class="generate-product-dialog-subtitle">
              已选择 {{ publishConfigTargetIds.length }} 个套图，配置要创建的发布任务
            </div>
          </div>
        </div>
      </template>

      <div
        v-loading="publishConfigDialogLoading"
        class="generate-product-dialog-body publish-config-dialog-body"
      >
        <div class="generate-product-panel generate-product-panel--wide publish-config-panel-wrap">
          <div class="publish-config-toolbar">
            <div class="publish-config-toolbar__stats">
              <div class="publish-config-stat-card">
                <div class="publish-config-stat-card__label">目标套图</div>
                <div class="publish-config-stat-card__value">
                  {{ publishConfigTargetIds.length }}
                </div>
              </div>
              <div class="publish-config-stat-card">
                <div class="publish-config-stat-card__label">可选配置</div>
                <div class="publish-config-stat-card__value">
                  {{ filteredPublishConfigs.length }}
                </div>
              </div>
              <div class="publish-config-stat-card">
                <div class="publish-config-stat-card__label">已选配置</div>
                <div class="publish-config-stat-card__value">
                  {{ publishConfigSelectedIds.length }}
                </div>
              </div>
            </div>
            <div class="publish-config-toolbar__actions">
              <el-input
                v-model="publishConfigSearchText"
                placeholder="搜索配置名称或平台..."
                clearable
                @input="publishConfigCurrentPage = 1"
                class="publish-config-search"
              />
              <el-tag v-if="publishConfigSelectedNames.length" type="primary" effect="plain">
                {{ publishConfigSelectedNames.join("、") }}
              </el-tag>
            </div>
          </div>

          <div class="common-table publish-config-grid-wrap">
            <vxe-grid
              v-bind="publishConfigGridOptions"
              :data="publishConfigDataSource"
              @checkbox-change="handlePublishConfigCheckboxChange"
              @checkbox-all="handlePublishConfigCheckboxAllChange"
            />
          </div>

          <div class="publish-config-pagination">
            <el-pagination
              v-model:current-page="publishConfigCurrentPage"
              v-model:page-size="publishConfigPageSize"
              :total="filteredPublishConfigs.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              size="small"
              background
            />
          </div>

          <div class="generate-product-tip publish-config-tip">
            会基于套图图片直接创建发布任务，不再依赖商品。
          </div>
        </div>
      </div>

      <template #footer>
        <div class="generate-product-dialog-footer">
          <el-button @click="handleClosePublishConfigDialog">取消</el-button>
          <el-button
            type="primary"
            :loading="publishConfigSubmitting"
            @click="handleSubmitCreatePublishTask"
          >
            确定生成发布任务
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="publishTasksVisible"
      fullscreen
      :show-close="true"
      :destroy-on-close="false"
      class="publish-task-list-dialog"
    >
      <template #header>
        <div class="generate-product-dialog-header">
          <div>
            <div class="generate-product-dialog-title">套图关联发布任务</div>
            <div class="generate-product-dialog-subtitle">
              当前共 {{ publishTasks.length }} 条任务记录
            </div>
          </div>
        </div>
      </template>

      <div v-loading="publishTasksLoading" class="publish-task-list-body">
        <div class="publish-task-list-toolbar">
          <div class="publish-task-list-toolbar__stats">
            <el-tag type="info" effect="plain">总数 {{ publishTasks.length }}</el-tag>
            <el-tag type="success" effect="plain"
              >完成 {{ publishTaskStatusCount.completed }}</el-tag
            >
            <el-tag type="warning" effect="plain"
              >处理中 {{ publishTaskStatusCount.processing }}</el-tag
            >
            <el-tag type="danger" effect="plain">失败 {{ publishTaskStatusCount.failed }}</el-tag>
          </div>
        </div>

        <el-empty
          v-if="!publishTasksLoading && publishTasks.length === 0"
          description="暂无发布任务"
        />
        <vxe-grid
          v-else
          v-bind="publishTasksGridOptions"
          :data="publishTasks"
          class="publish-task-list-grid"
        >
          <template #taskPlatformSlot="{ row }">
            <el-tag size="small" effect="plain">{{ formatPlatformName(row.platform) }}</el-tag>
          </template>
          <template #taskStatusSlot="{ row }">
            <el-tag :type="getPublishTaskStatusTag(row.status)" size="small">
              {{ getPublishTaskStatusLabel(row.status) }}
            </el-tag>
          </template>
          <template #taskErrorSlot="{ row }">
            <span v-if="row.error" class="publish-task-error">{{ row.error }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </vxe-grid>
      </div>
      <template #footer>
        <el-button @click="publishTasksVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <div class="pagination-container">
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 状态详情对话框已移除；状态说明使用默认单元格文本显示 -->
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watchEffect } from "vue";
import { ContentWrap } from "@/components/ContentWrap";
import { useWindowSize } from "@vueuse/core";
import {
  Search,
  ArrowDown,
  DocumentCopy,
  WarningFilled,
  CircleCheck,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { stickerPsdSetApi } from "@/api/stickerPsdSet";
import { getPromptList } from "@/api/prompt";
import { getPublishConfigListApi, createPublishTaskApi } from "@/api/product/publishConfig";
import request from "@/config/axios";
import { isLocalConnected } from "@/stores/connectionStatus";
import { websocketClient } from "@/services/websocketClient";
import { sortTypeOptions, defaultSortingValue } from "@/common/sort";
import { getPreviewImageUrl } from "@/utils/image";
import { downloadImageEnhanced } from "@/common/download";

const loading = ref(false);
const dataSource = ref<any[]>([]);
const total = ref(0);
const selectedIds = ref<string[]>([]);
const generatingProductId = ref<string>("");
const batchGeneratingProducts = ref(false);
const batchUpdatingStatus = ref(false);
const startingProductionId = ref<string>("");
const generateProductDialogVisible = ref(false);
const generateProductDialogLoading = ref(false);
const generateProductSubmitting = ref(false);
const generateProductTargetIds = ref<string[]>([]);
const generateProductPromptOptions = ref<any[]>([]);
const generateProductForm = reactive({
  promptId: null as number | null,
});
const publishConfigDialogVisible = ref(false);
const publishConfigDialogLoading = ref(false);
const publishConfigSubmitting = ref(false);
const publishConfigOptions = ref<any[]>([]);
const publishConfigSelectedIds = ref<string[]>([]);
const publishConfigTargetIds = ref<string[]>([]);
const publishConfigSearchText = ref("");
const publishConfigCurrentPage = ref(1);
const publishConfigPageSize = ref(10);
const publishTasksVisible = ref(false);
const publishTasksLoading = ref(false);
const publishTasks = ref<any[]>([]);

// 客户端连接状态（参考 header 中的状态检测方式）
const isClientConnected = computed(() => isLocalConnected.value);

const publishPlatformNameMap: Record<string, string> = {
  douyin: "抖音",
  kuaishou: "快手",
  xiaohongshu: "小红书",
  weibo: "微博",
  doudian: "抖店",
  kuaishou_shop: "快手小店",
  xianyu: "闲鱼",
  bilibili: "Bilibili",
  tiktok: "TikTok",
  youtube: "YouTube",
  temu: "Temu",
};

function formatPlatformName(platform?: string) {
  return publishPlatformNameMap[String(platform || "")] || String(platform || "-");
}

function getPublishTaskStatusLabel(status?: string) {
  const map: Record<string, string> = {
    pending: "待处理",
    waiting: "等待中",
    processing: "处理中",
    completed: "已完成",
    failed: "失败",
  };
  return map[String(status || "")] || String(status || "-");
}

function getPublishTaskStatusTag(status?: string) {
  const map: Record<string, "info" | "warning" | "success" | "danger"> = {
    pending: "info",
    waiting: "warning",
    processing: "warning",
    completed: "success",
    failed: "danger",
  };
  return map[String(status || "")] || "info";
}

const filteredPublishConfigs = computed(() => {
  const text = publishConfigSearchText.value.toLowerCase().trim();
  const list = publishConfigOptions.value || [];
  if (!text) {
    return list;
  }
  return list.filter(
    (item: any) =>
      String(item?.name || "")
        .toLowerCase()
        .includes(text) || formatPlatformName(item?.platform).toLowerCase().includes(text),
  );
});

const publishConfigSelectedNames = computed(() =>
  publishConfigSelectedIds.value
    .map((id) => publishConfigOptions.value.find((item: any) => item.id === id)?.name)
    .filter(Boolean),
);

const publishConfigDataSource = computed(() => {
  const start = (publishConfigCurrentPage.value - 1) * publishConfigPageSize.value;
  const end = start + publishConfigPageSize.value;
  return filteredPublishConfigs.value.slice(start, end);
});

const publishConfigGridOptions = computed(() => ({
  ...commonGridOptions,
  height: 520,
  loading: false,
  rowConfig: { isHover: true, keyField: "id" },
  columnConfig: { resizable: true },
  checkboxConfig: {
    checkRowKeys: publishConfigSelectedIds.value,
    highlight: true,
    trigger: "row" as const,
  },
  columns: [
    { type: "checkbox" as any, width: 60, align: "center" as any },
    {
      field: "platform",
      title: "平台",
      width: 140,
      formatter: ({ cellValue }: any) => formatPlatformName(cellValue),
    },
    { field: "name", title: "配置名称", minWidth: 180, showOverflow: true },
    { field: "description", title: "备注说明", minWidth: 220, showOverflow: true },
  ],
}));

const publishTasksGridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: Math.max(height.value - 260, 360),
  rowConfig: { isHover: true, keyField: "id" },
  columnConfig: { resizable: true },
  columns: [
    { field: "id", title: "任务ID", minWidth: 240, showOverflow: true },
    { field: "platform", title: "平台", width: 120, slots: { default: "taskPlatformSlot" } },
    { field: "status", title: "状态", width: 120, slots: { default: "taskStatusSlot" } },
    { field: "description", title: "描述", minWidth: 280, showOverflow: true },
    {
      field: "createdAt",
      title: "创建时间",
      width: 180,
      formatter: ({ cellValue }: any) => formatTimestamp(cellValue),
    },
    {
      field: "updatedAt",
      title: "更新时间",
      width: 180,
      formatter: ({ cellValue }: any) => formatTimestamp(cellValue),
    },
    {
      field: "error",
      title: "错误信息",
      minWidth: 260,
      showOverflow: true,
      slots: { default: "taskErrorSlot" },
    },
  ],
}));

const publishTaskStatusCount = computed(() => {
  const summary = {
    completed: 0,
    processing: 0,
    failed: 0,
  };
  publishTasks.value.forEach((item: any) => {
    if (item?.status === "completed") summary.completed += 1;
    else if (item?.status === "failed") summary.failed += 1;
    else summary.processing += 1;
  });
  return summary;
});

const statusOptions = [
  { label: "待制作", value: "pending" },
  { label: "制作中", value: "processing" },
  { label: "已完成", value: "completed" },
  { label: "失败", value: "failed" },
];

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  id: "",
  keyword: "",
  status: "",
  sortingFields: defaultSortingValue(),
  startTime: "",
  endTime: "",
});

const dateRange = ref<[string, string] | null>(null);

// 日期快捷选项
const dateShortcuts = [
  {
    text: "一个小时内",
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 60 * 60 * 1000);
      return [start, end];
    },
  },
  {
    text: "今天",
    value: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
      return [start, end];
    },
  },
  {
    text: "昨天",
    value: () => {
      const end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
      return [start, end];
    },
  },
  {
    text: "最近三天",
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return [start, end];
    },
  },
  {
    text: "最近一周",
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return [start, end];
    },
  },
  {
    text: "最近一个月",
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return [start, end];
    },
  },
  {
    text: "最近三个月",
    value: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return [start, end];
    },
  },
];

// 处理日期范围选择器变化
function handleDateRangeChange(value: [string, string] | null) {
  if (value && value.length === 2) {
    queryParams.startTime = value[0];
    queryParams.endTime = value[1];
  } else {
    queryParams.startTime = "";
    queryParams.endTime = "";
  }
  getList();
}

const showDetails = ref(false);
const detailDialogVisible = ref(false);
const detailLoading = ref(false);
const detailData = ref<any>(null);
const detailStickers = computed(() => getStickers(detailData.value || {}));
const detailImages = computed(() =>
  Array.isArray(detailData.value?.images) ? detailData.value.images : [],
);
const detailMetaObject = computed(() => {
  const meta = detailData.value?.meta;
  if (!meta) return null;
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta);
    } catch (e) {
      return null;
    }
  }
  return typeof meta === "object" ? meta : null;
});
const detailAutomationList = computed(() => {
  const automations = detailMetaObject.value?.automations;
  return Array.isArray(automations) ? automations : [];
});
const detailAutomationCount = computed(() => detailAutomationList.value.length);
const detailAutomationText = computed(() => {
  if (!detailAutomationList.value.length) return "无";
  return detailAutomationList.value
    .map((item: any) => item?.type || item?.action || item?.kind || "未命名动作")
    .join("、");
});
const detailStickerIdsText = computed(() => {
  const ids = detailStickers.value.map((item: any) => item?.id).filter(Boolean);
  return ids.length ? ids.join("\n") : "-";
});
const detailPublishTaskCount = computed(() => {
  const value =
    detailData.value?.publishTaskCount ??
    detailMetaObject.value?.publishTaskCount ??
    detailMetaObject.value?.publishTasks?.length ??
    0;
  return Number(value) || 0;
});

// 配置信息相关状态
const configPreviewMode = ref(false);

// 编辑配置对话框相关状态
const configEditDialogVisible = ref(false);
const configEditDialogLoading = ref(false);
const configEditDialogData = ref<any>(null);
const configEditDialogValue = ref("");
const configEditDialogError = ref("");
const configEditDialogSaving = ref(false);
let configValidateTimer: ReturnType<typeof setTimeout> | null = null;

// 查看配置对话框相关状态
const configViewDialogVisible = ref(false);
const configViewDialogLoading = ref(false);
const configViewDialogData = ref<any>(null);
const configViewFormatted = computed(() => {
  const config = configViewDialogData.value?.stickerPsdSetConfig;
  if (!config) return "";
  try {
    const parsed = typeof config === "string" ? JSON.parse(config) : config;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return String(config);
  }
});

// 格式化配置信息用于预览
const formattedConfig = computed(() => {
  const config = detailData.value?.stickerPsdSetConfig;
  if (!config) return "";
  try {
    const parsed = typeof config === "string" ? JSON.parse(config) : config;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return String(config);
  }
});

const detailMetaFormatted = computed(() => {
  const meta = detailData.value?.meta;
  if (!meta) return "";
  try {
    const parsed = typeof meta === "string" ? JSON.parse(meta) : meta;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return String(meta);
  }
});

function getColumns() {
  const baseColumns = [
    { type: "checkbox", width: 50, fixed: "left" as const },

    { title: "套图图片", field: "images", width: 200, slots: { default: "imagesSlot" } },
    { title: "套图名称", field: "name", minWidth: 180 },
    { title: "多素材关联", field: "stickers", width: 120, slots: { default: "stickersCountSlot" } },
    { title: "描述", field: "description", minWidth: 200, showOverflow: true },
    { title: "关键词", field: "keywords", minWidth: 180, showOverflow: true },
    {
      title: "上传者",
      field: "uploader",
      width: 140,
      formatter: ({ row }) =>
        row?.uploader?.account || row?.uploader?.name || row?.uploaderId || "-",
    },
    { title: "状态", field: "status", width: 120, slots: { default: "statusSlot" } },
    { title: "状态说明", field: "statusMessage", width: 320, showOverflow: true },
    { title: "配置信息", field: "config", width: 150, slots: { default: "configSlot" } },
    {
      title: "制作耗时",
      field: "processingTime",
      width: 140,
      formatter: ({ cellValue }) => formatProcessingTime(cellValue),
    },
    {
      title: "ID",
      field: "id",
      width: 120,
      showOverflow: false,
      slots: { default: "idSlot" },
    },
    {
      title: "创建时间",
      field: "createTime",
      width: 160,
      formatter: ({ cellValue }) => formatTimestamp(cellValue),
    },
    {
      title: "更新时间",
      field: "updateTime",
      width: 160,
      formatter: ({ cellValue }) => formatTimestamp(cellValue),
    },
  ];

  const operationColumn = [
    { title: "操作", width: 80, fixed: "right" as const, slots: { default: "operationSlot" } },
  ];

  return [...baseColumns, ...operationColumn];
}

const gridOptions = ref<any>({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: "id",
  },
  checkboxConfig: {
    reserve: true,
  },
  columns: getColumns(),
});

const { height } = useWindowSize();

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 240;
});

async function getList() {
  loading.value = true;
  try {
    const res = await stickerPsdSetApi.page({
      ...queryParams,
      id: queryParams.id?.trim() || undefined,
      status: queryParams.status || undefined,
      keyword: queryParams.keyword?.trim() || undefined,
      includeDetails: showDetails.value,
      sortingFields: queryParams.sortingFields,
      startTime: queryParams.startTime || undefined,
      endTime: queryParams.endTime || undefined,
    });
    dataSource.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleIdChange(val: string) {
  if (!val) {
    getList();
  }
}

function handleKeywordChange(val: string) {
  if (!val) {
    getList();
  }
}

function formatProcessingTime(seconds: any): string {
  const s = Number(seconds);
  if (isNaN(s) || s <= 0) return "-";
  if (s < 60) return `${s.toFixed(2)}秒`;
  if (s < 3600) {
    const minutes = Math.floor(s / 60);
    const secs = s % 60;
    return `${minutes}分${secs.toFixed(2)}秒`;
  }
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${hours}小时${minutes}分${secs.toFixed(2)}秒`;
}

// 批量下载套图图片（与商品页面逻辑一致）
async function handleDownloadPsdSetImages(row: any) {
  if (!row || !Array.isArray(row.images) || !row.images.length) {
    ElMessage.warning("暂无可下载的套图图片");
    return;
  }

  const images: string[] = row.images.filter((u: any) => typeof u === "string" && u.trim());
  if (!images.length) {
    ElMessage.warning("暂无可下载的套图图片");
    return;
  }

  const baseName = row.name || "套图图片";
  ElMessage.info(`开始下载 ${images.length} 张图片，请稍候...`);

  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    const suffixMatch = String(url).match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    const ext = suffixMatch ? suffixMatch[1] : "jpg";
    const filename = `${baseName}_${i + 1}.${ext}`;

    try {
      await downloadImageEnhanced(url, filename, { showMessage: false, fallbackToNewWindow: true });
    } catch (e) {
      console.error("下载单张图片失败:", e);
    }
  }

  ElMessage.success("套图图片批量下载任务已完成");
}

function statusLabel(status: string) {
  const item = statusOptions.find((s) => s.value === status);
  return item ? item.label : status || "-";
}

function statusTagType(status: string) {
  switch (status) {
    case "completed":
      return "success";
    case "processing":
      return "warning";
    case "failed":
      return "danger";
    case "pending":
      return "info";
    default:
      return "info";
  }
}

// 获取贴纸数组（兼容旧数据：优先使用 stickers，没有则使用 sticker）
function getStickers(row: any) {
  if (Array.isArray(row.stickers) && row.stickers.length > 0) {
    return row.stickers;
  }
  if (row.sticker) {
    return [row.sticker];
  }
  return [];
}

// 获取贴纸数量
function getStickersCount(row: any) {
  const stickers = getStickers(row);
  if (stickers.length > 0) {
    return stickers.length;
  }
  // 如果没有 stickers 数据，尝试从 stickerIds 获取数量
  if (Array.isArray(row.stickerIds) && row.stickerIds.length > 0) {
    return row.stickerIds.length;
  }
  // 如果有 stickerId，说明至少有一个
  if (row.stickerId) {
    return 1;
  }
  return 0;
}

// 复制 ID
async function copyId(id: string) {
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    ElMessage.success("ID 已复制到剪贴板");
  } catch (e) {
    // 降级方案
    const textarea = document.createElement("textarea");
    textarea.value = id;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    ElMessage.success("ID 已复制到剪贴板");
  }
}

function onSelectionChange({ records, reserves }) {
  const current = Array.isArray(records) ? records : [];
  const reserveList = Array.isArray(reserves) ? reserves : [];
  selectedIds.value = [...current, ...reserveList].map((item) => item.id);
}

async function updateRowStatus(row, status: string) {
  try {
    await stickerPsdSetApi.updateStatus(row.id, { status });
    row.status = status;
    ElMessage.success("状态已更新");
    getList();
  } catch (error: any) {
    ElMessage.error(error?.message || "状态更新失败");
  }
}

async function handleToProduct(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法生成产品");
  }
  generatingProductId.value = row.id;
  await openGenerateProductDialog([row.id]);
}

// 查看配置信息（独立的弹窗）
async function handleViewConfig(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法查看配置");
  }
  configViewDialogVisible.value = true;
  configViewDialogLoading.value = true;
  try {
    const res = await request.get({
      url: `/sticker-psd-set/${row.id}`,
    });
    configViewDialogData.value = res?.data || res || {};
  } catch (error: any) {
    console.error("获取套图详情失败:", error);
    ElMessage.error(error?.message || "获取配置失败");
    configViewDialogVisible.value = false;
  } finally {
    configViewDialogLoading.value = false;
  }
}

// 从查看配置弹窗跳转到编辑配置
function handleEditFromView() {
  if (!configViewDialogData.value?.id) {
    return ElMessage.warning("缺少ID，无法编辑配置");
  }
  // 关闭查看配置弹窗
  configViewDialogVisible.value = false;
  // 打开编辑配置弹窗
  handleEditConfigDirectly(configViewDialogData.value);
}

async function handleViewDetail(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法查看详情");
  }
  detailDialogVisible.value = true;
  detailLoading.value = true;
  configPreviewMode.value = false;
  try {
    const res = await request.get({
      url: `/sticker-psd-set/${row.id}`,
    });
    detailData.value = res?.data || res || {};
  } catch (error: any) {
    console.error("获取套图详情失败:", error);
    ElMessage.error(error?.message || "获取详情失败");
    detailDialogVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

function handleCloseDetailDialog() {
  detailLoading.value = false;
  detailData.value = null;
  configPreviewMode.value = false;
}

// 直接编辑配置信息（打开独立的编辑配置对话框）
async function handleEditConfigDirectly(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法编辑配置");
  }
  configEditDialogVisible.value = true;
  configEditDialogLoading.value = true;
  configEditDialogError.value = "";
  configEditDialogValue.value = "";
  try {
    const res = await request.get({
      url: `/sticker-psd-set/${row.id}`,
    });
    configEditDialogData.value = res?.data || res || {};
    // 初始化配置编辑值
    const config = configEditDialogData.value?.stickerPsdSetConfig;
    if (config) {
      try {
        const parsed = typeof config === "string" ? JSON.parse(config) : config;
        configEditDialogValue.value = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // 如果解析失败，显示原始值并提示错误
        configEditDialogValue.value = String(config);
        configEditDialogError.value = "当前配置格式不正确，请修正后保存";
      }
    } else {
      configEditDialogValue.value = "{}";
    }
  } catch (error: any) {
    console.error("获取套图详情失败:", error);
    ElMessage.error(error?.message || "获取详情失败");
    configEditDialogVisible.value = false;
  } finally {
    configEditDialogLoading.value = false;
  }
}

// 增强的JSON校验函数（用于编辑配置对话框）
function validateJsonEnhanced(jsonString: string): { valid: boolean; error?: string } {
  const trimmed = jsonString?.trim() || "";

  // 空值视为有效
  if (!trimmed) {
    return { valid: true };
  }

  // 检查是否以 { 或 [ 开头（基本结构检查）
  const firstChar = trimmed.charAt(0);
  const lastChar = trimmed.charAt(trimmed.length - 1);

  if (firstChar === "{" && lastChar !== "}") {
    return { valid: false, error: "JSON对象缺少闭合括号 }" };
  }

  if (firstChar === "[" && lastChar !== "]") {
    return { valid: false, error: "JSON数组缺少闭合括号 ]" };
  }

  // 尝试解析JSON
  try {
    const parsed = JSON.parse(trimmed);

    // 额外检查：确保解析后是对象或数组（不允许原始值）
    if (parsed !== null && typeof parsed !== "object" && !Array.isArray(parsed)) {
      return { valid: false, error: "配置必须是JSON对象或数组，不能是原始值" };
    }

    return { valid: true };
  } catch (e: any) {
    // 提供更友好的错误信息
    let errorMsg = "JSON格式错误";
    if (e.message) {
      if (e.message.includes("Unexpected token")) {
        errorMsg = `JSON语法错误：${e.message}`;
      } else if (e.message.includes("Unexpected end")) {
        errorMsg = "JSON不完整，请检查是否缺少引号、括号或逗号";
      } else if (e.message.includes("Unexpected string")) {
        errorMsg = "字符串格式错误，请检查引号是否匹配";
      } else {
        errorMsg = `JSON解析错误：${e.message}`;
      }
    }
    return { valid: false, error: errorMsg };
  }
}

// 实时校验JSON（用于编辑配置对话框）
function validateJsonRealtime(jsonString: string) {
  const result = validateJsonEnhanced(jsonString);
  configEditDialogError.value = result.error || "";
  return result.valid;
}

// 处理配置输入变化（带防抖）
function handleConfigInputChange() {
  // 清除之前的定时器
  if (configValidateTimer) {
    clearTimeout(configValidateTimer);
  }

  // 如果输入为空，清除错误信息
  if (!configEditDialogValue.value.trim()) {
    configEditDialogError.value = "";
    return;
  }

  // 防抖：500ms后执行校验
  configValidateTimer = setTimeout(() => {
    validateJsonRealtime(configEditDialogValue.value);
  }, 500);
}

// 取消编辑配置对话框
function handleCancelConfigEditDialog() {
  // 清理定时器
  if (configValidateTimer) {
    clearTimeout(configValidateTimer);
    configValidateTimer = null;
  }
  configEditDialogVisible.value = false;
  configEditDialogError.value = "";
  // 延迟清空数据，避免关闭动画时闪烁
  setTimeout(() => {
    configEditDialogData.value = null;
    configEditDialogValue.value = "";
  }, 300);
}

// 保存编辑配置对话框的配置信息
async function handleSaveConfigDialog() {
  const trimmedValue = configEditDialogValue.value?.trim() || "";

  // 验证JSON格式
  const validation = validateJsonEnhanced(trimmedValue);
  if (!validation.valid) {
    configEditDialogError.value = validation.error || "JSON格式错误";
    return;
  }

  if (!configEditDialogData.value?.id) {
    return ElMessage.warning("缺少ID，无法保存配置");
  }

  configEditDialogSaving.value = true;
  try {
    // 解析并格式化JSON
    let configValue: any = null;
    if (trimmedValue) {
      configValue = JSON.parse(trimmedValue);
    }

    // 调用更新API（使用新字段名 stickerPsdSetConfig）
    await stickerPsdSetApi.update(configEditDialogData.value.id, {
      stickerPsdSetConfig: configValue,
    });

    ElMessage.success("配置信息已保存");

    // 清理定时器
    if (configValidateTimer) {
      clearTimeout(configValidateTimer);
      configValidateTimer = null;
    }

    configEditDialogVisible.value = false;
    configEditDialogError.value = "";

    // 刷新列表以同步数据
    getList();

    // 延迟清空数据
    setTimeout(() => {
      configEditDialogData.value = null;
      configEditDialogValue.value = "";
    }, 300);
  } catch (error: any) {
    console.error("保存配置信息失败:", error);
    ElMessage.error(error?.message || "保存配置信息失败");
  } finally {
    configEditDialogSaving.value = false;
  }
}

function handleDelete(row) {
  ElMessageBox.confirm("确定删除该套图记录吗？", "删除确认", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await stickerPsdSetApi.remove(row.id);
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => {});
}

function handleBatchDelete() {
  if (!selectedIds.value.length) {
    return ElMessage.warning("请至少选择一条记录");
  }
  ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条记录吗？`, "批量删除", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await stickerPsdSetApi.removeBatch(selectedIds.value);
      ElMessage.success("批量删除成功");
      selectedIds.value = [];
      getList();
    })
    .catch(() => {});
}

async function handleBatchUpdateStatus(status: string) {
  if (!selectedIds.value.length) {
    return ElMessage.warning("请至少选择一条记录");
  }

  const statusLabel = statusOptions.find((s) => s.value === status)?.label || status;
  try {
    await ElMessageBox.confirm(
      `确定将选中的 ${selectedIds.value.length} 条记录的状态改为"${statusLabel}"吗？`,
      "批量修改状态",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      },
    );
  } catch (e) {
    return;
  }

  batchUpdatingStatus.value = true;
  let successCount = 0;
  let failCount = 0;

  try {
    for (const id of selectedIds.value) {
      try {
        await stickerPsdSetApi.updateStatus(id, { status });
        successCount += 1;
      } catch (error) {
        failCount += 1;
        console.error(`批量更新状态失败（ID: ${id}）`, error);
      }
    }

    if (successCount) {
      ElMessage.success(`成功更新 ${successCount} 条记录的状态`);
    }
    if (failCount) {
      ElMessage.warning(`有 ${failCount} 条记录更新失败，请稍后重试`);
    }

    if (successCount > 0) {
      selectedIds.value = [];
      getList();
    }
  } finally {
    batchUpdatingStatus.value = false;
  }
}

async function handleBatchGenerateProduct() {
  if (!selectedIds.value.length) {
    return ElMessage.warning("请选择需要生成产品的记录");
  }
  await openGenerateProductDialog(selectedIds.value);
}

async function ensurePublishConfigOptions() {
  if (publishConfigDialogLoading.value || publishConfigOptions.value.length > 0) {
    return;
  }

  publishConfigDialogLoading.value = true;
  try {
    const res = await getPublishConfigListApi();
    const list = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.list)
        ? (res as any).list
        : [];
    publishConfigOptions.value = list.filter((item: any) => item?.isActive !== false);
  } catch (error: any) {
    console.error("加载发布配置失败:", error);
    ElMessage.error(error?.message || "加载发布配置失败");
  } finally {
    publishConfigDialogLoading.value = false;
  }
}

async function openPublishConfigDialog(ids: string[]) {
  const normalizedIds = Array.from(
    new Set((ids || []).map((item) => String(item).trim()).filter(Boolean)),
  );
  if (!normalizedIds.length) {
    return ElMessage.warning("请选择需要生成发布任务的套图");
  }

  publishConfigTargetIds.value = normalizedIds;
  publishConfigSelectedIds.value = [];
  publishConfigSearchText.value = "";
  publishConfigCurrentPage.value = 1;
  publishConfigDialogVisible.value = true;
  await ensurePublishConfigOptions();
}

function handleClosePublishConfigDialog() {
  publishConfigDialogVisible.value = false;
  publishConfigSelectedIds.value = [];
  publishConfigTargetIds.value = [];
  publishConfigSearchText.value = "";
  publishConfigCurrentPage.value = 1;
}

function handlePublishConfigCheckboxChange({ checked, row }) {
  if (checked) {
    if (!publishConfigSelectedIds.value.includes(row.id)) {
      publishConfigSelectedIds.value.push(row.id);
    }
  } else {
    publishConfigSelectedIds.value = publishConfigSelectedIds.value.filter((id) => id !== row.id);
  }
}

function handlePublishConfigCheckboxAllChange({ checked }) {
  const currentPageIds = publishConfigDataSource.value.map((item: any) => item.id);
  if (checked) {
    currentPageIds.forEach((id: string) => {
      if (!publishConfigSelectedIds.value.includes(id)) {
        publishConfigSelectedIds.value.push(id);
      }
    });
  } else {
    publishConfigSelectedIds.value = publishConfigSelectedIds.value.filter(
      (id) => !currentPageIds.includes(id),
    );
  }
}

async function handleCreatePublishTask(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法生成发布任务");
  }
  await openPublishConfigDialog([row.id]);
}

async function handleBatchCreatePublishTask() {
  if (!selectedIds.value.length) {
    return ElMessage.warning("请选择需要生成发布任务的套图");
  }
  await openPublishConfigDialog(selectedIds.value);
}

async function handleSubmitCreatePublishTask() {
  if (!publishConfigTargetIds.value.length) {
    return ElMessage.warning("未选择套图");
  }
  if (!publishConfigSelectedIds.value.length) {
    return ElMessage.warning("请选择发布配置");
  }

  publishConfigSubmitting.value = true;
  let successCount = 0;
  let failCount = 0;

  try {
    for (const psdSetId of publishConfigTargetIds.value) {
      for (const publishConfigId of publishConfigSelectedIds.value) {
        try {
          const config = publishConfigOptions.value.find(
            (item: any) => item.id === publishConfigId,
          );
          if (!config?.platform) {
            throw new Error("发布配置缺少平台信息");
          }
          await createPublishTaskApi({
            psdSetId,
            platform: config.platform,
            publishConfigId,
            publishOptions: config.configData || {},
            description: `套图 ${psdSetId} -> ${config.name || publishConfigId}`,
          });
          successCount += 1;
        } catch (error) {
          failCount += 1;
          console.error(
            `生成发布任务失败（套图ID: ${psdSetId}, 配置ID: ${publishConfigId}）`,
            error,
          );
        }
      }
    }

    if (successCount > 0) {
      ElMessage.success(`成功创建 ${successCount} 个发布任务`);
      handleClosePublishConfigDialog();
    }
    if (failCount > 0) {
      ElMessage.warning(`有 ${failCount} 个发布任务创建失败`);
    }
  } finally {
    publishConfigSubmitting.value = false;
  }
}

async function handleViewPublishTasks(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法查看发布任务");
  }

  publishTasksVisible.value = true;
  publishTasksLoading.value = true;
  publishTasks.value = [];

  try {
    const res = await stickerPsdSetApi.getPublishTasks(row.id);
    publishTasks.value = Array.isArray(res)
      ? res
      : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
  } catch (error: any) {
    console.error("获取发布任务失败:", error);
    ElMessage.error(error?.message || "获取发布任务失败");
    publishTasksVisible.value = false;
  } finally {
    publishTasksLoading.value = false;
  }
}

async function ensureGenerateProductDialogOptions() {
  if (!generateProductPromptOptions.value.length) {
    const res = await getPromptList({
      currentPage: 1,
      pageSize: 1000,
    });
    generateProductPromptOptions.value = Array.isArray(res?.list) ? res.list : [];
  }
}

async function openGenerateProductDialog(ids: string[]) {
  const normalizedIds = Array.from(
    new Set((ids || []).map((item) => String(item).trim()).filter(Boolean)),
  );
  if (!normalizedIds.length) {
    return ElMessage.warning("请选择需要生成产品的套图");
  }

  generateProductTargetIds.value = normalizedIds;
  generateProductForm.promptId = null;
  generateProductDialogVisible.value = true;
  generateProductDialogLoading.value = true;

  try {
    await ensureGenerateProductDialogOptions();
  } catch (error: any) {
    console.error("加载生成产品配置失败:", error);
    ElMessage.error(error?.message || "加载配置失败");
  } finally {
    generateProductDialogLoading.value = false;
  }
}

function handleCloseGenerateProductDialog() {
  generateProductDialogVisible.value = false;
  generateProductTargetIds.value = [];
  generateProductForm.promptId = null;
  generatingProductId.value = "";
  batchGeneratingProducts.value = false;
}

async function handleSubmitGenerateProduct() {
  if (!generateProductTargetIds.value.length) {
    return ElMessage.warning("未选择套图");
  }

  generateProductSubmitting.value = true;
  let successCount = 0;
  let failCount = 0;

  try {
    for (const id of generateProductTargetIds.value) {
      try {
        await stickerPsdSetApi.generateProduct({
          id,
          promptId: generateProductForm.promptId,
        });
        successCount += 1;
      } catch (error) {
        failCount += 1;
        console.error(`生成产品失败（ID: ${id}）`, error);
      }
    }

    if (successCount) {
      ElMessage.success(`成功生成 ${successCount} 个产品`);
    }
    if (failCount) {
      ElMessage.warning(`有 ${failCount} 个产品生成失败，请稍后重试`);
    }

    if (successCount > 0) {
      handleCloseGenerateProductDialog();
      getList();
    }
  } finally {
    generateProductSubmitting.value = false;
    batchGeneratingProducts.value = false;
    if (!generateProductDialogVisible.value) {
      generatingProductId.value = "";
    }
  }
}

async function handleStartProduction(row: any) {
  if (!row?.id) {
    return ElMessage.warning("缺少ID，无法开始制作");
  }

  if (!isClientConnected.value) {
    return ElMessage.warning("客户端未连接，请先启动客户端");
  }

  if (websocketClient.state.status !== "connected") {
    return ElMessage.warning("WebSocket未连接，请稍后重试");
  }

  try {
    await ElMessageBox.confirm(
      `确认开始制作该套图吗？制作请求将发送到您的客户端。`,
      "开始制作确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      },
    );
  } catch (e) {
    return;
  }

  try {
    startingProductionId.value = row.id;

    // 通过WebSocket发送制作请求
    websocketClient.sendMessage("start-psd-set-production", { psdSetId: row.id });

    // 监听响应
    const responseHandler = (data: { success: boolean; message?: string }) => {
      console.log("[psd-set] 收到制作响应:", data);
      websocketClient.events.off("start-psd-set-production-response", responseHandler);
      startingProductionId.value = "";

      if (data.success) {
        ElMessage.success(data.message || "制作请求已发送到客户端");
        // 不在这里乐观更新为「制作中」，改由客户端上报 production-status 时再更新
      } else {
        // 如果失败，显示警告消息（比如正在制作中）
        const message = data.message || "开始制作失败";
        console.log("[psd-set] 显示警告消息:", message);
        ElMessage.warning(message);
      }
    };

    // 先监听事件，再发送请求
    websocketClient.events.on("start-psd-set-production-response", responseHandler);

    // 设置超时，如果5秒内没有响应，显示错误
    setTimeout(() => {
      if (startingProductionId.value === row.id) {
        websocketClient.events.off("start-psd-set-production-response", responseHandler);
        startingProductionId.value = "";
        ElMessage.warning("请求超时，请检查网络连接");
      }
    }, 5000);
  } catch (error: any) {
    console.error("开始制作失败:", error);
    ElMessage.error(error?.message || "开始制作失败，请检查客户端连接状态");
    startingProductionId.value = "";
  }
}

// 全局监听制作响应消息（用于处理客户端主动发送的响应，比如正在制作中）
const globalResponseHandler = (data: { success: boolean; message?: string; psdSetId?: string }) => {
  console.log("[psd-set] 全局收到制作响应:", data);

  // 如果 success 为 false，说明可能是正在制作中或其他错误
  if (!data.success) {
    const message = data.message || "开始制作失败";
    console.log("[psd-set] 全局显示警告消息:", message);
    ElMessage.warning(message);

    // 如果指定了 psdSetId，清除对应的 startingProductionId，并确保行状态不误标为 processing
    if (data.psdSetId) {
      if (startingProductionId.value === data.psdSetId) {
        startingProductionId.value = "";
      }
      const row = dataSource.value.find((r) => r.id === data.psdSetId);
      if (row && row.status === "processing") {
        row.status = "pending";
      }
    }
  } else {
    // 如果成功，也清除对应的 startingProductionId
    if (data.psdSetId && startingProductionId.value === data.psdSetId) {
      startingProductionId.value = "";
    }
  }
};

// 监听客户端推送的制作状态（实时更新表格行）
const productionStatusHandler = (data: {
  psdSetId?: string;
  status: string;
  message?: string;
  progress?: number;
  total?: number;
}) => {
  try {
    if (!data || !data.psdSetId) return;
    const row = dataSource.value.find((r) => r.id === data.psdSetId);
    if (row) {
      // 优先使用客户端上报的状态
      row.status = data.status || row.status;
      if (data.message) row.statusMessage = data.message;
      // 当任务完成或失败时，重新刷新列表以保证数据一致
      if (data.status === "completed" || data.status === "failed") {
        getList();
      }
    }
  } catch (e) {
    console.error("处理 production-status 事件失败", e);
  }
};

onMounted(() => {
  // 添加全局监听器
  websocketClient.events.on("start-psd-set-production-response", globalResponseHandler);
  websocketClient.events.on("production-status", productionStatusHandler);
});

onUnmounted(() => {
  // 清理全局监听器
  websocketClient.events.off("start-psd-set-production-response", globalResponseHandler);
  websocketClient.events.off("production-status", productionStatusHandler);
});

getList();
</script>

<style scoped>
.search-bar :deep(.el-form-item) {
  margin-bottom: 0;
}

.status-message {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

.pagination-container :deep(.el-pagination) {
  font-size: 14px;
}

/* 详情列样式 */
.details-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.related-info-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.detail-section-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.detail-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.psd-set-detail-dialog :deep(.el-dialog__body) {
  box-sizing: border-box;
  height: calc(100vh - 78px);
  padding: 0 20px 20px;
  overflow: hidden;
}

.psd-set-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.psd-set-detail-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.psd-set-detail-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.psd-set-detail-header__tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.psd-set-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 18px;
  height: 100%;
  overflow: hidden;
}

.psd-set-detail-main,
.psd-set-detail-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.psd-set-detail-panel {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.psd-set-detail-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.psd-set-detail-summary__item,
.psd-set-detail-text-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.psd-set-detail-text-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 14px;
}

.psd-set-detail-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.psd-set-detail-image-card {
  padding: 8px;
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  min-width: 0;
}

.psd-set-detail-image {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  background: var(--el-bg-color-page);
}

.psd-set-detail-side-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.psd-set-detail-template-image {
  width: 100%;
  height: 220px;
  border-radius: 10px;
  background: var(--el-bg-color-page);
}

.psd-set-detail-meta-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.psd-set-detail-meta-list > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  min-width: 0;
}

.detail-sticker-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-info-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  background: var(--el-fill-color-lighter);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.detail-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.detail-sticker-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.detail-sticker-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.detail-sticker-name,
.detail-sticker-desc,
.detail-sticker-keywords {
  word-break: break-word;
}

.detail-sticker-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
  font-family: "Courier New", Consolas, monospace;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
}

.detail-sticker-id.cursor-pointer {
  cursor: pointer;
  user-select: none;
}

.detail-sticker-id.cursor-pointer:hover {
  color: var(--el-color-primary);
}

.detail-sticker-id .copy-icon {
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.detail-sticker-id.cursor-pointer:hover .copy-icon {
  opacity: 1;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 6px;
  padding: 4px 8px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
  border-radius: 4px;
  border-left: 3px solid var(--el-color-primary);
}

.detail-label {
  color: var(--el-color-primary);
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.detail-sub-grid {
  width: 100%;
  margin: 0;
  padding: 0;
  background: none;
}

.detail-sub-grid :deep(.vxe-table) {
  font-size: 12px;
}

.detail-sub-grid :deep(.vxe-table--header) {
  background-color: var(--el-table-header-bg-color);
}

.detail-sub-grid :deep(.vxe-table--body) {
  background-color: transparent;
}

.detail-sub-grid :deep(.vxe-cell) {
  padding: 4px 8px;
}

.detail-sub-grid :deep(.vxe-table--header-wrapper) {
  .vxe-cell {
    font-weight: 500;
    font-size: 12px;
  }
}

.detail-thumb-image {
  width: 100px;
  height: 100px;
  object-fit: contain;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s ease;
  background-color: var(--el-bg-color-page);
}

.detail-thumb-image:hover {
  border-color: var(--el-color-primary);
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

@media (max-width: 1100px) {
  .psd-set-detail-dialog :deep(.el-dialog__body) {
    height: auto;
    min-height: calc(100vh - 78px);
  }

  .psd-set-detail-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .psd-set-detail-main,
  .psd-set-detail-side {
    overflow: visible;
    max-height: none;
  }
}

.detail-template-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.detail-template-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.detail-template-paths {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.template-file-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: flex-start;
  padding: 4px 0;
  min-width: 120px;
}

/* 操作下拉菜单样式 */
.operation-dropdown {
  position: relative;
}

.op-menu {
  min-width: 120px;
  padding: 2px 0;
  background: var(--el-bg-color);
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.op-menu-item {
  position: relative;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.op-menu-item:hover:not(.is-disabled) {
  background: var(--el-fill-color-light);
}

.op-menu-item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.op-menu-item.danger {
  color: var(--el-color-danger);
}

.op-menu-item.danger:hover:not(.is-disabled) {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.op-menu-label {
  flex: 1;
}

.op-menu-tip {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-left: 6px;
}

.op-menu-section {
  padding: 2px 0;
}

.op-menu-section-title {
  padding: 4px 12px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.op-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 2px 0;
}

/* 修复 Element Plus Dropdown 的样式 */
.operation-dropdown :deep(.el-popper) {
  padding: 0;
}

.operation-dropdown :deep(.el-dropdown-menu) {
  padding: 0;
  border: none;
  background: transparent;
}

.operation-dropdown :deep(.el-dropdown-menu__item) {
  padding: 0;
  height: auto;
}

/* 轮播样式 */
.custom-carousel {
  position: relative;
  padding: 0 20px;
}

.custom-carousel :deep(.el-carousel__container) {
  margin: 0 -20px;
}

.custom-carousel :deep(.el-carousel__arrow) {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  width: 24px;
  height: 24px;
}

.custom-carousel :deep(.el-carousel__arrow):hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.custom-carousel :deep(.el-carousel__arrow) i {
  font-size: 14px;
}

.custom-carousel :deep(.el-carousel__arrow--left) {
  left: 0;
}

.custom-carousel :deep(.el-carousel__arrow--right) {
  right: 0;
}

/* 素材关联标签样式 */
.material-association-tag {
  font-weight: 500;
  min-width: 70px;
  text-align: center;
}

.material-association-tag .tag-text {
  display: inline-block;
}

/* 配置信息相关样式 */
.config-editor-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-textarea :deep(.el-textarea__inner) {
  font-family: "Courier New", Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
}

.config-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 4px;
  color: var(--el-color-danger);
  font-size: 12px;
}

.config-success {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-7);
  border-radius: 4px;
  color: var(--el-color-success);
  font-size: 12px;
}

.config-preview-container {
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
}

.config-preview {
  margin: 0;
  font-family: "Courier New", Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.config-display {
  padding: 8px 0;
}

/* 编辑配置对话框相关样式 */
.config-edit-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-edit-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.config-edit-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.config-edit-info-label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  min-width: 80px;
}

.config-edit-info-value {
  color: var(--el-text-color-regular);
  flex: 1;
}

/* 查看配置对话框相关样式 */
.config-view-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-view-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.config-view-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.config-view-info-label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  min-width: 80px;
}

.config-view-info-value {
  color: var(--el-text-color-regular);
  flex: 1;
}

.config-view-container {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  max-height: 500px;
  overflow: auto;
}

.config-view-content {
  margin: 0;
  font-family: "Courier New", Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.config-view-empty {
  padding: 40px;
  text-align: center;
  font-size: 14px;
}

.generate-product-dialog-body {
  min-height: calc(100vh - 140px);
  padding: 8px 0 24px;
}

.publish-config-dialog-body {
  display: flex;
  min-height: calc(100vh - 140px);
  overflow: hidden;
}

.generate-product-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.generate-product-dialog-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.generate-product-dialog-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.generate-product-panel {
}

.generate-product-panel--wide {
  width: 100%;
}

.publish-config-panel-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
}

.publish-config-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.publish-config-toolbar__stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.publish-config-stat-card {
  min-width: 132px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.publish-config-stat-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.publish-config-stat-card__value {
  margin-top: 8px;
  font-size: 22px;
  line-height: 1;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.publish-config-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.publish-config-search {
  width: 320px;
}

.publish-config-grid-wrap {
  flex: 1;
  min-height: 0;
}

.publish-config-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.publish-config-tip {
  margin-top: 0;
}

.generate-product-panel-title {
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.generate-product-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.generate-product-option-id,
.generate-product-option-meta {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.generate-product-tip {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.generate-product-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

.publish-task-list-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: calc(100vh - 150px);
  min-height: 0;
  overflow: hidden;
}

.publish-task-list-dialog :deep(.el-dialog__body) {
  box-sizing: border-box;
  height: calc(100vh - 78px);
  overflow: hidden;
}

.publish-task-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.publish-task-list-toolbar__stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.publish-task-list-grid {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.publish-task-error {
  color: var(--el-color-danger);
}

@media (max-width: 768px) {
  .publish-task-list-dialog :deep(.el-dialog__body) {
    height: auto;
    min-height: calc(100vh - 78px);
  }

  .publish-task-list-body {
    height: auto;
    min-height: calc(100vh - 200px);
  }

  .publish-config-search {
    width: 100%;
  }

  .publish-config-toolbar__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
