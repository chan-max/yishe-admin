<template>
  <div>
    <!-- PC端显示原有搜索栏，移动端只显示筛选按钮 -->
    <div v-if="!isMobile" class="flex pb-4 flex-wrap justify-end gap-4 items-center search-bar">
      <div style="flex: 1"></div>
      <form-item label="按名称搜索">
        <el-input
          v-model="queryParams.imageName"
          placeholder="请输入图片名称"
          style="width: 160px"
          clearable
          @change="(val) => { if (!val) getList() }"
        />
      </form-item>
      <el-button type="primary" :icon="Search" @click="getList"> 搜索 </el-button>
      <form-item label="排序">
        <el-select v-model="queryParams.sortingFields" placeholder="请选择排序方式" style="width: 140px" @change="getList">
          <el-option label="创建时间倒序" value="createTime DESC" />
          <el-option label="创建时间正序" value="createTime ASC" />
        </el-select>
      </form-item>
      <form-item label="后缀">
        <el-select v-model="queryParams.suffix" placeholder="请选择后缀" style="width: 120px" clearable @change="getList">
          <el-option label="全部" value="" />
          <el-option label="jpg" value="jpg" />
          <el-option label="jpeg" value="jpeg" />
          <el-option label="png" value="png" />
          <el-option label="gif" value="gif" />
          <el-option label="webp" value="webp" />
          <el-option label="svg" value="svg" />
          <el-option label="bmp" value="bmp" />
          <el-option label="tiff" value="tiff" />
        </el-select>
      </form-item>
      <form-item label="ID精确查询">
        <el-input
          v-model="queryParams.id"
          placeholder="请输入ID"
          style="width: 120px"
          clearable
          @change="(val) => { if (!val) getList() }"
        />
      </form-item>
      <form-item label="phash相似度搜索">
        <div class="flex gap-4 items-center flex-wrap">
          <el-input
            v-model="queryParams.phash"
            placeholder="请输入phash值"
            style="width: 200px"
            clearable
            @blur="onPhashInputBlur"
          />
          
          <!-- 相似度范围滑块 -->
          <div class="flex flex-col gap-2" style="min-width: 300px">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">相似度范围:</span>
              <span class="text-sm font-medium text-blue-600">
                {{ phashRange[0] === phashRange[1] ? `${phashRange[0]}%` : `${phashRange[0]}% - ${phashRange[1]}%` }}
              </span>
              <el-tag v-if="phashRange[0] === phashRange[1]" size="small" type="info">精确匹配</el-tag>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 w-8">0%</span>
              <el-slider
                v-model="phashRange"
                range
                :min="0"
                :max="100"
                :step="1"
                :show-tooltip="true"
                :format-tooltip="(val) => `${val}%`"
                style="flex: 1"
                @change="onPhashRangeChange"
              />
              <span class="text-xs text-gray-500 w-8 text-right">100%</span>
            </div>
          </div>
          
          <div class="flex gap-2">
            <el-button type="primary" @click="handlePhashSearch">搜索</el-button>
            <el-button @click="clearPhashSearch">清空</el-button>
          </div>
        </div>
      </form-item>
      <form-item label="自定义贴纸">
        <el-select v-model="queryParams.isCustom" placeholder="请选择类型" style="width: 120px" clearable @change="getList">
          <el-option label="全部" :value="null" />
          <el-option label="是" :value="true" />
          <el-option label="否" :value="false" />
        </el-select>
      </form-item>
      <form-item label="侵权状态">
        <el-select v-model="queryParams.isInfringement" placeholder="请选择状态" style="width: 120px" clearable @change="getList">
          <el-option label="全部" :value="null" />
          <el-option label="侵权" :value="true" />
          <el-option label="非侵权" :value="false" />
        </el-select>
      </form-item>
      <form-item label="发布状态">
        <el-select v-model="queryParams.isPublish" placeholder="请选择状态" style="width: 120px" clearable @change="getList">
          <el-option label="全部" :value="null" />
          <el-option label="已发布" :value="true" />
          <el-option label="未发布" :value="false" />
        </el-select>
      </form-item>
      <form-item class="date-range-picker">
        <DateRangePicker
          @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end; getList() }"
        />
      </form-item>
      <div class="flex shrink-0">
        <el-button type="primary" @click="() => { uploadModalVisible = true }">上传</el-button>
        <el-button type="info" @click="() => { urlUploadModalVisible = true }">URL上传</el-button>
        <el-button type="default" @click="handleMultiDownload">下载 ({{ ids.length }})</el-button>
        <el-button type="success" @click="async () => { if (!ids.length) { return ElMessage.warning('请选择要制作的素材') } resetDesignModelSteps(); designModelModalVisible = true; await loadDesignModels() }">制作设计模型({{ ids.length }})</el-button>
        <el-button type="primary" @click="() => { if (!ids.length) { return ElMessage.warning('请先勾选素材') } linkRow = null; openLinkTemplate2D(null) }">根据二维模板组制作商品图({{ ids.length }})</el-button>
        <el-button type="warning" @click="handleBatchPublish">批量发布({{ ids.length }})</el-button>
        <el-button type="info" @click="handleBatchUnpublish">批量下架({{ ids.length }})</el-button>
        <el-button type="danger" :icon="Delete" @click="handleDelete(null)">批量删除({{ ids.length }})</el-button>
      </div>
    </div>
    <div v-else class="flex pb-4 justify-end">
      <el-button type="primary" icon="el-icon-filter" @click="filterDialogVisible = true">筛选</el-button>
    </div>
    <el-dialog v-model="filterDialogVisible" title="筛选" width="90%" align-center>
      <el-form :model="queryParams" label-width="80px">
        <el-form-item label="按名称搜索">
          <el-input v-model="queryParams.keyword" placeholder="请输入名称、描述或关键词" clearable />
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="queryParams.sortingFields" placeholder="请选择排序方式">
            <el-option label="创建时间倒序" value="createTime DESC" />
            <el-option label="创建时间正序" value="createTime ASC" />
          </el-select>
        </el-form-item>
        <el-form-item label="自定义贴纸">
          <el-select v-model="queryParams.isCustom" placeholder="请选择类型">
            <el-option label="全部" :value="null" />
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="侵权状态">
          <el-select v-model="queryParams.isInfringement" placeholder="请选择状态">
            <el-option label="全部" :value="null" />
            <el-option label="侵权" :value="true" />
            <el-option label="非侵权" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布状态">
          <el-select v-model="queryParams.isPublish" placeholder="请选择状态">
            <el-option label="全部" :value="null" />
            <el-option label="已发布" :value="true" />
            <el-option label="未发布" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="按时间查询">
          <DateRangePicker
            @change="(val) => { queryParams.startTime = val.start; queryParams.endTime = val.end }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="filterDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onMobileFilterSubmit">确定</el-button>
      </template>
    </el-dialog>

    <div class="flex gap-4">
      <div class="content-container" :style="{ width: '100%' }">
        <div class="common-table">
          <vxe-grid
            ref="gridRef"
            v-bind="gridOptions"
            :data="dataSource"
            :loading="loading"
            @checkbox-change="checkboxChange"
            @checkbox-all="checkboxAllChange"
          >
            <template #previewDefaultSlot="{ row }">
              <div class="flex flex-col items-center justify-center p-2">
                <img
                  :src="row.url"
                  :alt="row.name || '素材图片'"
                  style="width:120px; height:auto; object-fit:contain; background:#f5f5f5; cursor:pointer;"
                  @click="openImagePreview(row.url, row.name)"
                  @error="handleImageError"
                  @load="(event) => handleImageLoad(event, row)"
                />
                <div v-if="row.imageDimensions" class="text-xs text-gray-500 mt-1 text-center">
                  {{ row.imageDimensions.width }} × {{ row.imageDimensions.height }}
                </div>
              </div>
            </template>

            <template #resolutionSlot="{ row }">
              <span>{{ row.resolutionWidth && row.resolutionHeight ? row.resolutionWidth + '×' + row.resolutionHeight : '-' }}</span>
            </template>
            <template #originWebSlot="{ row }">
              <span>{{ row.originWeb || '-' }}</span>
            </template>
            <template #sizeSlot="{ row }">
              <span>{{ row.size ? (row.size / 1024).toFixed(1) + ' KB' : '-' }}</span>
            </template>

            <template #isCustomSlot="{ row }">
              <el-tag 
                :type="row.isCustom ? 'success' : 'info'" 
                size="small"
              >
                {{ row.isCustom ? '是' : '否' }}
              </el-tag>
            </template>

            <template #isInfringementSlot="{ row }">
              <el-tag 
                :type="row.isInfringement ? 'danger' : 'success'" 
                size="small"
              >
                {{ row.isInfringement ? '侵权' : '非侵权' }}
              </el-tag>
            </template>

            <template #isPublishSlot="{ row }">
              <el-tag 
                :type="row.isPublish ? 'success' : 'info'" 
                size="small"
              >
                {{ row.isPublish ? '已发布' : '未发布' }}
              </el-tag>
            </template>

            <template #similaritySlot="{ row }">
              <el-tag 
                v-if="row.similarity !== undefined"
                :type="row.similarity >= 90 ? 'success' : row.similarity >= 70 ? 'warning' : 'info'" 
                size="small"
              >
                {{ row.similarity.toFixed(1) }}%
              </el-tag>
              <span v-else>-</span>
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

                      <el-dropdown-item disabled>内容相关</el-dropdown-item>
                      <el-dropdown-item command="ai-generate">
                        <el-icon><MagicStick /></el-icon>
                        AI自动生成内容
                      </el-dropdown-item>
                      <el-dropdown-item command="ai-judge-infringement">
                        <el-icon><Warning /></el-icon>
                        AI判断侵权(知名IP)
                      </el-dropdown-item>
                      <el-dropdown-item command="view-meta">
                        <el-icon><Document /></el-icon>
                        查看元数据
                      </el-dropdown-item>

                      <el-dropdown-item divided disabled>文件操作</el-dropdown-item>
                      <el-dropdown-item command="download">
                        <el-icon><Download /></el-icon>
                        下载
                      </el-dropdown-item>
                      <el-dropdown-item command="copy">
                        <el-icon><Document /></el-icon>
                        复制
                      </el-dropdown-item>
                      <el-dropdown-item command="generate-phash">
                        <el-icon><Key /></el-icon>
                        生成哈希
                      </el-dropdown-item>

                      <el-dropdown-item divided disabled>发布</el-dropdown-item>
                      <el-dropdown-item command="publish" v-if="!row.isPublish">
                        <el-icon><Upload /></el-icon>
                        发布
                      </el-dropdown-item>
                      <el-dropdown-item command="unpublish" v-if="row.isPublish">
                        <el-icon><Download /></el-icon>
                        下架
                      </el-dropdown-item>

                      <el-dropdown-item divided disabled>制作</el-dropdown-item>
                      <el-dropdown-item command="design-model">
                        <el-icon><Picture /></el-icon>
                        制作设计模型
                      </el-dropdown-item>
                      <el-dropdown-item command="link-template-2d">
                        <el-icon><Grid /></el-icon>
                        二维模板制作商品图
                      </el-dropdown-item>

                      <el-dropdown-item command="delete" divided class="text-red-500">
                        <el-icon><Delete /></el-icon>
                        <span class="text-red-500">删除</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-icon v-if="aiTableLoading?.[row?.id]" class="is-loading ml-2" style="color:#409EFF;font-size:18px;" />
              </div>
            </template>
          </vxe-grid>
        </div>

        <!-- 分页 -->
        <div class="flex justify-end">
          <pagination
            v-model:page="queryParams.currentPage"
            v-model:limit="queryParams.pageSize"
            :total="total"
            @pagination="getList"
          />
        </div>
      </div>
    </div>

    <el-dialog
      v-model="linkTemplate2DDialogVisible"
      title="根据二维模板组制作商品图"
      fullscreen
      align-center
      class="link-2d-dialog"
    >
      <div class="link-2d-body">
        <div class="selected-materials">
          <div class="section-title">已选择素材 ({{ ids.length }})</div>
          <div class="thumbs">
            <div
              v-for="id in ids"
              :key="id"
              class="thumb"
            >
              <img :src="(dataSource.find(i => String(i.id) === String(id)) || {}).url" />
            </div>
          </div>
        </div>

        <div class="template-selector">
          <div class="section-title">选择二维模板组（可多选）</div>
          <div class="template-list">
            <el-checkbox-group v-model="selectedTemplateGroup2DIds" class="template-list-rows">
              <el-checkbox 
                v-for="tpl in templateGroup2DOptions"
                :key="tpl.id"
                :label="String(tpl.id)"
                class="template-row"
                :class="{ 'is-checked': selectedTemplateGroup2DIds.includes(String(tpl.id)) }"
              >
                <div class="row-thumb">
                  <img :src="tpl.image1 || tpl.image2 || tpl.image3 || tpl.image4 || tpl.image5 || tpl.image6 || tpl.image7 || tpl.image8 || tpl.image9 || tpl.image10" alt="thumb" />
                </div>
                <div class="row-content">
                  <div class="row-title" :title="tpl.name">{{ tpl.name || '未命名' }}</div>
                </div>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>

        
      </div>
      <template #footer>
        <div class="link-2d-footer">
          <div class="result-info">
            <el-alert
              type="info"
              :closable="false"
              show-icon
              :title="`将生成 ${ids.length} × ${selectedTemplateGroup2DIds.length} = ${ids.length * selectedTemplateGroup2DIds.length} 条商品图记录`"
            />
          </div>
          <div class="footer-actions">
            <el-button @click="linkTemplate2DDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="linkingTemplate2D" @click="confirmLinkTemplate2D">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="uploadModalVisible"
      title="素材上传"
      width="100%"
      style="height: 100%"
      align-center
      :footer="false"
      :destroy-on-close="true"
      class="material-upload-dialog"
      @close="uploadModalClose"
    >
      <div style="height: 100%">
        <list-upload
          :current-upload-info="currentUploadInfo"
          @single-file-uploaded="singleFileUploaded"
        />
      </div>
    </el-dialog>

    <!-- URL上传弹窗 -->
    <el-dialog
      v-model="urlUploadModalVisible"
      title="URL上传素材"
      width="500px"
      align-center
      :destroy-on-close="true"
      @close="resetUrlUploadForm"
    >
      <el-form
        ref="urlUploadFormRef"
        :model="urlUploadForm"
        :rules="urlUploadFormRules"
        label-width="80px"
      >
        <el-form-item label="图片URL" prop="url">
          <el-input
            v-model="urlUploadForm.url"
            placeholder="请输入图片的完整URL地址"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        <el-form-item label="文件名" prop="name">
          <el-input
            v-model="urlUploadForm.name"
            placeholder="请输入文件名"
            style="width: 100%"
            clearable
          />
        </el-form-item>
      </el-form>
      
      <!-- 预览区域 -->
      <div class="preview-section">
        <div class="preview-label">图片预览</div>
        <div v-if="urlUploadForm.url && urlPreviewVisible" class="image-preview">
          <img
            :src="urlUploadForm.url"
            alt="预览图片"
            class="preview-image"
            @error="handlePreviewError"
            @load="handlePreviewLoad"
          />
          <div v-if="imageInfo" class="image-info">
            <el-tag size="small" type="info">尺寸: {{ imageInfo.width }} × {{ imageInfo.height }}</el-tag>
          </div>
        </div>
        <div v-else-if="urlUploadForm.url && !urlPreviewVisible" class="preview-error">
          <el-icon size="32" color="#f56c6c">
            <PictureFilled />
          </el-icon>
          <p>图片预览加载失败</p>
          <p class="error-text">请检查URL是否正确</p>
        </div>
        <div v-else class="preview-placeholder">
          <el-icon size="32" color="#c0c4cc">
            <PictureFilled />
          </el-icon>
          <p>请输入图片URL后显示预览</p>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="urlUploadModalVisible = false">取消</el-button>
          <el-button type="primary" :loading="urlUploadLoading" @click="handleUrlUpload">上传</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 制作设计模型弹窗 -->
    <el-dialog
      v-model="designModelModalVisible"
      title="制作设计模型"
      width="100%"
      style="height: 100%"
      align-center
      :destroy-on-close="true"
      class="design-model-dialog"
      :footer="null"
      @close="resetDesignModelSteps"
    >
      <!-- 新增flex容器，左右布局 -->
      <div class="design-model-flex">
        <!-- 步骤指示器，纵向 -->
        <el-steps direction="vertical" :active="currentStep" finish-status="success" align-center class="steps-vertical">
          <el-step v-for="step in designModelSteps" :key="step.key" :title="step.title" :description="step.description" />
        </el-steps>
        <!-- 步骤内容区域 -->
        <div class="design-model-content">
          <div class="steps-all">
            <!-- 步骤1：选择素材 -->
            <div
              class="step-content"
              :class="{ 'step-active': currentStep === 0, 'step-inactive': currentStep !== 0 }"
            >
              <h3 class="text-lg font-bold mb-4">已选择的素材图：</h3>
              <div class="flex flex-wrap gap-4 mb-6">
                <template v-for="id in ids" :key="id">
                  <div v-if="dataSource.find(item => String(item.id) === String(id))" class="text-center">
                    <img 
                      :src="dataSource.find(item => String(item.id) === String(id)).url" 
                      :alt="dataSource.find(item => String(item.id) === String(id)).name"
                      class="w-20 h-20 object-cover rounded border"
                    />
                    <div class="text-xs text-gray-500 mt-1">{{ dataSource.find(item => String(item.id) === String(id)).name }}</div>
                  </div>
                </template>
              </div>
              
              <div class="border border-blue-200 rounded-lg p-4">
                <div class="flex items-start">
                  <el-icon class="text-blue-500 mt-0.5 mr-2">
                    <InfoFilled />
                  </el-icon>
                  <div class="text-sm text-blue-700">
                    <p class="font-medium mb-1">已选择 {{ ids.length }} 个素材</p>
                    <p>这些素材将用于制作设计模型，请确认选择无误后点击下一步。</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤2：选择设计模型 -->
            <div
              class="step-content"
              :class="{ 'step-active': currentStep === 1, 'step-inactive': currentStep !== 1 }"
            >
              <h3 class="text-lg font-bold mb-4">选择设计模型：</h3>
              
              <div class="design-model-list">
                <div v-if="designModelLoading" class="text-center py-4">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span class="ml-2">加载中...</span>
                </div>
                
                <div v-else-if="designModelList.length === 0" class="text-center py-4 text-gray-500">
                  暂无设计模型
                </div>
                
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    v-for="model in designModelList"
                    :key="model.id"
                    class="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-all relative"
                    :class="{ 'border-blue-500 shadow-[0_0_0_4px_rgba(64,158,255,0.6)]': selectedDesignModelIds.includes(model.id) }"
                    @click="selectDesignModel(model)"
                  >
                    <div class="flex items-center space-x-3">
                      <img
                        v-if="model.thumbnail"
                        :src="model.thumbnail"
                        :alt="model.name"
                        class="w-16 h-16 object-cover rounded"
                      />
                      <div class="flex-1 min-w-0">
                        <h4 class="font-medium truncate">{{ model.name }}</h4>
                        <p class="text-sm text-gray-500 truncate">{{ model.description || '暂无描述' }}</p>
                        <p class="text-xs text-gray-400">{{ model.createTime }}</p>
                      </div>
                    </div>
                    
                    <!-- 选中状态图标 -->
                    <div 
                      v-if="selectedDesignModelIds.includes(model.id)"
                      class="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <el-icon class="text-sm">
                        <Check />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>

              <div class=" border border-blue-200 rounded-lg p-4 mt-4">
                <div class="flex items-start">
                  <el-icon class="text-blue-500 mt-0.5 mr-2">
                    <InfoFilled />
                  </el-icon>
                  <div class="text-sm text-blue-700">
                    <p class="font-medium mb-1">已选择 {{ selectedDesignModelIds.length }} 个设计模型</p>
                    <p>将生成 {{ ids.length * selectedDesignModelIds.length }} 个新设计模型</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤3：确认制作 -->
            <div
              class="step-content"
              :class="{ 'step-active': currentStep === 2, 'step-inactive': currentStep !== 2 }"
            >
              <h3 class="text-lg font-bold mb-4">确认制作信息：</h3>
              
              <div class="bg-gray-50 rounded-lg p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- 素材信息 -->
                  <div>
                    <h4 class="font-medium text-gray-700 mb-3">选择的素材 ({{ ids.length }}个)</h4>
                    <div class="space-y-2">
                      <template v-for="id in ids" :key="id">
                        <div v-if="dataSource.find(item => String(item.id) === String(id))" class="flex items-center space-x-2">
                          <img 
                            :src="dataSource.find(item => String(item.id) === String(id)).url" 
                            :alt="dataSource.find(item => String(item.id) === String(id)).name"
                            class="w-8 h-8 object-cover rounded"
                          />
                          <span class="text-sm text-gray-600">{{ dataSource.find(item => String(item.id) === String(id)).name }}</span>
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- 设计模型信息 -->
                  <div>
                    <h4 class="font-medium text-gray-700 mb-3">选择的设计模型 ({{ selectedDesignModelIds.length }}个)</h4>
                    <div class="space-y-2">
                      <template v-for="modelId in selectedDesignModelIds" :key="modelId">
                        <div v-if="designModelList.find(model => model.id === modelId)" class="flex items-center space-x-2">
                          <img 
                            v-if="designModelList.find(model => model.id === modelId).thumbnail"
                            :src="designModelList.find(model => model.id === modelId).thumbnail" 
                            :alt="designModelList.find(model => model.id === modelId).name"
                            class="w-8 h-8 object-cover rounded"
                          />
                          <span class="text-sm text-gray-600">{{ designModelList.find(model => model.id === modelId).name }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>

                <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600 mb-2">
                      {{ ids.length }} × {{ selectedDesignModelIds.length }} = {{ ids.length * selectedDesignModelIds.length }}
                    </div>
                    <div class="text-sm text-blue-700">将生成 {{ ids.length * selectedDesignModelIds.length }} 个新设计模型</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 步骤导航按钮，移到内容底部 -->
          <div class="dialog-footer" style="margin-top: 16px;">
            <div class="flex-1 text-sm text-gray-600">
              <span>步骤 {{ currentStep + 1 }} / {{ designModelSteps.length }}</span>
            </div>
            <div class="flex gap-2">
              <el-button 
                v-if="currentStep > 0"
                @click="prevStep"
              >
                上一步
              </el-button>
              <el-button 
                v-if="currentStep < designModelSteps.length - 1"
                type="primary" 
                @click="nextStep"
                :disabled="!canProceedToNextStep"
              >
                下一步
              </el-button>
              <el-button 
                v-if="currentStep === designModelSteps.length - 1"
                type="success" 
                @click="handleDesignModelConfirm"
                :disabled="!selectedDesignModelIds.length"
              >
                开始制作
              </el-button>
              <el-button @click="designModelModalVisible = false">取消</el-button>
            </div>
          </div>
        </div>
      </div>
      <!-- 移除el-dialog的footer插槽 -->
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑素材信息" width="800px" :destroy-on-close="true" align-center>
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" placeholder="请输入名称" style="font-size:16px;height:48px;width:100%;" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="5" placeholder="请输入描述" style="font-size:16px;min-height:100px;width:100%;" />
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="editForm.keywords" placeholder="请输入关键字（逗号分隔）" style="font-size:16px;height:48px;width:100%;" />
        </el-form-item>
        <el-form-item label="自定义贴纸">
          <el-tag 
            :type="editForm.isCustom ? 'success' : 'info'" 
            size="large"
            style="font-size:16px;padding:8px 16px;"
          >
            {{ editForm.isCustom ? '是' : '否' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="侵权状态">
          <el-select v-model="editForm.isInfringement" placeholder="请选择侵权状态" style="font-size:16px;height:48px;width:100%;">
            <el-option label="非侵权" :value="false" />
            <el-option label="侵权" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布状态">
          <el-select v-model="editForm.isPublish" placeholder="请选择发布状态" style="font-size:16px;height:48px;width:100%;">
            <el-option label="未发布" :value="false" />
            <el-option label="已发布" :value="true" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="aiGenDialogVisible"
      title="AI自动生成内容"
      width="500px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">请输入你希望AI分析的内容风格或角度（如：偏艺术描述、简洁风格、突出色彩等）</div>
      <el-input
        v-model="aiGenPrompt"
        type="textarea"
        :rows="6"
        placeholder="如：请用艺术化语言描述图片内容..."
        style="font-size:16px;min-height:120px;width:100%;resize:vertical;"
      />
      <template #footer>
        <el-button @click="aiGenDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiGenDialogLoading" @click="submitAiGenDialog">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="aiJudgeInfringementDialogVisible"
      title="AI判断侵权"
      width="600px"
      align-center
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 16px; color: #666; font-size: 14px; line-height: 1.5;">
        <div style="margin-bottom: 8px; font-weight: 500; color: #333;">AI判断标准说明：</div>
        <div style="margin-bottom: 12px;">• 知名IP角色：迪士尼、漫威、DC、任天堂等公司的角色形象</div>
        <div style="margin-bottom: 12px;">• 知名品牌：Nike、Adidas、Apple、Coca-Cola等品牌标识</div>
        <div style="margin-bottom: 12px;">• 知名商标：麦当劳、星巴克、肯德基等商标</div>
        <div style="margin-bottom: 12px;">• 可能追究版权的：知名电影、游戏、动漫中的角色或场景</div>
        <div style="color: #409EFF; font-size: 13px;">注意：未知的原创设计、普通插画、风景照片等会被标记为非侵权</div>
      </div>
      <div style="margin-bottom: 16px; color: #888; font-size: 15px;">请输入你希望AI判断侵权的特定角度或要求（可选，留空则使用默认判断标准）</div>
      <el-input
        v-model="aiJudgeInfringementPrompt"
        type="textarea"
        :rows="4"
        placeholder="如：请重点关注某个特定品牌或IP..."
        style="font-size:16px;min-height:100px;width:100%;resize:vertical;"
      />
      <template #footer>
        <el-button @click="aiJudgeInfringementDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiJudgeInfringementLoading" @click="submitAiJudgeInfringementDialog">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="metaDialogVisible" fullscreen title="元数据详情" :close-on-click-modal="false">
      <vue-json-pretty :data="JSON.parse(metaDialogContent)" />
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
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  watch,
  handleError,
  watchEffect
} from 'vue'

import {
  getMaterialList,
  deleteAssetLibrary,
  checkAssetLibrary,
  pullAsset,
  materialDistribute,
  getMaterialDetail,
  handleDropMaterial,
  aiAutoGenerateMaterialInfo,
  updateAssetLibrary,
  calculatePhash, // 新增
  aiJudgeInfringement // 新增AI判断侵权接口
} from '@/api/material' // 实际接口导入

import { uploadToCOS } from '@/api/cos'
import { uploadMaterialFile, copyStickers } from '@/api/material'

import { commonGridOptions } from '@/common/table'
import { formatTimestamp } from '@/common/date'
import CryptoJS from 'crypto-js'

import { useDebounceFn, useLocalStorage, useSessionStorage, useWindowSize } from '@vueuse/core'
import { sortTypeOptions, defaultSortingValue } from '@/common/sort'
import { saveAs } from 'file-saver'

import { useUserStore } from '@/store/modules/user'
import listUpload from './listUpload.vue'
import { materialConfig, getMaterialConfig, categoryOptions } from '@/views/material/collect/index'
import { ElButton, ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Search, TopRight, Upload, Loading, Check, More, InfoFilled, ArrowDown, Edit, Download, Picture, MagicStick, Key, Document, Warning, PictureFilled, Grid } from '@element-plus/icons-vue'
import tree from './tree.vue'
import { materialStatusOptions } from '.'
import { psdTemplateApi } from '@/api/psdTemplate'
import { formatDate } from '@/utils/formatTime'
import { getTitleTemplateList } from '@/api/publish'
import { downloadCrossOriginImage, downloadFileByElement, downloadImage } from '@/common/download'
import { useRouter } from 'vue-router'
import { getConfigTemplateList } from '@/api/publish/config'
import genPicture from './genPicture.vue'
import { getAccessToken } from '@/utils/auth'
import { getTenantId } from '@/utils/auth'
import useListSelect from '@/components/common/userListSelect.vue'
import { getDesignModelList } from '@/api/designModel'
import { getDesignToolMessenger } from '@/utils/designToolMessenger'
import request from '@/config/axios'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { pageTemplateGroup2D } from '@/api/templateGroup2D'
import { createProductImage2D, batchCreateProductImage2D } from '@/api/productImage2D'

const userStore = useUserStore()

const form = ref({})

const queryParams = reactive({
  currentPage: 1,
  pageSize: 20,
  keyword: '',
  imageName: '', // 按名称搜索
  sortingFields: 'createTime DESC', // 排序字段
  startTime: '',
  endTime: '',
  suffix: '', // 新增后缀参数
  id: '', // 新增ID精确查询参数
  phash: '', // phash值
  phashSimilarityMin: undefined, // phash相似度最小值
  phashSimilarityMax: undefined, // phash相似度最大值
  isCustom: null, // 新增自定义贴纸过滤参数，使用null而不是空字符串
  isInfringement: null, // 新增侵权状态过滤参数
  isPublish: null, // 新增发布状态过滤参数
})

// phash相似度范围滑块
const phashRange = ref([70, 90]) // [最小值, 最大值]

// 展示模式
const picMode = useLocalStorage('material_view_mode', false)

watch(picMode, () => {
  ids.value = []
})

const gridRef = ref()

function resetCheckStatus() {
  if (gridRef.value?.clearCheckboxRow) {
    gridRef.value?.clearCheckboxRow()
  }
  if (gridRef.value?.clearCheckboxReserve) {
    gridRef.value?.clearCheckboxReserve()
  }
  ids.value = []
}

const gridOptions = ref({
  ...commonGridOptions,
  maxHeight: null,
  rowConfig: {
    keyField: 'id'
  },
  checkboxConfig: {
    reserve: true
  },
  columns: [
    { type: 'checkbox', width: 50, ellipsis: true, reserve: true },
    // { title: 'ID', field: 'id', width: 80, ellipsis: true },
    {
      title: '图片预览',
      field: 'url',
      width: 120,
      slots: { default: 'previewDefaultSlot' }
    },
    { title: '图片名称', field: 'name', minWidth: 180, className: 'font-bold' },
    { title: '描述', field: 'description', minWidth: 200 },
    { title: '关键词', field: 'keywords', minWidth: 160 },
    { title: '后缀', field: 'suffix', width: 80, }, // 新增后缀列
    { title: '感知哈希', field: 'phash', width: 80,  }, // 新增哈希列
    { 
      title: '相似度', 
      field: 'similarity', 
      width: 80,
      slots: { default: 'similaritySlot' }
    }, // 新增相似度列
    { title: 'ID', field: 'id', width: 80,  }, // 新增ID列
    { 
      title: '自定义贴纸', 
      field: 'isCustom', 
      width: 100,
      slots: { default: 'isCustomSlot' }
    },
    { 
      title: '侵权状态', 
      field: 'isInfringement', 
      width: 100,
      slots: { default: 'isInfringementSlot' }
    },
    { 
      title: '发布状态', 
      field: 'isPublish', 
      width: 100,
      slots: { default: 'isPublishSlot' }
    },
    {
      title: '创建时间',
      field: 'createTime',
      width: 150,
      ellipsis: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue)
      }
    },
    {
      title: '修改时间',
      field: 'updateTime',
      width: 150,
      ellipsis: true,
      formatter: (e) => {
        return formatTimestamp(e.cellValue)
      }
    },
    {
      title: '操作',
      fixed: 'right',
      width: 'auto',
      field: 'operation',
      slots: { default: 'operationDefaultSlot' }
    }
  ]
})

