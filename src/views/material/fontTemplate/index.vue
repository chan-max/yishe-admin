<template>
  <ContentWrap :plain="true">
    <ListPageLayout
      class="font-template-page"
      :sidebar-width="folderTreeCollapsed ? '28px' : '280px'"
    >
      <template #filter>
        <div class="list-page-filter list-page-filter--flat">
          <el-form :model="queryParams" label-position="top" class="list-page-search-form">
            <el-row :gutter="12" class="list-page-search-form__row">
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="10" :lg="8">
                <el-form-item label="搜索">
                  <el-input
                    v-model="queryParams.searchKeyword"
                    size="small"
                    placeholder="搜索字体 ID、名称、描述、关键字"
                    clearable
                    @keyup.enter="handleSearch"
                    @clear="handleSearch"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col class="list-page-search-form__col--wide" :xs="24" :sm="12" :md="8" :lg="6">
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
                @click="handleSearch"
                :icon="Search"
                :loading="loading"
                >搜索</el-button
              >
              <el-button size="small" :disabled="loading" @click="handleReset">重置</el-button>
              <el-button v-if="isAdmin" size="small" type="primary" @click="handleAdd" :icon="Plus">
                新增字体
              </el-button>
              <el-dropdown
                v-if="isAdmin"
                trigger="click"
                :disabled="batchGenerateThumbnailLoading"
                @command="handleBatchGenerateThumbnailCommand"
              >
                <el-button
                  size="small"
                  type="primary"
                  :loading="batchGenerateThumbnailLoading"
                >
                  <template v-if="batchGenerateThumbnailLoading">
                    生成中 {{ batchGenerateThumbnailProgress.processed }}/{{
                      batchGenerateThumbnailProgress.total
                    }}
                  </template>
                  <template v-else>
                    批量生成 {{ ids.length ? `(${ids.length})` : "" }}
                  </template>
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="thumbnail-only">仅生成缩略图</el-dropdown-item>
                    <el-dropdown-item command="thumbnail-ai">
                      生成缩略图并 AI 补全
                    </el-dropdown-item>
                    <el-dropdown-item command="ai-only" :disabled="!ids.length">
                      仅 AI 补全选中项
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button
                v-if="batchGenerateThumbnailLoading"
                size="small"
                type="warning"
                @click="cancelBatchGenerateThumbnail"
              >
                取消生成
              </el-button>
              <el-button
                v-if="isAdmin"
                size="small"
                type="danger"
                @click="handleBatchDelete"
                :disabled="!ids.length"
                :loading="batchDeleteLoading"
              >
                批量删除 ({{ ids.length }})
              </el-button>
              <el-dropdown
                v-if="isAdmin"
                trigger="click"
                :disabled="!ids.length"
                @command="handleBatchActionCommand"
              >
                <el-button size="small" type="success" :disabled="!ids.length">
                  批量操作 ({{ ids.length }})
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="copy-to-user">
                      <el-icon><DocumentCopy /></el-icon>
                      <span>分享给用户</span>
                    </el-dropdown-item>
                    <el-dropdown-item command="move-to-user">
                      <el-icon><TopRight /></el-icon>
                      <span>转移给用户</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </el-form>
        </div>
      </template>

      <template #sidebar>
        <div
          class="list-page-panel list-page-panel--flat list-page-sidebar font-template-sidebar folder-sidebar-shell"
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
                  class="font-template-dnd-grid dnd-text-selectable"
                  v-bind="gridOptions"
                  :data="dataSource"
                  :loading="loading"
                  @checkbox-change="checkboxChange"
                  @checkbox-all="checkboxAllChange"
                >
                  <template #dragHandleSlot>
                    <TableRowDragHandle />
                  </template>
                  <template #thumbnailDefaultSlot="{ row }">
                    <div class="flex items-center justify-center p-2">
                      <img
                        v-if="row.thumbnail"
                        :src="row.thumbnail"
                        :alt="row.name || '字体缩略图'"
                        loading="lazy"
                        style="
                          width: 160px;
                          height: auto;
                          object-fit: contain;
                          background: #f5f5f5;
                          cursor: pointer;
                          border-radius: 8px;
                          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        "
                        @click="openThumbnailPreview(row.thumbnail, row.name)"
                        @error="handleThumbnailError"
                      />
                      <div
                        v-else
                        class="w-40 h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm"
                      >
                        无缩略图
                      </div>
                    </div>
                  </template>

                  <template #languagesSlot="{ row }">
                    <div class="flex flex-wrap gap-1">
                      <el-tag
                        v-for="langCode in row.languages || []"
                        :key="langCode"
                        size="small"
                        type="info"
                        class="language-tag"
                      >
                        <span>{{ getLanguageByCode(langCode)?.label || langCode }}</span>
                        <el-tooltip
                          v-if="getLanguageByCode(langCode)"
                          :content="`${getLanguageByCode(langCode)?.example} - ${getLanguageByCode(langCode)?.chineseName}`"
                          placement="top"
                        >
                          <el-icon class="ml-1" style="font-size: 12px">
                            <InfoFilled />
                          </el-icon>
                        </el-tooltip>
                      </el-tag>
                      <span
                        v-if="!row.languages || row.languages.length === 0"
                        class="text-gray-400 text-xs"
                        >未设置</span
                      >
                    </div>
                  </template>

                  <template #operationDefaultSlot="{ row }">
                    <div class="flex items-center">
                      <el-dropdown
                        trigger="click"
                        @command="(command) => handleOperationCommand(command, row)"
                        class="operation-dropdown"
                      >
                        <el-button type="primary" link size="small" class="operation-trigger-button"
                          >操作</el-button
                        >
                        <template #dropdown>
                          <el-dropdown-menu class="operation-menu-compact">
                            <el-dropdown-item v-if="isAdmin" command="edit">
                              <el-icon>
                                <Edit />
                              </el-icon>
                              <span>编辑</span>
                            </el-dropdown-item>
                            <el-dropdown-item v-if="isAdmin" command="generate-thumbnail">
                              <el-icon>
                                <Picture />
                              </el-icon>
                              <span>生成缩略图</span>
                            </el-dropdown-item>
                            <el-dropdown-item command="download">
                              <el-icon>
                                <Download />
                              </el-icon>
                              <span>下载源文件</span>
                            </el-dropdown-item>
                            <el-dropdown-item command="copy-url">
                              <el-icon>
                                <DocumentCopy />
                              </el-icon>
                              <span>复制源文件地址</span>
                            </el-dropdown-item>
                            <el-dropdown-item v-if="isAdmin" command="ai-generate">
                              <el-icon>
                                <MagicStick />
                              </el-icon>
                              <span>AI生成内容</span>
                            </el-dropdown-item>
                            <el-dropdown-item v-if="isAdmin" command="copy-to-user">
                              <el-icon>
                                <DocumentCopy />
                              </el-icon>
                              <span>分享给用户</span>
                            </el-dropdown-item>
                            <el-dropdown-item v-if="isAdmin" command="move-to-user">
                              <el-icon>
                                <TopRight />
                              </el-icon>
                              <span>转移给用户</span>
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="isAdmin"
                              command="delete"
                              divided
                              class="operation-menu-item--danger"
                            >
                              <el-icon>
                                <Delete />
                              </el-icon>
                              <span>删除</span>
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                      <el-icon
                        v-if="aiTableLoading?.[row?.id]"
                        class="is-loading ml-2"
                        style="color: #67c23a; font-size: 18px"
                      />
                    </div>
                  </template>

                  <template #urlDefaultSlot="{ row }">
                    <div class="flex items-center gap-2">
                      <span class="truncate flex-1">{{ row.url }}</span>
                      <el-button
                        type="primary"
                        link
                        size="small"
                        @click="copyUrl(row.url)"
                        class="shrink-0"
                      >
                        复制
                      </el-button>
                    </div>
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
      width="700px"
      @close="dialogClose"
      align-center
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="请输入字体模板描述"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="关键字" prop="keywords">
              <el-input v-model="form.keywords" placeholder="请输入关键字，多个关键字用逗号分隔" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="适用语言" prop="languages">
              <el-select
                v-model="form.languages"
                multiple
                filterable
                placeholder="请选择适用语言（可多选）"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="lang in LANGUAGE_OPTIONS"
                  :key="lang.code"
                  :label="`${lang.label} (${lang.example}) - ${lang.chineseName}`"
                  :value="lang.code"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <span>{{ lang.label }}</span>
                    <span style="color: #909399; font-size: 12px; margin-left: 8px">
                      {{ lang.example }} - {{ lang.chineseName }}
                    </span>
                  </div>
                </el-option>
              </el-select>
              <div style="margin-top: 8px; font-size: 12px; color: #909399">
                提示：一个字体可以标记多种语言，选择后会在表格中显示语言标签和示例
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="24" v-if="!isEdit">
            <el-form-item label="模板文件" prop="file">
              <el-upload
                style="width: 100%"
                action="#"
                :limit="1"
                :file-list="fileList"
                :on-change="handleFileChange"
                :before-upload="beforeUpload"
                :auto-upload="false"
                :on-remove="handleFileRemove"
                accept=".ttf,.otf,.woff,.woff2"
              >
                <el-button type="primary">选择字体文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">只能上传字体文件（.ttf, .otf, .woff, .woff2）</div>
                </template>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
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
      <div style="margin-bottom: 16px; color: #888; font-size: 15px">
        请输入你希望AI分析的内容维度（默认已包含字体风格、字重、适用场景、设计特点等详细分析维度，可自行修改）
      </div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="请从字体风格、字重、情感调性、适用场景、设计特点等维度进行分析..."
        style="font-size: 16px; min-height: 120px; width: 100%; resize: vertical"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <!-- 批量AI补全弹窗 -->
    <el-dialog
      v-model="batchAiDialogVisible"
      title="批量AI补全内容"
      width="600px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #888; font-size: 15px">
        将为选中的 <strong>{{ ids.length }}</strong> 个字体模板进行AI内容补全
      </div>
      <el-input
        v-model="batchAiPrompt"
        type="textarea"
        :rows="6"
        placeholder="请输入统一的AI分析提示词，已预设详细分析维度，可自行修改..."
        style="font-size: 16px; min-height: 120px; width: 100%; resize: vertical"
      />

      <!-- 进度显示 -->
      <div v-if="batchProgress.total > 0" style="margin-top: 16px">
        <div
          style="
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <span>处理进度</span>
          <span>{{ batchProgress.processed }}/{{ batchProgress.total }}</span>
        </div>
        <el-progress
          :percentage="Math.round((batchProgress.processed / batchProgress.total) * 100)"
          :status="batchProgress.processed === batchProgress.total ? 'success' : ''"
        />
        <div style="margin-top: 8px; font-size: 12px; color: #909399">
          成功: {{ batchProgress.success }} | 失败: {{ batchProgress.failed }}
        </div>
      </div>

      <div
        style="
          margin-top: 16px;
          padding: 12px;
          background: #f5f7fa;
          border-radius: 4px;
          font-size: 14px;
          color: #606266;
        "
      >
        <div style="margin-bottom: 8px"><strong>操作说明：</strong></div>
        <div>• 系统将分批处理，每批5个，避免API限流</div>
        <div>• 处理过程中会显示进度和结果</div>
        <div>• 失败的项会单独记录，不影响其他项</div>
        <div style="margin-top: 8px; color: #e6a23c"><strong>注意事项：</strong></div>
        <div>• 确保选中的字体模板都有缩略图</div>
        <div>• 如果AI分析失败，可能是图片内容不清晰或格式不支持</div>
        <div>• 系统会自动重试失败的项，提高成功率</div>
        <div>• 默认已预设详细分析维度（风格、字重、适用场景、设计特点等），可直接使用或自定义修改</div>
      </div>
      <template #footer>
        <el-button @click="batchAiDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchAiDialogLoading" @click="submitBatchAiDialog"
          >开始批量补全</el-button
        >
      </template>
    </el-dialog>

    <!-- 生成缩略图弹窗 -->
    <el-dialog
      v-model="generateThumbnailDialogVisible"
      title="生成字体模板缩略图"
      fullscreen
      align-center
      :destroy-on-close="true"
      @close="resetFontPreview"
    >
      <el-form
        :model="thumbnailForm"
        :rules="thumbnailRules"
        ref="thumbnailFormRef"
        label-width="100px"
      >
        <!-- 基本信息行 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="模板名称">
              <el-input v-model="currentRow.name" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字体文件">
              <el-input v-model="currentRow.url" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="模板文字" prop="templateText">
          <div style="margin-bottom: 12px">
            <el-select
              v-model="selectedTemplateIndex"
              placeholder="请选择默认模板"
              style="min-width: 300px"
              @change="applyDefaultTemplate"
              clearable
            >
              <el-option
                v-for="(template, index) in defaultTemplates"
                :key="index"
                :label="template.name"
                :value="index"
              />
            </el-select>
          </div>
          <el-input
            v-model="thumbnailForm.templateText"
            type="textarea"
            :rows="10"
            placeholder="请输入用于生成缩略图的模板文字，或从上方选择默认模板"
            style="font-family: monospace; font-size: 13px"
          />
          <div style="margin-top: 8px; font-size: 12px; color: #909399">
            支持换行，每行将显示为不同的文字行。可从上方选择默认模板快速应用，或手动输入自定义文字。
          </div>
        </el-form-item>

        <el-form-item label="图片样式设置">
          <el-row :gutter="16">
            <el-col :span="12">
              <div class="form-item-wrapper">
                <label class="form-label">字体大小</label>
                <el-input-number
                  v-model="thumbnailForm.options.fontSize"
                  :min="20"
                  :max="200"
                  :step="10"
                  style="width: 100%"
                />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="form-item-wrapper">
                <label class="form-label">文字颜色</label>
                <el-color-picker v-model="thumbnailForm.options.textColor" />
              </div>
            </el-col>
          </el-row>

          <div
            style="
              margin-top: 12px;
              padding: 8px;
              background: #f0f9ff;
              border-radius: 4px;
              border-left: 3px solid #3b82f6;
            "
          >
            <div style="font-size: 12px; color: #1e40af; font-weight: 500">智能尺寸</div>
            <div style="font-size: 11px; color: #3b82f6; margin-top: 2px">
              画布尺寸将根据文字内容和字体大小自动计算
            </div>
          </div>
        </el-form-item>

        <el-form-item label="预览效果">
          <div class="preview-container compact">
            <div class="preview-header compact">
              <span>实时预览</span>
              <div v-if="fontLoading" class="font-loading-indicator">
                <el-icon class="is-loading" style="margin-right: 4px; color: #409eff">
                  <Loading />
                </el-icon>
                <span style="color: #409eff; font-size: 12px">字体加载中...</span>
              </div>
            </div>
            <div class="preview-content compact">
              <!-- 预览区域 - 自适应高度 -->
              <div
                v-if="currentRow.url"
                class="preview-image compact single-preview"
                :style="{
                  width: '800px',
                  minHeight: '400px',
                  padding: '24px',
                  color: thumbnailForm.options.textColor,
                  fontSize: Math.min(thumbnailForm.options.fontSize, 80) + 'px',
                  backgroundColor: 'white',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1',
                  fontFamily: loadedFontFamily || 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }"
              >
                <!-- 状态信息区域 -->
                <div style="margin-bottom: 8px; font-size: 10px; color: #909399; flex-shrink: 0">
                  <i class="el-icon-info"></i>
                  <span v-if="fontLoading">
                    <el-icon class="is-loading" style="margin-right: 4px">
                      <Loading />
                    </el-icon>
                    正在加载字体预览...
                  </span>
                  <span v-else-if="!loadedFontFamily">等待加载字体预览...</span>
                  <span v-else>当前使用字体: {{ currentRow.name }}</span>
                </div>

                <!-- 文字内容区域 -->
                <div
                  class="preview-text-content"
                  :style="{
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    wordWrap: 'break-word',
                  }"
                >
                  {{ thumbnailForm.templateText || defaultTemplates[0].content }}
                </div>
              </div>

              <!-- 默认预览区域 -->
              <div
                v-else
                class="preview-image compact"
                :style="{
                  width: '800px',
                  minHeight: '400px',
                  padding: '24px',
                  color: thumbnailForm.options.textColor,
                  fontSize: Math.min(thumbnailForm.options.fontSize, 80) + 'px',
                  backgroundColor: 'white',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }"
              >
                <!-- 状态信息区域 -->
                <div style="margin-bottom: 8px; font-size: 10px; color: #909399; flex-shrink: 0">
                  <i class="el-icon-info"></i>
                  <span v-if="!currentRow.url">请先选择字体模板</span>
                  <span v-else>当前预览使用系统默认字体</span>
                </div>

                <!-- 文字内容区域 -->
                <div
                  class="preview-text-content"
                  :style="{
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    wordWrap: 'break-word',
                  }"
                >
                  {{ thumbnailForm.templateText || defaultTemplates[0].content }}
                </div>
              </div>
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #909399; text-align: center">
              字体预览会自动加载，实时显示字体大小、颜色和字体样式（自适应高度，固定宽度800px，宽高比2:1）
            </div>
          </div>
        </el-form-item>

        <el-form-item label="字体状态检查">
          <div
            style="
              padding: 12px;
              background: #fef3c7;
              border-radius: 4px;
              border-left: 3px solid #f59e0b;
            "
          >
            <div style="margin-bottom: 8px; font-size: 13px; color: #92400e; font-weight: 500">
              字体加载状态：
            </div>
            <div style="font-size: 12px; color: #92400e; line-height: 1.5">
              <div v-if="fontLoading">
                <strong>🔄 字体加载中...</strong>
                <div style="margin-top: 4px; font-size: 11px; color: #d97706">
                  正在加载字体文件，请稍候...
                </div>
              </div>
              <div v-else-if="loadedFontFamily">
                <strong>✅ 字体已加载：</strong>{{ loadedFontFamily }}
                <div style="margin-top: 4px; font-size: 11px; color: #d97706">
                  当前预览区域使用自定义字体，前端生成缩略图将包含此字体效果
                </div>
                <div style="margin-top: 4px; font-size: 11px; color: #059669">
                  💡 提示：字体已正确加载，可以安全使用前端生成功能
                </div>
              </div>
              <div v-else>
                <strong>⚠️ 字体未加载：</strong>当前使用系统默认字体
                <div style="margin-top: 4px; font-size: 11px; color: #d97706">
                  字体预览会自动加载，如果长时间未加载成功，请检查字体文件URL是否可访问
                </div>
                <div style="margin-top: 4px; font-size: 11px; color: #dc2626">
                  ⚠️ 警告：使用系统字体生成缩略图可能无法体现字体模板的真实效果
                </div>
              </div>
            </div>
            <div
              style="
                margin-top: 8px;
                padding: 8px;
                background: rgba(245, 158, 11, 0.1);
                border-radius: 4px;
              "
            >
              <div style="font-size: 11px; color: #92400e">
                <strong>调试信息：</strong>
                <div>字体URL: {{ currentRow.url || "未设置" }}</div>
                <div>
                  加载状态: {{ fontLoading ? "加载中" : loadedFontFamily ? "已加载" : "未加载" }}
                </div>
                <div>字体名称: {{ loadedFontFamily || "系统默认" }}</div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="generateThumbnailDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="frontendGenerateLoading"
          @click="submitFrontendGenerateThumbnail"
          >生成缩略图</el-button
        >
      </template>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <ImagePreview
      :visible="imagePreviewVisible"
      :image-url="currentImageUrl"
      @close="closeImagePreview"
    />

    <el-dialog
      v-model="fontTemplateUserTransferDialogVisible"
      :title="fontTemplateUserTransferDialogTitle"
      width="560px"
      align-center
      :close-on-click-modal="false"
      @closed="resetFontTemplateUserTransferDialog"
    >
      <div class="sticker-user-transfer-dialog">
        <el-alert
          :type="fontTemplateUserTransferAction === 'copy' ? 'success' : 'warning'"
          :closable="false"
          show-icon
          :title="
            fontTemplateUserTransferAction === 'copy'
              ? '复制字体模板并分享给目标用户，原模板会保留。'
              : '转移字体模板给目标用户，会变更模板归属并同步调整 COS 路径。'
          "
        />

        <el-form label-width="96px" class="sticker-user-transfer-form">
          <el-form-item label="目标用户" required>
            <el-select
              v-model="fontTemplateUserTransferTargetUserId"
              class="sticker-user-transfer-form__select"
              filterable
              clearable
              :loading="fontTemplateUserTransferUsersLoading"
              placeholder="请选择目标用户"
            >
              <el-option
                v-for="item in fontTemplateUserTransferUserOptions"
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
            <el-tag type="info">{{ fontTemplateUserTransferIds.length }}</el-tag>
          </el-form-item>

          <el-form-item label="选中模板">
            <div class="sticker-user-transfer-preview">
              <el-tag
                v-for="item in fontTemplateUserTransferPreviewItems"
                :key="item.id"
                size="small"
                effect="plain"
              >
                {{ item.label }}
              </el-tag>
              <span
                v-if="
                  fontTemplateUserTransferIds.length > fontTemplateUserTransferPreviewItems.length
                "
                class="sticker-user-transfer-preview__more"
              >
                等 {{ fontTemplateUserTransferIds.length }} 条
              </span>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="fontTemplateUserTransferDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="fontTemplateUserTransferSubmitting"
          @click="submitFontTemplateUserTransfer"
        >
          {{ fontTemplateUserTransferSubmitText }}
        </el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, watchEffect, nextTick } from "vue";
