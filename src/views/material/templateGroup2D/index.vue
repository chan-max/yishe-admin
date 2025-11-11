<template>
  <div class="p-4">
    <div class="py-4 flex justify-between gap-4 items-center">
      <div style="flex: 1"></div>
      <div class="shrink-0">
        <el-button type="primary" @click="handleAdd">新增</el-button>
      </div>
    </div>
    <div class="common-table">
      <vxe-grid
        v-bind="gridOptions"
        :data="dataSource"
        :loading="loading"
      >
        <template #imagesSlot="{ row }">
          <div class="images-with-config" :class="{ 'template-group': getImages(row).length > 1 }">
            <div v-for="(url, i) in getImages(row)" :key="i" class="image-config-item">
              <div class="image-preview">
                <el-image
                  :src="url"
                  :preview-src-list="getImages(row)"
                  :initial-index="i"
                  fit="cover"
                  @load="() => ensureImageMeta(url)"
                />
                <div class="image-label">图片{{ i + 1 }}</div>
              </div>
              <div class="config-info">
                <div v-if="getImageConfig(row, i + 1)" class="config-details">
                  <div class="config-line">
                    <span class="label">模式:</span>
                    <span class="value mode-tag" :class="getConfigMode(row, i) === 'topLeftFixedSize' ? 'mode-fixed' : 'mode-topleft'">
                      {{ getConfigModeLabel(getConfigMode(row, i)) }}
                    </span>
                  </div>
                  <div class="config-line">
                    <span class="label">位置:</span>
                    <span class="value">{{ getImageConfig(row, i + 1).position?.xPercent || 0 }}%, {{ getImageConfig(row, i + 1).position?.yPercent || 0 }}%</span>
                  </div>
                  <div class="config-line">
                    <span class="label">尺寸:</span>
                    <span class="value">
                      {{ getImageConfig(row, i + 1).size?.widthPercent || 30 }}%
                      <template v-if="getConfigMode(row, i) === 'topLeftFixedSize' && getImageConfig(row, i + 1).size?.heightPercent">
                        × {{ getImageConfig(row, i + 1).size.heightPercent }}%
                      </template>
                      <template v-else>
                        <span class="size-hint">(高度自适应)</span>
                      </template>
                    </span>
                  </div>
                  <div class="config-line">
                    <span class="label">透明度:</span>
                    <span class="value">{{ getImageConfig(row, i + 1).opacity || 100 }}%</span>
                  </div>
                  <div class="config-line" v-if="getImageConfig(row, i + 1).keepOriginal">
                    <span class="label">保持原图:</span>
                    <span class="value">是</span>
                  </div>
                </div>
                <div v-else class="config-default">默认配置</div>
              </div>
            </div>
          </div>
        </template>
        <template #operationDefaultSlot="{ row }">
          <el-dropdown trigger="hover">
            <span class="el-dropdown-link">
              <el-button link type="primary" size="small">操作</el-button>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                <el-dropdown-item @click="openImageOption(row)">编辑图片模板信息</el-dropdown-item>
                <el-dropdown-item divided @click="handleDelete(row)" class="text-red-500">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </vxe-grid>
    </div>
    <div class="py-4 flex justify-end">
      <pagination
        :total="total"
        v-model:page="queryParams.currentPage"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="800px" align-center @close="dialogClose">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="名称" prop="name">
              <el-input v-model="form.name" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="关键字" prop="keywords">
              <el-input v-model="form.keywords" placeholder="逗号分隔" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" maxlength="1000" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="图片">
              <div class="uploader">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  multiple
                  accept="image/*"
                  :before-upload="beforeUploadImage"
                  :on-change="handleFileChange"
                >
                  <el-button type="primary">选择图片</el-button>
                </el-upload>
                <div class="thumbs">
                  <div class="thumb" v-for="(item, idx) in imageItems" :key="idx">
                    <el-image
                      :src="item.preview || item.url"
                      :preview-src-list="imageItems.map(i => i.preview || i.url).filter(Boolean)"
                      :initial-index="idx"
                      fit="cover"
                      @load="() => (item.url ? ensureImageMeta(item.url) : undefined)"
                    />
                    
                    <div class="ops">
                      <el-button size="small" @click="replaceImage(idx)">替换</el-button>
                      <el-button size="small" type="danger" @click="removeImage(idx)">移除</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑图片模板信息 -->
    <el-dialog
      v-model="imageOptionDialogVisible"
      title="编辑图片模板信息"
      fullscreen
    >
      <div v-if="currentImageRow" class="image-option-body">
        <div class="image-option-grid vertical">
          <div
            class="image-option-item"
            v-for="(url, index) in getImages(currentImageRow)"
            :key="index"
          >
            <div class="preview" :ref="el => (previewRefs[index] = el)" :style="getPreviewBoxStyle(url)">
              <div class="preview-image-wrapper">
                <el-image 
                  :src="url" 
                  fit="contain" 
                  @load="() => handleImageLoaded(url)" 
                />
              </div>
              <!-- 两种模式统一：显示半透明背景区域和左上角十字标识 -->
              <div 
                class="overlay-block" 
                :style="getOverlayStyle(url, index)"
              ></div>
              <div 
                class="overlay-cross-marker" 
                :style="getCrossMarkerStyle(url, index)"
              ></div>
            </div>
            <div class="details">
              <div class="meta">
                <div class="line">尺寸：<span>{{ imageMetaMap[url]?.w || '-' }}×{{ imageMetaMap[url]?.h || '-' }}</span></div>
                <div class="line">比例：<span>{{ imageMetaMap[url]?.ratio || '-' }}</span></div>
              </div>
              <div class="config-editor">
                <!-- 配置模式显示 -->
                <div class="mode-info">
                  <div class="mode-header">
                    <h4>配置模式</h4>
                    <el-select
                      v-model="manualConfigs[index].mode"
                      size="small"
                      style="width: 200px"
                      @change="onManualConfigChange(index)"
                    >
                      <el-option label="左上角对齐-自动高度" value="topLeftAutoHeight" />
                      <el-option label="左上角对齐-固定尺寸" value="topLeftFixedSize" />
                    </el-select>
                  </div>
                  <div class="mode-description">
                    <div class="mode-brief">
                      <span class="mode-desc-text">{{ getModeDescription(manualConfigs[index]?.mode || 'topLeftAutoHeight').description }}</span>
                      <!-- 固定尺寸模式提示 -->
                      <el-alert
                        v-if="manualConfigs[index]?.mode === 'topLeftFixedSize'"
                        type="warning"
                        :closable="false"
                        show-icon
                        style="margin-top: 8px;"
                      >
                        <template #title>
                          <span style="font-size: 12px;">由于尺寸固定，素材图会自动裁剪为指定宽高，不保持原始宽高比</span>
                        </template>
                      </el-alert>
                      <el-popover
                        placement="right"
                        :width="500"
                        trigger="hover"
                        popper-class="mode-detail-popover"
                      >
                        <template #reference>
                          <el-button 
                            text 
                            type="primary" 
                            size="small" 
                            class="mode-detail-btn"
                          >
                            <el-icon><InfoFilled /></el-icon>
                            查看详情
                          </el-button>
                        </template>
                        <template #default>
                          <div class="mode-details-popover" v-if="manualConfigs[index].mode === 'topLeftAutoHeight' || !manualConfigs[index]?.mode">
                            <div class="detail-section">
                              <div class="detail-title">
                                <el-icon><InfoFilled /></el-icon>
                                <span>工作原理</span>
                              </div>
                              <ul class="detail-list">
                                <li>图片的<strong>左上角</strong>会与您指定的位置坐标对齐</li>
                                <li>位置坐标使用百分比表示：(0, 0) 表示模板左上角，(100, 100) 表示模板右下角</li>
                                <li>宽度由 <code>widthPercent</code> 参数控制，表示占模板宽度的百分比</li>
                                <li>高度会根据图片的原始宽高比自动计算，保持图片不变形</li>
                              </ul>
                            </div>
                            <div class="detail-section">
                              <div class="detail-title">
                                <el-icon><Setting /></el-icon>
                                <span>参数说明</span>
                              </div>
                              <div class="param-table">
                                <div class="param-row">
                                  <div class="param-name">position.xPercent</div>
                                  <div class="param-desc">素材左上角的X坐标（百分比，0-100）</div>
                                </div>
                                <div class="param-row">
                                  <div class="param-name">position.yPercent</div>
                                  <div class="param-desc">素材左上角的Y坐标（百分比，0-100）</div>
                                </div>
                                <div class="param-row">
                                  <div class="param-name">size.widthPercent</div>
                                  <div class="param-desc">素材宽度占模板宽度的百分比（1-100）</div>
                                </div>
                                <div class="param-row">
                                  <div class="param-name">opacity</div>
                                  <div class="param-desc">素材透明度（0-100，100表示完全不透明）</div>
                                </div>
                              </div>
                            </div>
                            <div class="detail-section">
                              <div class="detail-title">
                                <el-icon><Document /></el-icon>
                                <span>使用示例</span>
                              </div>
                              <div class="example-box">
                                <div class="example-item">
                                  <strong>示例1：左上角放置</strong>
                                  <code>{ position: { xPercent: 0, yPercent: 0 }, size: { widthPercent: 30 } }</code>
                                  <div class="example-desc">图片左上角对齐模板左上角，宽度为模板的30%</div>
                                </div>
                                <div class="example-item">
                                  <strong>示例2：居中偏上</strong>
                                  <code>{ position: { xPercent: 35, yPercent: 10 }, size: { widthPercent: 50 } }</code>
                                  <div class="example-desc">图片左上角位于模板中心偏上位置，宽度为模板的50%</div>
                                </div>
                                <div class="example-item">
                                  <strong>示例3：右下角区域</strong>
                                  <code>{ position: { xPercent: 70, yPercent: 70 }, size: { widthPercent: 25 } }</code>
                                  <div class="example-desc">图片左上角位于右下角区域，宽度为模板的25%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div class="mode-details-popover" v-else-if="manualConfigs[index].mode === 'topLeftFixedSize'">
                            <div class="detail-section">
                              <div class="detail-title">
                                <el-icon><InfoFilled /></el-icon>
                                <span>工作原理</span>
                              </div>
                              <ul class="detail-list">
                                <li>图片的<strong>左上角</strong>会与您指定的位置坐标对齐（与topLeftAutoHeight模式相同）</li>
                                <li>位置坐标使用百分比表示：(0, 0) 表示模板左上角，(100, 100) 表示模板右下角</li>
                                <li>宽度由 <code>widthPercent</code> 参数控制，表示占模板宽度的百分比</li>
                                <li>高度由 <code>heightPercent</code> 参数控制，表示占模板高度的百分比</li>
                                <li><strong>重要：</strong>素材图会被裁剪为指定的宽高尺寸，不保持原始宽高比</li>
                                <li>裁剪方式：从素材图的左上角开始，按照指定尺寸进行裁剪</li>
                              </ul>
                            </div>
                            <div class="detail-section">
                              <div class="detail-title">
                                <el-icon><Setting /></el-icon>
                                <span>参数说明</span>
                              </div>
                              <div class="param-table">
                                <div class="param-row">
                                  <div class="param-name">position.xPercent</div>
                                  <div class="param-desc">素材左上角的X坐标（百分比，0-100）</div>
                                </div>
                                <div class="param-row">
                                  <div class="param-name">position.yPercent</div>
                                  <div class="param-desc">素材左上角的Y坐标（百分比，0-100）</div>
                                </div>
                                <div class="param-row">
                                  <div class="param-name">size.widthPercent</div>
                                  <div class="param-desc">素材宽度占模板宽度的百分比（1-100）</div>
                                </div>
                                <div class="param-row">
                                  <div class="param-name">size.heightPercent</div>
                                  <div class="param-desc">素材高度占模板高度的百分比（1-100）<strong>（仅固定尺寸模式）</strong></div>
                                </div>
                                <div class="param-row">
                                  <div class="param-name">opacity</div>
                                  <div class="param-desc">素材透明度（0-100，100表示完全不透明）</div>
                                </div>
                              </div>
                            </div>
                            <div class="detail-section">
                              <div class="detail-title">
                                <el-icon><Document /></el-icon>
                                <span>使用示例</span>
                              </div>
                              <div class="example-box">
                                <div class="example-item">
                                  <strong>示例1：固定正方形区域</strong>
                                  <code>{ mode: "topLeftFixedSize", position: { xPercent: 10, yPercent: 10 }, size: { widthPercent: 30, heightPercent: 30 } }</code>
                                  <div class="example-desc">素材被裁剪为30%×30%的正方形，放置在左上角区域</div>
                                </div>
                                <div class="example-item">
                                  <strong>示例2：固定矩形区域</strong>
                                  <code>{ mode: "topLeftFixedSize", position: { xPercent: 50, yPercent: 20 }, size: { widthPercent: 40, heightPercent: 20 } }</code>
                                  <div class="example-desc">素材被裁剪为40%×20%的矩形，放置在中心偏上位置</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </template>
                      </el-popover>
                    </div>
                  </div>
                </div>
                <!-- 手动配置 -->
                <div class="manual-controls">
                  <h4>手动配置</h4>
                  <!-- 位置控制 -->
                  <div class="control-group">
                    <label>位置 (左上角为原点，单位: 百分比):</label>
                        <div class="position-controls vertical">
                          <div class="control-item">
                            <span>X%:</span>
                            <el-slider
                              v-model="manualConfigs[index].position.xPercent"
                              :min="0"
                              :max="100"
                              :step="0.1"
                              show-input
                              @change="onManualConfigChange(index)"
                            />
                          </div>
                          <div class="control-item">
                            <span>Y%:</span>
                            <el-slider
                              v-model="manualConfigs[index].position.yPercent"
                              :min="0"
                              :max="100"
                              :step="0.1"
                              show-input
                              @change="onManualConfigChange(index)"
                            />
                          </div>
                        </div>
                  </div>

                  <!-- 尺寸控制 -->
                  <div class="control-group">
                    <label>尺寸 (百分比%):</label>
                    <div class="control-item">
                      <span>宽度%:</span>
                      <el-slider
                        v-model="manualConfigs[index].size.widthPercent"
                        :min="1"
                        :max="100"
                        :step="1"
                        show-input
                        @change="onManualConfigChange(index)"
                      />
                    </div>
                    <!-- 固定尺寸模式显示高度配置 -->
                    <div v-if="manualConfigs[index].mode === 'topLeftFixedSize'" class="control-item" style="margin-top: 12px;">
                      <span>高度%:</span>
                      <el-slider
                        v-model="manualConfigs[index].size.heightPercent"
                        :min="1"
                        :max="100"
                        :step="1"
                        show-input
                        @change="onManualConfigChange(index)"
                      />
                    </div>
                  </div>

                  <!-- 旋转角度 -->
                  <div class="control-group">
                    <label>旋转角度 (度):</label>
                    <div class="control-item">
                      <span>角度:</span>
                      <el-slider
                        v-model="manualConfigs[index].rotationDegrees"
                        :min="0"
                        :max="360"
                        :step="1"
                        show-input
                        @change="onManualConfigChange(index)"
                      />
                    </div>
                  </div>

                  <!-- 固定尺寸模式下的填充方式选择 -->
                  <div v-if="manualConfigs[index].mode === 'topLeftFixedSize'" class="control-group" style="margin-top: 16px;">
                    <label>填充方式:</label>
                    <div class="control-item">
                      <el-radio-group
                        v-model="manualConfigs[index].fitMode"
                        @change="onManualConfigChange(index)"
                      >
                        <el-radio label="crop">裁剪（填满区域，可能裁剪图片）</el-radio>
                        <el-radio label="contain">空白填充（保持原图完整，居中显示）</el-radio>
                      </el-radio-group>
                      <div style="font-size: 12px; color: var(--el-text-color-secondary); margin-top: 8px;">
                        <div v-if="manualConfigs[index].fitMode === 'crop'">
                          图片会被缩放并裁剪为指定尺寸，保持填满整个区域，可能会裁剪掉部分内容
                        </div>
                        <div v-else>
                          图片会保持原始宽高比完整显示，居中放置在指定区域内，空白部分用透明填充
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 透明度控制 -->
                  <div class="control-group">
                    <label>透明度:</label>
                    <div class="control-item">
                      <span>透明度%:</span>
                      <el-slider
                        v-model="manualConfigs[index].opacity"
                        :min="0"
                        :max="100"
                        :step="1"
                        show-input
                        @change="onManualConfigChange(index)"
                      />
                    </div>
                  </div>

                  <!-- 圆角控制 -->
                  <div class="control-group">
                    <label>圆角 (按素材图宽高百分比):</label>
                    <div class="control-item">
                      <span>圆角%:</span>
                      <el-slider
                        v-model="manualConfigs[index].borderRadius"
                        :min="0"
                        :max="50"
                        :step="0.5"
                        show-input
                        @change="onManualConfigChange(index)"
                      />
                      <div style="font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px;">
                        圆角按素材图宽高的百分比计算，圆角边缘透明，可看到后面的模板图
                      </div>
                    </div>
                  </div>

                  <!-- 保持原图开关 -->
                  <div class="control-group">
                    <label>保持原图:</label>
                    <div class="control-item">
                      <el-switch
                        v-model="manualConfigs[index].keepOriginal"
                        @change="onManualConfigChange(index)"
                      />
                      <span style="margin-left: 8px; font-size: 12px; color: var(--el-text-color-secondary);">
                        开启时不进行图片组合，直接使用模板原图
                      </span>
                    </div>
                  </div>

                </div>

                <!-- JSON配置 -->
                <div class="json-editor">
                  <h4>JSON配置</h4>
                  <el-input
                    v-model="imageOptionsDraft[index]"
                    type="textarea"
                    :rows="6"
                    :placeholder="jsonPlaceholder"
                    @input="onJsonConfigChange(index)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="imageOptionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveImageOptions" :loading="imageOptionSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
  
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled, Setting, Document } from '@element-plus/icons-vue'
import { uploadToCOS } from '@/api/cos'
import { pageTemplateGroup2D, createTemplateGroup2D, updateTemplateGroup2D, deleteTemplateGroup2D } from '@/api/templateGroup2D'
import { commonGridOptions } from '@/common/table'