const { height } = useWindowSize()

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 260
})

const dataSource = ref([])
const loading = ref(false)
const open = ref(false)
const title = ref('')
const ids = ref<string[]>([])
const single = ref(false)
const multiple = ref(true)
const total = ref(0)
const formRef = ref()
const dialogTitle = ref('')
const dialogVisible = ref(false)
const isEdit = ref(true)
const currentRow = ref()
const submitLoading = ref(false)

const rules = {
  name: [{ required: true, message: '', trigger: 'blur' }]
}

const designModelModalVisible = ref(false)
const filterDialogVisible = ref(false)
const isMobile = ref(false)

// 设计模型相关
const designModelList = ref([])
const designModelLoading = ref(false)
const selectedDesignModelIds = ref([])

// 分步骤相关
const currentStep = ref(0)
const designModelSteps = ref([
  {
    key: 'select-materials',
    title: '选择素材',
    description: '确认要使用的素材'
  },
  {
    key: 'select-models',
    title: '选择设计模型',
    description: '选择要应用的设计模型'
  },
  {
    key: 'confirm',
    title: '确认制作',
    description: '确认制作信息并开始制作'
  }
])

// 计算是否可以进入下一步
const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 0: // 选择素材步骤
      return ids.value.length > 0
    case 1: // 选择设计模型步骤
      return selectedDesignModelIds.value.length > 0
    case 2: // 确认制作步骤
      return true
    default:
      return false
  }
})