import { buildOperationColumn, commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useUserStore } from "@/store/modules/user";
import { defaultSortingValue } from "@/common/sort";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import FolderTree from "@/components/material/FolderTree.vue";
import TableRowDragHandle from "@/components/TableRowDragHandle/index.vue";
// import { getShopProductCategoryList, deleteShopProductCategory, editShopProductCategory, addShopProductCategory } from "@/api/shop";
import {
  Search,
  Plus,
  Delete,
  TopRight,
  Edit,
  Loading,
  Picture,
  Download,
  MagicStick,
  InfoFilled,
  DocumentCopy,
  DArrowLeft,
  DArrowRight,
  ArrowDown,
} from "@element-plus/icons-vue";
import { useWindowSize, useLocalStorage } from "@vueuse/core";

import { downloadFileByElement } from "@/common/download";
import { uploadToCOS } from "@/api/cos";
import { getUserList } from "@/api/user";
import ContentWrap from "@/components/ContentWrap/src/ContentWrap.vue";
import ListPageLayout from "@/components/ListPageLayout/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { fontTemplateApi } from "@/api/fontTemplate";
import { ImagePreview } from "@/components/ImagePreview";
import { htmlToPngFile } from "@/utils/htmlToPng";
import { copyLink } from "@/utils/clipboard";
import { useFolderRowDrag } from "@/hooks/useFolderRowDrag";
import { FOLDER_FILTER, convertFolderIdToApiParam } from "@/constants/folder";
import { isQueuedAiTaskResult, notifyQueuedAiTask, unwrapAiTaskResult } from "@/utils/aiTask";

