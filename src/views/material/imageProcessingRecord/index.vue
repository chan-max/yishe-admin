<template>
  <ContentWrap :plain="true">
    <ListPageLayout class="image-processing-record-page">
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col
                class="list-page-search-form__col--base"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
                :xl="6"
              >
                <el-form-item label="关键词">
                  <el-input
                    v-model="queryParams.keyword"
                    size="small"
                    clearable
                    placeholder="标题 / 文件名 / 原图地址"
                    @keyup.enter="getList"
                    @change="handleKeywordChange"
                  />
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="5"
                :xl="4"
              >
                <el-form-item label="状态">
                  <el-select
                    v-model="queryParams.status"
                    size="small"
                    clearable
                    placeholder="全部状态"
                    @change="getList"
                  >
                    <el-option label="待处理" value="pending" />
                    <el-option label="成功" value="success" />
                    <el-option label="部分成功" value="partial" />
                    <el-option label="失败" value="failed" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--narrow"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="5"
                :xl="4"
              >
                <el-form-item label="任务类型">
                  <el-select
                    v-model="queryParams.taskType"
                    size="small"
                    clearable
                    placeholder="全部类型"
                    @change="getList"
                  >
                    <el-option label="图片处理" value="process" />
                    <el-option label="图片裂变" value="variations" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col
                class="list-page-search-form__col--wide"
                :xs="24"
                :sm="24"
                :md="24"
                :lg="8"
                :xl="10"
              >
                <el-form-item label="服务状态">
                  <div class="image-processing-record-page__status-bar">
                    <el-tag :type="imageStatusTagType" size="small">
                      yishe-images {{ imageStatusLabel }}
                    </el-tag>
                    <div class="image-processing-record-page__status-content">
                      <span
                        class="image-processing-record-page__status-text"
                        :title="imageStatusSummary"
                      >
                        {{ imageStatusSummary }}
                      </span>
                      <span
                        v-if="imageStatusDetail"
                        class="image-processing-record-page__status-detail"
                        :title="imageStatusDetail"
                      >
                        {{ imageStatusDetail }}
                      </span>
                    </div>
                  </div>
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
              >
                搜索
              </el-button>
              <el-button size="small" type="primary" :icon="Plus" @click="openCreateDialog">
                新增
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                :disabled="loading"
                @click="handleBatchDelete"
              >
                批量删除({{ selectedRows.length }})
              </el-button>
              <el-button
                size="small"
                :icon="RefreshRight"
                :loading="imagesStatus.loading || metaLoading"
                @click="refreshPageMeta"
              >
                刷新状态
              </el-button>
            </div>
          </el-form>
        </div>
      </template>

      <template #table>
        <div
          class="list-page-panel list-page-panel--flat list-page-table-panel list-page-table-panel--flat"
        >
          <div class="list-page-table-panel__body">
            <div class="common-table">
              <vxe-grid
                v-bind="gridOptions"
                :data="dataSource"
                :loading="loading"
                @checkbox-change="handleCheckboxChange"
                @checkbox-all="handleCheckboxAll"
              >
                <template #sourceSlot="{ row }">
                  <div class="image-record-source-cell">
                    <div class="image-record-thumb" @click.stop="openRowSource(row)">
                      <img
                        v-if="getSourcePreview(row)"
                        :src="getSourcePreview(row)"
                        :alt="row.sourceFilename || row.title || '原图'"
                      />
                      <span v-else class="image-record-thumb__placeholder">无预览</span>
                    </div>
                    <div class="image-record-source-meta">
                      <span class="image-record-source-type">
                        {{ row.sourceType === "upload" ? "本地上传" : "图片地址" }}
                      </span>
                      <span class="image-record-source-name" :title="row.sourceFilename || '-'">
                        {{ row.sourceFilename || "-" }}
                      </span>
                    </div>
                  </div>
                </template>
                <template #titleSlot="{ row }">
                  <div class="image-record-title-cell">
                    <span class="image-record-title-main">{{ row.title || "-" }}</span>
                    <span class="image-record-title-sub">ID: {{ row.id }}</span>
                    <span
                      v-if="row.sourceOriginalUrl"
                      class="image-record-title-sub"
                      :title="row.sourceOriginalUrl"
                    >
                      原始地址：{{ row.sourceOriginalUrl }}
                    </span>
                  </div>
                </template>
                <template #taskTypeSlot="{ row }">
                  <el-tag :type="row.taskType === 'variations' ? 'warning' : 'primary'" effect="plain">
                    {{ getTaskTypeLabel(row.taskType) }}
                  </el-tag>
                </template>
                <template #statusSlot="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" effect="plain">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
                <template #resultSlot="{ row }">
                  <div class="image-record-result-cell">
                    <div
                      class="image-record-result-thumb"
                      :class="{ 'is-empty': !getFirstResultUrl(row) }"
                      @click.stop="openFirstResult(row)"
                    >
                      <img
                        v-if="getFirstResultUrl(row)"
                        :src="getFirstResultUrl(row)"
                        :alt="row.title || '结果图'"
                      />
                      <span v-else class="image-record-thumb__placeholder">无结果</span>
                    </div>
                    <div class="image-record-result-meta">
                      <span class="image-record-result-count">{{ getResultSummary(row) }}</span>
                      <span class="image-record-result-engine">
                        {{ row.processorLabel || row.processorId || "默认引擎" }}
                      </span>
                    </div>
                  </div>
                </template>
                <template #createTimeSlot="{ row }">
                  <span class="table-time-text">{{ formatTimestamp(row.createTime) }}</span>
                </template>
                <template #operationDefaultSlot="{ row }">
                  <div class="flex justify-start">
                    <el-dropdown
                      trigger="click"
                      placement="bottom-end"
                      @command="(command) => handleOperationCommand(command, row)"
                      class="operation-dropdown"
                    >
                      <el-button type="primary" link size="small" class="operation-trigger-button">
                        操作
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="operation-menu-compact">
                          <el-dropdown-item command="detail">查看详情</el-dropdown-item>
                          <el-dropdown-item
                            command="delete"
                            divided
                            class="operation-menu-item--danger"
                          >
                            删除
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
          <Pagination
            :total="total"
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </template>
    </ListPageLayout>

    <el-dialog
      v-model="createVisible"
      title="新增图片处理任务"
      fullscreen
      destroy-on-close
      class="image-processing-create-dialog"
    >
      <div v-loading="metaLoading" class="image-processing-create-layout">
        <div class="image-processing-create-banner">
          <div class="image-processing-create-banner__title">图片处理工作台</div>
        </div>

        <el-card shadow="never" class="image-processing-panel-card">
          <template #header>第 1 步 · 选择来源与任务</template>
          <div class="image-processing-panel-scroll">
            <el-form label-position="top" class="image-processing-form">
              <el-form-item label="任务类型">
                <el-radio-group v-model="form.taskType">
                  <el-radio-button label="process">图片处理</el-radio-button>
                  <el-radio-button label="variations">图片裂变</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="任务标题">
                <el-input
                  v-model="form.title"
                  clearable
                  maxlength="255"
                  placeholder="可选，留空会自动生成标题"
                />
              </el-form-item>

              <el-form-item label="图片来源">
                <el-radio-group v-model="form.sourceType" @change="handleSourceTypeChange">
                  <el-radio-button label="upload">本地上传</el-radio-button>
                  <el-radio-button label="url">输入地址</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <template v-if="form.sourceType === 'upload'">
                <el-form-item label="上传图片">
                  <el-upload
                    ref="sourceUploadRef"
                    drag
                    action="#"
                    accept="image/*"
                    :auto-upload="false"
                    :limit="1"
                    :show-file-list="false"
                    :on-change="handleSourceFileChange"
                    :on-exceed="handleSourceFileExceed"
                  >
                    <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                    <div class="el-upload__text">拖拽图片到这里，或点击选择</div>
                    <template #tip>
                      <div class="el-upload__tip">支持单张图片上传，服务端会先归档到 COS。</div>
                    </template>
                  </el-upload>
                </el-form-item>
                <div v-if="sourceFileName" class="image-processing-source-file">
                  已选择：{{ sourceFileName }}
                </div>
              </template>

              <template v-else>
                <el-form-item label="图片地址">
                  <el-input
                    v-model="form.imageUrl"
                    clearable
                    placeholder="https://example.com/source.png"
                  />
                </el-form-item>
                <div class="image-processing-source-tip">
                  远程图片会先下载并归档到 COS，再提交给 yishe-images 执行。
                </div>
              </template>

              <el-form-item label="处理引擎">
                <el-select
                  v-model="form.processorId"
                  clearable
                  filterable
                  placeholder="留空则使用服务默认引擎"
                  class="image-processing-full-width"
                >
                  <el-option
                    v-for="processor in processorOptions"
                    :key="processor.id"
                    :label="processor.label || processor.id"
                    :value="processor.id"
                  >
                    <div class="image-processing-select-option">
                      <span>{{ processor.label || processor.id }}</span>
                      <span>{{ processor.id }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>

              <div class="image-processing-preview-card">
                <div class="image-processing-preview-card__title">原图预览</div>
                <div class="image-processing-preview-card__body">
                  <img
                    v-if="createSourcePreview"
                    :src="createSourcePreview"
                    alt="source preview"
                    class="image-processing-preview-card__image"
                  />
                  <div v-else class="image-processing-preview-card__empty">等待选择图片</div>
                </div>
              </div>

              <div v-if="hasSourceContext" class="image-processing-source-context">
                <div class="image-processing-source-context__title">来源链路</div>
                <div class="image-processing-source-context__item">
                  <span class="label">来源模块</span>
                  <span class="value">{{ form.sourceModule || "-" }}</span>
                </div>
                <div class="image-processing-source-context__item">
                  <span class="label">来源记录</span>
                  <span class="value">{{ form.sourceRecordId || "-" }}</span>
                </div>
                <div class="image-processing-source-context__item">
                  <span class="label">来源名称</span>
                  <span class="value">{{ form.sourceName || "-" }}</span>
                </div>
              </div>
            </el-form>
          </div>
        </el-card>

        <el-card shadow="never" class="image-processing-panel-card">
          <template #header>
            第 2 步 ·
            {{ form.taskType === "process" ? "填写链式处理 JSON" : "查看裂变预设" }}
          </template>
          <div class="image-processing-panel-scroll image-processing-panel-scroll--column">
            <template v-if="form.taskType === 'process'">
              <div class="image-processing-panel-toolbar">
                <el-button size="small" @click="fillDefaultOperations">恢复示例</el-button>
                <el-button size="small" @click="formatOperationsJson">格式化 JSON</el-button>
              </div>
              <div class="image-processing-json-editor">
                <el-input
                  v-model="form.operationsJson"
                  type="textarea"
                  :rows="18"
                  resize="none"
                  placeholder='请输入 JSON，例如：[{"type":"resize","params":{"width":1080,"height":1080}}]'
                />
              </div>
              <div class="image-processing-panel-tip">
                `process` 模式直接提交远端操作链；默认示例和操作列表都来自 yishe-images 元数据，经
                design-server 透传。
              </div>
            </template>

            <template v-else>
              <div class="image-processing-panel-tip">
                `variations` 模式会调用 yishe-images 当前内置的裂变预设集合，不在前端硬编码执行链。
              </div>
              <div class="image-processing-variation-list">
                <div
                  v-for="variation in variations"
                  :key="variation.id || variation.name"
                  class="image-processing-variation-card"
                >
                  <div class="image-processing-variation-card__header">
                    <span class="image-processing-variation-card__title">
                      {{ variation.name || "未命名预设" }}
                    </span>
                    <el-tag size="small" effect="plain">
                      {{ variation.operationCount || 0 }} 步
                    </el-tag>
                  </div>
                  <div class="image-processing-variation-card__desc">
                    {{ variation.description || "无描述" }}
                  </div>
                  <pre class="image-processing-variation-card__json">{{
                    formatJson(variation.operations || [])
                  }}</pre>
                </div>
                <div v-if="!variations.length" class="image-processing-empty-state">
                  暂未获取到裂变预设
                </div>
              </div>
            </template>
          </div>
        </el-card>

        <el-card shadow="never" class="image-processing-panel-card">
          <template #header>
            第 3 步 ·
            {{ form.taskType === "process" ? "远端操作目录" : "提交说明" }}
          </template>
          <div class="image-processing-panel-scroll image-processing-panel-scroll--column">
            <template v-if="form.taskType === 'process'">
              <div class="image-processing-panel-tip">
                下方列表直接来自 yishe-images 元数据。点击“插入模板”会把默认参数片段追加到当前
                JSON 中，后续新增操作无需改前端页面逻辑。
              </div>
              <div v-for="group in groupedOperations" :key="group.category" class="image-processing-op-group">
                <div class="image-processing-op-group__title">
                  {{ group.label }} <span>({{ group.items.length }})</span>
                </div>
                <div class="image-processing-op-list">
                  <div
                    v-for="operation in group.items"
                    :key="operation.apiType || operation.type"
                    class="image-processing-op-card"
                  >
                    <div class="image-processing-op-card__header">
                      <div class="image-processing-op-card__title">
                        {{ operation.type || operation.apiType }}
                      </div>
                      <el-button size="small" type="primary" link @click="appendOperationTemplate(operation)">
                        插入模板
                      </el-button>
                    </div>
                    <div class="image-processing-op-card__desc">
                      {{ operation.description || "无描述" }}
                    </div>
                    <div class="image-processing-op-card__meta">
                      <span>分类：{{ operation.category || "default" }}</span>
                      <span>必填：{{ getRequiredParamNames(operation).join(" / ") || "-" }}</span>
                    </div>
                    <div class="image-processing-op-card__params">
                      {{ getOperationParamSummary(operation) }}
                    </div>
                    <div
                      v-if="getOperationParamRows(operation).length"
                      class="image-processing-op-card__param-list"
                    >
                      <div
                        v-for="param in getOperationParamRows(operation)"
                        :key="`${operation.type || operation.apiType}-${param.name}`"
                        class="image-processing-op-card__param-item"
                      >
                        <div class="image-processing-op-card__param-head">
                          <span class="name">{{ param.name }}</span>
                          <span class="meta">{{ param.meta }}</span>
                        </div>
                        <div class="image-processing-op-card__param-desc">
                          {{ param.description }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!groupedOperations.length" class="image-processing-empty-state">
                暂未获取到操作目录
              </div>
            </template>

            <template v-else>
              <el-alert
                type="info"
                :closable="false"
                class="image-processing-submit-alert"
                title="裂变结果会在服务端归档到 COS，并写入执行记录；删除记录时会同步删除归档文件。"
              />
              <div class="image-processing-submit-summary">
                <div class="image-processing-submit-summary__item">
                  <span class="label">提交模式</span>
                  <span class="value">{{ getTaskTypeLabel(form.taskType) }}</span>
                </div>
                <div class="image-processing-submit-summary__item">
                  <span class="label">图片来源</span>
                  <span class="value">
                    {{ form.sourceType === "upload" ? "本地上传" : "远程地址" }}
                  </span>
                </div>
                <div class="image-processing-submit-summary__item">
                  <span class="label">处理引擎</span>
                  <span class="value">{{ selectedProcessorLabel || "服务默认引擎" }}</span>
                </div>
                <div class="image-processing-submit-summary__item">
                  <span class="label">裂变预设</span>
                  <span class="value">{{ variations.length }} 组</span>
                </div>
              </div>
            </template>

            <div class="image-processing-request-preview">
              <div class="image-processing-request-preview__title">提交预览</div>
              <pre class="image-processing-json-block">{{ requestPreviewJson }}</pre>
            </div>

            <div class="image-processing-create-actions">
              <el-alert
                type="success"
                :closable="false"
                class="image-processing-submit-alert"
                title="处理完成后，源图和结果图会归档到 COS；yishe-images 临时文件会在服务端清理。"
              />
              <div class="image-processing-submit-hint">
                当前模块是独立记录模块，和 remotion 一样走“服务端协调 + COS 存储 + 记录管理”的模式。
              </div>
              <div class="image-processing-create-actions__buttons">
                <el-button @click="createVisible = false">取消</el-button>
                <el-button
                  type="primary"
                  :loading="submitLoading"
                  :disabled="!canSubmitCreate"
                  @click="submitCreate"
                >
                  立即执行
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      title="图片处理详情"
      fullscreen
      destroy-on-close
      class="image-processing-detail-dialog"
    >
      <div v-if="currentRow" class="image-processing-detail-layout">
        <el-card shadow="never" class="image-processing-panel-card">
          <template #header>任务概览</template>
          <div class="image-processing-panel-scroll image-processing-panel-scroll--column">
            <div class="image-processing-preview-card">
              <div class="image-processing-preview-card__title">归档原图</div>
              <div class="image-processing-preview-card__body">
                <img
                  v-if="currentRow.sourceImageUrl || currentRow.sourceOriginalUrl"
                  :src="currentRow.sourceImageUrl || currentRow.sourceOriginalUrl"
                  alt="source image"
                  class="image-processing-preview-card__image"
                />
                <div v-else class="image-processing-preview-card__empty">无原图地址</div>
              </div>
            </div>
            <div class="image-processing-detail-summary">
              <div class="image-processing-detail-summary__item">
                <span class="label">标题</span>
                <span class="value">{{ currentRow.title || "-" }}</span>
              </div>
              <div class="image-processing-detail-summary__item">
                <span class="label">任务类型</span>
                <span class="value">{{ getTaskTypeLabel(currentRow.taskType) }}</span>
              </div>
              <div class="image-processing-detail-summary__item">
                <span class="label">状态</span>
                <span class="value">{{ getStatusLabel(currentRow.status) }}</span>
              </div>
              <div class="image-processing-detail-summary__item">
                <span class="label">处理引擎</span>
                <span class="value">
                  {{ currentRow.processorLabel || currentRow.processorId || "默认引擎" }}
                </span>
              </div>
              <div class="image-processing-detail-summary__item">
                <span class="label">上传者</span>
                <span class="value">
                  {{
                    currentRow.uploader?.account ||
                    currentRow.uploader?.name ||
                    currentRow.userId ||
                    "-"
                  }}
                </span>
              </div>
              <div class="image-processing-detail-summary__item">
                <span class="label">创建时间</span>
                <span class="value">{{ formatTimestamp(currentRow.createTime) }}</span>
              </div>
              <div class="image-processing-detail-summary__item">
                <span class="label">原始地址</span>
                <span class="value value--wrap">{{ currentRow.sourceOriginalUrl || "-" }}</span>
              </div>
              <div
                v-if="currentRow.sourceModule || currentRow.sourceRecordId || currentRow.sourceName"
                class="image-processing-detail-summary__item"
              >
                <span class="label">来源链路</span>
                <span class="value value--wrap">
                  {{
                    [
                      currentRow.sourceModule || "",
                      currentRow.sourceRecordId || "",
                      currentRow.sourceName || "",
                    ]
                      .filter(Boolean)
                      .join(" / ") || "-"
                  }}
                </span>
              </div>
              <div class="image-processing-detail-summary__item">
                <span class="label">COS 原图</span>
                <span class="value value--wrap">{{ currentRow.sourceImageUrl || "-" }}</span>
              </div>
              <div v-if="currentRow.errorMessage" class="image-processing-detail-summary__item">
                <span class="label">失败信息</span>
                <span class="value value--error">{{ currentRow.errorMessage }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="image-processing-panel-card">
          <template #header>处理结果 ({{ detailResultFiles.length }})</template>
          <div class="image-processing-panel-scroll image-processing-panel-scroll--column">
            <div v-if="detailResultFiles.length" class="image-processing-result-toolbar">
              <div class="image-processing-result-toolbar__selection">
                <span>已选 {{ selectedResultIndexes.length }} 个可导入结果</span>
                <el-button type="primary" link size="small" @click="selectAllImportableResults">
                  全选可导入
                </el-button>
                <el-button type="primary" link size="small" @click="resetDetailImportState">
                  清空选择
                </el-button>
              </div>
              <div class="image-processing-result-toolbar__actions">
                <el-select
                  v-model="importFolderId"
                  clearable
                  filterable
                  :loading="importFolderLoading"
                  class="image-processing-result-toolbar__folder"
                  placeholder="自动继承来源文件夹 / 根目录"
                >
                  <el-option label="自动继承来源文件夹 / 根目录" value="" />
                  <el-option
                    v-for="folder in importFolderOptions"
                    :key="folder.id"
                    :label="folder.path || folder.name || folder.id"
                    :value="folder.id"
                  />
                </el-select>
                <el-button
                  type="primary"
                  :loading="importLoading"
                  :disabled="!selectedResultIndexes.length"
                  @click="importSelectedResults"
                >
                  导入素材库
                </el-button>
              </div>
            </div>
            <div v-if="detailResultFiles.length" class="image-processing-result-gallery">
              <div
                v-for="(file, index) in detailResultFiles"
                :key="file.key || file.outputFile || `${index}`"
                class="image-processing-result-card"
                :class="{ 'is-failed': !file.success, 'is-imported': !!file.adoptedStickerId }"
              >
                <div class="image-processing-result-card__header">
                  <el-checkbox
                    v-if="canImportResultFile(file)"
                    :model-value="selectedResultIndexes.includes(index)"
                    @change="(checked) => toggleResultSelection(index, !!checked)"
                  >
                    选中导入
                  </el-checkbox>
                  <el-tag v-else-if="file.adoptedStickerId" type="success" effect="plain">
                    已导入
                  </el-tag>
                  <el-tag v-else type="info" effect="plain">不可导入</el-tag>
                </div>
                <div class="image-processing-result-card__thumb" @click="file.url && openUrl(file.url)">
                  <img v-if="file.url" :src="file.url" :alt="file.name || file.outputFile || 'result'" />
                  <div v-else class="image-processing-result-card__empty">无归档结果</div>
                </div>
                <div class="image-processing-result-card__body">
                  <div class="image-processing-result-card__title">
                    {{ file.name || file.outputFile || "结果文件" }}
                  </div>
                  <div class="image-processing-result-card__meta">
                    {{ file.description || (file.success ? "处理完成" : "处理失败") }}
                  </div>
                  <div v-if="file.outputFile" class="image-processing-result-card__meta is-mono">
                    {{ file.outputFile }}
                  </div>
                  <div v-if="file.engine?.label || file.engine?.id" class="image-processing-result-card__meta">
                    引擎：{{ file.engine?.label || file.engine?.id }}
                  </div>
                  <div
                    v-if="file.adoptedStickerId || file.adoptedStickerName"
                    class="image-processing-result-card__meta"
                  >
                    素材库：{{ file.adoptedStickerName || file.adoptedStickerId }}
                  </div>
                  <div v-if="file.error" class="image-processing-result-card__error">
                    {{ file.error }}
                  </div>
                  <div class="image-processing-result-card__actions">
                    <el-button
                      v-if="file.url"
                      type="primary"
                      link
                      size="small"
                      @click="openUrl(file.url)"
                    >
                      打开 COS 文件
                    </el-button>
                    <el-button
                      v-if="file.serviceUrl"
                      type="primary"
                      link
                      size="small"
                      @click="openUrl(file.serviceUrl)"
                    >
                      查看服务结果
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="image-processing-empty-state">暂无处理结果</div>
          </div>
        </el-card>

        <div class="image-processing-detail-json-column">
          <el-card shadow="never" class="image-processing-panel-card">
            <template #header>请求参数</template>
            <div class="image-processing-panel-scroll">
              <pre class="image-processing-json-block">{{ formatJson(currentRow.requestParams) }}</pre>
            </div>
          </el-card>
          <el-card shadow="never" class="image-processing-panel-card">
            <template #header>服务响应</template>
            <div class="image-processing-panel-scroll">
              <pre class="image-processing-json-block">{{ formatJson(currentRow.responseData) }}</pre>
            </div>
          </el-card>
        </div>
      </div>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Plus, RefreshRight, Search, UploadFilled } from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";
import { formatTimestamp } from "@/common/date";
import { buildOperationColumn, buildTimeColumn, commonGridOptions } from "@/common/table";
import {
  batchDeleteImageProcessingRecord,
  createImageProcessingRecord,
  deleteImageProcessingRecord,
  getImageProcessingMeta,
  getImageProcessingRecordDetail,
  getImageProcessingRecordPage,
  importImageProcessingResults,
} from "@/api/image-processing-record";
import { getStickerFolderList } from "@/api/material";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { refreshServiceHealth, useServiceHealthState } from "@/services/serviceHealthState";
import {
  buildImageProcessingPrefillSignature,
  clearImageProcessingRoutePrefill,
  resolveImageProcessingRoutePrefill,
  stripImageProcessingPrefillQuery,
} from "@/utils/imageProcessingRoute";

const EMPTY_OPERATIONS_JSON = "[]";

const { height } = useWindowSize();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const total = ref(0);
const dataSource = ref<any[]>([]);
const selectedRows = ref<any[]>([]);
const createVisible = ref(false);
const detailVisible = ref(false);
const submitLoading = ref(false);
const metaLoading = ref(false);
const importLoading = ref(false);
const importFolderLoading = ref(false);
const currentRow = ref<any>(null);
const catalog = ref<Record<string, any> | null>(null);
const operations = ref<any[]>([]);
const variations = ref<any[]>([]);
const importFolderOptions = ref<any[]>([]);
const selectedResultIndexes = ref<number[]>([]);
const importFolderId = ref("");
const imagesStatus = useServiceHealthState("images");
const sourceUploadRef = ref();
const sourceFile = ref<File | null>(null);
const sourceFileName = ref("");
const sourceFilePreviewUrl = ref("");
const lastAppliedPrefillSignature = ref("");

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  keyword: "",
  status: "",
  taskType: "",
});

