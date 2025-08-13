<template>
  <div>
    <div class="pb-4 flex flex-wrap justify-end gap-4 items-center search-bar">
      <!-- 这里放所有搜索/过滤表单项和按钮，结构与crawler-material.vue一致，参数不变 -->
      <form-item class="date-range-picker">
        <DateRangePicker
          @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end; getList() }"
        />
      </form-item>
      <el-button type="primary" @click="handleAdd" :icon="Plus">
        新增字体
      </el-button>
      <div class="flex shrink-0 gap-2">
        <el-button 
          type="success" 
          @click="handleBatchAiGenerate"
          :disabled="!ids.length"
          :loading="batchAiLoading"
        >
          批量AI补全 ({{ ids.length }})
        </el-button>
        <el-button 
          type="primary" 
          @click="handleBatchGenerateThumbnail"
          :disabled="!ids.length"
          :loading="batchGenerateThumbnailLoading"
        >
          批量生成缩略图 ({{ ids.length }})
        </el-button>
      </div>
    </div>

    <!-- 表格展示 -->
    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
        @checkbox-change="checkboxChange"
        @checkbox-all="checkboxAllChange"
      >
        <template #thumbnailDefaultSlot="{ row }">
          <div class="flex items-center justify-center p-2">
            <img
              v-if="row.thumbnail"
              :src="row.thumbnail"
              :alt="row.name || '字体缩略图'"
              style="width:160px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"
              @click="openThumbnailPreview(row.thumbnail, row.name)"
              @error="handleThumbnailError"
            />
            <div v-else class="w-40 h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
              无缩略图
            </div>
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

        <template #operationDefaultSlot="{ row }">
          <div class="flex items-center">
            <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)" class="operation-dropdown">
              <el-button type="primary" link size="small">
                操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="preview">
                    <el-icon><View /></el-icon>
                    预览
                  </el-dropdown-item>
                  <el-dropdown-item command="generate-thumbnail">
                    <el-icon><Picture /></el-icon>
                    生成缩略图
                  </el-dropdown-item>
                  <el-dropdown-item command="font-params">
                    <el-icon><Picture /></el-icon>
                    制作文字图
                  </el-dropdown-item>
                  <el-dropdown-item command="download">
                    <el-icon><Download /></el-icon>
                    下载源文件
                  </el-dropdown-item>
                  <el-dropdown-item command="ai-generate">
                    <el-icon><MagicStick /></el-icon>
                    AI自动生成内容
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-icon v-if="aiTableLoading?.[row?.id]" class="is-loading ml-2" style="color:#67C23A;font-size:18px;" />
          </div>
        </template>

        <template #urlDefaultSlot="{ row }">
          <div class="flex items-center gap-2">
            <span class="truncate flex-1">{{ row.url }}</span>
            <el-button type="primary" link size="small" @click="copyUrl(row.url)" class="shrink-0">
              复制
            </el-button>
          </div>
        </template>
      </vxe-grid>
    </div>

    <!-- 分页 -->
    <div class=" flex justify-end">
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

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
              <el-input 
                v-model="form.keywords" 
                placeholder="请输入关键字，多个关键字用逗号分隔" 
              />
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
        <el-button type="primary" @click="submitForm" :loading="submitLoading"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <FontPreview
      v-model="previewVisible"
      :font-url="currentPreviewUrl"
    />

    <!-- 字体参数设置弹窗 -->
    <el-dialog
      title="制作文字图"
      v-model="fontParamsVisible"
      width="500px"
      @close="handleFontParamsClose"
      align-center
    >
      <el-form :model="fontParamsForm" :rules="fontParamsRules" ref="fontParamsFormRef" label-width="100px">
        <el-form-item label="文字内容" prop="text">
          <el-input v-model="fontParamsForm.text" placeholder="请输入文字内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fontParamsVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFontParams" :loading="fontParamsLoading">确定</el-button>
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
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">请输入你希望AI分析的内容风格或角度（如：偏艺术描述、简洁风格、突出字体特点等）</div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="如：请用艺术化语言描述字体风格..."
        style="font-size:16px;min-height:120px;width:100%;resize:vertical;"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
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
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">
        将为选中的 <strong>{{ ids.length }}</strong> 个字体模板进行AI内容补全
      </div>
      <el-input
        v-model="batchAiPrompt"
        type="textarea"
        :rows="6"
        placeholder="请输入统一的AI分析提示词（可选）..."
        style="font-size:16px;min-height:120px;width:100%;resize:vertical;"
      />
      
      <!-- 进度显示 -->
      <div v-if="batchProgress.total > 0" style="margin-top: 16px;">
        <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span>处理进度</span>
          <span>{{ batchProgress.processed }}/{{ batchProgress.total }}</span>
        </div>
        <el-progress 
          :percentage="Math.round((batchProgress.processed / batchProgress.total) * 100)"
          :status="batchProgress.processed === batchProgress.total ? 'success' : ''"
        />
        <div style="margin-top: 8px; font-size: 12px; color: #909399;">
          成功: {{ batchProgress.success }} | 失败: {{ batchProgress.failed }}
        </div>
      </div>
      
      <div style="margin-top: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px; font-size: 14px; color: #606266;">
        <div style="margin-bottom: 8px;"><strong>操作说明：</strong></div>
        <div>• 系统将分批处理，每批5个，避免API限流</div>
        <div>• 处理过程中会显示进度和结果</div>
        <div>• 失败的项会单独记录，不影响其他项</div>
        <div style="margin-top: 8px; color: #e6a23c;"><strong>注意事项：</strong></div>
        <div>• 确保选中的字体模板都有缩略图</div>
        <div>• 如果AI分析失败，可能是图片内容不清晰或格式不支持</div>
        <div>• 系统会自动重试失败的项，提高成功率</div>
        <div>• 建议提示词示例："请分析字体风格，重点关注设计特点和适用场景"</div>
      </div>
      <template #footer>
        <el-button @click="batchAiDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchAiDialogLoading" @click="submitBatchAiDialog">开始批量补全</el-button>
      </template>
    </el-dialog>

    <!-- 生成缩略图弹窗 -->
    <el-dialog
      v-model="generateThumbnailDialogVisible"
      title="生成字体模板缩略图"
      fullscreen
      align-center
      :destroy-on-close="true"
    >
      <el-form :model="thumbnailForm" :rules="thumbnailRules" ref="thumbnailFormRef" label-width="100px" size="small">
        <!-- 基本信息行 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="模板名称">
              <el-input v-model="currentRow.name" disabled size="small" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字体文件">
              <el-input v-model="currentRow.url" disabled size="small" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="模板文字" prop="templateText">
          <el-input
            v-model="thumbnailForm.templateText"
            type="textarea"
            :rows="3"
            placeholder="请输入用于生成缩略图的模板文字，如：ABCDEFGHIJKLMNOPQRSTUVWXYZ&#10;abcdefghijklmnopqrstuvwxyz&#10;0123456789&#10;!@#$%^&*()&#10;你好世界字体设计创意无限中文排版艺术字体设计美学&#10;字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体"
            style="font-family: monospace;"
          />
          <div style="margin-top: 4px; font-size: 11px; color: #909399;">
            支持换行，每行将显示为不同的文字行。默认包含：大写字母、小写字母、数字、常用符号、中文字符。
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
                  size="small"
                  style="width: 100%"
                />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="form-item-wrapper">
                <label class="form-label">文字颜色</label>
                <el-color-picker v-model="thumbnailForm.options.textColor" size="small" />
              </div>
            </el-col>
          </el-row>
          
          <div style="margin-top: 12px; padding: 8px; background: #f0f9ff; border-radius: 4px; border-left: 3px solid #3b82f6;">
            <div style="font-size: 12px; color: #1e40af; font-weight: 500;">智能尺寸</div>
            <div style="font-size: 11px; color: #3b82f6; margin-top: 2px;">
              画布尺寸将根据文字内容和字体大小自动计算
            </div>
          </div>
        </el-form-item>

        <el-form-item label="预览效果">
          <div class="preview-container compact">
            <div class="preview-header compact">
              <span>实时预览</span>
              <el-button 
                type="primary" 
                size="small" 
                style="margin-left: 8px;"
                @click="showFontPreview"
              >
                查看字体
              </el-button>
            </div>
            <div class="preview-content compact">
              <!-- 字体预览区域 -->
              <div 
                v-if="currentRow.url && fontPreviewLoaded"
                class="preview-image font-preview compact"
                :style="{
                  width: 'auto',
                  height: 'auto',
                  minWidth: '120px',
                  minHeight: '60px',
                  padding: '12px',
                  color: thumbnailForm.options.textColor,
                  fontSize: Math.min(thumbnailForm.options.fontSize, 80) + 'px',
                  backgroundColor: 'transparent',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '4px',
                  fontFamily: currentFontFamily,
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.3'
                }"
              >
                {{ thumbnailForm.templateText || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体' }}
              </div>
              
              <!-- 默认预览区域 -->
              <div 
                v-else
                class="preview-image compact"
                :style="{
                  width: 'auto',
                  height: 'auto',
                  minWidth: '120px',
                  minHeight: '60px',
                  padding: '12px',
                  color: thumbnailForm.options.textColor,
                  fontSize: Math.min(thumbnailForm.options.fontSize, 80) + 'px',
                  backgroundColor: 'transparent',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.3'
                }"
              >
                <div style="margin-bottom: 4px; font-size: 10px; color: #909399;">
                  <i class="el-icon-info"></i> 
                  <span v-if="!currentRow.url">请先选择字体模板</span>
                  <span v-else-if="!fontPreviewLoaded">字体加载中...</span>
                  <span v-else>当前预览使用系统默认字体</span>
                </div>
                {{ thumbnailForm.templateText || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体' }}
              </div>
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #909399; text-align: center;">
              预览效果会实时显示字体大小和颜色
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="generateThumbnailDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="generateThumbnailLoading" @click="submitGenerateThumbnail">生成缩略图</el-button>
      </template>
    </el-dialog>

    <!-- 批量生成缩略图弹窗 -->
    <el-dialog
      v-model="batchGenerateThumbnailDialogVisible"
      title="批量生成字体模板缩略图"
      fullscreen
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">
        将为选中的 <strong>{{ ids.length }}</strong> 个字体模板生成缩略图
      </div>
      
      <el-form :model="batchThumbnailForm" :rules="batchThumbnailRules" ref="batchThumbnailFormRef" label-width="120px">
        <el-form-item label="字体文件URL">
          <el-select 
            v-model="batchThumbnailForm.fontUrl" 
            placeholder="请选择要预览的字体文件"
            style="width: 100%"
          >
            <el-option
              v-for="id in ids"
              :key="id"
              :label="`字体模板 ${id}`"
              :value="getFontUrlById(id)"
            />
          </el-select>
          <div style="margin-top: 8px; font-size: 12px; color: #909399;">
            选择字体文件用于预览效果，生成缩略图时将使用各自字体模板的字体文件
          </div>
        </el-form-item>
        
        <el-form-item label="模板文字" prop="templateText">
          <el-input
            v-model="batchThumbnailForm.templateText"
            type="textarea"
            :rows="3"
            placeholder="请输入用于生成缩略图的模板文字，如：ABCDEFGHIJKLMNOPQRSTUVWXYZ&#10;abcdefghijklmnopqrstuvwxyz&#10;0123456789&#10;!@#$%^&*()&#10;你好世界字体设计创意无限中文排版艺术字体设计美学&#10;字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体"
            style="font-family: monospace;"
          />
        </el-form-item>

        <el-form-item label="图片样式设置">
          <el-row :gutter="16">
            <el-col :span="12">
              <div class="form-item-wrapper">
                <label class="form-label">字体大小</label>
                <el-input-number 
                  v-model="batchThumbnailForm.options.fontSize" 
                  :min="20" 
                  :max="200" 
                  :step="10"
                  size="small"
                  style="width: 100%"
                />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="form-item-wrapper">
                <label class="form-label">文字颜色</label>
                <el-color-picker v-model="batchThumbnailForm.options.textColor" size="small" />
              </div>
            </el-col>
          </el-row>
          
          <div style="margin-top: 12px; padding: 8px; background: #f0f9ff; border-radius: 4px; border-left: 3px solid #3b82f6;">
            <div style="font-size: 12px; color: #1e40af; font-weight: 500;">智能尺寸</div>
            <div style="font-size: 11px; color: #3b82f6; margin-top: 2px;">
              画布尺寸将根据文字内容和字体大小自动计算
            </div>
          </div>
        </el-form-item>

        <el-form-item label="预览效果">
          <div class="preview-container compact">
            <div class="preview-header compact">
              <span>实时预览</span>
              <el-button 
                type="primary" 
                size="small" 
                style="margin-left: 8px;"
                @click="showBatchFontPreview"
              >
                查看字体
              </el-button>
            </div>
            <div class="preview-content compact">
              <!-- 字体预览区域 -->
              <div 
                v-if="batchThumbnailForm.fontUrl && batchFontPreviewLoaded"
                class="preview-image font-preview compact"
                :style="{
                  width: 'auto',
                  height: 'auto',
                  minWidth: '120px',
                  minHeight: '60px',
                  padding: '12px',
                  color: batchThumbnailForm.options.textColor,
                  fontSize: Math.min(batchThumbnailForm.options.fontSize, 80) + 'px',
                  backgroundColor: 'transparent',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '4px',
                  fontFamily: batchCurrentFontFamily,
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.3'
                }"
              >
                {{ batchThumbnailForm.templateText || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体' }}
              </div>
              
              <!-- 默认预览区域 -->
              <div 
                v-else
                class="preview-image compact"
                :style="{
                  width: 'auto',
                  height: 'auto',
                  minWidth: '120px',
                  minHeight: '60px',
                  padding: '12px',
                  color: batchThumbnailForm.options.textColor,
                  fontSize: Math.min(batchThumbnailForm.options.fontSize, 80) + 'px',
                  backgroundColor: 'transparent',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.3'
                }"
              >
                <div style="margin-bottom: 4px; font-size: 10px; color: #909399;">
                  <i class="el-icon-info"></i> 
                  <span v-if="!batchThumbnailForm.fontUrl">请先选择字体文件</span>
                  <span v-else-if="!batchFontPreviewLoaded">字体加载中...</span>
                  <span v-else>当前预览使用系统默认字体</span>
                </div>
                {{ batchThumbnailForm.templateText || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体' }}
              </div>
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #909399; text-align: center;">
              预览效果会实时显示字体大小和颜色
            </div>
          </div>
        </el-form-item>

        <el-form-item label="批处理设置">
          <el-row :gutter="16">
            <el-col :span="12">
              <div class="form-item-wrapper">
                <label class="form-label">批处理大小</label>
                <el-input-number 
                  v-model="batchThumbnailForm.batchSize" 
                  :min="1" 
                  :max="10" 
                  :step="1"
                  style="width: 100%"
                />
                <div style="margin-top: 4px; font-size: 12px; color: #909399;">
                  建议设置为3-5，避免同时处理过多图片
                </div>
              </div>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>

      <!-- 进度显示 -->
      <div v-if="batchThumbnailProgress.total > 0" style="margin-top: 16px;">
        <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span>生成进度</span>
          <span>{{ batchThumbnailProgress.processed }}/{{ batchThumbnailProgress.total }}</span>
        </div>
        <el-progress 
          :percentage="Math.round((batchThumbnailProgress.processed / batchThumbnailProgress.total) * 100)"
          :status="batchThumbnailProgress.processed === batchThumbnailProgress.total ? 'success' : ''"
        />
        <div style="margin-top: 8px; font-size: 12px; color: #909399;">
          成功: {{ batchThumbnailProgress.success }} | 失败: {{ batchThumbnailProgress.failed }}
        </div>
      </div>

      <div style="margin-top: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px; font-size: 14px; color: #606266;">
        <div style="margin-bottom: 8px;"><strong>操作说明：</strong></div>
        <div>• 系统将分批处理，避免同时生成过多图片</div>
        <div>• 如果字体模板已有缩略图，将被新生成的覆盖</div>
        <div>• 处理过程中会显示进度和结果</div>
        <div style="margin-top: 8px; color: #e6a23c;"><strong>注意事项：</strong></div>
        <div>• 确保选中的字体模板都有字体文件</div>
        <div>• 生成过程可能需要一些时间，请耐心等待</div>
        <div>• 建议批处理大小设置为3-5，避免资源占用过多</div>
      </div>

      <template #footer>
        <el-button @click="batchGenerateThumbnailDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchGenerateThumbnailLoading" @click="submitBatchGenerateThumbnail">开始批量生成</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <ImagePreview
      :visible="imagePreviewVisible"
      :image-url="currentImageUrl"
      @close="closeImagePreview"
    />
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, onUnmounted, watchEffect } from "vue";
import { commonGridOptions } from "@/common/table";
import { formatTimestamp } from "@/common/date";
import { useUserStore } from "@/store/modules/user";
import { sortTypeOptions, defaultSortingValue } from "@/common/sort";
import { ElMessage, ElMessageBox } from "element-plus";
// import { getShopProductCategoryList, deleteShopProductCategory, editShopProductCategory, addShopProductCategory } from "@/api/shop";
import {
  Search,
  Plus,
  Delete,
  TopRight,
  Edit,
  CirclePlusFilled,
  CirclePlus,
  Loading,
  ArrowDown,
  View,
  Picture,
  Download,
  MagicStick,
} from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";

import { ShopPlatformApi } from "@/api/shop/platform";
import { ShopCategoryApi } from "@/api/shop/category";
import { ShopApi } from "@/api/shop/shopIndex";
import { downloadFileByElement } from "@/common/download";
import { getTitleTemplateList } from "@/api/publish";
import { uploadOSSFile } from "@/api/oss";
import { uploadToCOS } from "@/api/cos";
import PsdPreview from '@/components/PsdPreview/index.vue'
import { fontTemplateApi } from "@/api/fontTemplate";
import { ImagePreview } from '@/components/ImagePreview';
import FontPreview from '@/components/FontPreview.vue';

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  startTime: '',
  endTime: ''
});

const gridOptions = ref({
  ...commonGridOptions,
  columns: [
    { type: "checkbox", width: 50, showOverflow: true },
    { 
      title: "缩略图", 
      field: "thumbnail", 
      width: 200,
      slots: {
        default: "thumbnailDefaultSlot"
      }
    },
    // { title: "ID", field: "id", width: 140, showOverflow: true },
    { 
      title: "文件地址", 
      field: "url", 
      width: 360,
      slots: {
        default: "urlDefaultSlot"
      }
    },
    { title: "字体名称", field: "name", width: 240, showOverflow: true },
    { title: "描述", field: "description", minWidth: 200, showOverflow: true },
    { title: "关键字", field: "keywords", minWidth: 160, showOverflow: true },
    { title: "分类", field: "category", width: 120, showOverflow: true },
    { title: "创建人", field: "creatorName", minWidth: 100, showOverflow: true },
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
  maxHeight: 400
});

const { height } = useWindowSize();

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 220;
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
const currentRow = ref<{
  url?: string;
  id?: number;
  name?: string;
}>({});
const submitLoading = ref(false);

// 字体参数相关
const fontParamsVisible = ref(false);
const fontParamsLoading = ref(false);
const fontParamsFormRef = ref();
const fontParamsForm = ref({
  text: '',
  fontId: null
});

const fontParamsRules = {
  text: [{ required: true, message: '请输入文字内容', trigger: 'blur' }]
};

// AI生成内容相关
const aiGenDialogVisible = ref(false);
const aiGenPrompt = ref('');
const aiGenDialogLoading = ref(false);
const aiTableLoading = ref<Record<string, boolean>>({});
let aiGenRow = null;

// 批量AI补全相关
const batchAiLoading = ref(false);
const batchAiDialogVisible = ref(false);
const batchAiPrompt = ref('');
const batchAiDialogLoading = ref(false);
const batchProgress = ref({
  total: 0,
  processed: 0,
  success: 0,
  failed: 0
});

// 生成缩略图相关
const generateThumbnailDialogVisible = ref(false);
const generateThumbnailLoading = ref(false);
const thumbnailFormRef = ref();
const thumbnailForm = ref({
  templateText: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体',
  options: {
    fontSize: 100,
    textColor: '#000000'
  }
});
const thumbnailRules = {
  templateText: [{ required: true, message: '请输入模板文字', trigger: 'blur' }]
};

// 批量生成缩略图相关
const batchGenerateThumbnailDialogVisible = ref(false);
const batchGenerateThumbnailLoading = ref(false);
const batchThumbnailFormRef = ref();
const batchThumbnailForm = ref({
  fontUrl: '',
  templateText: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体',
  options: {
    fontSize: 100,
    textColor: '#000000'
  },
  batchSize: 3
});
const batchThumbnailRules = {
  templateText: [{ required: true, message: '请输入模板文字', trigger: 'blur' }]
};
const batchThumbnailProgress = ref({
  total: 0,
  processed: 0,
  success: 0,
  failed: 0
});

// 图片预览相关状态
const imagePreviewVisible = ref(false);
const currentImageUrl = ref('');

// 字体预览相关
const previewVisible = ref(false);
const currentPreviewUrl = ref('');
const fontPreviewLoaded = ref(false);
const currentFontFamily = ref('');

// 批量生成缩略图预览相关
const batchFontPreviewLoaded = ref(false);
const batchCurrentFontFamily = ref('');

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
}

getList();

// 操作函数
function handleQuery() {
  queryParams.currentPage = 1;
}

function resetQuery() {
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
      await fontTemplateApi.deleteFontTemplate({ ids: delIds });
      ElMessage.success("删除成功");
      getList();
    })
    .catch(() => {});
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
  dialogTitle.value = "新建字体模板";
  form.value = {
    file: null,
    name: "",
  };
}