// 语言枚举定义
const LANGUAGE_OPTIONS = [
  { code: "zh-CN", label: "简体中文", example: "你好世界", chineseName: "简体中文" },
  { code: "zh-TW", label: "繁體中文", example: "你好世界", chineseName: "繁体中文" },
  { code: "en", label: "English", example: "你好世界", chineseName: "英语" },
  { code: "es", label: "Español", example: "你好世界", chineseName: "西班牙语" },
  { code: "fr", label: "Français", example: "你好世界", chineseName: "法语" },
  { code: "de", label: "Deutsch", example: "你好世界", chineseName: "德语" },
  { code: "ja", label: "日本語", example: "你好世界", chineseName: "日语" },
  { code: "ko", label: "한국어", example: "你好世界", chineseName: "韩语" },
  { code: "ru", label: "Русский", example: "你好世界", chineseName: "俄语" },
  { code: "pt", label: "Português", example: "你好世界", chineseName: "葡萄牙语" },
  { code: "it", label: "Italiano", example: "你好世界", chineseName: "意大利语" },
  { code: "ar", label: "العربية", example: "你好世界", chineseName: "阿拉伯语" },
  { code: "hi", label: "हिन्दी", example: "你好世界", chineseName: "印地语" },
  { code: "th", label: "ไทย", example: "你好世界", chineseName: "泰语" },
  { code: "vi", label: "Tiếng Việt", example: "你好世界", chineseName: "越南语" },
  { code: "id", label: "Bahasa Indonesia", example: "你好世界", chineseName: "印尼语" },
  { code: "tr", label: "Türkçe", example: "你好世界", chineseName: "土耳其语" },
  { code: "pl", label: "Polski", example: "你好世界", chineseName: "波兰语" },
  { code: "nl", label: "Nederlands", example: "你好世界", chineseName: "荷兰语" },
  { code: "sv", label: "Svenska", example: "你好世界", chineseName: "瑞典语" },
  { code: "da", label: "Dansk", example: "你好世界", chineseName: "丹麦语" },
  { code: "no", label: "Norsk", example: "你好世界", chineseName: "挪威语" },
  { code: "fi", label: "Suomi", example: "你好世界", chineseName: "芬兰语" },
  { code: "cs", label: "Čeština", example: "你好世界", chineseName: "捷克语" },
  { code: "hu", label: "Magyar", example: "你好世界", chineseName: "匈牙利语" },
  { code: "ro", label: "Română", example: "你好世界", chineseName: "罗马尼亚语" },
  { code: "el", label: "Ελληνικά", example: "你好世界", chineseName: "希腊语" },
  { code: "he", label: "עברית", example: "你好世界", chineseName: "希伯来语" },
  { code: "uk", label: "Українська", example: "你好世界", chineseName: "乌克兰语" },
  { code: "bg", label: "Български", example: "你好世界", chineseName: "保加利亚语" },
  { code: "hr", label: "Hrvatski", example: "你好世界", chineseName: "克罗地亚语" },
  { code: "sk", label: "Slovenčina", example: "你好世界", chineseName: "斯洛伐克语" },
  { code: "sl", label: "Slovenščina", example: "你好世界", chineseName: "斯洛文尼亚语" },
  { code: "sr", label: "Српски", example: "你好世界", chineseName: "塞尔维亚语" },
  { code: "ms", label: "Bahasa Melayu", example: "你好世界", chineseName: "马来语" },
  { code: "tl", label: "Filipino", example: "你好世界", chineseName: "菲律宾语" },
  { code: "sw", label: "Kiswahili", example: "你好世界", chineseName: "斯瓦希里语" },
  { code: "bn", label: "বাংলা", example: "你好世界", chineseName: "孟加拉语" },
  { code: "ta", label: "தமிழ்", example: "你好世界", chineseName: "泰米尔语" },
  { code: "te", label: "తెలుగు", example: "你好世界", chineseName: "泰卢固语" },
  { code: "mr", label: "मराठी", example: "你好世界", chineseName: "马拉地语" },
  { code: "gu", label: "ગુજરાતી", example: "你好世界", chineseName: "古吉拉特语" },
  { code: "kn", label: "ಕನ್ನಡ", example: "你好世界", chineseName: "卡纳达语" },
  { code: "ml", label: "മലയാളം", example: "你好世界", chineseName: "马拉雅拉姆语" },
  { code: "pa", label: "ਪੰਜਾਬੀ", example: "你好世界", chineseName: "旁遮普语" },
  { code: "fa", label: "فارسی", example: "你好世界", chineseName: "波斯语" },
  { code: "ur", label: "اردو", example: "你好世界", chineseName: "乌尔都语" },
  { code: "ka", label: "ქართული", example: "你好世界", chineseName: "格鲁吉亚语" },
  { code: "am", label: "አማርኛ", example: "你好世界", chineseName: "阿姆哈拉语" },
  { code: "ha", label: "Hausa", example: "你好世界", chineseName: "豪萨语" },
  { code: "yo", label: "Yorùbá", example: "你好世界", chineseName: "约鲁巴语" },
  { code: "zu", label: "isiZulu", example: "你好世界", chineseName: "祖鲁语" },
  { code: "af", label: "Afrikaans", example: "你好世界", chineseName: "南非荷兰语" },
  { code: "eu", label: "Euskara", example: "你好世界", chineseName: "巴斯克语" },
  { code: "ca", label: "Català", example: "你好世界", chineseName: "加泰罗尼亚语" },
  { code: "gl", label: "Galego", example: "你好世界", chineseName: "加利西亚语" },
];