const form = reactive({
  title: "",
  taskType: "process",
  sourceType: "upload",
  imageUrl: "",
  processorId: "",
  operationsJson: EMPTY_OPERATIONS_JSON,
  sourceModule: "",
  sourceRecordId: "",
  sourceName: "",
});

const imageStatusLabel = computed(() => {
  if (imagesStatus.loading && !imagesStatus.checked) return "检测中";
  if (!imagesStatus.checked) return "未检测";
  return imagesStatus.available ? "可用" : "不可用";
});

const imageStatusTagType = computed(() => {
  if (imagesStatus.loading && !imagesStatus.checked) return "warning";
  if (!imagesStatus.checked) return "info";
  return imagesStatus.available ? "success" : "danger";
});

const imageStatusSummary = computed(() => {
  if (imagesStatus.loading && !imagesStatus.checked) return "检测中";
  if (!imagesStatus.checked) return "未检测";
  if (imagesStatus.available) {
    return imagesStatus.message || "服务可用";
  }
  return imagesStatus.message || "服务异常";
});

const imageStatusDetail = computed(() => {
  const parts: string[] = [];
  if (imagesStatus.baseUrl) {
    parts.push(imagesStatus.baseUrl);
  }
  if (imagesStatus.timestamp) {
    parts.push(formatHealthTime(imagesStatus.timestamp));
  }
  return parts.join(" | ");
});

