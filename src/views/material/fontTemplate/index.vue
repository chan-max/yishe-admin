<template>
  <div>
    <div class="pb-4 flex flex-wrap justify-end gap-4 items-center search-bar">
      <!-- 搜索输入框 -->
      <div class="flex items-center gap-2">
        <el-input
          v-model="queryParams.searchKeyword"
          placeholder="搜索字体名称、描述、关键字"
          style="width: 300px;"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch" :icon="Search">
          搜索
        </el-button>
        <el-button @click="handleReset">
          重置
        </el-button>
      </div>
      
      <!-- 日期范围选择器 -->
      <form-item class="date-range-picker">
        <DateRangePicker
          @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end; getList() }"
        />
      </form-item>
      <el-button v-if="isAdmin" type="primary" @click="handleAdd" :icon="Plus">
        新增字体
      </el-button>
      <div v-if="isAdmin" class="flex shrink-0 gap-2">
        <el-button 
          type="success" 
          @click="handleBatchAiGenerate"
          :disabled="!ids.length"
          :loading="batchAiLoading"
        >
          批量AI补全 ({{ ids.length }})
        </el-button>
        <el-button 
          type="danger" 
          @click="handleBatchDelete"
          :disabled="!ids.length"
          :loading="batchDeleteLoading"
        >
          批量删除 ({{ ids.length }})
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
              loading="lazy"
              style="width:160px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"
              @click="openThumbnailPreview(row.thumbnail, row.name)"
              @error="handleThumbnailError"
            />
            <div v-else class="w-40 h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
              无缩略图
            </div>
          </div>
        </template>

        <template #languagesSlot="{ row }">
          <div class="flex flex-wrap gap-1">
            <el-tag
              v-for="langCode in (row.languages || [])"
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
                <el-icon class="ml-1" style="font-size: 12px;"><InfoFilled /></el-icon>
              </el-tooltip>
            </el-tag>
            <span v-if="!row.languages || row.languages.length === 0" class="text-gray-400 text-xs">未设置</span>
          </div>
        </template>

        <template #operationDefaultSlot="{ row }">
          <div class="flex items-center">
            <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, row)" class="operation-dropdown">
              <el-button type="primary" link size="small">
                操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu class="operation-menu-compact">
                  <el-dropdown-item v-if="isAdmin" command="edit">
                    <el-icon><Edit /></el-icon>
                    <span>编辑</span>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin" command="generate-thumbnail">
                    <el-icon><Picture /></el-icon>
                    <span>生成缩略图</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="download">
                    <el-icon><Download /></el-icon>
                    <span>下载源文件</span>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin" command="ai-generate">
                    <el-icon><MagicStick /></el-icon>
                    <span>AI生成内容</span>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin" command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    <span>删除</span>
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
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>{{ lang.label }}</span>
                    <span style="color: #909399; font-size: 12px; margin-left: 8px;">
                      {{ lang.example }} - {{ lang.chineseName }}
                    </span>
                  </div>
                </el-option>
              </el-select>
              <div style="margin-top: 8px; font-size: 12px; color: #909399;">
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
        <el-button type="primary" @click="submitForm" :loading="submitLoading"
          >确定</el-button
        >
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
      @close="resetFontPreview"
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
              <div v-if="fontLoading" class="font-loading-indicator">
                <el-icon class="is-loading" style="margin-right: 4px; color: #409EFF;"><Loading /></el-icon>
                <span style="color: #409EFF; font-size: 12px;">字体加载中...</span>
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
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }"
              >
                <!-- 状态信息区域 -->
                <div style="margin-bottom: 8px; font-size: 10px; color: #909399; flex-shrink: 0;">
                  <i class="el-icon-info"></i> 
                  <span v-if="fontLoading">
                    <el-icon class="is-loading" style="margin-right: 4px;"><Loading /></el-icon>
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
                    wordWrap: 'break-word'
                  }"
                >
                  {{ thumbnailForm.templateText || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体' }}
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
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }"
              >
                <!-- 状态信息区域 -->
                <div style="margin-bottom: 8px; font-size: 10px; color: #909399; flex-shrink: 0;">
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
                    wordWrap: 'break-word'
                  }"
                >
                  {{ thumbnailForm.templateText || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体' }}
                </div>
              </div>
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #909399; text-align: center;">
              字体预览会自动加载，实时显示字体大小、颜色和字体样式（自适应高度，固定宽度800px，宽高比2:1）
            </div>
          </div>
        </el-form-item>

        <el-form-item label="字体状态检查">
          <div style="padding: 12px; background: #fef3c7; border-radius: 4px; border-left: 3px solid #f59e0b;">
            <div style="margin-bottom: 8px; font-size: 13px; color: #92400e; font-weight: 500;">字体加载状态：</div>
            <div style="font-size: 12px; color: #92400e; line-height: 1.5;">
              <div v-if="fontLoading">
                <strong>🔄 字体加载中...</strong>
                <div style="margin-top: 4px; font-size: 11px; color: #d97706;">
                  正在加载字体文件，请稍候...
                </div>
              </div>
              <div v-else-if="loadedFontFamily">
                <strong>✅ 字体已加载：</strong>{{ loadedFontFamily }}
                <div style="margin-top: 4px; font-size: 11px; color: #d97706;">
                  当前预览区域使用自定义字体，前端生成缩略图将包含此字体效果
                </div>
                <div style="margin-top: 4px; font-size: 11px; color: #059669;">
                  💡 提示：字体已正确加载，可以安全使用前端生成功能
                </div>
              </div>
              <div v-else>
                <strong>⚠️ 字体未加载：</strong>当前使用系统默认字体
                <div style="margin-top: 4px; font-size: 11px; color: #d97706;">
                  字体预览会自动加载，如果长时间未加载成功，请检查字体文件URL是否可访问
                </div>
                <div style="margin-top: 4px; font-size: 11px; color: #dc2626;">
                  ⚠️ 警告：使用系统字体生成缩略图可能无法体现字体模板的真实效果
                </div>
              </div>
            </div>
            <div style="margin-top: 8px; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 4px;">
              <div style="font-size: 11px; color: #92400e;">
                <strong>调试信息：</strong>
                <div>字体URL: {{ currentRow.url || '未设置' }}</div>
                <div>加载状态: {{ fontLoading ? '加载中' : (loadedFontFamily ? '已加载' : '未加载') }}</div>
                <div>字体名称: {{ loadedFontFamily || '系统默认' }}</div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="generateThumbnailDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="frontendGenerateLoading" @click="submitFrontendGenerateThumbnail">生成缩略图</el-button>
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
  InfoFilled,
} from "@element-plus/icons-vue";
import { useWindowSize } from "@vueuse/core";

import { ShopPlatformApi } from "@/api/shop/platform";
import { ShopCategoryApi } from "@/api/shop/category";
import { ShopApi } from "@/api/shop/shopIndex";
import { downloadFileByElement } from "@/common/download";
import { uploadOSSFile } from "@/api/oss";
import { uploadToCOS } from "@/api/cos";
import PsdPreview from '@/components/PsdPreview/index.vue'
import { fontTemplateApi } from "@/api/fontTemplate";
import { ImagePreview } from '@/components/ImagePreview';
import { htmlToPngFile } from '@/utils/htmlToPng';
import { copyLink } from '@/utils/clipboard';

// 语言枚举定义
const LANGUAGE_OPTIONS = [
  { code: 'zh-CN', label: '简体中文', example: '你好世界', chineseName: '简体中文' },
  { code: 'zh-TW', label: '繁體中文', example: '你好世界', chineseName: '繁体中文' },
  { code: 'en', label: 'English', example: '你好世界', chineseName: '英语' },
  { code: 'es', label: 'Español', example: '你好世界', chineseName: '西班牙语' },
  { code: 'fr', label: 'Français', example: '你好世界', chineseName: '法语' },
  { code: 'de', label: 'Deutsch', example: '你好世界', chineseName: '德语' },
  { code: 'ja', label: '日本語', example: '你好世界', chineseName: '日语' },
  { code: 'ko', label: '한국어', example: '你好世界', chineseName: '韩语' },
  { code: 'ru', label: 'Русский', example: '你好世界', chineseName: '俄语' },
  { code: 'pt', label: 'Português', example: '你好世界', chineseName: '葡萄牙语' },
  { code: 'it', label: 'Italiano', example: '你好世界', chineseName: '意大利语' },
  { code: 'ar', label: 'العربية', example: '你好世界', chineseName: '阿拉伯语' },
  { code: 'hi', label: 'हिन्दी', example: '你好世界', chineseName: '印地语' },
  { code: 'th', label: 'ไทย', example: '你好世界', chineseName: '泰语' },
  { code: 'vi', label: 'Tiếng Việt', example: '你好世界', chineseName: '越南语' },
  { code: 'id', label: 'Bahasa Indonesia', example: '你好世界', chineseName: '印尼语' },
  { code: 'tr', label: 'Türkçe', example: '你好世界', chineseName: '土耳其语' },
  { code: 'pl', label: 'Polski', example: '你好世界', chineseName: '波兰语' },
  { code: 'nl', label: 'Nederlands', example: '你好世界', chineseName: '荷兰语' },
  { code: 'sv', label: 'Svenska', example: '你好世界', chineseName: '瑞典语' },
  { code: 'da', label: 'Dansk', example: '你好世界', chineseName: '丹麦语' },
  { code: 'no', label: 'Norsk', example: '你好世界', chineseName: '挪威语' },
  { code: 'fi', label: 'Suomi', example: '你好世界', chineseName: '芬兰语' },
  { code: 'cs', label: 'Čeština', example: '你好世界', chineseName: '捷克语' },
  { code: 'hu', label: 'Magyar', example: '你好世界', chineseName: '匈牙利语' },
  { code: 'ro', label: 'Română', example: '你好世界', chineseName: '罗马尼亚语' },
  { code: 'el', label: 'Ελληνικά', example: '你好世界', chineseName: '希腊语' },
  { code: 'he', label: 'עברית', example: '你好世界', chineseName: '希伯来语' },
  { code: 'uk', label: 'Українська', example: '你好世界', chineseName: '乌克兰语' },
  { code: 'bg', label: 'Български', example: '你好世界', chineseName: '保加利亚语' },
  { code: 'hr', label: 'Hrvatski', example: '你好世界', chineseName: '克罗地亚语' },
  { code: 'sk', label: 'Slovenčina', example: '你好世界', chineseName: '斯洛伐克语' },
  { code: 'sl', label: 'Slovenščina', example: '你好世界', chineseName: '斯洛文尼亚语' },
  { code: 'sr', label: 'Српски', example: '你好世界', chineseName: '塞尔维亚语' },
  { code: 'ms', label: 'Bahasa Melayu', example: '你好世界', chineseName: '马来语' },
  { code: 'tl', label: 'Filipino', example: '你好世界', chineseName: '菲律宾语' },
  { code: 'sw', label: 'Kiswahili', example: '你好世界', chineseName: '斯瓦希里语' },
  { code: 'bn', label: 'বাংলা', example: '你好世界', chineseName: '孟加拉语' },
  { code: 'ta', label: 'தமிழ்', example: '你好世界', chineseName: '泰米尔语' },
  { code: 'te', label: 'తెలుగు', example: '你好世界', chineseName: '泰卢固语' },
  { code: 'mr', label: 'मराठी', example: '你好世界', chineseName: '马拉地语' },
  { code: 'gu', label: 'ગુજરાતી', example: '你好世界', chineseName: '古吉拉特语' },
  { code: 'kn', label: 'ಕನ್ನಡ', example: '你好世界', chineseName: '卡纳达语' },
  { code: 'ml', label: 'മലയാളം', example: '你好世界', chineseName: '马拉雅拉姆语' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', example: '你好世界', chineseName: '旁遮普语' },
  { code: 'fa', label: 'فارسی', example: '你好世界', chineseName: '波斯语' },
  { code: 'ur', label: 'اردو', example: '你好世界', chineseName: '乌尔都语' },
  { code: 'ka', label: 'ქართული', example: '你好世界', chineseName: '格鲁吉亚语' },
  { code: 'am', label: 'አማርኛ', example: '你好世界', chineseName: '阿姆哈拉语' },
  { code: 'ha', label: 'Hausa', example: '你好世界', chineseName: '豪萨语' },
  { code: 'yo', label: 'Yorùbá', example: '你好世界', chineseName: '约鲁巴语' },
  { code: 'zu', label: 'isiZulu', example: '你好世界', chineseName: '祖鲁语' },
  { code: 'af', label: 'Afrikaans', example: '你好世界', chineseName: '南非荷兰语' },
  { code: 'eu', label: 'Euskara', example: '你好世界', chineseName: '巴斯克语' },
  { code: 'ca', label: 'Català', example: '你好世界', chineseName: '加泰罗尼亚语' },
  { code: 'gl', label: 'Galego', example: '你好世界', chineseName: '加利西亚语' },
];

// 根据语言代码获取语言信息
function getLanguageByCode(code: string) {
  return LANGUAGE_OPTIONS.find(lang => lang.code === code);
}

// 获取语言显示文本（带例子和中文）
function getLanguageDisplayText(codes: string[]): string {
  if (!codes || codes.length === 0) return '未设置';
  return codes.map(code => {
    const lang = getLanguageByCode(code);
    if (lang) {
      return `${lang.label} (${lang.example}) - ${lang.chineseName}`;
    }
    return code;
  }).join('; ');
}

const userStore = useUserStore()

// 判断是否为管理员
const isAdmin = computed(() => userStore.user?.isAdmin ?? false)

// 查询条件
const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  sortingFields: defaultSortingValue(),
  startTime: '',
  endTime: '',
  searchKeyword: '' // 搜索关键字
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
    // { 
    //   title: "文件地址", 
    //   field: "url", 
    //   width: 360,
    //   slots: {
    //     default: "urlDefaultSlot"
    //   }
    // },
    { title: "字体名称", field: "name", width: 240, showOverflow: true },
    { title: "描述", field: "description", minWidth: 200, showOverflow: true },
    { title: "关键字", field: "keywords", minWidth: 160, showOverflow: true },
    { title: "分类", field: "category", width: 120, showOverflow: true },
    { 
      title: "适用语言", 
      field: "languages", 
      minWidth: 200, 
      slots: { default: "languagesSlot" } 
    },
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

// 批量删除相关
const batchDeleteLoading = ref(false);

// 生成缩略图相关
const generateThumbnailDialogVisible = ref(false);
const frontendGenerateLoading = ref(false);
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

// 图片预览相关状态
const imagePreviewVisible = ref(false);
const currentImageUrl = ref('');

// 字体预览相关状态
const fontLoading = ref(false);
const loadedFontFamily = ref('');



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

// 搜索功能
function handleSearch() {
  queryParams.currentPage = 1;
  getList();
}

// 重置功能
function handleReset() {
  queryParams.searchKeyword = '';
  queryParams.startTime = '';
  queryParams.endTime = '';
  queryParams.currentPage = 1;
  getList();
}

function resetQuery() {
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
    ElMessage.warning('请先选择要删除的数据');
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
        dangerouslyUseHTMLString: true
      }
    );

    batchDeleteLoading.value = true;
    
    // 调用删除API
    await fontTemplateApi.deleteFontTemplate({ ids: ids.value });
    
    ElMessage.success(`成功删除 ${ids.value.length} 个字体模板`);
    
    // 清空选择并刷新列表
    ids.value = [];
    getList();
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败，请稍后重试');
    }
  } finally {
    batchDeleteLoading.value = false;
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

function cancel() {
  open.value = false;
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
    const fontStyles = document.querySelectorAll('style');
    fontStyles.forEach(style => {
      if (style.innerHTML.includes(loadedFontFamily.value)) {
        style.remove();
      }
    });
    loadedFontFamily.value = '';
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
      
      const cos = await uploadToCOS({ file: form.value.file });
      const { key, url } = cos;
      
      await fontTemplateApi.createFontTemplate({
        name: form.value.name,
        description: form.value.description,
        keywords: form.value.keywords,
        languages: form.value.languages || [],
        url,
        size: form.value.file.size,
        type: form.value.file.name.split(".").pop(),
        file: null,
        uploaderId: userStore.user?.id
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



const copyUrl = (url: string) => {
  copyLink(url);
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
  // 重置字体预览状态
  resetFontPreview();
  // 重置为默认值并打开弹窗
  thumbnailForm.value.templateText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()\n你好世界字体设计创意无限中文排版艺术字体设计美学\n字体之美排版艺术设计灵感创意设计字体艺术排版之美设计创意字体排版艺术设计创意字体';
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
    const previewElement = document.querySelector('.single-preview') as HTMLElement;
    if (!previewElement) {
      ElMessage.error('找不到预览元素，请确保预览区域已正确显示');
      return;
    }
    
    // 确保预览元素有正确的尺寸
    console.log('预览元素尺寸:', previewElement.offsetWidth, 'x', previewElement.offsetHeight);
    
    // 确保字体完全加载和应用
    if (loadedFontFamily.value) {
      console.log('开始等待字体加载完成...');
      console.log('当前加载的字体:', loadedFontFamily.value);
      
      // 等待字体加载完成
      await document.fonts.ready;
      console.log('字体加载完成，等待渲染...');
      
      // 检查字体是否已加载
      const fontFaceSet = document.fonts;
      console.log('字体集合状态:', fontFaceSet);
      
      // 强制应用字体到预览元素
      previewElement.style.fontFamily = loadedFontFamily.value;
      
      // 触发重排，确保字体样式被应用
      previewElement.offsetHeight;
      
      // 等待更长时间确保字体完全渲染
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 再次检查字体是否已应用
      const computedStyle = window.getComputedStyle(previewElement);
      console.log('当前字体:', computedStyle.fontFamily);
      console.log('字体是否包含自定义字体:', computedStyle.fontFamily.includes(loadedFontFamily.value));
      
      // 如果字体还没有应用，再等待一段时间
      if (!computedStyle.fontFamily.includes(loadedFontFamily.value)) {
        console.log('字体未应用，继续等待...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 再次强制应用字体
        previewElement.style.fontFamily = loadedFontFamily.value;
        previewElement.offsetHeight;
        
        // 再次检查
        const finalComputedStyle = window.getComputedStyle(previewElement);
        console.log('最终字体:', finalComputedStyle.fontFamily);
      }
    } else {
      console.log('没有加载的字体，使用系统默认字体');
    }
    
    console.log('开始生成图片...');
    
    // 使用htmlToPngFile方法生成PNG文件
    const file = await htmlToPngFile(previewElement, `${currentRow.value.name || 'font'}_thumbnail.png`);
    console.log('PNG文件生成完成:', file);
    
    console.log('PNG文件生成完成，准备上传到COS');
    
    // 上传到COS
    const cos = await uploadToCOS({ file });
    const { url } = cos;
    
    // 调用后端API更新缩略图路径
    await fontTemplateApi.updateFontTemplate({
      id: currentRow.value.id,
      thumbnail: url
    });
    
    ElMessage.success('前端缩略图生成成功');
    generateThumbnailDialogVisible.value = false;
    getList(); // 刷新列表
    
  } catch (error) {
    console.error('前端缩略图生成失败:', error);
    ElMessage.error('前端缩略图生成失败，请稍后重试');
  } finally {
    frontendGenerateLoading.value = false;
  }
}

// 字体加载预览相关方法
async function loadFontForPreview() {
  if (!currentRow.value?.url) {
    return;
  }
  
  // 重置之前的状态
  loadedFontFamily.value = '';
  fontLoading.value = true;
  
  try {
    console.log('开始加载字体:', currentRow.value.url);
    
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
    console.log('等待字体加载...');
    await document.fonts.ready;
    
    // 使用FontFace API检查字体加载状态
    const fontFace = new FontFace(fontId, `url(${fontBlobUrl})`);
    await fontFace.load();
    
    // 将字体添加到字体集合（兼容性处理）
    try {
      (document.fonts as any).add(fontFace);
    } catch (error) {
      console.warn('FontFace API add方法不支持，跳过:', error);
    }
    
    // 设置字体名称
    loadedFontFamily.value = fontId;
    
    // 强制触发字体重新渲染
    const previewElement = document.querySelector('.single-preview') as HTMLElement;
    if (previewElement) {
      previewElement.style.fontFamily = fontId;
      // 触发重排
      previewElement.offsetHeight;
      
      // 等待字体应用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 验证字体是否已应用
      const computedStyle = window.getComputedStyle(previewElement);
      console.log('字体应用状态:', computedStyle.fontFamily);
    }
    
    console.log('字体加载成功:', fontId);
    
  } catch (error) {
    console.error('字体加载失败:', error);
    // 静默失败，不显示错误消息
    // 重置字体状态
    loadedFontFamily.value = '';
  } finally {
    fontLoading.value = false;
  }
}

// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'edit':
      handleEdit(row);
      break;
    case 'preview':
      // handlePreview(row);
      break;
    case 'generate-thumbnail':
      handleGenerateThumbnail(row);
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
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    
    span {
      font-size: 13px;
      line-height: 1.5;
    }
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

.operation-dropdown {
  margin-right: 8px;
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