// 根据语言代码获取语言信息
function getLanguageByCode(code: string) {
  return LANGUAGE_OPTIONS.find((lang) => lang.code === code);
}

const userStore = useUserStore();

// 判断是否为管理员
const isAdmin = computed(() => userStore.user?.isAdmin ?? false);

const FOLDER_CATEGORY = "fonttemplate";
const folderTreeCollapsed = useLocalStorage("font_template_folder_collapsed", false);
const selectedFolderId = ref<string | null>("__all__");

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  startTime: "",
  endTime: "",
  searchKeyword: "", // 搜索关键字
  folderId: null as string | null, // 文件夹筛选
});

const gridOptions = ref({
  ...commonGridOptions,
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
      width: 200,
      slots: {
        default: "thumbnailDefaultSlot",
      },
    },
    { title: "字体名称", field: "name", width: 240, showOverflow: true },
    { title: "描述", field: "description", minWidth: 200, showOverflow: true },
    { title: "关键字", field: "keywords", minWidth: 160, showOverflow: true },
    { title: "分类", field: "category", width: 120, showOverflow: true },
    {
      title: "适用语言",
      field: "languages",
      minWidth: 200,
      slots: { default: "languagesSlot" },
    },
        { title: "字体 ID", field: "id", width: 220, showOverflow: true },
    {
      title: "上传者",
      field: "uploader",
      minWidth: 120,
      showOverflow: true,
      formatter: ({ row }) =>
        row?.uploader?.account || row?.uploader?.name || row?.creatorName || row?.userId || "-",
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
    buildOperationColumn("operationDefaultSlot"),
  ],
  maxHeight: 400,
});

const { height } = useWindowSize();

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 220;
});