const processorOptions = computed(() => {
  return Array.isArray(catalog.value?.processors?.available) ? catalog.value?.processors?.available : [];
});

const selectedProcessorLabel = computed(() => {
  const matched = processorOptions.value.find((item) => item.id === form.processorId);
  if (matched) {
    return matched.label || matched.id;
  }
  return form.processorId || "";
});

const createSourcePreview = computed(() => {
  if (form.sourceType === "upload") {
    return sourceFilePreviewUrl.value;
  }
  return String(form.imageUrl || "").trim();
});

const hasSourceContext = computed(() => {
  return !!(form.sourceModule || form.sourceRecordId || form.sourceName);
});

const groupedOperations = computed(() => {
  const groups = new Map<string, any[]>();

  for (const operation of operations.value) {
    const category = String(operation?.category || "default");
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)?.push(operation);
  }

  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    label: categoryLabelMap[category] || category,
    items,
  }));
});

const canSubmitCreate = computed(() => {
  if (imagesStatus.checked && !imagesStatus.available) {
    return false;
  }
  if (form.sourceType === "upload") {
    return !!sourceFile.value;
  }
  return /^https?:\/\//i.test(String(form.imageUrl || "").trim());
});

const detailResultFiles = computed(() => {
  return Array.isArray(currentRow.value?.resultFiles) ? currentRow.value.resultFiles : [];
});

