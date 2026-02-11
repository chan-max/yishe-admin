<script setup lang="ts">
import { ref, reactive, onMounted, computed, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPublishConfigListApi,
  createPublishConfigApi,
  updatePublishConfigApi,
  deletePublishConfigApi
} from '@/api/product/publishConfig'
import { ContentWrap } from '@/components/ContentWrap'
import { formatTime } from '@/utils'
import { commonGridOptions } from "@/common/table"
import { useWindowSize } from "@vueuse/core"

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = reactive({
  page: 1,
  pageSize: 20
})

const { height } = useWindowSize()
const gridMaxHeight = ref<number>(0)

watchEffect(() => {
  gridMaxHeight.value = height.value - 220
})

const gridOptions = computed(() => ({
  ...commonGridOptions,
  maxHeight: gridMaxHeight.value,
  columns: [
    { field: 'name', title: '配置名称', minWidth: 150 },
    { field: 'platform', title: '平台', minWidth: 100 },
    { field: 'description', title: '描述', minWidth: 200, showOverflow: true },
    {
      field: 'createTime',
      title: '创建时间',
      width: 160,
      formatter: ({ cellValue }) => formatTime(cellValue, 'yyyy-MM-dd HH:mm')
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right' as const,
      slots: { default: 'action' }
    }
  ]
}))

const getList = async () => {
  loading.value = true
  try {
    const res = await getPublishConfigListApi()
    if (Array.isArray(res)) {
        tableData.value = res
        total.value = res.length
    } else if (res && res.list) {
         tableData.value = res.list
         total.value = res.total
    } else {
        tableData.value = res as any
        total.value = (res as any).length
    }

  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  getList()
}

// Dialog
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const form = reactive({
  id: undefined,
  name: '',
  platform: '',
  configData: '{}', // String representation for editing
  description: '',
  isActive: true
})

const platformOptions = [
  { label: '抖音', value: 'douyin' },
  { label: 'YouTube', value: 'youtube' },
  { label: '小红书', value: 'xiaohongshu' },
  { label: '微博', value: 'weibo' },
  { label: '快手', value: 'kuaishou' },
  { label: 'B站', value: 'bilibili' },
  { label: '知乎', value: 'zhihu' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Temu', value: 'temu' },
  { label: '淘宝', value: 'taobao' },
  { label: '视频号', value: 'wechat_channels' },
  { label: '百家号', value: 'baijiahao' },
  { label: '咸鱼', value: 'xianyu' },
  { label: '京东', value: 'jd' },
  { label: '拼多多', value: 'pinduoduo' },
  { label: '今日头条', value: 'toutiao' },
  { label: '大鱼号', value: 'dayu' },
  { label: '企鹅号', value: 'penguin' },
  { label: '搜狐号', value: 'sohu' },
  { label: '网易号', value: 'netease' },
  { label: '度小视', value: 'duxiaoshi' },
  { label: '美拍', value: 'meipai' },
  { label: '秒拍', value: 'miaopai' },
  { label: 'A站', value: 'acfun' },
  { label: '西瓜视频', value: 'xigua' },
  { label: '好看视频', value: 'haokan' },
  { label: '全民小视频', value: 'quanmin' },
]

const rules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }]
}

const handleAdd = () => {
  dialogTitle.value = '新增发布配置'
  form.id = undefined
  form.name = ''
  form.platform = ''
  form.configData = '{}'
  form.description = ''
  form.isActive = true
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑发布配置'
  form.id = row.id
  form.name = row.name
  form.platform = row.platform
  form.configData = row.configData ? JSON.stringify(row.configData, null, 2) : '{}'
  form.description = row.description
  form.isActive = row.isActive
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        let parsedConfigData = {}
        try {
            parsedConfigData = JSON.parse(form.configData)
        } catch (e) {
            ElMessage.error('JSON格式错误')
            return
        }

        const data = {
            ...form,
            configData: parsedConfigData
        }

        if (form.id) {
          await updatePublishConfigApi(form.id, data)
          ElMessage.success('更新成功')
        } else {
          await createPublishConfigApi(data)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        getList()
      } catch (err) {
        console.error(err)
      }
    }
  })
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除该配置吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deletePublishConfigApi(row.id)
      ElMessage.success('删除成功')
      getList()
    } catch (err) {
      console.error(err)
    }
  })
}

onMounted(() => {
  getList()
})
</script>

<template>
  <ContentWrap>
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
         <!-- Search logic could be improved with backend support -->
        <el-button type="primary" @click="handleSearch">刷新</el-button>
      </div>
      <div>
        <el-button type="primary" @click="handleAdd">新增配置</el-button>
      </div>
    </div>

    <vxe-grid
      v-bind="gridOptions"
      :data="tableData"
      :loading="loading"
    >
      <template #action="{ row }">
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
      </template>
    </vxe-grid>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="50%">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：抖音-主账号" />
        </el-form-item>
        <el-form-item label="平台" prop="platform">
          <el-select v-model="form.platform" placeholder="请选择平台">
             <el-option v-for="item in platformOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="个性配置" prop="configData">
          <el-input v-model="form.configData" type="textarea" :rows="5" placeholder="JSON格式，例如：{'tags': ['推荐'], 'privacy': 'public'}" />
        </el-form-item>
         <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="启用状态" prop="isActive">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </ContentWrap>
</template>