const dataSource = ref([]);
const loading = ref(false);
const ids = ref([]);
const total = ref(0);
const formRef = ref();
const dialogTitle = ref("");
const dialogVisible = ref(false);
const isEdit = ref(true);
const currentRow = ref<{
  url?: string;
  id?: number;
  name?: string;
}>({});
const submitLoading = ref(false);
type FontTemplateUserTransferAction = "copy" | "move";
type FontTemplateUserTransferUserOption = {
  id: string;
  name?: string;
  account?: string;
  label: string;
  isAdmin?: boolean;
};
const fontTemplateUserTransferDialogVisible = ref(false);
const fontTemplateUserTransferSubmitting = ref(false);
const fontTemplateUserTransferUsersLoading = ref(false);
const fontTemplateUserTransferUsersLoaded = ref(false);
const fontTemplateUserTransferAction = ref<FontTemplateUserTransferAction>("copy");
const fontTemplateUserTransferIds = ref<string[]>([]);
const fontTemplateUserTransferTargetUserId = ref("");
const fontTemplateUserTransferUserOptions = ref<FontTemplateUserTransferUserOption[]>([]);
const fontTemplateUserTransferDialogTitle = computed(() =>
  fontTemplateUserTransferAction.value === "copy" ? "分享字体模板给用户" : "转移字体模板给用户",
);
const fontTemplateUserTransferSubmitText = computed(() =>
  fontTemplateUserTransferAction.value === "copy" ? "确认分享" : "确认转移",
);
const fontTemplateUserTransferPreviewItems = computed(() =>
  fontTemplateUserTransferIds.value.slice(0, 5).map((id) => {
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
  gridClass: "font-template-dnd-grid",
  dataSource,
  selectedIds: ids,
  onDropToFolder: handleFolderDrop,
});

// AI生成内容相关
const aiGenDialogVisible = ref(false);
const aiGenPrompt = ref("");
const aiGenDialogLoading = ref(false);
const aiTableLoading = ref<Record<string, boolean>>({});
let aiGenRow = null;

// 批量AI补全相关
const batchAiLoading = ref(false);
const batchAiDialogVisible = ref(false);
const batchAiPrompt = ref("");
const batchAiDialogLoading = ref(false);
const batchProgress = ref({
  total: 0,
  processed: 0,
  success: 0,
  failed: 0,
});

// 批量删除相关
const batchDeleteLoading = ref(false);

// 默认模板列表
const defaultTemplates = [
  {
    name: "完整字符集（英文+数字+符号+中文）",
    content:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()_+-=[]{}|;:,.<>?/\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体",
  },
  {
    name: "基础英文+数字",
    content: "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789",
  },
  {
    name: "中文展示模板",
    content:
      "你好世界\n字体设计创意无限\n中文排版艺术字体\n设计美学字体之美\n排版艺术设计灵感\n创意设计字体艺术",
  },
  {
    name: "中英文混合",
    content: "Hello World\n你好世界\nFont Design\n字体设计\nCreative Typography\n创意排版",
  },
  {
    name: "符号展示",
    content: "!@#$%^&*()_+-=\n[]{}|;:,.<>?/\n~`'\"\\",
  },
  {
    name: "数字展示",
    content: "0123456789\n一二三四五六七八九十\n①②③④⑤⑥⑦⑧⑨⑩",
  },
  {
    name: "字母展示（大写）",
    content: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  },
  {
    name: "字母展示（小写）",
    content: "abcdefghijklmnopqrstuvwxyz",
  },
  {
    name: "常用短语（英文）",
    content: "The Quick Brown Fox\nJumps Over\nThe Lazy Dog\nFont Preview\nTypography Design",
  },
  {
    name: "常用短语（中文）",
    content: "字体预览\n设计美学\n创意无限\n排版艺术\n字体之美",
  },
];

// 生成缩略图相关
const generateThumbnailDialogVisible = ref(false);
const frontendGenerateLoading = ref(false);
const thumbnailFormRef = ref();
const selectedTemplateIndex = ref<number | null>(null);
const thumbnailForm = ref({
  templateText: defaultTemplates[0].content,
  options: {
    fontSize: 100,
    textColor: "#000000",
  },
});
const thumbnailRules = {
  templateText: [{ required: true, message: "请输入模板文字", trigger: "blur" }],
};

// 图片预览相关状态
const imagePreviewVisible = ref(false);
const currentImageUrl = ref("");

// 字体预览相关状态
const fontLoading = ref(false);
const loadedFontFamily = ref("");

// 批量生成缩略图相关状态
const batchGenerateThumbnailLoading = ref(false);
const batchGenerateThumbnailProgress = ref({
  total: 0,
  processed: 0,
  success: 0,
  failed: 0,
});
const batchGenerateThumbnailAbortController = ref<AbortController | null>(null);

type BatchGenerateThumbnailOptions = {
  completeWithAi?: boolean;
};

async function getList() {
  loading.value = true;

  let params = {
    ...queryParams,
  };

  let res = await fontTemplateApi
    .getFontTemplatePage({
      ...params,
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false;
    });
  dataSource.value = res.list;
  total.value = res.total;
  ids.value = [];

  // 列表渲染完成后挂载拖拽
  nextTick(setupRowDrag);
}

function ensureFontTemplateAdminOperation() {
  if (!isAdmin.value) {
    ElMessage.warning("仅管理员可执行该操作");
    return false;
  }
  return true;
}

async function loadFontTemplateTransferUserOptions() {
  if (fontTemplateUserTransferUsersLoaded.value || fontTemplateUserTransferUsersLoading.value) {
    return;
  }

  fontTemplateUserTransferUsersLoading.value = true;
  try {
    const res = await getUserList({
      currentPage: 1,
      pageSize: 1000,
    });
    const list = Array.isArray(res?.list) ? res.list : [];
    fontTemplateUserTransferUserOptions.value = list.map((item: any) => ({
      id: String(item.id),
      name: item.name || "",
      account: item.account || "",
      label: item.name || item.account || `用户 #${item.id}`,
      isAdmin: !!item.isAdmin,
    }));
    fontTemplateUserTransferUsersLoaded.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || "加载用户列表失败");
  } finally {
    fontTemplateUserTransferUsersLoading.value = false;
  }
}

function resetFontTemplateUserTransferDialog() {
  fontTemplateUserTransferSubmitting.value = false;
  fontTemplateUserTransferAction.value = "copy";
  fontTemplateUserTransferIds.value = [];
  fontTemplateUserTransferTargetUserId.value = "";
}

async function openFontTemplateUserTransferDialog(
  action: FontTemplateUserTransferAction,
  row?: any,
) {
  if (!ensureFontTemplateAdminOperation()) {
    return;
  }

  const targetIds = row
    ? [String(row.id)]
    : (Array.isArray(ids.value) ? ids.value : []).map((id) => String(id)).filter(Boolean);

  if (!targetIds.length) {
    ElMessage.warning("请选择要操作的字体模板");
    return;
  }

  fontTemplateUserTransferAction.value = action;
  fontTemplateUserTransferIds.value = Array.from(new Set(targetIds));
  fontTemplateUserTransferTargetUserId.value = "";
  await loadFontTemplateTransferUserOptions();
  fontTemplateUserTransferDialogVisible.value = true;
}

async function submitFontTemplateUserTransfer() {
  if (!ensureFontTemplateAdminOperation()) {
    return;
  }

  if (!fontTemplateUserTransferIds.value.length) {
    ElMessage.warning("请选择要操作的字体模板");
    return;
  }

  if (!fontTemplateUserTransferTargetUserId.value) {
    ElMessage.warning("请选择目标用户");
    return;
  }

  fontTemplateUserTransferSubmitting.value = true;
  const actionLabel = fontTemplateUserTransferAction.value === "copy" ? "分享" : "转移";

  try {
    const payload = {
      ids: fontTemplateUserTransferIds.value,
      targetUserId: fontTemplateUserTransferTargetUserId.value,
    };
    const res =
      fontTemplateUserTransferAction.value === "copy"
        ? await fontTemplateApi.copyToUser(payload)
        : await fontTemplateApi.moveToUser(payload);
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
      fontTemplateUserTransferDialogVisible.value = false;
      ids.value = [];
      await getList();
    } else if (failedCount > 0) {
      ElMessage.error(`${actionLabel}失败 ${failedCount} 条`);
    } else {
      ElMessage.warning("未处理任何字体模板，请稍后重试");
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
    fontTemplateUserTransferSubmitting.value = false;
  }
}

getList();

function handleFolderChange(payload: { folderId: string | null }) {
  if (payload.folderId === "all") {
    queryParams.folderId = undefined as any;
  } else if (payload.folderId === null) {
    queryParams.folderId = "0"; // '0' represents Uncategorized (Root)
  } else {
    queryParams.folderId = payload.folderId;
  }
  queryParams.currentPage = 1;
  getList();
}

// 搜索功能
function handleSearch() {
  queryParams.currentPage = 1;
  getList();
}

// 重置功能
function handleReset() {
  queryParams.searchKeyword = "";
  queryParams.startTime = "";
  queryParams.endTime = "";
  queryParams.currentPage = 1;
  getList();
}

// 单个删除功能
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
      await fontTemplateApi.deleteFontTemplate({ ids: delIds });
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => {});
}