const detailImportableIndexes = computed(() => {
  return getImportableResultIndexes(currentRow.value);
});

const requestPreviewJson = computed(() => {
  return formatJson(buildCreateRequestPreview());
});

const gridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: Math.max(height.value - 250, 420),
  rowConfig: { keyField: "id" },
  columns: [
    { type: "checkbox", width: 50 },
    { title: "原图", field: "sourceImageUrl", width: 190, slots: { default: "sourceSlot" } },
    { title: "标题", field: "title", minWidth: 280, slots: { default: "titleSlot" } },
    { title: "任务类型", field: "taskType", width: 118, slots: { default: "taskTypeSlot" } },
    { title: "状态", field: "status", width: 120, slots: { default: "statusSlot" } },
    { title: "结果", field: "resultFiles", minWidth: 200, slots: { default: "resultSlot" } },
    {
      title: "上传者",
      field: "uploader",
      width: 140,
      formatter: ({ row }: any) =>
        row?.uploader?.account || row?.uploader?.name || row?.userId || "-",
    },
    { ...buildTimeColumn("创建时间", "createTime", 180), slots: { default: "createTimeSlot" } },
    buildOperationColumn("operationDefaultSlot"),
  ],
}));

const categoryLabelMap: Record<string, string> = {
  basic: "基础操作",
  effect: "图片效果",
};