const queryParams = reactive({ currentPage: 1, pageSize: 20 })
const jsonPlaceholder = `请输入JSON配置，例如：

模式1 - topLeftAutoHeight（左上角对齐-自动高度）：
{
  "mode": "topLeftAutoHeight",
  "position": { "xPercent": 0, "yPercent": 0 },
  "size": { "widthPercent": 30 },
  "rotationDegrees": 0,
  "opacity": 100,
  "borderRadius": 0,
  "keepOriginal": false
}

模式2 - topLeftFixedSize（左上角对齐-固定尺寸）：
{
  "mode": "topLeftFixedSize",
  "position": { "xPercent": 0, "yPercent": 0 },
  "size": { "widthPercent": 30, "heightPercent": 30 },
  "rotationDegrees": 0,
  "opacity": 100,
  "borderRadius": 5,
  "keepOriginal": false
}

参数说明：
• mode: 配置模式，"topLeftAutoHeight"（左上角对齐-自动高度）或 "topLeftFixedSize"（左上角对齐-固定尺寸）
• position: { xPercent, yPercent } - 素材左上角坐标(百分比)，0,0表示左上角，100,100表示右下角
• size: 
  - topLeftAutoHeight模式: { widthPercent: 1-100 } - 宽度百分比，高度自动计算
  - topLeftFixedSize模式: { widthPercent: 1-100, heightPercent: 1-100 } - 宽高百分比，素材会被裁剪
• rotationDegrees: 旋转角度（0-360，围绕素材中心旋转）
• opacity: 0-100 - 素材透明度百分比，100表示完全不透明
• borderRadius: 0-50 - 圆角百分比（按素材图宽高计算），圆角边缘透明，可看到后面的模板图
• keepOriginal: true/false - 是否保持原图`