// 批量删除功能
async function handleBatchDelete() {
  if (!ids.value.length) {
    ElMessage.warning("请先选择要删除的数据");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${ids.value.length} 个字体模板吗？\n\n删除后将同时删除：\n• 字体文件\n• 缩略图\n\n此操作不可恢复！`,
      "批量删除确认",
      {
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true,
      },
    );

    batchDeleteLoading.value = true;

    // 调用删除API
    await fontTemplateApi.deleteFontTemplate({ ids: ids.value });

    ElMessage.success(`成功删除 ${ids.value.length} 个字体模板`);

    // 清空选择并刷新列表
    ids.value = [];
    getList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      ElMessage.error("批量删除失败，请稍后重试");
    }
  } finally {
    batchDeleteLoading.value = false;
  }
}

// 拖拽到文件夹时的交互
async function handleFolderDrop(payload: { data: any }) {
  markExternalFolderDropHandled();
  if (!dragState.draggingIds.length) return;
  if (payload.data.id === FOLDER_FILTER.ALL) return;

  const targetFolderId =
    payload.data.id === FOLDER_FILTER.NOT_GROUP ? FOLDER_FILTER.NOT_GROUP : payload.data.id;
  const targetPath = payload.data.path || "";
  const movingIds = [...dragState.draggingIds];

  try {
    await fontTemplateApi.batchMove({
      ids: movingIds,
      folderId: convertFolderIdToApiParam(targetFolderId) as string,
    });
    ElMessage.success(`已移动 ${movingIds.length} 个字体模板到 ${targetPath || "未分组"}`);

    // Stay in current folder, just refresh list
    await getList();
    ids.value = [];
  } catch (error) {
    ElMessage.error((error as Error).message || "移动失败");
  } finally {
    resetAfterDrop();
  }
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建字体模板";
  form.value = {
    file: null,
    name: "",
    description: "",
    keywords: "",
    languages: [],
  };
}

function handleEdit(row) {
  currentRow.value = row;
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";

  form.value = {
    ...row,
    languages: row.languages || [],
  };
}

const form = ref<{
  file?: any;
  name: string;
  id?: number;
  description?: string;
  keywords?: string;
  languages?: string[];
}>({
  file: null,
  name: "",
  description: "",
  keywords: "",
  languages: [],
});

const rules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  description: [{ required: false, message: "请输入描述", trigger: "blur" }],
  keywords: [{ required: false, message: "请输入关键字", trigger: "blur" }],
  file: [{ required: true, message: "请选择字体文件", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
  fileList.value = [];
  submitLoading.value = false;
};

// 重置字体预览状态
const resetFontPreview = () => {
  // 清理单个字体样式
  if (loadedFontFamily.value) {
    const fontStyles = document.querySelectorAll("style");
    fontStyles.forEach((style) => {
      if (style.innerHTML.includes(loadedFontFamily.value)) {
        style.remove();
      }
    });
    loadedFontFamily.value = "";
  }
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
      submitLoading.value = true;
      await fontTemplateApi.updateFontTemplate({
        id: form.value.id,
        name: form.value.name,
        description: form.value.description,
        keywords: form.value.keywords,
        languages: form.value.languages || [],
      });
      ElMessage.success("更新成功");
      getList();
    } else {
      submitLoading.value = true;

      const userAccount =
        (userStore.user as any)?.account ||
        userStore.user?.shortName ||
        userStore.user?.name ||
        "anonymous";
      const userId = (userStore.user as any)?.id || (userStore as any).userInfo?.id;
      const cos = await uploadToCOS({
        file: form.value.file,
        category: "font-template",
        account: userAccount,
        userId,
        // 新增时没有 ID，先上传，创建后再更新路径（如果需要）
        isThumbnail: false,
      });
      const { url } = cos;

      await fontTemplateApi.createFontTemplate({
        name: form.value.name,
        description: form.value.description,
        keywords: form.value.keywords,
        languages: form.value.languages || [],
        url,
        size: form.value.file.size,
        type: form.value.file.name.split(".").pop(),
        file: null,
        userId: userStore.user?.id,
      });
      ElMessage.success("添加成功");
      getList();
    }

    dialogVisible.value = false;
  } catch (e) {
  } finally {
    submitLoading.value = false;
    dialogVisible.value = false;
  }
};

/**
 * @字体文件处理
 */

const fileList = ref([]);

// 文件选择改变时的回调
const handleFileChange = (file, files) => {
  fileList.value = files; // 更新文件列表
  form.value.name = file.name.replace(/\.[^/.]+$/, ""); // 去掉文件扩展名
  form.value.file = file.raw; // 将文件绑定到表单数据
};

// 文件移除时的回调
const handleFileRemove = () => {
  fileList.value = []; // 清空文件列表
  form.value.file = null; // 清空表单中的文件
};

// 文件上传前的校验
const beforeUpload = (file) => {
  const isFont = /\.(ttf|otf|woff|woff2)$/.test(file.name.toLowerCase());
  if (!isFont) {
    ElMessage.error("只能上传字体文件！");
    return false;
  }
  return true;
};

const copyUrl = (url: string) => {
  copyLink(url);
};

// AI生成内容相关方法
function handleAiGenerate(row) {
  if (aiTableLoading.value[row.id]) return;
  aiGenRow = row;
  aiGenPrompt.value = `请从以下维度对字体进行详细分析，并输出对应的分类信息：

1. 字体风格分类：如衬线体、无衬线体、手写体、装饰体、等宽体等
2. 字重/粗细：极细、细、常规、中等、粗、极粗、黑体等
3. 情感调性：优雅、稳重、活泼、现代、古典、科技、可爱、力量感等
4. 适用场景：标题、正文、品牌标识、海报、UI界面、包装、广告等
5. 适用行业：科技、时尚、餐饮、教育、金融、娱乐、运动等
6. 设计特点：圆角、直角、几何、有机、装饰性笔画、连笔等
7. 推荐搭配字体：建议可与此字体搭配使用的其他类型字体
8. 关键词建议：10-15个便于检索的风格和用途关键词

请结合字体的笔画特征、结构比例、整体视觉感受进行综合分析。`;
  aiGenDialogVisible.value = true;
}

async function submitAiGenDialog() {
  if (!aiGenRow) return;
  aiGenDialogLoading.value = true;
  aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: true };
  try {
    await handleAiAutoGenerate(
      aiGenRow,
      () => {
        aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false };
        aiGenDialogLoading.value = false;
        aiGenDialogVisible.value = false;
        aiGenRow = null;
      },
      aiGenPrompt.value,
    );
  } catch (e) {
    aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false };
    aiGenDialogLoading.value = false;
    aiGenDialogVisible.value = false;
    aiGenRow = null;
  }
}

async function handleAiAutoGenerate(row, cb, prompt) {
  try {
    // 调用字体模板的AI补全接口
    const res = await fontTemplateApi.aiCompleteContent(row.id, prompt || "");
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

// 批量AI补全内容
async function handleBatchAiGenerate() {
  if (!ids.value.length) {
    ElMessage.warning("请先选择要批量操作的数据");
    return;
  }

  batchAiPrompt.value = `请从以下维度对字体进行详细分析，并输出对应的分类信息：

1. 字体风格分类：如衬线体、无衬线体、手写体、装饰体、等宽体等
2. 字重/粗细：极细、细、常规、中等、粗、极粗、黑体等
3. 情感调性：优雅、稳重、活泼、现代、古典、科技、可爱、力量感等
4. 适用场景：标题、正文、品牌标识、海报、UI界面、包装、广告等
5. 适用行业：科技、时尚、餐饮、教育、金融、娱乐、运动等
6. 设计特点：圆角、直角、几何、有机、装饰性笔画、连笔等
7. 推荐搭配字体：建议可与此字体搭配使用的其他类型字体
8. 关键词建议：10-15个便于检索的风格和用途关键词

请结合字体的笔画特征、结构比例、整体视觉感受进行综合分析。`;
  batchAiDialogVisible.value = true;
}

async function submitBatchAiDialog() {
  if (!ids.value.length) return;

  batchAiDialogLoading.value = true;

  try {
    const res = await fontTemplateApi.batchAiCompleteContent({
      ids: ids.value,
      prompt: batchAiPrompt.value,
      batchSize: 5,
    });

    const resultData = unwrapAiTaskResult(res);

    if (isQueuedAiTaskResult(resultData)) {
      notifyQueuedAiTask(resultData, {
        title: "批量AI补全任务已提交",
        fallbackMessage: `已提交 ${ids.value.length} 个字体模板的AI补全任务，完成后会通过消息中心通知结果`,
      });
      batchAiDialogVisible.value = false;
      batchAiPrompt.value = "";
      batchProgress.value = { total: 0, processed: 0, success: 0, failed: 0 };
      return;
    }

    // 初始化进度
    batchProgress.value = {
      total: ids.value.length,
      processed: 0,
      success: 0,
      failed: 0,
    };

    // 更新最终进度
    batchProgress.value.processed = resultData.processed;
    batchProgress.value.success = resultData.success;
    batchProgress.value.failed = resultData.failed;

    if (resultData.success > 0) {
      // 显示详细结果
      let message = `批量AI补全完成：成功 ${resultData.success} 个，失败 ${resultData.failed} 个`;

      if (resultData.failed > 0 && resultData.errors && resultData.errors.length > 0) {
        message += `\n失败项目：${resultData.errors
          .slice(0, 3)
          .map((e) => e.id)
          .join(", ")}${resultData.errors.length > 3 ? "..." : ""}`;
      }

      ElMessage.success(message);

      // 刷新列表
      getList();
      // 清空选择
      ids.value = [];
      // 延迟关闭弹窗，让用户看到最终结果
      setTimeout(() => {
        batchAiDialogVisible.value = false;
        // 重置进度
        batchProgress.value = { total: 0, processed: 0, success: 0, failed: 0 };
      }, 3000);
    } else {
      ElMessage.error("批量AI补全失败，请检查网络连接和AI服务状态");
    }
  } catch (error) {
    console.error("批量AI补全失败:", error);

    // 根据错误类型显示不同的提示
    let errorMessage = "批量AI补全失败";
    if (error.response?.status === 500) {
      errorMessage = "服务器内部错误，请稍后重试";
    } else if (error.response?.status === 429) {
      errorMessage = "请求过于频繁，请稍后重试";
    } else if (error.message?.includes("timeout")) {
      errorMessage = "请求超时，请检查网络连接";
    }

    ElMessage.error(errorMessage);
    // 重置进度
    batchProgress.value = { total: 0, processed: 0, success: 0, failed: 0 };
  } finally {
    batchAiDialogLoading.value = false;
  }
}

// 应用默认模板
function applyDefaultTemplate(index: number | null) {
  if (index !== null && index >= 0 && index < defaultTemplates.length) {
    thumbnailForm.value.templateText = defaultTemplates[index].content;
    ElMessage.success(`已应用模板：${defaultTemplates[index].name}`);
  }
}

// 生成缩略图相关方法
function handleGenerateThumbnail(row) {
  currentRow.value = row;
  // 如果已有缩略图，提示用户
  if (row.thumbnail) {
    ElMessage.info("该字体模板已有缩略图，生成新的将覆盖现有缩略图");
  }
  // 重置字体预览状态
  resetFontPreview();
  // 重置为默认模板并打开弹窗
  selectedTemplateIndex.value = 0;
  thumbnailForm.value.templateText = defaultTemplates[0].content;
  generateThumbnailDialogVisible.value = true;

  // 弹窗打开后自动加载字体预览
  setTimeout(() => {
    if (currentRow.value?.url) {
      loadFontForPreview();
    }
  }, 300);
}

// 前端生成缩略图
async function submitFrontendGenerateThumbnail() {
  if (!thumbnailFormRef.value) return;

  try {
    await thumbnailFormRef.value.validate();
    frontendGenerateLoading.value = true;

    // 直接使用页面中的实时预览元素
    const previewElement = document.querySelector(".single-preview") as HTMLElement;
    if (!previewElement) {
      ElMessage.error("找不到预览元素，请确保预览区域已正确显示");
      return;
    }

    // 确保预览元素有正确的尺寸
    console.log("预览元素尺寸:", previewElement.offsetWidth, "x", previewElement.offsetHeight);

    // 确保字体完全加载和应用
    if (loadedFontFamily.value) {
      console.log("开始等待字体加载完成...");
      console.log("当前加载的字体:", loadedFontFamily.value);

      // 等待字体加载完成
      await document.fonts.ready;
      console.log("字体加载完成，等待渲染...");

      // 检查字体是否已加载
      const fontFaceSet = document.fonts;
      console.log("字体集合状态:", fontFaceSet);

      // 强制应用字体到预览元素
      previewElement.style.fontFamily = loadedFontFamily.value;

      // 触发重排，确保字体样式被应用
      previewElement.offsetHeight;

      // 等待更长时间确保字体完全渲染
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 再次检查字体是否已应用
      const computedStyle = window.getComputedStyle(previewElement);
      console.log("当前字体:", computedStyle.fontFamily);
      console.log(
        "字体是否包含自定义字体:",
        computedStyle.fontFamily.includes(loadedFontFamily.value),
      );

      // 如果字体还没有应用，再等待一段时间
      if (!computedStyle.fontFamily.includes(loadedFontFamily.value)) {
        console.log("字体未应用，继续等待...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // 再次强制应用字体
        previewElement.style.fontFamily = loadedFontFamily.value;
        previewElement.offsetHeight;

        // 再次检查
        const finalComputedStyle = window.getComputedStyle(previewElement);
        console.log("最终字体:", finalComputedStyle.fontFamily);
      }
    } else {
      console.log("没有加载的字体，使用系统默认字体");
    }

    console.log("开始生成图片...");

    // 使用htmlToPngFile方法生成PNG文件
    const file = await htmlToPngFile(
      previewElement,
      `${currentRow.value.name || "font"}_thumbnail.png`,
    );
    console.log("PNG文件生成完成:", file);

    console.log("PNG文件生成完成，准备上传到COS");

    // 上传到COS
    const userAccount =
      (userStore.user as any)?.account ||
      userStore.user?.shortName ||
      userStore.user?.name ||
      "anonymous";
    const userId = (userStore.user as any)?.id || (userStore as any).userInfo?.id;
    const cos = await uploadToCOS({
      file,
      category: "font-template",
      account: userAccount,
      userId,
      entityId: currentRow.value.id, // 使用当前行的 ID
      isThumbnail: true,
    });
    const { url } = cos;

    // 调用后端API更新缩略图路径
    await fontTemplateApi.updateFontTemplate({
      id: currentRow.value.id,
      thumbnail: url,
    });

    ElMessage.success("前端缩略图生成成功");
    generateThumbnailDialogVisible.value = false;
    getList(); // 刷新列表
  } catch (error) {
    console.error("前端缩略图生成失败:", error);
    ElMessage.error("前端缩略图生成失败，请稍后重试");
  } finally {
    frontendGenerateLoading.value = false;
  }
}

function handleBatchActionCommand(command: string) {
  if (command === "copy-to-user") {
    openFontTemplateUserTransferDialog("copy");
  } else if (command === "move-to-user") {
    openFontTemplateUserTransferDialog("move");
  }
}

function handleBatchGenerateThumbnailCommand(command: string) {
  if (command === "thumbnail-ai") {
    void handleBatchGenerateThumbnail({ completeWithAi: true });
    return;
  }

  if (command === "ai-only") {
    handleBatchAiGenerate();
    return;
  }

  void handleBatchGenerateThumbnail({ completeWithAi: false });
}

// 批量生成缩略图
async function handleBatchGenerateThumbnail(options: BatchGenerateThumbnailOptions = {}) {
  const completeWithAi = options.completeWithAi === true;
  // 获取要处理的字体列表：选中的或者全部没有缩略图的
  let fontsToProcess = [];
  if (ids.value.length > 0) {
    // 使用选中的
    fontsToProcess = dataSource.value.filter((item) => ids.value.includes(item.id));
  } else {
    // 使用当前列表中没有缩略图的
    fontsToProcess = dataSource.value.filter((item) => !item.thumbnail);
  }

  if (fontsToProcess.length === 0) {
    ElMessage.warning("没有需要生成缩略图的字体模板");
    return;
  }

  // 确认操作
  try {
    await ElMessageBox.confirm(
      `即将为 ${fontsToProcess.length} 个字体模板批量生成缩略图${completeWithAi ? "，并在生成后调用 AI 补全内容" : ""}，是否继续？`,
      completeWithAi ? "批量生成缩略图并补全" : "批量生成缩略图",
      { type: "warning" },
    );
  } catch {
    return; // 用户取消
  }

  // 开始批量处理
  batchGenerateThumbnailLoading.value = true;
  batchGenerateThumbnailProgress.value = {
    total: fontsToProcess.length,
    processed: 0,
    success: 0,
    failed: 0,
  };
  batchGenerateThumbnailAbortController.value = new AbortController();

  const templateText = defaultTemplates[0].content; // 使用默认模板文字

  for (let i = 0; i < fontsToProcess.length; i++) {
    // 检查是否被取消
    if (batchGenerateThumbnailAbortController.value?.signal.aborted) {
      ElMessage.warning("批量生成已取消");
      break;
    }

    const font = fontsToProcess[i];
    console.log(`\n--- 批量生成 ${i + 1}/${fontsToProcess.length} ---`);
    console.log(`处理: ${font.name || font.id}`);

    try {
      // 1. 打开生成缩略图弹窗（这会设置 currentRow 并加载字体）
      handleGenerateThumbnail(font);

      // 2. 等待弹窗打开和字体加载完成
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. 检查弹窗是否打开
      if (!generateThumbnailDialogVisible.value) {
        throw new Error("弹窗未打开");
      }

      // 4. 找到预览元素并生成图片
      const previewElement = document.querySelector(".single-preview") as HTMLElement;
      if (!previewElement) {
        throw new Error("找不到预览元素");
      }

      // 5. 确保字体应用到预览元素
      if (loadedFontFamily.value) {
        previewElement.style.fontFamily = loadedFontFamily.value;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // 6. 生成 PNG 文件
      const file = await htmlToPngFile(previewElement, `${font.name || "font"}_thumbnail.png`);

      // 7. 上传到 COS
      const userAccount =
        (userStore.user as any)?.account ||
        userStore.user?.shortName ||
        userStore.user?.name ||
        "anonymous";
      const userId = (userStore.user as any)?.id || (userStore as any).userInfo?.id;
      const cos = await uploadToCOS({
        file,
        category: "font-template",
        account: userAccount,
        userId,
        entityId: font.id,
        isThumbnail: true,
      });
      const { url } = cos;

      // 8. 更新数据库
      await fontTemplateApi.updateFontTemplate({
        id: font.id,
        thumbnail: url,
      });

      // 9. 关闭弹窗
      generateThumbnailDialogVisible.value = false;

      if (completeWithAi) {
        await fontTemplateApi.aiCompleteContent(font.id).catch((error) => {
          console.warn(`AI补全失败 ${font.name || font.id}:`, error);
        });
      }

      batchGenerateThumbnailProgress.value.success++;
      console.log(`  [OK] ${font.name || font.id}`);
    } catch (error: any) {
      batchGenerateThumbnailProgress.value.failed++;
      console.error(`  [FAIL] ${font.name || font.id}:`, error.message);
      // 确保弹窗关闭
      generateThumbnailDialogVisible.value = false;
    }

    batchGenerateThumbnailProgress.value.processed++;

    // 延迟一下，避免太快
    if (i < fontsToProcess.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // 完成
  batchGenerateThumbnailLoading.value = false;
  batchGenerateThumbnailAbortController.value = null;

  const { success, failed, total } = batchGenerateThumbnailProgress.value;
  ElMessage.success(
    `${completeWithAi ? "批量生成并补全" : "批量生成缩略图"}完成：成功 ${success} 个，失败 ${failed} 个，共 ${total} 个`,
  );

  // 刷新列表
  getList();
}

// 取消批量生成
function cancelBatchGenerateThumbnail() {
  batchGenerateThumbnailAbortController.value?.abort();
}

// 字体加载预览相关方法
async function loadFontForPreview() {
  if (!currentRow.value?.url) {
    return;
  }

  // 重置之前的状态
  loadedFontFamily.value = "";
  fontLoading.value = true;

  try {
    console.log("开始加载字体:", currentRow.value.url);

    // 创建字体ID
    const fontId = `font_${Date.now()}`;

    // 先下载字体文件，然后创建Blob URL（参考1s项目的成功做法）
    const response = await fetch(currentRow.value.url);
    const fontBlob = await response.blob();
    const fontBlobUrl = URL.createObjectURL(fontBlob);

    // 创建字体样式标签
    const fontStyle = document.createElement("style");
    fontStyle.innerHTML = `
      @font-face {
        font-family: ${fontId};
        src: url("${fontBlobUrl}") format("woff2"), 
             url("${fontBlobUrl}") format("woff"),
             url("${fontBlobUrl}") format("truetype"),
             url("${fontBlobUrl}") format("opentype");
        font-display: block;
      }
    `;

    // 添加到文档头部
    document.head.appendChild(fontStyle);

    // 等待字体加载完成
    console.log("等待字体加载...");
    await document.fonts.ready;

    // 使用FontFace API检查字体加载状态
    const fontFace = new FontFace(fontId, `url(${fontBlobUrl})`);
    await fontFace.load();

    // 将字体添加到字体集合（兼容性处理）
    try {
      (document.fonts as any).add(fontFace);
    } catch (error) {
      console.warn("FontFace API add方法不支持，跳过:", error);
    }

    // 设置字体名称
    loadedFontFamily.value = fontId;

    // 强制触发字体重新渲染
    const previewElement = document.querySelector(".single-preview") as HTMLElement;
    if (previewElement) {
      previewElement.style.fontFamily = fontId;
      // 触发重排
      previewElement.offsetHeight;

      // 等待字体应用
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 验证字体是否已应用
      const computedStyle = window.getComputedStyle(previewElement);
      console.log("字体应用状态:", computedStyle.fontFamily);
    }

    console.log("字体加载成功:", fontId);
  } catch (error) {
    console.error("字体加载失败:", error);
    // 静默失败，不显示错误消息
    // 重置字体状态
    loadedFontFamily.value = "";
  } finally {
    fontLoading.value = false;
  }
}

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case "edit":
      handleEdit(row);
      break;
    case "preview":
      // handlePreview(row);
      break;
    case "generate-thumbnail":
      handleGenerateThumbnail(row);
      break;
    case "download":
      downloadFileByElement(row.url, row.name);
      break;
    case "copy-url":
      copyUrl(row.url);
      break;
    case "ai-generate":
      handleAiGenerate(row);
      break;
    case "copy-to-user":
      openFontTemplateUserTransferDialog("copy", row);
      break;
    case "move-to-user":
      openFontTemplateUserTransferDialog("move", row);
      break;
    case "delete":
      handleDelete(row);
      break;
    default:
      console.warn("未知的操作命令:", command);
  }
}

// 缩略图预览相关方法
function openThumbnailPreview(thumbnailUrl: string, _fontName?: string) {
  currentImageUrl.value = thumbnailUrl;
  imagePreviewVisible.value = true;
}

function handleThumbnailError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
  const parent = img.parentElement;
  if (parent) {
    const errorDiv = document.createElement("div");
    errorDiv.className =
      "w-20 h-20 bg-red-100 rounded flex items-center justify-center text-red-400 text-xs";
    errorDiv.textContent = "加载失败";
    parent.appendChild(errorDiv);
  }
}

function closeImagePreview() {
  imagePreviewVisible.value = false;
  currentImageUrl.value = "";
}
</script>

<style scoped>
.font-template-page {
  gap: 10px;
  padding: 8px 0 0;
}

.font-template-page .list-page-layout__main {
  gap: 10px;
}

.font-template-page .list-page-filter--flat {
  gap: 10px;
  padding-bottom: 10px;
}

.font-template-page .list-page-table-panel__pagination--flat {
  padding-top: 10px;
}


.font-template-sidebar {
  min-height: 100%;
}

.pb-4.flex,
.search-bar {
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.pb-4.flex > *,
.search-bar > * {
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .pb-4.flex,
  .search-bar {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    padding-bottom: 8px !important;
  }

  .pb-4.flex > *,
  .search-bar > * {
    width: 100% !important;
    min-width: 0 !important;
    margin-right: 0 !important;
    margin-bottom: 8px !important;
  }

  .el-input,
  .el-select,
  .el-button,
  .el-date-editor {
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }

  .content-container {
    padding: 0 4px !important;
  }
}

/* 操作dropdown样式已移至公共样式文件 list-page-common.css */

/* 自定义表单项样式 */
.form-item-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .form-label {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
    line-height: 1.4;
  }

  .el-input-number,
  .el-color-picker {
    width: 100%;
  }

  .el-color-picker {
    height: 32px;
  }
}

/* 弹窗内容样式优化 */
.el-dialog__body {
  .el-form {
    .el-form-item {
      margin-bottom: 20px;

      .el-form-item__label {
        font-weight: 500;
        color: #303133;
      }
    }
  }
}

/* 预览效果样式 */
.preview-container {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
  background: #fafafa;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-weight: 500;
  color: #303133;
}

.preview-header.compact {
  margin-bottom: 12px;
}

/* 字体加载指示器样式 */
.font-loading-indicator {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }

  100% {
    opacity: 1;
  }
}

.preview-container.compact {
  padding: 12px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-weight: 500;
  color: #303133;
}

.preview-header.compact {
  margin-bottom: 12px;
}

.preview-content {
  display: flex;
  justify-content: center;
}

.preview-content.compact {
  min-height: 460px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 0;
}

.preview-image {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.preview-image.compact {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  word-break: break-word;
  word-wrap: break-word;
  /* 自适应高度，固定宽度 */
  width: 800px !important;
  min-width: 800px !important;
  max-width: 800px !important;
  min-height: 400px !important;
  height: auto !important;
}

.preview-image:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.preview-image.compact:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* 文字内容区域样式 */
.preview-text-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 100%;
  word-break: break-word;
  word-wrap: break-word;
  hyphens: auto;
}

.form-item-wrapper {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #303133;
}

.language-tag {
  display: inline-flex;
  align-items: center;
  cursor: default;
}

.language-tag .el-icon {
  cursor: help;
}

@media (max-width: 768px) {
  .preview-container {
    padding: 12px;
  }

  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .preview-image.compact {
    /* 在小屏幕上自适应高度 */
    width: 640px !important;
    min-width: 640px !important;
    max-width: 640px !important;
    min-height: 320px !important;
    height: auto !important;
  }

  .preview-content.compact {
    min-height: 380px;
    padding: 20px 0;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .preview-image.compact {
    /* 在更小的屏幕上自适应高度 */
    width: 520px !important;
    min-width: 520px !important;
    max-width: 520px !important;
    min-height: 260px !important;
    height: auto !important;
  }

  .preview-content.compact {
    min-height: 320px;
    padding: 16px 0;
    align-items: flex-start;
  }
}
</style>