function handleEdit(row) {
  currentRow.value = row;
  isEdit.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";

  form.value = {
    ...row,
  };
}

function cancel() {
  open.value = false;
}

const form = ref<{
  file?: any;
  name: string;
  id?: number;
  description?: string;
  keywords?: string;
}>({
  file: null,
  name: "",
  description: "",
  keywords: "",
});

const rules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  description: [{ required: false, message: "请输入描述", trigger: "blur" }],
  keywords: [{ required: false, message: "请输入关键字", trigger: "blur" }],
  // titleTemplateId: [{ required: true, message: "请选择标题模板", trigger: "blur" }],
  file: [{ required: true, message: "请选择字体文件", trigger: "blur" }],
};

const dialogClose = () => {
  dialogVisible.value = false;
  fileList.value = [];
  submitLoading.value = false;
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
      });
      ElMessage.success("更新成功");
      getList();
    } else {
      submitLoading.value = true;
      
      const cos = await uploadToCOS({ file: form.value.file });
      const { key, url } = cos;
      
      await fontTemplateApi.createFontTemplate({
        name: form.value.name,
        description: form.value.description,
        keywords: form.value.keywords,
        url,
        size: form.value.file.size,
        type: form.value.file.name.split(".").pop(),
        file: null,
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
    ElMessage.error('只能上传字体文件！');
    return false;
  }
  return true;
};

function handlePreview(row) {
  previewVisible.value = true
  currentRow.value = row
}

function handleFontParams(row) {
  fontParamsForm.value.fontId = row.id;
  fontParamsVisible.value = true;
}

function handleFontParamsClose() {
  fontParamsForm.value = {
    text: '',
    fontId: null
  };
  fontParamsVisible.value = false;
}

async function submitFontParams() {
  if (!fontParamsFormRef.value) return;
  
  try {
    await fontParamsFormRef.value.validate();
    fontParamsLoading.value = true;
    
    // 这里调用后端API
    await fontTemplateApi.genImage({
      fontId: fontParamsForm.value.fontId,
      text: fontParamsForm.value.text
    });
    
    ElMessage.success('生成成功');
    fontParamsVisible.value = false;
  } catch (error) {
    console.error('生成失败:', error);
  } finally {
    fontParamsLoading.value = false;
  }
}

const copyUrl = (url: string) => {
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('复制成功');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
};

// AI生成内容相关方法
function handleAiGenerate(row) {
  if (aiTableLoading.value[row.id]) return;
  aiGenRow = row;
  aiGenPrompt.value = '';
  aiGenDialogVisible.value = true;
}

async function submitAiGenDialog() {
  if (!aiGenRow) return;
  aiGenDialogLoading.value = true;
  aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: true };
  try {
    await handleAiAutoGenerate(aiGenRow, () => {
      aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false };
      aiGenDialogLoading.value = false;
      aiGenDialogVisible.value = false;
      aiGenRow = null;
    }, aiGenPrompt.value);
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
    const res = await fontTemplateApi.aiCompleteContent(row.id, prompt || '');
    
    // 更新行数据
    if (res) {
      row.name = res.name || row.name;
      row.description = res.description || row.description;
      row.keywords = res.keywords || row.keywords;
    }
    
    ElMessage.success('AI自动生成内容成功');
    if (typeof cb === 'function') cb();
    getList();
  } catch (e) {
    ElMessage.error('AI自动生成内容失败');
    if (typeof cb === 'function') cb();
  }
}