const gridOptions = ref<any>({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { title: '图片与配置', field: 'images', minWidth: 500, slots: { default: 'imagesSlot' } },
    { title: '名称', field: 'name', minWidth: 240 },
    { title: '关键字', field: 'keywords', minWidth: 240 },
    { title: '描述', field: 'description', minWidth: 320 },
    { title: '更新时间', field: 'updateTime', width: 180 },
    { title: '操作', fixed: 'right', width: 96, slots: { default: 'operationDefaultSlot' } },
  ]
})

const dataSource = ref([])
const loading = ref(false)
const total = ref(0)
const formRef = ref()
const dialogTitle = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const currId = ref<string | null>(null)

const form = ref({
  name: '',
  description: '',
  keywords: ''
})

// imageItems: [{ url?: string, file?: File, preview?: string }]
const imageItems = ref<any[]>([])
const submitLoading = ref(false)
// 缓存图片元数据 { url: { w, h, ratio } }
const imageMetaMap = reactive<Record<string, { w: number; h: number; ratio: string }>>({})

const imageOptionDialogVisible = ref(false)
const currentImageRow = ref<any>(null)
const imageOptionsDraft = ref<string[]>([])
const imageOptionSaving = ref(false)
const manualConfigs = ref<any[]>([])
const previewRefs = ref<any[]>([])
const overlayTick = ref(0)