// 步骤导航方法
function nextStep() {
  if (currentStep.value < designModelSteps.value.length - 1 && canProceedToNextStep.value) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 重置步骤状态
function resetDesignModelSteps() {
  currentStep.value = 0
  selectedDesignModelIds.value = []
}

// 处理上传

const uploadModalVisible = ref(false)

function uploadModalClose() {}

async function getList() {
  loading.value = true
  let res = await getMaterialList({
    ...queryParams
  }).finally(() => {
    loading.value = false
  })
  dataSource.value = res.list
  total.value = res.total
}

// phash相似度搜索
async function handlePhashSearch() {
  // 去除phash值的前后空格
  queryParams.phash = queryParams.phash.trim()
  
  if (!queryParams.phash) {
    ElMessage.warning('请输入phash值')
    return
  }
  
  // 验证范围值
  if (phashRange.value[0] < 0 || phashRange.value[0] > 100 || 
      phashRange.value[1] < 0 || phashRange.value[1] > 100) {
    ElMessage.warning('相似度范围必须在0-100之间')
    return
  }
  
  if (phashRange.value[0] > phashRange.value[1]) {
    ElMessage.warning('最小值不能大于最大值')
    return
  }
  
  // 重置页码
  queryParams.currentPage = 1
  // 调用现有的getList函数，它会自动检测phash参数并调用相似度搜索
  await getList()
}

// phash范围滑块变更
function onPhashRangeChange(value) {
  // 同步到queryParams
  queryParams.phashSimilarityMin = value[0]
  queryParams.phashSimilarityMax = value[1]
}

// phash输入框失去焦点时自动trim
function onPhashInputBlur() {
  queryParams.phash = queryParams.phash.trim()
}

// 清空phash搜索
function clearPhashSearch() {
  queryParams.phash = ''
  phashRange.value = [70, 90]
  queryParams.phashSimilarityMin = undefined
  queryParams.phashSimilarityMax = undefined
}

getList()

// 操作函数
function handleQuery() {
  queryParams.currentPage = 1
}

function resetQuery() {
  getList()
}

// 移动端筛选提交
function onMobileFilterSubmit() {
  filterDialogVisible.value = false
  getList()
}

// 下载
function handleMultiDownload() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要下载的数据')
  }

  // 处理图片下载
  try {
    ids.value.forEach(async (id, index) => {
      let row = dataSource.value.find((item) => {
        return item.id == id
      })

      if (!row) {
        return
      }
      setTimeout(async () => {
        try {
          const downloadUrl = row.url || row.ossObjectName
          const fileName = row.name || row.imageName || `image_${id}.jpg`
          
          if (!downloadUrl) {
            ElMessage.error(`图片 ${fileName} 下载失败：缺少下载链接`)
            return
          }
          
          // 使用新的下载函数，确保文件被下载而不是打开新页面
          await downloadImage(downloadUrl, fileName)
          ElNotification.success(`图片 ${fileName} 下载成功`)
        } catch (error) {
          console.error('下载失败:', error)
          ElMessage.error(`图片下载失败：${error.message}`)
        }
      }, 500 * index)
    })
  } catch (e) {
    console.error('批量下载失败:', e)
    ElMessage.error('批量下载失败')
  }
}