// 批量AI补全内容
async function handleBatchAiGenerate() {
  if (!ids.value.length) {
    ElMessage.warning('请先选择要批量操作的数据');
    return;
  }

  batchAiPrompt.value = '';
  batchAiDialogVisible.value = true;
}

async function submitBatchAiDialog() {
  if (!ids.value.length) return;
  
  batchAiDialogLoading.value = true;
  
  // 初始化进度
  batchProgress.value = {
    total: ids.value.length,
    processed: 0,
    success: 0,
    failed: 0
  };
  
  try {
    // 显示确认信息
    ElMessage.info(`开始处理 ${ids.value.length} 个字体模板，请耐心等待...`);
    
    const res = await fontTemplateApi.batchAiCompleteContent({
      ids: ids.value,
      prompt: batchAiPrompt.value,
      batchSize: 5
    });
    
    // 更新最终进度
    batchProgress.value.processed = res.processed;
    batchProgress.value.success = res.success;
    batchProgress.value.failed = res.failed;
    
    if (res.success > 0) {
      // 显示详细结果
      let message = `批量AI补全完成：成功 ${res.success} 个，失败 ${res.failed} 个`;
      
      if (res.failed > 0 && res.errors && res.errors.length > 0) {
        message += `\n失败项目：${res.errors.slice(0, 3).map(e => e.id).join(', ')}${res.errors.length > 3 ? '...' : ''}`;
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
      ElMessage.error('批量AI补全失败，请检查网络连接和AI服务状态');
    }
  } catch (error) {
    console.error('批量AI补全失败:', error);
    
    // 根据错误类型显示不同的提示
    let errorMessage = '批量AI补全失败';
    if (error.response?.status === 500) {
      errorMessage = '服务器内部错误，请稍后重试';
    } else if (error.response?.status === 429) {
      errorMessage = '请求过于频繁，请稍后重试';
    } else if (error.message?.includes('timeout')) {
      errorMessage = '请求超时，请检查网络连接';
    }
    
    ElMessage.error(errorMessage);
    // 重置进度
    batchProgress.value = { total: 0, processed: 0, success: 0, failed: 0 };
  } finally {
    batchAiDialogLoading.value = false;
  }
}

// 生成缩略图相关方法
function handleGenerateThumbnail(row) {
  currentRow.value = row;
  // 如果已有缩略图，提示用户
  if (row.thumbnail) {
    ElMessage.info('该字体模板已有缩略图，生成新的将覆盖现有缩略图');
  }
  // 重置为默认值并打开弹窗
  thumbnailForm.value.templateText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体';
  generateThumbnailDialogVisible.value = true;
}

async function submitGenerateThumbnail() {
  if (!thumbnailFormRef.value) return;
   
  try {
    await thumbnailFormRef.value.validate();
    generateThumbnailLoading.value = true;
    
    // 调用后端API生成缩略图
    await fontTemplateApi.generateThumbnail(currentRow.value.id?.toString() || '', {
      templateText: thumbnailForm.value.templateText,
      options: thumbnailForm.value.options
    });
    
    ElMessage.success('缩略图生成成功');
    generateThumbnailDialogVisible.value = false;
    getList(); // 刷新列表
  } catch (error) {
    console.error('缩略图生成失败:', error);
    ElMessage.error('缩略图生成失败，请稍后重试');
  } finally {
    generateThumbnailLoading.value = false;
  }
}

// 批量生成缩略图相关方法
function handleBatchGenerateThumbnail() {
  if (!ids.value.length) {
    ElMessage.warning('请先选择要批量操作的数据');
    return;
  }
  // 设置默认字体URL为第一个选中项的字体URL
  const firstItem = dataSource.value.find(item => item.id === ids.value[0]);
  batchThumbnailForm.value.fontUrl = firstItem?.url || '';
  batchThumbnailForm.value.templateText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体'; // 重置为默认值
  batchGenerateThumbnailDialogVisible.value = true;
}

async function submitBatchGenerateThumbnail() {
  if (!ids.value.length) return;
  
  batchGenerateThumbnailLoading.value = true;
  
  // 初始化进度
  batchThumbnailProgress.value = {
    total: ids.value.length,
    processed: 0,
    success: 0,
    failed: 0
  };
  
  try {
    // 显示确认信息
    ElMessage.info(`开始处理 ${ids.value.length} 个字体模板，请耐心等待...`);
    
    const res = await fontTemplateApi.batchGenerateThumbnail({
      ids: ids.value,
      templateText: batchThumbnailForm.value.templateText,
      options: batchThumbnailForm.value.options,
      batchSize: batchThumbnailForm.value.batchSize
    });
    
    // 更新最终进度
    batchThumbnailProgress.value.processed = res.processed;
    batchThumbnailProgress.value.success = res.success;
    batchThumbnailProgress.value.failed = res.failed;
    
    if (res.success > 0) {
      // 显示详细结果
      let message = `批量缩略图生成完成：成功 ${res.success} 个，失败 ${res.failed} 个`;
      
      if (res.failed > 0 && res.errors && res.errors.length > 0) {
        message += `\n失败项目：${res.errors.slice(0, 3).map(e => e.id).join(', ')}${res.errors.length > 3 ? '...' : ''}`;
      }
      
      ElMessage.success(message);
      
      // 刷新列表
      getList();
      // 清空选择
      ids.value = [];
      // 延迟关闭弹窗，让用户看到最终结果
      setTimeout(() => {
        batchGenerateThumbnailDialogVisible.value = false;
        // 重置进度
        batchThumbnailProgress.value = { total: 0, processed: 0, success: 0, failed: 0 };
      }, 3000);
    } else {
      ElMessage.error('批量缩略图生成失败，请检查网络连接和AI服务状态');
    }
  } catch (error) {
    console.error('批量缩略图生成失败:', error);
    
    // 根据错误类型显示不同的提示
    let errorMessage = '批量缩略图生成失败';
    if (error.response?.status === 500) {
      errorMessage = '服务器内部错误，请稍后重试';
    } else if (error.response?.status === 429) {
      errorMessage = '请求过于频繁，请稍后重试';
    } else if (error.message?.includes('timeout')) {
      errorMessage = '请求超时，请检查网络连接';
    }
    
    ElMessage.error(errorMessage);
    // 重置进度
    batchThumbnailProgress.value = { total: 0, processed: 0, success: 0, failed: 0 };
  } finally {
    batchGenerateThumbnailLoading.value = false;
  }
}

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'edit':
      handleEdit(row);
      break;
    case 'preview':
      handlePreview(row);
      break;
    case 'generate-thumbnail':
      handleGenerateThumbnail(row);
      break;
    case 'font-params':
      handleFontParams(row);
      break;
    case 'download':
      downloadFileByElement(row.url, row.name);
      break;
    case 'ai-generate':
      handleAiGenerate(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
    default:
      console.warn('未知的操作命令:', command);
  }
}