function computeRatio(w: number, h: number) {
  if (!w || !h) return '-'
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const g = gcd(w, h)
  return `${Math.round(w / g)}:${Math.round(h / g)}`
}

function ensureImageMeta(url: string) {
  if (!url || imageMetaMap[url]) return
  const img = new Image()
  img.onload = () => {
    const w = img.naturalWidth
    const h = img.naturalHeight
    imageMetaMap[url] = { w, h, ratio: computeRatio(w, h) }
  }
  img.src = url
}

function openImageOption(row) {
  currentImageRow.value = row
  const urls = getImages(row)
  imageOptionsDraft.value = urls.map((_, idx) => {
    const key = `imageOption${idx + 1}`
    const val = row[key]
    try {
      if (val === undefined || val === null) return getDefaultImageOption()
      // 如果是字符串，直接展示原始字符串，避免出现被加上引号的情况
      if (typeof val === 'string') return val
      // 对象/数组等再进行格式化
      return JSON.stringify(val, null, 2)
    } catch (e) {
      return getDefaultImageOption()
    }
  })
  
  // 初始化手动配置
  manualConfigs.value = urls.map((_, idx) => {
    const key = `imageOption${idx + 1}`
    const val = row[key]
    try {
      let config
      if (val === undefined || val === null) {
        config = getDefaultManualConfig()
      } else if (typeof val === 'string') {
        try {
          config = JSON.parse(val)
        } catch {
          config = getDefaultManualConfig()
        }
      } else {
        config = val
      }
      // 确保有mode字段，兼容旧配置
      if (!config.mode) {
        config.mode = 'topLeftAutoHeight'
      }
      // 兼容旧模式名称
      if (config.mode === 'topLeft') {
        config.mode = 'topLeftAutoHeight'
      }
      if (config.mode === 'fixedSize') {
        config.mode = 'topLeftFixedSize'
      }
      // 确保有 rotationDegrees 字段
      if (config.rotationDegrees === undefined || config.rotationDegrees === null) {
        config.rotationDegrees = 0
      }
      // 如果是topLeftFixedSize模式但没有heightPercent，设置默认值
      if (config.mode === 'topLeftFixedSize' && !config.size?.heightPercent) {
        config.size = config.size || {}
        config.size.heightPercent = config.size.widthPercent || 30
      }
      // 确保有borderRadius字段，默认0
      if (config.borderRadius === undefined || config.borderRadius === null) {
        config.borderRadius = 0
      }
      // 确保有fitMode字段，默认'crop'（仅固定尺寸模式需要）
      if (config.mode === 'topLeftFixedSize' && (config.fitMode === undefined || config.fitMode === null)) {
        config.fitMode = 'crop'
      }
      return config
    } catch (e) {
      return getDefaultManualConfig()
    }
  })
  
  imageOptionDialogVisible.value = true
  // 等待渲染，初始化元数据并强制刷新一次覆盖块
  nextTick(() => {
    urls.forEach((u) => ensureImageMeta(u))
    overlayTick.value++
  })
}

