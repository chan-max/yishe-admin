<template>
  <div class="rich-text-editor">
    <!-- 显示模式 -->
    <div v-if="!editing" class="preview-mode">
      <div v-for="(item, index) in sortedItems" :key="index" class="preview-item">
        <div v-if="item.type === 'text'" class="text-item">
          <div v-for="(content, contentIndex) in item.contentList" :key="contentIndex" class="text-content" :style="{
            fontSize: content.textModuleDetails?.fontSize + 'px',
            color: content.textModuleDetails?.fontColor,
            textAlign: content.textModuleDetails?.align,
            backgroundColor: content.textModuleDetails?.backgroundColor,
            padding: '8px',
            margin: '4px 0',
            border: '1px solid #eee'
          }">
            {{ content.text }}
          </div>
        </div>
        <div v-else-if="item.type === 'image'" class="image-item">
          <div class="image-placeholder"
            :style="{ width: item.contentList[0]?.width / 4 + 'px', height: item.contentList[0]?.height / 4 + 'px' }">
            <el-icon>
              <Picture />
            </el-icon>
            <span>图片 ({{ item.contentList[0]?.width }}×{{ item.contentList[0]?.height }})</span>
          </div>
        </div>
        <div class="item-actions">
          <el-button size="small" @click="editItem(index)">编辑</el-button>
          <el-button size="small" type="danger" @click="removeItem(index)">删除</el-button>
        </div>
      </div>
      <el-button type="primary" @click="addTextItem">添加文本</el-button>
      <el-button type="primary" @click="addImageItem">添加图片</el-button>
    </div>

    <!-- 编辑模式 -->
    <div v-else class="edit-mode">
      <el-form label-width="120px">
        <el-form-item label="类型">
          <el-radio-group v-model="currentItem.type">
            <el-radio label="text">文本</el-radio>
            <el-radio label="image">图片</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="优先级">
          <el-input-number v-model="currentItem.priority" :min="1" />
        </el-form-item>

        <!-- 文本内容编辑 -->
        <template v-if="currentItem.type === 'text'">
          <el-form-item label="文本内容">
            <div>
              <el-button type="primary" size="small" @click="addTextContent">添加文本段落</el-button>
              <div v-for="(content, index) in currentItem.contentList" :key="index" class="text-content-editor">
                <el-input v-model="content.text" type="textarea" :rows="3" placeholder="输入文本内容" />
                <div class="text-style-editor">
                  <el-form-item label="字体大小">
                    <el-input-number v-model="content.textModuleDetails.fontSize" :min="8" :max="72" />
                  </el-form-item>
                  <el-form-item label="字体颜色">
                    <el-color-picker v-model="content.textModuleDetails.fontColor" />
                  </el-form-item>
                  <el-form-item label="对齐方式">
                    <el-select v-model="content.textModuleDetails.align" style="width: 120px;">
                      <el-option label="左对齐" value="left" />
                      <el-option label="居中" value="center" />
                      <el-option label="右对齐" value="right" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="背景颜色">
                    <el-color-picker v-model="content.textModuleDetails.backgroundColor" />
                  </el-form-item>
                  <el-button type="danger" size="small" @click="removeTextContent(index)">删除段落</el-button>
                </div>
              </div>
            </div>
          </el-form-item>
        </template>

        <!-- 图片内容编辑 -->
        <template v-else-if="currentItem.type === 'image'">
          <el-form-item label="图片宽度">
            <el-input-number v-model="currentItem.contentList[0].width" :min="100" :max="2000" />
          </el-form-item>
          <el-form-item label="图片高度">
            <el-input-number v-model="currentItem.contentList[0].height" :min="100" :max="2000" />
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" @click="saveItem">保存</el-button>
          <el-button @click="cancelEdit">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Picture } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const items = ref([...props.modelValue])

function getMaxPriority(){
  return items.value.reduce((max,item) => {
    return  item.priority > max ?  item.priority : max;
  },1)
}

watch(() => props.modelValue,() => {
  items.value = [...props.modelValue]
})

const editing = ref(false)
const currentIndex = ref(-1)
const currentItem = ref(createNewItem('text'))

// 按优先级排序的项
const sortedItems = computed(() => {
  return [...items.value].sort((a, b) => a.priority - b.priority)
})

// 创建新项
function createNewItem(type) {
  let maxP = getMaxPriority()
  if (type === 'text') {
    return {
      lang: 'zh',
      key: 'DecImage',
      type: 'text',
      priority: maxP +1,
      contentList: [
        {
          text: '',
          textModuleDetails: {
            fontSize: 12,
            fontColor: '#333333',
            align: 'left',
            backgroundColor: '#ffffff'
          }
        }
      ]
    }
  } else {
    return {
      lang: 'zh',
      key: 'DecImage',
      type: 'image',
      priority: maxP +1,
      contentList: [
        {
          height: 800,
          width: 800
        }
      ]
    }
  }
}

// 添加文本项
function addTextItem() {
  currentItem.value = createNewItem('text')
  currentIndex.value = -1
  editing.value = true
}

// 添加图片项
function addImageItem() {
  currentItem.value = createNewItem('image')
  currentIndex.value = -1
  editing.value = true
}

// 编辑项
function editItem(index) {
  currentItem.value = JSON.parse(JSON.stringify(items.value[index]))
  currentIndex.value = index
  editing.value = true
}

// 保存项
function saveItem() {
  if (currentIndex.value === -1) {
    // 新增
    items.value.push(currentItem.value)
  } else {
    // 更新
    items.value[currentIndex.value] = currentItem.value
  }

  emit('update:modelValue', items.value)
  editing.value = false
}

// 取消编辑
function cancelEdit() {
  editing.value = false
}

// 删除项
function removeItem(index) {
  items.value.splice(index, 1)
  emit('update:modelValue', items.value)
}

// 添加文本内容
function addTextContent() {
  currentItem.value.contentList.push({
    text: '',
    textModuleDetails: {
      fontSize: 12,
      fontColor: '#333333',
      align: 'left',
      backgroundColor: '#ffffff'
    }
  })
}

// 删除文本内容
function removeTextContent(index) {
  if (currentItem.value.contentList.length > 1) {
    currentItem.value.contentList.splice(index, 1)
  } else {
    ElMessage.warning('至少需要保留一个文本段落')
  }
}
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
}

.preview-item {
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border: 1px dashed #c0c4cc;
  color: #909399;
}

.image-placeholder .el-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.item-actions {
  margin-top: 10px;
}

.text-content-editor {
  margin-bottom: 20px;
}

.text-style-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  align-items: center;
}
</style>