function handleDelete(row?) {
  let delIds: any = null
  if (row) {
    delIds = [row.id]
  } else {
    delIds = Array.isArray(ids.value) ? [...ids.value] : []
    if (!delIds.length) {
      return ElMessage.warning('请选择要删除的数据')
    }
  }

  ElMessageBox.confirm('确认删除该数据吗', '删除提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'error'
  })
    .then(async () => {
      delIds = delIds.map((id) => String(id))
      await deleteAssetLibrary({ ids: delIds })
      ElNotification.success('删除成功')
      resetCheckStatus()
      getList()
    })
    .catch(() => {})
}
function checkboxChange(e) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)]
}

function checkboxAllChange(e) {
  const records = Array.isArray(e.records) ? e.records : []
  const reserves = Array.isArray(e.reserves) ? e.reserves : []
  ids.value = [...records.map((item) => item.id), ...reserves.map((item) => item.id)]
}

async function handleDownload(row) {
  // 处理图片下载
  try {
    const downloadUrl = row.url || row.ossObjectName
    const fileName = row.name || row.imageName || `image_${row.id}.jpg`
    
    if (!downloadUrl) {
      ElMessage.error(`图片 ${fileName} 下载失败：缺少下载链接`)
      return
    }
    
    // 使用新的下载函数，确保文件被下载而不是打开新页面
    await downloadImage(downloadUrl, fileName)
    ElNotification.success(`图片 ${fileName} 下载成功`)
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error(`图片下载失败：${error.message}`)
  }
}