watch(
  () => form.taskType,
  (taskType) => {
    if (taskType === "process") {
      syncDefaultOperationsJson();
    }
  },
);

function handleKeywordChange(value: string) {
  if (!value) {
    getList();
  }
}

function handleCheckboxChange({ records }: any) {
  selectedRows.value = records || [];
}

function handleCheckboxAll({ records }: any) {
  selectedRows.value = records || [];
}

function getTaskTypeLabel(taskType?: string) {
  return taskType === "variations" ? "图片裂变" : "图片处理";
}

function getStatusLabel(status?: string) {
  const labelMap: Record<string, string> = {
    pending: "待处理",
    processing: "处理中",
    success: "成功",
    partial: "部分成功",
    failed: "失败",
  };
  return labelMap[status || ""] || status || "-";
}

function getStatusTagType(status?: string) {
  if (status === "success") return "success";
  if (status === "partial" || status === "processing") return "warning";
  if (status === "failed") return "danger";
  return "info";
}

function getSourcePreview(row: any) {
  return row?.sourceImageUrl || row?.sourceOriginalUrl || "";
}

function getFirstResultUrl(row: any) {
  const files = Array.isArray(row?.resultFiles) ? row.resultFiles : [];
  const first = files.find((item: any) => item?.success && item?.url);
  return first?.url || "";
}

function getResultSummary(row: any) {
  const files = Array.isArray(row?.resultFiles) ? row.resultFiles : [];
  const successCount = files.filter((item: any) => item?.success).length;
  if (!files.length) {
    return "0 个结果";
  }
  return `${successCount}/${files.length} 个已归档`;
}

function openUrl(url?: string) {
  const normalized = String(url || "").trim();
  if (!normalized) return;
  window.open(normalized, "_blank", "noopener,noreferrer");
}

function openRowSource(row: any) {
  openUrl(getSourcePreview(row));
}

function openFirstResult(row: any) {
  openUrl(getFirstResultUrl(row));
}

function revokeSourcePreviewUrl() {
  if (sourceFilePreviewUrl.value && sourceFilePreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(sourceFilePreviewUrl.value);
  }
  sourceFilePreviewUrl.value = "";
}

function resetSourceUpload() {
  sourceFile.value = null;
  sourceFileName.value = "";
  if (sourceUploadRef.value?.clearFiles) {
    sourceUploadRef.value.clearFiles();
  }
  revokeSourcePreviewUrl();
}

function resetForm() {
  form.title = "";
  form.taskType = "process";
  form.sourceType = "upload";
  form.imageUrl = "";
  form.processorId = "";
  form.operationsJson = EMPTY_OPERATIONS_JSON;
  form.sourceModule = "";
  form.sourceRecordId = "";
  form.sourceName = "";
  resetSourceUpload();
}

function handleSourceTypeChange(value: string) {
  if (value === "upload") {
    form.imageUrl = "";
    return;
  }
  resetSourceUpload();
}

function handleSourceFileChange(uploadFile: any) {
  const rawFile = uploadFile?.raw || uploadFile;
  if (!(rawFile instanceof File)) {
    return;
  }

  sourceFile.value = rawFile;
  sourceFileName.value = rawFile.name || "";
  revokeSourcePreviewUrl();
  sourceFilePreviewUrl.value = URL.createObjectURL(rawFile);
  form.sourceType = "upload";
}

function handleSourceFileExceed() {
  ElMessage.warning("一次只支持上传 1 张图片");
}

function fillDefaultOperations() {
  syncDefaultOperationsJson({ force: true });
}

function formatOperationsJson() {
  const raw = String(form.operationsJson || "").trim();
  if (!raw) {
    syncDefaultOperationsJson({ force: true });
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      ElMessage.error("处理 JSON 必须是数组");
      return;
    }
    form.operationsJson = JSON.stringify(parsed, null, 2);
  } catch (error: any) {
    ElMessage.error(`JSON 格式错误：${error?.message || error}`);
  }
}

function getRequiredParamNames(operation: any) {
  const params = operation?.params || {};
  return Object.entries(params)
    .filter(([, definition]: any) => !!definition?.required)
    .map(([key]) => key);
}

function getOperationParamSummary(operation: any) {
  const paramNames = Object.keys(operation?.params || {});
  if (!paramNames.length) {
    return "无需额外参数";
  }
  return `参数：${paramNames.join(", ")}`;
}

function cloneParamDefaultValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneParamDefaultValue(item)) as T;
  }
  if (value && typeof value === "object") {
    return { ...(value as Record<string, any>) } as T;
  }
  return value;
}

function resolveOperationParamDefault(definition: any) {
  if (definition?.default !== undefined) {
    return cloneParamDefaultValue(definition.default);
  }
  if (Array.isArray(definition?.enum) && definition.enum.length) {
    return cloneParamDefaultValue(definition.enum[0]);
  }
  if (definition?.type === "number" && definition?.minimum !== undefined) {
    return Number(definition.minimum);
  }
  if (!definition?.required) {
    return undefined;
  }
  if (definition.type === "boolean") {
    return false;
  }
  if (definition.type === "array") {
    return [];
  }
  if (definition.type === "object") {
    return {};
  }
  return "";
}

function formatOperationParamValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(" / ");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  return String(value);
}

function getOperationParamRows(operation: any) {
  const params = operation?.params || {};
  return Object.entries(params as Record<string, any>).map(([name, definition]) => {
    const metaParts = [
      definition?.type || "any",
      definition?.required ? "必填" : "可选",
    ];

    if (definition?.default !== undefined) {
      metaParts.push(`默认 ${formatOperationParamValue(definition.default)}`);
    } else if (definition?.type === "number" && definition?.minimum !== undefined) {
      metaParts.push(`建议起始 ${definition.minimum}`);
    }

    if (definition?.minimum !== undefined || definition?.maximum !== undefined) {
      metaParts.push(
        `范围 ${definition?.minimum ?? "-"} ~ ${definition?.maximum ?? "-"}`
      );
    }

    if (Array.isArray(definition?.enum) && definition.enum.length) {
      metaParts.push(`枚举 ${definition.enum.join(" / ")}`);
    }

    return {
      name,
      description: definition?.description || "无说明",
      meta: metaParts.join(" · "),
    };
  });
}

function buildOperationTemplate(operation: any) {
  const template: Record<string, any> = {
    type: operation?.apiType || operation?.type,
  };
  const params = operation?.params || {};
  const paramValues: Record<string, any> = {};

  for (const [key, definition] of Object.entries(params as Record<string, any>)) {
    const defaultValue = resolveOperationParamDefault(definition);
    if (defaultValue !== undefined) {
      paramValues[key] = defaultValue;
    }
  }

  if (Object.keys(paramValues).length) {
    template.params = paramValues;
  }

  return template;
}

function isEmptyOperationTemplateJson(value?: string) {
  const raw = String(value || "").trim();
  if (!raw) {
    return true;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length === 0;
  } catch {
    return false;
  }
}

function resolveDefaultOperationsJson() {
  const firstOperation = operations.value[0];
  if (!firstOperation) {
    return EMPTY_OPERATIONS_JSON;
  }
  return JSON.stringify([buildOperationTemplate(firstOperation)], null, 2);
}

function syncDefaultOperationsJson(options: { force?: boolean } = {}) {
  if (form.taskType !== "process") {
    return;
  }

  if (options.force || isEmptyOperationTemplateJson(form.operationsJson)) {
    form.operationsJson = resolveDefaultOperationsJson();
  }
}

function cleanupRoutePrefill() {
  clearImageProcessingRoutePrefill(route.query);
  const nextQuery = stripImageProcessingPrefillQuery(route.query);
  router.replace({ path: route.path, query: nextQuery });
}

function applyRoutePrefill() {
  const prefill = resolveImageProcessingRoutePrefill(route.query);
  const signature = buildImageProcessingPrefillSignature(prefill);

  if (!prefill?.imageUrl || !signature || lastAppliedPrefillSignature.value === signature) {
    return;
  }

  lastAppliedPrefillSignature.value = signature;
  resetForm();
  form.sourceType = "url";
  form.imageUrl = prefill.imageUrl;
  form.taskType = prefill.taskType || "process";
  form.title = prefill.title || prefill.sourceName || "";
  form.sourceModule = prefill.sourceModule || "";
  form.sourceRecordId = prefill.sourceRecordId || "";
  form.sourceName = prefill.sourceName || "";
  syncDefaultOperationsJson({ force: true });

  if (prefill.openCreate !== false) {
    createVisible.value = true;
    void refreshPageMeta();
  }

  cleanupRoutePrefill();
}

function appendOperationTemplate(operation: any) {
  const raw = String(form.operationsJson || "").trim();
  let parsed: any[] = [];

  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch (error: any) {
      ElMessage.error(`当前 JSON 不合法，无法插入模板：${error?.message || error}`);
      return;
    }
  }

  if (!Array.isArray(parsed)) {
    ElMessage.error("当前 JSON 必须是数组，才能追加操作模板");
    return;
  }

  parsed.push(buildOperationTemplate(operation));
  form.operationsJson = JSON.stringify(parsed, null, 2);
}

function formatJson(value: any) {
  if (value === null || value === undefined || value === "") {
    return "{}";
  }
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseOperationsJsonSafe(rawValue: string) {
  const raw = String(rawValue || "").trim();
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed;
  } catch (error) {
    return raw;
  }
}

function buildCreateRequestPreview() {
  return {
    title: String(form.title || "").trim() || null,
    taskType: form.taskType,
    processorId: String(form.processorId || "").trim() || null,
    source: {
      type: form.sourceType,
      imageUrl: form.sourceType === "url" ? String(form.imageUrl || "").trim() || null : null,
      uploadFileName:
        form.sourceType === "upload" ? String(sourceFileName.value || "").trim() || null : null,
      sourceModule: String(form.sourceModule || "").trim() || null,
      sourceRecordId: String(form.sourceRecordId || "").trim() || null,
      sourceName: String(form.sourceName || "").trim() || null,
    },
    request:
      form.taskType === "process"
        ? {
            operations: parseOperationsJsonSafe(form.operationsJson),
          }
        : {
            variationCount: variations.value.length,
            variationNames: variations.value.map((item) => item?.name).filter(Boolean),
          },
    flow: [
      "design-server 归档源图到 COS",
      "yishe-images 执行真实图片处理",
      "design-server 归档结果到 COS 并写入记录",
    ],
  };
}

function formatHealthTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

watch(
  () => route.fullPath,
  () => {
    applyRoutePrefill();
  },
  { immediate: true },
);

async function refreshPageMeta() {
  await Promise.allSettled([refreshServiceHealth("images"), loadMeta(true)]);
}

async function loadMeta(silent = false) {
  if (!silent) {
    metaLoading.value = true;
  }

  try {
    const result: any = await getImageProcessingMeta();
    catalog.value = result?.catalog || null;
    operations.value = Array.isArray(result?.operations) ? result.operations : [];
    variations.value = Array.isArray(result?.variations) ? result.variations : [];
    syncDefaultOperationsJson();
  } catch (error: any) {
    catalog.value = null;
    operations.value = [];
    variations.value = [];
    ElMessage.error(error?.message || "获取图片服务元数据失败");
  } finally {
    metaLoading.value = false;
  }
}

async function loadImportFolders(force = false) {
  if (importFolderLoading.value) {
    return;
  }

  if (!force && importFolderOptions.value.length) {
    return;
  }

  importFolderLoading.value = true;
  try {
    const result: any = await getStickerFolderList({ folderCategory: "sticker" });
    importFolderOptions.value = Array.isArray(result) ? result : [];
  } catch (error: any) {
    importFolderOptions.value = [];
    ElMessage.error(error?.message || "获取素材文件夹失败");
  } finally {
    importFolderLoading.value = false;
  }
}