function getDefaultImageOption() {
  return JSON.stringify({
    mode: 'topLeftAutoHeight',
    position: { xPercent: 0, yPercent: 0 },
    size: { widthPercent: 30 },
    rotationDegrees: 0,
    opacity: 100,
    borderRadius: 0,
    keepOriginal: false
  }, null, 2)
}

function getDefaultManualConfig() {
  return {
    mode: 'topLeftAutoHeight',
    position: { xPercent: 0, yPercent: 0 },
    size: { widthPercent: 30 },
    rotationDegrees: 0,
    opacity: 100,
    borderRadius: 0,
    keepOriginal: false,
    fitMode: 'crop' // 默认裁剪模式
  }
}

// 根据模式获取默认配置（已废弃，保留用于兼容）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getDefaultConfigByMode(mode: string) {
  if (mode === 'topLeftFixedSize') {
    return {
      mode: 'topLeftFixedSize',
      position: { xPercent: 0, yPercent: 0 },
      size: { widthPercent: 30, heightPercent: 30 },
      opacity: 100,
      borderRadius: 0,
      keepOriginal: false,
      fitMode: 'crop' // 默认裁剪模式
    }
  }
  return getDefaultManualConfig()
}

// 手动配置变化时同步到JSON
function onManualConfigChange(index: number) {
  const config = manualConfigs.value[index]
  if (config) {
    // 兼容旧模式名称
    if (config.mode === 'topLeft') {
      config.mode = 'topLeftAutoHeight'
    }
    if (config.mode === 'fixedSize') {
      config.mode = 'topLeftFixedSize'
    }
    // 切换模式时，如果切换到topLeftFixedSize但没有heightPercent，设置默认值
    if (config.mode === 'topLeftFixedSize' && !config.size?.heightPercent) {
      config.size = config.size || {}
      config.size.heightPercent = config.size.widthPercent || 30
    }
    // 如果是topLeftAutoHeight模式，移除heightPercent（如果存在）
    if (config.mode === 'topLeftAutoHeight' && config.size?.heightPercent !== undefined) {
      const newSize = { ...config.size }
      delete newSize.heightPercent
      config.size = newSize
    }
    imageOptionsDraft.value[index] = JSON.stringify(config, null, 2)
  }
}

// JSON配置变化时同步到手动配置
function onJsonConfigChange(index: number) {
  try {
    const config = JSON.parse(imageOptionsDraft.value[index])
    manualConfigs.value[index] = config
  } catch (e) {
    // JSON解析失败时保持手动配置不变
  }
}