// 复制单个素材
async function handleCopy(row) {
  try {
    const res = await copyStickers({ ids: String(row.id) })
    const count = Array.isArray(res?.list) ? res.list.length : 1
    ElMessage.success(`复制成功 ${count} 条`)
    getList()
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

async function handleDesignModel(row) {
  // 设置当前选中的素材为单个素材
  ids.value = [row.id]
  resetDesignModelSteps()
  designModelModalVisible.value = true
  await loadDesignModels()
}

// 处理单个素材的二维模板制作
async function handleLinkTemplate2D(row) {
  // 设置当前选中的素材为单个素材
  ids.value = [row.id]
  await openLinkTemplate2D(row)
}

async function loadDesignModels() {
  designModelLoading.value = true
  try {
    // 只查母版模型
    const res = await getDesignModelList({
      currentPage: 1,
      pageSize: 100,
      isTemplate: true
    })
    designModelList.value = res.list || []
  } catch (error) {
    console.error('加载设计模型失败:', error)
    ElMessage.error('加载设计模型失败')
  } finally {
    designModelLoading.value = false
  }
}



function selectDesignModel(model) {
  const index = selectedDesignModelIds.value.indexOf(model.id)
  if (index > -1) {
    // 如果已选中，则取消选中
    selectedDesignModelIds.value.splice(index, 1)
  } else {
    // 如果未选中，则添加到选中列表
    selectedDesignModelIds.value.push(model.id)
  }
}

function handleDesignModelConfirm() {
  if (!selectedDesignModelIds.value.length) {
    ElMessage.warning('请选择设计模型')
    return
  }
  
  // 打印最终数据
  console.log('素材图ID数组:', ids.value)
  console.log('设计模型ID数组:', selectedDesignModelIds.value)
  
  // 发送数据到设计工具
  const designToolMessenger = getDesignToolMessenger()
  const childWindow = designToolMessenger.getChildWindow()

  const success = designToolMessenger.sendDesignModelData({
    materialIds: Array.isArray(ids.value) ? [...ids.value] : [],
    designModelIds: selectedDesignModelIds.value
  })
  
  if (success) {
    ElMessage.success('数据已发送到设计工具')
    if (childWindow && typeof childWindow.focus === 'function') {
      childWindow.focus()
    }
    // 关闭弹窗并重置步骤
    designModelModalVisible.value = false
    resetDesignModelSteps()
  }
}



const delayUpdateList = useDebounceFn(() => {
  getList()
}, 1999)

function singleFileUploaded() {
  console.log('单个文件上传')
  delayUpdateList()
}

/**
 * @group
 */

const aiGenDialogVisible = ref(false)
const aiGenPrompt = ref('')
const aiGenDialogLoading = ref(false)
let aiGenRow = null

const aiJudgeInfringementDialogVisible = ref(false)
const aiJudgeInfringementPrompt = ref('')
const aiJudgeInfringementLoading = ref(false)
let aiJudgeInfringementRow = null

const aiTableLoading = ref<Record<string, boolean>>({})

// meta相关变量
const metaDialogVisible = ref(false)
const metaDialogContent = ref('')

function onAiTableAutoGenerate(row) {
  if (aiTableLoading.value[row.id]) return
  aiGenRow = row
  aiGenPrompt.value = ''
  aiGenDialogVisible.value = true
}

function onAiJudgeInfringement(row) {
  if (aiTableLoading.value[row.id]) return
  aiJudgeInfringementRow = row
  aiJudgeInfringementPrompt.value = ''
  aiJudgeInfringementDialogVisible.value = true
}

async function submitAiGenDialog() {
  if (!aiGenRow) return
  aiGenDialogLoading.value = true
  aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: true }
  try {
    await handleAiAutoGenerate(aiGenRow, () => {
      aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false }
      aiGenDialogLoading.value = false
      aiGenDialogVisible.value = false
      aiGenRow = null
    }, aiGenPrompt.value)
  } catch (e) {
    aiTableLoading.value = { ...aiTableLoading.value, [aiGenRow.id]: false }
    aiGenDialogLoading.value = false
    aiGenDialogVisible.value = false
    aiGenRow = null
  }
}