// 缩略图预览相关方法
function openThumbnailPreview(thumbnailUrl: string, fontName?: string) {
  currentImageUrl.value = thumbnailUrl;
  imagePreviewVisible.value = true;
}

function handleThumbnailError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'w-20 h-20 bg-red-100 rounded flex items-center justify-center text-red-400 text-xs';
    errorDiv.textContent = '加载失败';
    parent.appendChild(errorDiv);
  }
}

function closeImagePreview() {
  imagePreviewVisible.value = false;
  currentImageUrl.value = '';
}

function showFontPreview() {
  if (currentRow.value && currentRow.value.url) {
    previewVisible.value = true;
    currentPreviewUrl.value = currentRow.value.url;
  } else {
    ElMessage.warning('请先选择一个字体模板并生成缩略图，然后才能预览字体效果。');
  }
}

// 加载字体预览
async function loadFontPreview() {
  if (!currentRow.value?.url) {
    fontPreviewLoaded.value = false;
    currentFontFamily.value = '';
    return;
  }

  try {
    fontPreviewLoaded.value = false;
    
    // 创建唯一的字体名称
    const fontName = `FontPreview_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // 创建 @font-face 规则
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: '${fontName}';
        src: url('${currentRow.value.url}') format('woff2'),
             url('${currentRow.value.url}') format('woff'),
             url('${currentRow.value.url}') format('truetype'),
             url('${currentRow.value.url}') format('opentype');
        font-display: swap;
      }
    `;
    
    // 移除之前的样式（如果存在）
    const existingStyle = document.getElementById('font-preview-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    style.id = 'font-preview-style';
    document.head.appendChild(style);
    
    // 创建字体加载检测
    const font = new FontFace(fontName, `url(${currentRow.value.url})`);
    await font.load();
    
    // 字体加载完成
    currentFontFamily.value = fontName;
    fontPreviewLoaded.value = true;
    
    console.log('字体预览加载成功:', fontName);
    
  } catch (error) {
    console.error('字体预览加载失败:', error);
    fontPreviewLoaded.value = false;
    currentFontFamily.value = '';
    ElMessage.warning('字体预览加载失败，将使用系统默认字体');
  }
}

// 监听当前行变化，自动加载字体预览
watch(() => currentRow.value?.url, (newUrl) => {
  if (newUrl) {
    loadFontPreview();
  } else {
    fontPreviewLoaded.value = false;
    currentFontFamily.value = '';
  }
}, { immediate: true });

// 监听批量字体URL变化，自动加载字体预览
watch(() => batchThumbnailForm.value.fontUrl, (newUrl) => {
  if (newUrl) {
    loadBatchFontPreview();
  } else {
    batchFontPreviewLoaded.value = false;
    batchCurrentFontFamily.value = '';
  }
}, { immediate: true });

// 加载批量字体预览
async function loadBatchFontPreview() {
  if (!batchThumbnailForm.value.fontUrl) {
    batchFontPreviewLoaded.value = false;
    batchCurrentFontFamily.value = '';
    return;
  }

  try {
    batchFontPreviewLoaded.value = false;
    
    // 创建唯一的字体名称
    const fontName = `BatchFontPreview_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // 创建 @font-face 规则
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: '${fontName}';
        src: url('${batchThumbnailForm.value.fontUrl}') format('woff2'),
             url('${batchThumbnailForm.value.fontUrl}') format('woff'),
             url('${batchThumbnailForm.value.fontUrl}') format('truetype'),
             url('${batchThumbnailForm.value.fontUrl}') format('opentype');
        font-display: swap;
      }
    `;
    
    // 移除之前的样式（如果存在）
    const existingStyle = document.getElementById('batch-font-preview-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    style.id = 'batch-font-preview-style';
    document.head.appendChild(style);
    
    // 创建字体加载检测
    const font = new FontFace(fontName, `url(${batchThumbnailForm.value.fontUrl})`);
    await font.load();
    
    // 字体加载完成
    batchCurrentFontFamily.value = fontName;
    batchFontPreviewLoaded.value = true;
    
    console.log('批量字体预览加载成功:', fontName);
    
  } catch (error) {
    console.error('批量字体预览加载失败:', error);
    batchFontPreviewLoaded.value = false;
    batchCurrentFontFamily.value = '';
    ElMessage.warning('字体预览加载失败，将使用系统默认字体');
  }
}

function showBatchFontPreview() {
  if (batchThumbnailForm.value.fontUrl) {
    previewVisible.value = true;
    currentPreviewUrl.value = batchThumbnailForm.value.fontUrl;
  } else {
    ElMessage.warning('请先选择一个字体文件用于预览效果');
  }
}

function getFontUrlById(id: string) {
  const item = dataSource.value.find(item => item.id === id);
  return item?.url || '';
}

</script>

<style scoped>
.pb-4.flex, .search-bar {
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.pb-4.flex > *, .search-bar > * {
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .pb-4.flex, .search-bar {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    padding-bottom: 8px !important;
  }
  .pb-4.flex > *, .search-bar > * {
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
  .common-table {
    overflow-x: auto;
  }
}

.operation-dropdown {
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .el-icon {
      margin-right: 4px;
    }
  }
}

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
  min-height: 80px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
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
}

.preview-image:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.preview-image.compact:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.font-preview {
  background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
              linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
              linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
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

.operation-dropdown {
  margin-right: 8px;
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
  
  .preview-image {
    min-width: 100px !important;
    min-height: 50px !important;
  }
}
</style>