// 计算左侧缩略图上的展示方块样式（仅展示，无交互）
function getOverlayStyle(url: string, index: number) {
  // 引入一个无用读取以触发响应式刷新
  void overlayTick.value
  const meta = imageMetaMap[url]
  const preview = previewRefs.value[index]
  const config = manualConfigs.value[index]
  if (!meta || !preview || !config) return { display: 'none' }

  const imgEl: HTMLImageElement | null = preview.querySelector('img')
  if (!imgEl) return { display: 'none' }

  // 预览容器尺寸
  const containerRect = preview.getBoundingClientRect()
  const imgRect = imgEl.getBoundingClientRect()

  // 图片在容器中的位置与显示尺寸
  const imgLeft = imgRect.left - containerRect.left
  const imgTop = imgRect.top - containerRect.top
  const imgWidth = imgRect.width
  const imgHeight = imgRect.height

  // 将真实坐标/尺寸映射为显示坐标/尺寸
  const scaleX = imgWidth / (meta.w || 1)
  const scaleY = imgHeight / (meta.h || 1)
  const scale = Math.min(scaleX, scaleY) // 使用较小的缩放比例，保持一致性

  // 位置（百分比转换为像素，左上角为原点），映射到显示坐标
  const xPercent = config.position?.xPercent || 0
  const yPercent = config.position?.yPercent || 0
  const pixelX = (xPercent / 100) * meta.w
  const pixelY = (yPercent / 100) * meta.h
  let posX = imgLeft + pixelX * scaleX
  let posY = imgTop + pixelY * scaleY

  const sizeCfg = config.size || {}
  let mode = config.mode || 'topLeftAutoHeight'
  // 兼容旧模式名称
  if (mode === 'topLeft') mode = 'topLeftAutoHeight'
  if (mode === 'fixedSize') mode = 'topLeftFixedSize'
  
  let displayWidth: number
  let displayHeight: number

  if (mode === 'topLeftFixedSize') {
    // 固定尺寸模式：使用指定的宽高百分比
    const widthPercent = typeof sizeCfg.widthPercent === 'number' ? sizeCfg.widthPercent : 30
    const heightPercent = typeof sizeCfg.heightPercent === 'number' ? sizeCfg.heightPercent : 30
    
    const realWidth = Math.max(1, Math.min(100, widthPercent)) / 100 * meta.w
    const realHeight = Math.max(1, Math.min(100, heightPercent)) / 100 * meta.h
    
    displayWidth = realWidth * scale
    displayHeight = realHeight * scale
  } else {
    // topLeftAutoHeight模式：只关注左上角坐标和宽度
    // 高度会根据素材图片的原始宽高比自动计算
    // 预览中显示一个合理的预览区域（使用宽度作为基准，高度显示模板图的一部分）
    const widthPercent = typeof sizeCfg.widthPercent === 'number' ? sizeCfg.widthPercent : 30
    const realWidth = Math.max(1, Math.min(100, widthPercent)) / 100 * meta.w
    
    displayWidth = realWidth * scale
    // 使用素材真实宽高比计算高度，确保预览与后端一致
    const ratio = meta.h && meta.w ? (meta.h / meta.w) : 1
    displayHeight = displayWidth * ratio
  }

  // 约束左上角不超出模板图边界
  const left = Math.max(imgLeft, Math.min(imgLeft + imgWidth - displayWidth, posX))
  const top = Math.max(imgTop, Math.min(imgTop + imgHeight - displayHeight, posY))

  // 计算圆角（如果有配置）
  let borderRadius = '0px'
  if (config.borderRadius && config.borderRadius > 0) {
    // 圆角按素材图宽高的百分比计算
    const baseSize = Math.min(meta.w, meta.h)
    const borderRadiusPx = (config.borderRadius / 100) * baseSize
    // 映射到预览显示尺寸
    const displayBorderRadius = borderRadiusPx * scale
    borderRadius = `${displayBorderRadius}px`
  }

  // 计算背景色（根据透明度变化）
  const opacity = config.opacity !== undefined ? config.opacity : 100
  const opacityValue = Math.max(0, Math.min(100, opacity)) / 100
  // 基础透明度，根据配置的透明度调整（增加基础透明度，让颜色更深）
  const baseAlpha = 0.4 * opacityValue // 基础透明度乘以配置的透明度比例
  
  // 根据模式设置背景
  let background: string
  if (mode === 'topLeftAutoHeight') {
    // 左上角对齐模式：从左上角渐变到右下角
    background = `linear-gradient(135deg, rgba(64, 158, 255, ${baseAlpha}) 0%, rgba(64, 158, 255, ${baseAlpha * 0.5}) 50%, rgba(64, 158, 255, ${baseAlpha * 0.1}) 100%)`
  } else {
    // 固定尺寸模式：纯色背景（跟随透明度）
    background = `rgba(64, 158, 255, ${baseAlpha})`
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${displayWidth}px`,
    height: `${displayHeight}px`,
    borderRadius,
    background,
    display: 'block',
    transformOrigin: 'center center',
    transform: `rotate(${typeof config.rotationDegrees === 'number' ? config.rotationDegrees : 0}deg)`
  }
}

// 已移除：getWidthLineStyle、getHeightLineStyle、getGradientAreaStyle
// 现在统一使用 overlay-block 显示半透明背景区域，不再使用边框线

// 计算左上角十字标识样式（左上角对齐模式）
function getCrossMarkerStyle(url: string, index: number) {
  void overlayTick.value
  const meta = imageMetaMap[url]
  const preview = previewRefs.value[index]
  const config = manualConfigs.value[index]
  if (!meta || !preview || !config) return { display: 'none' }

  const imgEl: HTMLImageElement | null = preview.querySelector('img')
  if (!imgEl) return { display: 'none' }

  const containerRect = preview.getBoundingClientRect()
  const imgRect = imgEl.getBoundingClientRect()

  const imgLeft = imgRect.left - containerRect.left
  const imgTop = imgRect.top - containerRect.top
  const imgWidth = imgRect.width
  const imgHeight = imgRect.height

  const scaleX = imgWidth / (meta.w || 1)
  const scaleY = imgHeight / (meta.h || 1)

  // 位置（左上角坐标）
  const xPercent = config.position?.xPercent || 0
  const yPercent = config.position?.yPercent || 0
  const pixelX = (xPercent / 100) * meta.w
  const pixelY = (yPercent / 100) * meta.h
  let posX = imgLeft + pixelX * scaleX
  let posY = imgTop + pixelY * scaleY

  // 约束位置
  const left = Math.max(imgLeft, Math.min(imgLeft + imgWidth - 10, posX))
  const top = Math.max(imgTop, Math.min(imgTop + imgHeight - 10, posY))

  return {
    left: `${left}px`,
    top: `${top}px`,
    display: 'block'
  }
}

// 根据图片原始宽高比，动态设置预览容器尺寸，避免出现额外留白
function getPreviewBoxStyle(url: string) {
  const meta = imageMetaMap[url]
  if (!meta || !meta.w || !meta.h) return {}
  // 使用 CSS aspect-ratio 让容器完全按图片比例自适应，无额外空白
  const ratio = meta.w / meta.h
  return { aspectRatio: `${ratio}`, width: '100%' }
}

function handleImageLoaded(url: string) {
  ensureImageMeta(url)
  // 图片加载后再强制刷新一次覆盖块
  overlayTick.value++
}

// 注意：圆角只应用到素材图（预览色块），不应用到模板图
// 模板图保持原样，预览中显示的是模板图，预览色块显示素材图的位置和圆角效果

// 已废弃：尺寸类型切换（改为使用 widthPercent），保留空函数防止引用
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onSizeTypeChange(_index: number) {}







async function saveImageOptions() {
  if (!currentImageRow.value) return
  try {
    imageOptionSaving.value = true
    const payload: any = {}
    // 需要是合理的 JSON 或 JS 对象表达式；否则阻止保存
    const parseJsonOrObject = (text: string): any => {
      // 优先尝试严格 JSON
      try {
        return JSON.parse(text)
      } catch {}
      // 其次尝试 JS 对象/数组/原始表达式（例如 {a:1}, [1,2], 'abc'）
      try {
        // 使用 Function 包裹并以表达式方式返回
        // 管理端内网使用，输入来源可控；这里用于配置解析
        // eslint-disable-next-line no-new-func
        const fn = new Function(`return ( ${text} )`)
        const v = fn()
        // 仅接受对象或数组，避免意外的可执行代码产生副作用
        if (v !== null && (Array.isArray(v) || typeof v === 'object')) {
          return v
        }
        throw new Error('表达式不是对象或数组')
      } catch (e) {
        throw new Error('无效的 JSON 或对象字面量')
      }
    }

    for (let idx = 0; idx < imageOptionsDraft.value.length; idx++) {
      const txt = imageOptionsDraft.value[idx]
      const key = `imageOption${idx + 1}`
      if (txt && txt.trim()) {
        try {
          const parsed = parseJsonOrObject(txt.trim())
          payload[key] = parsed
        } catch (e: any) {
          ElMessage.error(`第 ${idx + 1} 张图片的模板信息不是有效的 JSON/对象：${e?.message || ''}`)
          return
        }
      } else {
        payload[key] = null
      }
    }
    await updateTemplateGroup2D(currentImageRow.value.id, payload)
    ElMessage.success('已保存图片模板信息')
    imageOptionDialogVisible.value = false
    getList()
  } finally {
    imageOptionSaving.value = false
  }
}

function getImages(row) {
  const urls: string[] = []
  for (let i = 1; i <= 10; i++) {
    const key = `image${i}`
    if (row[key]) urls.push(row[key])
  }
  return urls
}

function getImageConfig(row, imageIndex) {
  const key = `imageOption${imageIndex}`
  const config = row[key]
  if (!config) return null
  
  try {
    // 如果是字符串，尝试解析JSON
    if (typeof config === 'string') {
      return JSON.parse(config)
    }
    // 如果已经是对象，直接返回
    if (typeof config === 'object') {
      return config
    }
  } catch (e) {
    console.warn(`解析图片${imageIndex}配置失败:`, e)
  }
  
  return null
}

// 获取配置模式
function getConfigMode(row: any, imageIndex: number): string {
  const config = getImageConfig(row, imageIndex + 1)
  if (!config) return 'topLeftAutoHeight' // 默认模式
  let mode = config.mode || 'topLeftAutoHeight'
  // 兼容旧模式名称
  if (mode === 'topLeft') mode = 'topLeftAutoHeight'
  if (mode === 'fixedSize') mode = 'topLeftFixedSize'
  return mode
}

// 获取配置模式标签
function getConfigModeLabel(mode: string): string {
  // 兼容旧模式名称
  if (mode === 'topLeft') mode = 'topLeftAutoHeight'
  if (mode === 'fixedSize') mode = 'topLeftFixedSize'
  
  const modeLabels: Record<string, string> = {
    'topLeftAutoHeight': '左上角对齐-自动高度',
    'topLeftFixedSize': '左上角对齐-固定尺寸',
    'center': '居中对齐模式',
    'bottomRight': '右下角对齐模式'
  }
  return modeLabels[mode] || mode || '未知模式'
}

// 获取模式描述信息
function getModeDescription(mode: string): { title: string; description: string } {
  // 兼容旧模式名称
  if (mode === 'topLeft') mode = 'topLeftAutoHeight'
  if (mode === 'fixedSize') mode = 'topLeftFixedSize'
  
  const descriptions: Record<string, { title: string; description: string }> = {
    'topLeftAutoHeight': {
      title: '左上角对齐-自动高度（topLeftAutoHeight）',
      description: '图片的左上角与您指定的位置坐标对齐，宽度由 widthPercent 控制，高度根据原始宽高比自动计算。这是最常用的定位方式，适合精确控制素材在模板中的位置。'
    },
    'topLeftFixedSize': {
      title: '左上角对齐-固定尺寸（topLeftFixedSize）',
      description: '图片的左上角与您指定的位置坐标对齐，宽度和高度分别由 widthPercent 和 heightPercent 控制。素材图会被裁剪为指定的宽高尺寸，不保持原始宽高比。适合需要精确尺寸控制的场景。'
    },
    'center': {
      title: '居中对齐模式（center）',
      description: '图片的中心点与您指定的位置坐标对齐。'
    },
    'bottomRight': {
      title: '右下角对齐模式（bottomRight）',
      description: '图片的右下角与您指定的位置坐标对齐。'
    }
  }
  return descriptions[mode] || {
    title: '未知模式',
    description: '该模式暂未实现或未定义。'
  }
}

async function getList() {
  loading.value = true
  try {
    const res = await pageTemplateGroup2D({ page: queryParams.currentPage, pageSize: queryParams.pageSize })
    dataSource.value = res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  currId.value = null
  dialogVisible.value = true
  dialogTitle.value = '新增模板组'
  form.value = { name: '', description: '', keywords: '' }
  imageItems.value = []
}

function handleEdit(row) {
  isEdit.value = true
  currId.value = row.id
  dialogVisible.value = true
  dialogTitle.value = '编辑模板组'
  form.value = { name: row.name, description: row.description || '', keywords: row.keywords || '' }
  imageItems.value = getImages(row).map(url => ({ url }))
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该模板组吗？', '提示', { type: 'warning' })
    .then(async () => {
      await deleteTemplateGroup2D(row.id)
      ElMessage.success('删除成功')
      getList()
    })
    .catch(() => {})
}

function handleFileChange(file) {
  // 仅本地缓存，点击“确定”时再统一上传到COS
  const raw = file?.raw
  if (!raw) return
  if (!raw.type || !raw.type.startsWith('image/')) {
    ElMessage.error('只能选择图片文件')
    return
  }
  const preview = URL.createObjectURL(raw)
  imageItems.value.push({ file: raw, preview })
}

function replaceImage(index: number) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = (input.files && input.files[0]) as File
    if (!file) return
    if (!file.type || !file.type.startsWith('image/')) {
      ElMessage.error('只能选择图片文件')
      return
    }
    const preview = URL.createObjectURL(file)
    const old = imageItems.value[index]
    imageItems.value[index] = { file, preview, url: old?.url }
  }
  input.click()
}

function beforeUploadImage(file: File) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    ElMessage.error('只能选择图片文件')
    return false
  }
  return true
}

function removeImage(index: number) {
  const item = imageItems.value[index]
  if (item?.preview) URL.revokeObjectURL(item.preview)
  imageItems.value.splice(index, 1)
}

const rules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 1, max: 255, message: '长度1-255', trigger: 'blur' }
  ],
  keywords: [
    { max: 500, message: '长度不超过500', trigger: 'blur' }
  ],
  description: [
    { max: 1000, message: '长度不超过1000', trigger: 'blur' }
  ]
}

function fillImages(payload: any, urls: string[]) {
  for (let i = 1; i <= 10; i++) {
    payload[`image${i}`] = urls[i - 1] || ''
  }
}

async function submitForm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitLoading.value = true
    const payload: any = {
      name: form.value.name,
      description: form.value.description,
      keywords: form.value.keywords,
    }
    // 统一上传：已有url直接使用；有file则上传到COS取url
    const finalUrls: string[] = []
    for (const item of imageItems.value) {
      if (item.url && !item.file) {
        finalUrls.push(item.url)
      } else if (item.file) {
        const res = await uploadToCOS({ file: item.file })
        finalUrls.push(res.url)
      }
      if (finalUrls.length >= 10) break
    }
    fillImages(payload, finalUrls)
    if (isEdit.value && currId.value) {
      await updateTemplateGroup2D(currId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createTemplateGroup2D(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  getList()
})

function dialogClose() {
  submitLoading.value = false
}
</script>

<style scoped>
.images-with-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 480px;
}

.images-with-config.template-group {
  border: 2px solid var(--el-color-primary);
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.02) 0%, rgba(64, 158, 255, 0.05) 100%);
  position: relative;
}

.images-with-config.template-group::before {
  content: '模板组';
  position: absolute;
  top: -10px;
  left: 16px;
  background: var(--el-color-primary);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  z-index: 1;
}

.image-config-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color-page);
  transition: box-shadow 0.2s;
}

.image-config-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.image-preview .el-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-label {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.config-info {
  flex: 1;
  font-size: 12px;
  line-height: 1.4;
  min-width: 0;
}

.config-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.config-line .label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  min-width: 50px;
  font-size: 11px;
}

.config-line .value {
  color: var(--el-color-primary);
  font-weight: 600;
  text-align: right;
  flex: 1;
  margin-left: 8px;
  font-size: 11px;
}

.config-default {
  color: var(--el-text-color-placeholder);
  font-style: italic;
  font-size: 11px;
  text-align: center;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  border: 1px dashed var(--el-border-color-light);
}

.mode-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.mode-tag.mode-topleft {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  border: 1px solid rgba(64, 158, 255, 0.3);
}

.mode-tag.mode-fixed {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.size-hint {
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  font-weight: normal;
  margin-left: 4px;
}
.uploader {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.thumb {
  width: 100px;
  height: 100px;
  position: relative;
}
.thumb .el-image, .thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
}
.thumb .img-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 4px 6px;
  font-size: 12px;
  line-height: 1.2;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.image-option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.image-option-grid.vertical { grid-template-columns: 1fr; }
.image-option-item { 
  border: 1px solid var(--el-border-color); 
  border-radius: 6px; 
  padding: 20px; 
  display: grid; 
  grid-template-columns: 500px 1fr; 
  gap: 24px; 
  align-items: start; 
  margin-bottom: 20px;
}
.image-option-item .preview { 
  width: 100%; 
  /* height 由 aspect-ratio 决定，避免空白 */
  overflow: visible; 
  border-radius: 4px; 
  padding: 0; 
  background: var(--el-fill-color-lighter); 
  position: relative; 
}
.image-option-item .preview-image-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.image-option-item .preview .el-image { width: 100%; height: 100%; object-fit: contain; display: block; }
.overlay-block {
  position: absolute;
  /* 无边框模式：移除边框线，背景色和渐变由 getOverlayStyle 动态设置 */
  pointer-events: none;
  /* border-radius 和 background 由 getOverlayStyle 动态设置 */
}

/* 左上角对齐模式：宽度线（蓝色，水平线） */
.overlay-width-line {
  position: absolute;
  background: #409eff;
  box-shadow: 0 0 4px rgba(64, 158, 255, 0.6);
  z-index: 10;
  pointer-events: none;
}

/* 左上角对齐模式：高度线（蓝色，垂直线） */
.overlay-height-line {
  position: absolute;
  background: #409eff;
  box-shadow: 0 0 4px rgba(64, 158, 255, 0.6);
  z-index: 10;
  pointer-events: none;
}

/* 左上角对齐模式：渐变区域（从左上到右下，从有颜色到透明） */
.overlay-gradient-area {
  position: absolute;
  z-index: 9;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.3) 0%, rgba(64, 158, 255, 0.15) 30%, rgba(64, 158, 255, 0) 100%);
  border-radius: 0 0 4px 4px;
}

/* 左上角对齐模式：左上角十字标识（红色） */
.overlay-cross-marker {
  position: absolute;
  width: 20px;
  height: 20px;
  z-index: 11;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.overlay-cross-marker::before,
.overlay-cross-marker::after {
  content: '';
  position: absolute;
  background: #f56c6c;
  box-shadow: 0 0 2px rgba(245, 108, 108, 0.6);
}

.overlay-cross-marker::before {
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  transform: translateX(-50%);
}

.overlay-cross-marker::after {
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  transform: translateY(-50%);
}
.image-option-item .details { display: flex; flex-direction: column; gap: 8px; }
.image-option-item .meta { font-size: 12px; color: var(--el-text-color-secondary); display: flex; gap: 12px; }
.image-option-item .config-editor { margin-top: 4px; }
.image-option-body { 
  max-height: calc(100vh - 120px); 
  overflow: auto; 
  padding-right: 6px; 
}

.config-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-editor h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 8px;
}

.mode-info {
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-light);
}

.mode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.mode-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mode-description {
  margin-top: 8px;
}

.mode-brief {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mode-desc-text {
  flex: 1;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.mode-detail-btn {
  padding: 0;
  font-size: 12px;
  white-space: nowrap;
}

.mode-detail-btn .el-icon {
  margin-right: 4px;
}

.mode-details-popover {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 4px;
}

/* Popover 样式 */
:deep(.mode-detail-popover) {
  max-width: 500px;
  
  .el-popover__title {
    margin-bottom: 12px;
  }
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.mode-details-popover .detail-section {
  margin-bottom: 16px;
}

.mode-details-popover .detail-section:last-child {
  margin-bottom: 0;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail-title .el-icon {
  font-size: 16px;
  color: var(--el-color-primary);
}

.detail-list {
  margin: 0;
  padding-left: 24px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.detail-list li {
  margin-bottom: 8px;
}

.detail-list li:last-child {
  margin-bottom: 0;
}

.detail-list code {
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-color-primary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.param-table {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.param-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 12px 16px;
}

.param-row:last-child {
  border-bottom: none;
}

.param-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.param-desc {
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.6;
}

.example-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.example-item {
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  border-left: 3px solid var(--el-color-primary);
}

.example-item strong {
  display: block;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.example-item code {
  display: block;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: var(--el-text-color-primary);
  margin: 8px 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.example-desc {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.manual-controls {
  padding: 12px 0;
}

.control-group {
  margin-bottom: 16px;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.position-controls {
  display: flex;
  gap: 16px;
}

.position-controls.vertical {
  flex-direction: column;
  gap: 12px;
}

.position-controls.vertical .control-item {
  flex: none;
  width: 100%;
}

.control-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-item span {
  min-width: 36px;
  font-size: 12px;
  text-wrap: nowrap;
  color: var(--el-text-color-secondary);
}

.fixed-size-controls {
  display: flex;
  gap: 12px;
}

.fixed-size-controls > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fixed-size-controls span {
  min-width: 40px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.thumb .ops {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 6px;
  padding: 6px;
  background: rgba(0,0,0,0.4);
  justify-content: center;
}

</style>