async function submitAiJudgeInfringementDialog() {
  if (!aiJudgeInfringementRow) return
  aiJudgeInfringementLoading.value = true
  aiTableLoading.value = { ...aiTableLoading.value, [aiJudgeInfringementRow.id]: true }
  try {
    await handleAiJudgeInfringement(aiJudgeInfringementRow, () => {
      aiTableLoading.value = { ...aiTableLoading.value, [aiJudgeInfringementRow.id]: false }
      aiJudgeInfringementLoading.value = false
      aiJudgeInfringementDialogVisible.value = false
      aiJudgeInfringementRow = null
    }, aiJudgeInfringementPrompt.value)
  } catch (e) {
    aiTableLoading.value = { ...aiTableLoading.value, [aiJudgeInfringementRow.id]: false }
    aiJudgeInfringementLoading.value = false
    aiJudgeInfringementDialogVisible.value = false
    aiJudgeInfringementRow = null
  }
}

async function handleAiAutoGenerate(row, cb, prompt) {
  try {
    const res = await aiAutoGenerateMaterialInfo({
      id: row.id,
      prompt: prompt || ''
    })
    // 更新行数据
    if (res && res.data) {
      row.name = res.data.name
      row.description = res.data.description
      row.keywords = res.data.keywords
      // 你可以根据实际返回结构调整
    }
    ElNotification.success('AI自动生成内容成功')
    if (typeof cb === 'function') cb()
    getList()
  } catch (e) {
    ElNotification.error('AI自动生成内容失败')
    if (typeof cb === 'function') cb()
  }
}

async function handleAiJudgeInfringement(row, cb, prompt) {
  try {
    const res = await aiJudgeInfringement({
      id: row.id,
      prompt: prompt || ''
    })
    
    // 更新行数据
    if (res) {
      row.isInfringement = res.isInfringement
      
      // 显示AI判断结果
      const resultText = res.isInfringement ? '侵权' : '非侵权'
      const resultType = res.isInfringement ? 'warning' : 'success'
      
      ElNotification({
        title: 'AI判断侵权完成',
        message: `判断结果：${resultText}，置信度：${(res.confidence * 100).toFixed(1)}%，理由：${res.reason}`,
        duration: 5000,
        type: resultType
      })
    }
    
    if (typeof cb === 'function') cb()
    getList()
  } catch (e) {
    ElNotification.error(`AI判断侵权失败：${e.message || '未知错误'}`)
    if (typeof cb === 'function') cb()
  }
}

async function handleGeneratePhash(row) {
  if (!row.url) {
    ElMessage.error('图片无有效链接，无法生成哈希');
    return;
  }
  try {
    const { phash } = await calculatePhash({ url: row.url, ext: row.suffix || 'jpg' });
    if (phash) {
      row.phash = phash;
      ElMessage.success('哈希生成成功: ' + phash);
      // 可选：自动保存到后端
      await updateAssetLibrary({ id: row.id, phash });
      getList();
    } else {
      ElMessage.warning('哈希生成失败');
    }
  } catch (e) {
    ElMessage.error('哈希生成失败');
  }
}

// 发布贴纸
async function handlePublish(row) {
  try {
    await updateAssetLibrary({ id: row.id, isPublish: true });
    row.isPublish = true;
    ElMessage.success('发布成功');
    getList();
  } catch (e) {
    ElMessage.error('发布失败');
  }
}

// 下架贴纸
async function handleUnpublish(row) {
  try {
    await updateAssetLibrary({ id: row.id, isPublish: false });
    row.isPublish = false;
    ElMessage.success('下架成功');
    getList();
  } catch (e) {
    ElMessage.error('下架失败');
  }
}

// 批量发布
async function handleBatchPublish() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要发布的素材');
  }
  
  try {
    const promises = ids.value.map(id => 
      updateAssetLibrary({ id, isPublish: true })
    );
    await Promise.all(promises);
    ElMessage.success(`成功发布 ${ids.value.length} 个素材`);
    resetCheckStatus();
    getList();
  } catch (e) {
    ElMessage.error('批量发布失败');
  }
}