async function getList() {
  loading.value = true;
  selectedRows.value = [];
  try {
    const result: any = await getImageProcessingRecordPage({ ...queryParams });
    dataSource.value = result?.list || result?.records || [];
    total.value = result?.total || 0;
  } catch (error: any) {
    dataSource.value = [];
    total.value = 0;
    ElMessage.error(error?.message || "获取图片处理记录失败");
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  resetForm();
  createVisible.value = true;
  void refreshPageMeta();
}

function canImportResultFile(file: any) {
  return !!(file?.success && file?.url && !file?.adoptedStickerId);
}

function getImportableResultIndexes(row: any) {
  const files = Array.isArray(row?.resultFiles) ? row.resultFiles : [];
  return files
    .map((file: any, index: number) => (canImportResultFile(file) ? index : -1))
    .filter((index: number) => index >= 0);
}

function resetDetailImportState() {
  selectedResultIndexes.value = [];
  importFolderId.value = "";
}

function toggleResultSelection(index: number, checked: boolean) {
  const next = new Set(selectedResultIndexes.value);
  if (checked) {
    next.add(index);
  } else {
    next.delete(index);
  }
  selectedResultIndexes.value = Array.from(next).sort((a, b) => a - b);
}

function selectAllImportableResults() {
  selectedResultIndexes.value = [...detailImportableIndexes.value];
}

async function prepareDetailState(row: any) {
  currentRow.value = row;
  resetDetailImportState();
  selectAllImportableResults();
  await loadImportFolders();
}

async function submitCreate() {
  if (!canSubmitCreate.value) {
    ElMessage.warning("请先补全图片来源");
    return;
  }

  if (form.taskType === "process") {
    const raw = String(form.operationsJson || "").trim();
    if (!raw) {
      ElMessage.warning("请填写处理 JSON");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) {
        ElMessage.warning("处理 JSON 必须是非空数组");
        return;
      }
      form.operationsJson = JSON.stringify(parsed, null, 2);
    } catch (error: any) {
      ElMessage.error(`处理 JSON 格式错误：${error?.message || error}`);
      return;
    }
  }

  submitLoading.value = true;
  try {
    await refreshServiceHealth("images");
    if (imagesStatus.checked && !imagesStatus.available) {
      ElMessage.error("图片处理服务不可用，请先恢复服务后再提交");
      return;
    }

    const payload = new FormData();
    if (String(form.title || "").trim()) {
      payload.append("title", String(form.title).trim());
    }
    payload.append("taskType", form.taskType);
    if (String(form.processorId || "").trim()) {
      payload.append("processorId", String(form.processorId).trim());
    }
    if (String(form.sourceModule || "").trim()) {
      payload.append("sourceModule", String(form.sourceModule).trim());
    }
    if (String(form.sourceRecordId || "").trim()) {
      payload.append("sourceRecordId", String(form.sourceRecordId).trim());
    }
    if (String(form.sourceName || "").trim()) {
      payload.append("sourceName", String(form.sourceName).trim());
    }
    if (form.taskType === "process") {
      payload.append("operationsJson", form.operationsJson);
    }

    if (form.sourceType === "upload" && sourceFile.value) {
      payload.append("sourceFile", sourceFile.value);
    } else {
      payload.append("imageUrl", String(form.imageUrl || "").trim());
    }

    const result: any = await createImageProcessingRecord(payload);
    createVisible.value = false;
    await getList();

    if (result?.status === "failed") {
      await prepareDetailState(result);
      detailVisible.value = true;
      ElMessage.error(result?.errorMessage || "图片处理失败");
      return;
    }

    if (result?.status === "partial") {
      await prepareDetailState(result);
      detailVisible.value = true;
      ElMessage.warning("任务已完成，但部分结果处理失败");
      return;
    }

    ElMessage.success("图片处理完成，结果已归档到 COS");
  } catch (error: any) {
    ElMessage.error(error?.message || "创建图片处理任务失败");
  } finally {
    submitLoading.value = false;
  }
}

async function openDetail(row: any) {
  try {
    const result: any = await getImageProcessingRecordDetail(row.id);
    await prepareDetailState(result);
    detailVisible.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || "获取详情失败");
  }
}

async function importSelectedResults() {
  if (!currentRow.value?.id) {
    ElMessage.warning("当前没有可导入的记录");
    return;
  }

  if (!selectedResultIndexes.value.length) {
    ElMessage.warning("请先选择要导入素材库的结果");
    return;
  }

  importLoading.value = true;
  try {
    const result: any = await importImageProcessingResults(currentRow.value.id, {
      resultIndexes: selectedResultIndexes.value,
      folderId: importFolderId.value || null,
    });

    const createdCount = Array.isArray(result?.created) ? result.created.length : 0;
    const skippedCount = Array.isArray(result?.skipped) ? result.skipped.length : 0;
    const failedCount = Array.isArray(result?.failed) ? result.failed.length : 0;

    const refreshed: any = await getImageProcessingRecordDetail(currentRow.value.id);
    await prepareDetailState(refreshed);
    await getList();

    if (failedCount) {
      ElMessage.warning(
        `已导入 ${createdCount} 个结果，跳过 ${skippedCount} 个，失败 ${failedCount} 个`,
      );
      return;
    }

    if (!createdCount && skippedCount) {
      ElMessage.warning(`没有新增素材，已跳过 ${skippedCount} 个结果`);
      return;
    }

    ElMessage.success(`已导入 ${createdCount} 个结果到素材库`);
  } catch (error: any) {
    ElMessage.error(error?.message || "导入素材库失败");
  } finally {
    importLoading.value = false;
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除记录「${row.title || row.id}」吗？`, "删除确认", {
      type: "warning",
    });
    await deleteImageProcessingRecord(row.id);
    if (currentRow.value?.id === row.id) {
      detailVisible.value = false;
      currentRow.value = null;
      resetDetailImportState();
    }
    ElMessage.success("删除成功");
    await getList();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "删除图片处理记录失败");
    }
  }
}

async function handleBatchDelete() {
  if (!selectedRows.value.length) {
    ElMessage.warning("请选择要删除的记录");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedRows.value.length} 条记录吗？`,
      "批量删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    loading.value = true;
    const ids = selectedRows.value.map((item: any) => item.id);
    const result: any = await batchDeleteImageProcessingRecord(ids);

    if (result?.failed?.length) {
      ElMessage.warning(`部分删除失败：${result.failed.length} 条`);
    } else {
      ElMessage.success(`成功删除 ${result?.successIds?.length || ids.length} 条记录`);
    }

    selectedRows.value = [];
    await getList();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "批量删除失败");
    }
  } finally {
    loading.value = false;
  }
}

function handleOperationCommand(command: string, row: any) {
  if (command === "detail") {
    openDetail(row);
    return;
  }
  if (command === "delete") {
    handleDelete(row);
  }
}

onMounted(async () => {
  await Promise.allSettled([loadMeta(), getList(), refreshServiceHealth("images")]);
});

onBeforeUnmount(() => {
  revokeSourcePreviewUrl();
});
</script>

<style scoped>
:deep(.image-processing-record-page) {
  gap: 10px;
  padding: 8px 0 0;
}

:deep(.image-processing-record-page .list-page-layout__main) {
  gap: 10px;
}

:deep(.image-processing-record-page .list-page-filter--flat) {
  gap: 10px;
  padding-bottom: 10px;
}

:deep(.image-processing-record-page .list-page-table-panel__pagination--flat) {
  padding-top: 10px;
}