// 批量下架
async function handleBatchUnpublish() {
  if (!ids.value.length) {
    return ElMessage.warning('请选择要下架的素材');
  }
  
  try {
    const promises = ids.value.map(id => 
      updateAssetLibrary({ id, isPublish: false })
    );
    await Promise.all(promises);
    ElMessage.success(`成功下架 ${ids.value.length} 个素材`);
    resetCheckStatus();
    getList();
  } catch (e) {
    ElMessage.error('批量下架失败');
  }
}

const editDialogVisible = ref(false)
const editForm = ref({ id: '', name: '', description: '', keywords: '', isCustom: false, isInfringement: false, isPublish: false })
const editLoading = ref(false)

// 其他缺少的变量
const currentUploadInfo = ref({ path: '' })
const currentGenPictureConfig = ref([])
const genPicturesForm = ref({})
const genPicturesFormRules = ref({})
const genPicturesModalVisible = ref(false)

// 配置变更函数
function configChange(config) {
  currentGenPictureConfig.value = config
}

// 图片预览相关状态
const imagePreviewVisible = ref(false)
const currentImageUrl = ref('')

function handleEdit(row) {
  editForm.value = { 
    id: row.id, 
    name: row.name, 
    description: row.description, 
    keywords: row.keywords,
    isCustom: row.isCustom || false,
    isInfringement: row.isInfringement || false,
    isPublish: row.isPublish || false
  }
  editDialogVisible.value = true
}

// 关联二维模板组
const linkTemplate2DDialogVisible = ref(false)
const selectedTemplateGroup2DId = ref('') // 保留以兼容旧逻辑（未使用）
const selectedTemplateGroup2DIds = ref<string[]>([])
const linkingTemplate2D = ref(false)
const templateGroup2DOptions = ref<any[]>([])
let linkRow: any = null

async function openLinkTemplate2D(row: any) {
  linkRow = row
  selectedTemplateGroup2DId.value = ''
  selectedTemplateGroup2DIds.value = []
  linkTemplate2DDialogVisible.value = true
  try {
    const res = await pageTemplateGroup2D({ page: 1, pageSize: 200 })
    templateGroup2DOptions.value = res.list || []
  } catch (e) {
    ElMessage.error('加载二维模板组失败')
  }
}

async function confirmLinkTemplate2D() {
  if (!selectedTemplateGroup2DIds.value.length) {
    ElMessage.warning('请选择二维模板组')
    return
  }

  function toggleTemplate2D(id: string) {
    const key = String(id)
    const idx = selectedTemplateGroup2DIds.value.indexOf(key)
    if (idx >= 0) {
      selectedTemplateGroup2DIds.value.splice(idx, 1)
    } else {
      selectedTemplateGroup2DIds.value.push(key)
    }
  }
  try {
    linkingTemplate2D.value = true
    const materialIds = linkRow ? [String(linkRow.id)] : (Array.isArray(ids.value) ? [...ids.value] : [])
    if (!materialIds.length) {
      ElMessage.warning('请先勾选素材或从行操作进入')
      return
    }
    await batchCreateProductImage2D({ materialIds: materialIds.map(String), templateGroup2DIds: [...selectedTemplateGroup2DIds.value] })
    ElMessage.success(`制作成功，共 ${materialIds.length * selectedTemplateGroup2DIds.value.length} 条`) 
    linkTemplate2DDialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(`关联失败：${e?.message || ''}`)
  } finally {
    linkingTemplate2D.value = false
  }
}

async function submitEdit() {
  editLoading.value = true
  try {
    await updateAssetLibrary(editForm.value)
    ElNotification.success('保存成功')
    editDialogVisible.value = false
    getList()
  } catch (e) {
    ElNotification.error('保存失败')
  } finally {
    editLoading.value = false
  }
}

// 图片预览相关方法
function openImagePreview(imageUrl: string, imageName?: string) {
  currentImageUrl.value = imageUrl
  imagePreviewVisible.value = true
}

function closeImagePreview() {
  imagePreviewVisible.value = false
  currentImageUrl.value = ''
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/src/assets/images/image-error.png' // 错误图片占位符，可以根据实际情况调整
  console.warn('图片加载失败:', img.alt)
}

// 处理图片加载完成事件
function handleImageLoad(event: Event, row: any) {
  const img = event.target as HTMLImageElement
  if (img.naturalWidth && img.naturalHeight) {
    // 将图片尺寸信息存储到行数据中
    row.imageDimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight
    }
    console.log(`图片 ${row.name || row.id} 尺寸: ${img.naturalWidth} × ${img.naturalHeight}`)
  } else {
    console.warn(`图片 ${row.name || row.id} 无法获取尺寸信息`)
  }
}

// 显示meta详情
function showMetaDetail(meta: any) {
  metaDialogContent.value = JSON.stringify(meta, null, 2)
  metaDialogVisible.value = true
}

defineExpose({ handleGeneratePhash });



// 处理dropdown操作命令
function handleOperationCommand(command: string, row: any) {
  switch (command) {
    case 'edit':
      handleEdit(row);
      break;
    case 'download':
      handleDownload(row);
      break;
    case 'design-model':
      handleDesignModel(row);
      break;
    case 'link-template-2d':
      handleLinkTemplate2D(row);
      break;
    case 'ai-generate':
      onAiTableAutoGenerate(row);
      break;
    case 'ai-judge-infringement':
      onAiJudgeInfringement(row);
      break;
    case 'generate-phash':
      handleGeneratePhash(row);
      break;
    case 'publish':
      handlePublish(row);
      break;
    case 'unpublish':
      handleUnpublish(row);
      break;
    case 'view-meta':
      showMetaDetail(row.meta);
      break;
    case 'copy':
      handleCopy(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
    default:
      console.warn('未知的操作命令:', command);
  }
}

// URL上传相关
const urlUploadModalVisible = ref(false)
const urlUploadLoading = ref(false)
const urlUploadFormRef = ref()
const urlPreviewVisible = ref(false)
const imageInfo = ref(null)

const urlUploadForm = reactive({
  url: '',
  name: '',
  description: '',
  keywords: '',
  isCustom: false,
  isInfringement: false,
  isPublish: false
})

const urlUploadFormRules = {
  url: [
    { required: true, message: '请输入图片URL', trigger: 'blur' },
    { 
      pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i, 
      message: '请输入有效的图片URL', 
      trigger: 'blur' 
    }
  ],
  name: [
    { required: true, message: '请输入文件名', trigger: 'blur' }
  ]
}

// 重置URL上传表单
function resetUrlUploadForm() {
  urlUploadForm.url = ''
  urlUploadForm.name = ''
  urlUploadForm.description = ''
  urlUploadForm.keywords = ''
  urlUploadForm.isCustom = false
  urlUploadForm.isInfringement = false
  urlUploadForm.isPublish = false
  urlPreviewVisible.value = false
  imageInfo.value = null
}

// 监听URL变化，自动显示预览
watch(() => urlUploadForm.url, (newUrl) => {
  if (newUrl && isValidImageUrl(newUrl)) {
    urlPreviewVisible.value = true
    imageInfo.value = null
  } else {
    urlPreviewVisible.value = false
    imageInfo.value = null
  }
})

// 验证是否为有效的图片URL
function isValidImageUrl(url) {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i
  return imageExtensions.test(url)
}

// 处理预览图片加载成功
function handlePreviewLoad(event) {
  const img = event.target
  imageInfo.value = {
    width: img.naturalWidth,
    height: img.naturalHeight,
    size: '未知'
  }
}

// 处理预览图片加载失败
function handlePreviewError() {
  ElMessage.warning('图片预览加载失败，请检查URL是否正确')
  urlPreviewVisible.value = false
}

// 从URL获取图片文件
async function fetchImageFromUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'image/*'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL指向的不是图片文件')
    }
    
    const blob = await response.blob()
    
    // 检查文件大小（限制10MB）
    if (blob.size > 10 * 1024 * 1024) {
      throw new Error('图片文件过大，请选择小于10MB的图片')
    }
    
    // 从URL或content-type获取文件扩展名
    let extension = 'jpg'
    const urlMatch = url.match(/\.([a-zA-Z0-9]+)(\?.*)?$/i)
    if (urlMatch) {
      extension = urlMatch[1].toLowerCase()
    } else if (contentType) {
      const typeMatch = contentType.match(/image\/([a-zA-Z0-9]+)/i)
      if (typeMatch) {
        extension = typeMatch[1].toLowerCase()
        if (extension === 'jpeg') extension = 'jpg'
      }
    }
    
    // 创建File对象
    const fileName = urlUploadForm.name || `image_${Date.now()}.${extension}`
    const file = new File([blob], fileName, { type: blob.type })
    
    return { file, extension }
  } catch (error) {
    console.error('获取图片失败:', error)
    throw new Error(`获取图片失败: ${error.message}`)
  }
}