.image-processing-record-page__status-bar {
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: flex-start;
  gap: 10px;
}

.image-processing-record-page__status-content {
  display: flex;
  min-width: 0;
  flex: 1;
  max-width: 420px;
  flex-direction: column;
  gap: 2px;
}

.image-processing-record-page__status-text,
.image-processing-record-page__status-detail {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-processing-record-page__status-text {
  color: var(--el-text-color-primary);
  line-height: 1.5;
}

.image-processing-record-page__status-detail {
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.image-record-source-cell,
.image-record-result-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.image-record-title-cell,
.image-record-source-meta,
.image-record-result-meta {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.image-record-thumb,
.image-record-result-thumb {
  display: flex;
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  cursor: pointer;
}

.image-record-thumb img,
.image-record-result-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-record-thumb__placeholder {
  padding: 0 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
  line-height: 1.5;
}

.image-record-source-type,
.image-record-result-engine,
.image-record-title-sub {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.image-record-source-name,
.image-record-title-main,
.image-record-result-count {
  color: var(--el-text-color-primary);
  font-weight: 500;
  word-break: break-word;
}

.image-record-result-thumb.is-empty {
  cursor: default;
}

:deep(.image-processing-create-dialog .el-dialog__body),
:deep(.image-processing-detail-dialog .el-dialog__body) {
  height: calc(100vh - 70px);
  padding-top: 12px;
  overflow: hidden;
}

.image-processing-create-layout {
  display: grid;
  height: 100%;
  grid-template-columns: 340px minmax(0, 1fr) 400px;
  gap: 16px;
}

.image-processing-create-banner {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  min-height: 0;
  padding: 2px 2px 0;
}

.image-processing-create-banner__title {
  color: var(--el-text-color-primary);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.2;
}

.image-processing-panel-card {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
}

:deep(.image-processing-panel-card .el-card__body) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 18px 18px;
}

.image-processing-panel-scroll {
  min-height: 0;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 4px;
}

.image-processing-panel-scroll--column {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.image-processing-form,
.image-processing-json-editor {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 0;
}

.image-processing-full-width {
  width: 100%;
}

.image-processing-select-option {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.image-processing-source-file,
.image-processing-source-tip,
.image-processing-panel-tip,
.image-processing-submit-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.image-processing-source-context,
.image-processing-request-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: var(--el-fill-color-extra-light);
  padding: 12px;
}

.image-processing-source-context__title,
.image-processing-request-preview__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.image-processing-source-context__item {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.image-processing-source-context__item .label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.image-processing-source-context__item .value {
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.image-processing-preview-card {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 12px;
}

.image-processing-preview-card__title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.image-processing-preview-card__body {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  background: var(--el-fill-color-light);
}

.image-processing-preview-card__image {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
}

.image-processing-preview-card__empty,
.image-processing-empty-state,
.image-processing-result-card__empty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  text-align: center;
  line-height: 1.6;
}

.image-processing-panel-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.image-processing-json-editor {
  min-height: 0;
  flex: 1;
}

:deep(.image-processing-json-editor .el-textarea) {
  display: flex;
  min-height: 0;
  flex: 1;
}

:deep(.image-processing-json-editor .el-textarea__inner) {
  height: 100%;
  min-height: 420px !important;
  line-height: 1.65;
}

.image-processing-variation-list,
.image-processing-op-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.image-processing-variation-card,
.image-processing-op-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: var(--el-bg-color);
  padding: 16px 18px;
}

.image-processing-variation-card__header,
.image-processing-op-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.image-processing-variation-card__title,
.image-processing-op-card__title,
.image-processing-op-group__title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.image-processing-variation-card__desc,
.image-processing-op-card__desc,
.image-processing-op-card__meta,
.image-processing-op-card__params {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
  padding-inline: 2px;
}

.image-processing-variation-card__json,
.image-processing-json-block {
  margin: 0;
  overflow: auto;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  padding: 12px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.image-processing-op-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-processing-op-card__param-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-processing-op-card__param-item {
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
  padding: 12px 14px;
}

.image-processing-op-card__param-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
}

.image-processing-op-card__param-head .name {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.image-processing-op-card__param-head .meta,
.image-processing-op-card__param-desc {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.image-processing-op-group__title span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 400;
}

.image-processing-submit-alert {
  margin-top: 4px;
}

.image-processing-submit-summary {
  display: grid;
  gap: 10px;
}

.image-processing-submit-summary__item,
.image-processing-detail-summary__item {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.image-processing-submit-summary__item .label,
.image-processing-detail-summary__item .label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.image-processing-submit-summary__item .value,
.image-processing-detail-summary__item .value {
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.image-processing-detail-summary__item .value--wrap {
  overflow-wrap: anywhere;
}

.image-processing-detail-summary__item .value--error {
  color: var(--el-color-danger);
}

.image-processing-create-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
}

.image-processing-create-actions__buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.image-processing-detail-layout {
  display: grid;
  height: 100%;
  grid-template-columns: 320px minmax(0, 1fr) 420px;
  gap: 16px;
}

.image-processing-detail-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-processing-result-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.image-processing-result-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
  padding: 12px;
}

.image-processing-result-toolbar__selection,
.image-processing-result-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.image-processing-result-toolbar__selection {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.image-processing-result-toolbar__folder {
  width: 320px;
  max-width: 100%;
}

.image-processing-result-card {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: var(--el-bg-color);
}

.image-processing-result-card.is-failed {
  border-color: rgba(245, 108, 108, 0.35);
}

.image-processing-result-card.is-imported {
  border-color: rgba(103, 194, 58, 0.35);
}

.image-processing-result-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 10px 12px 8px;
}

.image-processing-result-card__thumb {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--el-fill-color-light);
  cursor: pointer;
}

.image-processing-result-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-processing-result-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
}

.image-processing-result-card__title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.image-processing-result-card__meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.image-processing-result-card__meta.is-mono {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.image-processing-result-card__error {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1.6;
}

.image-processing-result-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.image-processing-detail-json-column {
  display: grid;
  min-height: 0;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1440px) {
  .image-processing-create-layout {
    grid-template-columns: 320px minmax(0, 1fr) 360px;
  }

  .image-processing-detail-layout {
    grid-template-columns: 300px minmax(0, 1fr) 360px;
  }
}

@media (max-width: 1200px) {
  .image-processing-create-layout,
  .image-processing-detail-layout {
    display: flex;
    flex-direction: column;
  }

  :deep(.image-processing-create-dialog .el-dialog__body),
  :deep(.image-processing-detail-dialog .el-dialog__body) {
    overflow-y: auto;
  }

  .image-processing-detail-json-column {
    grid-template-rows: none;
  }
}

@media (max-width: 768px) {
  .image-record-source-cell,
  .image-record-result-cell {
    align-items: flex-start;
  }

  .image-processing-create-actions__buttons {
    justify-content: stretch;
  }

  .image-processing-create-actions__buttons .el-button {
    flex: 1;
  }

  .image-processing-result-toolbar__folder {
    width: 100%;
  }
}
</style>