// 处理URL上传
async function handleUrlUpload() {
  if (!urlUploadFormRef.value) return
  
  try {
    // 验证表单
    await urlUploadFormRef.value.validate()
    
    urlUploadLoading.value = true
    
    // 获取图片文件
    const { file, extension } = await fetchImageFromUrl(urlUploadForm.url)
    
    // 上传到COS
    const cos = await uploadToCOS({ file })
    const { key, url } = cos
    
    // 上传到服务器
    await uploadMaterialFile({
      url,
      name: urlUploadForm.name,
      description: urlUploadForm.description,
      keywords: urlUploadForm.keywords,
      suffix: extension,
      isCustom: urlUploadForm.isCustom,
      isInfringement: urlUploadForm.isInfringement,
      isPublish: urlUploadForm.isPublish
    })
    
    ElNotification.success('图片上传成功')
    urlUploadModalVisible.value = false
    resetUrlUploadForm()
    
    // 刷新列表
    getList()
    
  } catch (error) {
    console.error('URL上传失败:', error)
    ElMessage.error(`上传失败: ${error.message}`)
  } finally {
    urlUploadLoading.value = false
  }
}

</script>

<style scoped>
.link-2d-dialog :deep(.el-dialog__body) { height: calc(100vh - 140px); display: flex; flex-direction: column; overflow: hidden; }
.design-model-dialog :deep(.el-dialog__body) { max-height: calc(100vh - 160px); overflow: hidden; }
.design-model-flex { height: 100%; overflow: hidden; }
.design-model-content { max-height: calc(100vh - 80px); overflow: auto; }
.link-2d-body { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1; overflow: auto; }
.link-2d-footer { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 12px; }
.link-2d-footer .result-info { flex: 1; min-width: 0; }
.link-2d-footer .footer-actions { display: flex; gap: 8px; }
.selected-materials .thumbs { display: flex; flex-wrap: wrap; gap: 8px; }
.selected-materials .thumb { width: 72px; height: 72px; border: 1px solid var(--el-border-color); border-radius: 4px; overflow: hidden; background: var(--el-fill-color-lighter); }
.selected-materials .thumb img { width: 100%; height: 100%; object-fit: cover; }
.template-selector .template-list { min-height: 320px; max-height: 560px; overflow: auto; border: 1px solid var(--el-border-color); border-radius: 4px; padding: 8px; }
.template-selector .section-title { margin-top: 8px; }
.template-selector .template-list-rows { display: flex; flex-direction: column; gap: 10px; }
.template-selector .template-row { display: flex !important; align-items: center; gap: 12px; padding: 10px; border: 2px solid var(--el-border-color); border-radius: 10px; background: transparent; width: 100%; height: 160px; }
.template-selector .template-row:hover { border-color: var(--el-color-primary); box-shadow: 0 4px 12px rgba(64,158,255,0.12); background: rgba(64,158,255,0.06); }
.template-selector .template-row.is-checked { border-color: var(--el-color-primary); box-shadow: 0 0 0 2px var(--el-color-primary) inset; }
.template-selector .row-thumb { width: 200px; height: 120px; background: #f9fafb; border-radius: 6px; display:flex; align-items:center; justify-content:center; overflow: hidden; }
.template-selector .row-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
.template-selector .row-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.template-selector .row-title { font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.template-selector .row-actions { display: flex; align-items: center; gap: 8px; }
.template-selector .check-indicator { width: 14px; height: 14px; border: 2px solid var(--el-border-color); border-radius: 50%; display: inline-block; }
.template-selector .check-indicator.checked { border-color: var(--el-color-primary); background: var(--el-color-primary); }
.section-title { font-size: 14px; color: var(--el-text-color-regular); margin-bottom: 8px; }
.result-info { grid-column: 1 / -1; }
/* PC端优化 */
.flex.pb-4, .search-bar {
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.flex.pb-4 > *, .search-bar > * {
  margin-bottom: 0;
}
@media (max-width: 600px) {
  .flex.pb-4, .search-bar {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    padding-bottom: 8px !important;
  }
  .flex.pb-4 > *, .search-bar > * {
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
  .date-range-picker {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }
  .date-range-picker .el-date-editor,
  .date-range-picker .el-range-editor {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
  }
  .content-container {
    padding: 0 4px !important;
  }
  .common-table {
    overflow-x: auto;
  }
}
.table-header {
  border-radius: 4px;
  box-shadow: rgba(17, 17, 26, 0.15) 0px 1px 0px;
}

h1 {
  font-size: 1rem;
}
/* 步骤内容区块统一透明背景风格 */
.step-content {
  margin-bottom: 24px;
  border-radius: 8px;
  padding: 24px;
  transition: box-shadow 0.2s, background 0.2s, opacity 0.2s;
  background: transparent;
  color: #fff;
}
.step-active {
  box-shadow: 0 0 0 3px #409eff44;
  background: rgba(64, 158, 255, 0.10) !important; /* 高亮：主色+透明 */
  opacity: 1;
}
.step-inactive {
  background: rgba(100, 100, 100, 0.06) !important; /* 弱化：深灰+透明 */
  opacity: 0.6;
  filter: grayscale(0.2);
}
/* 去除步骤内容内部的白色/灰色背景 */
.bg-gray-50,
.border-blue-200,
.bg-blue-50 {
  background: transparent !important;
  border-color: rgba(64,158,255,0.15) !important;
}
.design-model-flex {
  display: flex;
  flex-direction: row;
  height: 100%;
}
.steps-vertical {
  flex-shrink: 0;
  min-width: 180px;
  margin-right: 32px;
}
.design-model-content {
  flex: 1;
  overflow-y: auto;
}

/* URL上传容器布局 */
.url-upload-container {
  display: flex;
  gap: 20px;
  min-height: 300px;
}

.form-section {
  flex: 1;
  min-width: 0;
}

.preview-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.preview-label {
  margin-bottom: 12px;
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
  padding: 16px;
  min-height: 200px;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  object-fit: contain;
}

.image-info {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-placeholder,
.preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
  padding: 16px;
  min-height: 200px;
  color: #909399;
  text-align: center;
}

.preview-error {
  color: #f56c6c;
}

.error-text {
  font-size: 12px;
  margin-top: 4px;
}

.preview-placeholder p,
.preview-error p {
  margin: 8px 0 0 0;
  font-size: 14px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .url-upload-container {
    flex-direction: column;
    gap: 16px;
  }
  
  .preview-section {
    min-height: 150px;
  }
  
  .image-preview,
  .preview-placeholder,
  .preview-error {
    min-height: 150px;
  }
}
</style>