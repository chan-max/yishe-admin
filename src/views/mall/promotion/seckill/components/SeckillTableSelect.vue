<template>
  <Dialog v-model="dialogVisible" :appendToBody="true" title="选择活动" width="70%">
    <ContentWrap>
      <!-- 搜索工作栏 -->
      <el-form
        ref="queryFormRef"
        :inline="true"
        :model="queryParams"
        class="-mb-15px"
        label-width="68px"
      >
        <el-form-item label="活动名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入活动名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="活动状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择活动状态"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery">
            <Icon class="mr-5px" icon="ep:search" />
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon class="mr-5px" icon="ep:refresh" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="loading" :data="list" show-overflow-tooltip>
        <!-- 1. 多选模式（不能使用type="selection"，Element会忽略Header插槽） -->
        <el-table-column width="55" v-if="multiple">
          <template #header>
            <el-checkbox
              v-model="isCheckAll"
              :indeterminate="isIndeterminate"
              @change="handleCheckAll"
            />
          </template>
          <template #default="{ row }">
            <el-checkbox
              v-model="checkedStatus[row.id]"
              @change="(checked: boolean) => handleCheckOne(checked, row, true)"
            />
          </template>
        </el-table-column>
        <!-- 2. 单选模式 -->
        <el-table-column label="#" width="55" v-else>
          <template #default="{ row }">
            <el-radio
              :value="row.id"
              v-model="selectedActivityId"
              @change="handleSingleSelected(row)"
            >
              <!-- 空格不能省略，是为了让单选框不显示label，如果不指定label不会有选中的效果 -->
              &nbsp;
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="活动编号" prop="id" min-width="80" />
        <el-table-column label="活动名称" prop="name" min-width="140" />
        <el-table-column label="活动时间" min-width="210">
          <template #default="scope">
            {{ formatDate(scope.row.startTime, 'YYYY-MM-DD') }}
            ~ {{ formatDate(scope.row.endTime, 'YYYY-MM-DD') }}
          </template>
        </el-table-column>
        <el-table-column label="商品图片" prop="spuName" min-width="80">
          <template #default="scope">
            <el-image
              :src="scope.row.picUrl"
              class="h-40px w-40px"
              :preview-src-list="[scope.row.picUrl]"
              preview-teleported
            />
          </template>
        </el-table-column>
        <el-table-column label="商品标题" prop="spuName" min-width="300" />
        <el-table-column
          label="原价"
          prop="marketPrice"
          min-width="100"
          :formatter="fenToYuanFormat"
        />
        <el-table-column label="拼团价" prop="seckillPrice" min-width="100">
          <template #default="scope">
            {{ formatSeckillPrice(scope.row.products) }}
          </template>
        </el-table-column>
        <el-table-column label="开团组数" prop="groupCount" min-width="100" />
        <el-table-column label="成团组数" prop="groupSuccessCount" min-width="100" />
        <el-table-column label="购买次数" prop="recordCount" min-width="100" />
        <el-table-column label="活动状态" align="center" prop="status" min-width="100">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          align="center"
          prop="createTime"
          :formatter="dateFormatter"
          width="180px"
        />
      </el-table>
      <!-- 分页 -->
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.currentPage"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>
    <template #footer v-if="multiple">
      <el-button type="primary" @click="handleEmitChange">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { handleTree } from '@/utils/tree'

import * as ProductCategoryApi from '@/api/mall/product/category'
import { propTypes } from '@/utils/propTypes'
import { CHANGE_EVENT } from 'element-plus'
import * as SeckillActivityApi from '@/api/mall/promotion/seckill/seckillActivity'
import { fenToYuanFormat } from '@/utils/formatter'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { fenToYuan } from '@/utils'

type SeckillActivityVO = Required<SeckillActivityApi.SeckillActivityVO>

/**
 * 活动表格选择对话框
 * 1. 单选模式：
 *    1.1 点击表格左侧的单选框时，结束选择，并关闭对话框
 *    1.2 再次打开时，保持选中状态
 * 2. 多选模式：
 *    2.1 点击表格左侧的多选框时，记录选中的活动
 *    2.2 切换分页时，保持活动的选中状态
 *    2.3 点击右下角的确定按钮时，结束选择，关闭对话框
 *    2.4 再次打开时，保持选中状态
 */
defineOptions({ name: 'SeckillTableSelect' })

defineProps({
  // 多选模式
  multiple: propTypes.bool.def(false)
})

// 列表的总页数
const total = ref(0)
// 列表的数据
const list = ref<SeckillActivityVO[]>([])
// 列表的加载中
const loading = ref(false)
// 弹窗的是否展示
const dialogVisible = ref(false)
// 查询参数
const queryParams = ref({
  currentPage: 1,
  pageSize: 10,
  name: null,
  status: undefined
})

/** 打开弹窗 */
const open = (SeckillList?: SeckillActivityVO[]) => {
  // 重置
  checkedActivitys.value = []
  checkedStatus.value = {}
  isCheckAll.value = false
  isIndeterminate.value = false

  // 处理已选中
  if (SeckillList && SeckillList.length > 0) {
    checkedActivitys.value = [...SeckillList]
    checkedStatus.value = Object.fromEntries(SeckillList.map((activityVO) => [activityVO.id, true]))
  }

  dialogVisible.value = true
  resetQuery()
}
// 提供 open 方法，用于打开弹窗
defineExpose({ open })

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await SeckillActivityApi.getSeckillActivityPage(queryParams.value)
    list.value = data.list
    total.value = data.total
    // checkbox绑定undefined会有问题，需要给一个bool值
    list.value.forEach(
      (activityVO) =>
        (checkedStatus.value[activityVO.id] = checkedStatus.value[activityVO.id] || false)
    )
    // 计算全选框状态
    calculateIsCheckAll()
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.currentPage = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.value = {
    currentPage: 1,
    pageSize: 10,
    name: undefined,
    createTime: []
  }
  getList()
}

/**
 * 格式化拼团价格
 * @param products
 */
const formatSeckillPrice = (products) => {
  const seckillPrice = Math.min(...products.map((item) => item.seckillPrice))
  return `￥${fenToYuan(seckillPrice)}`
}

// 是否全选
const isCheckAll = ref(false)
// 全选框是否处于中间状态：不是全部选中 && 任意一个选中
const isIndeterminate = ref(false)
// 选中的活动
const checkedActivitys = ref<SeckillActivityVO[]>([])
// 选中状态：key为活动ID，value为是否选中
const checkedStatus = ref<Record<string, boolean>>({})

// 选中的活动 activityId
const selectedActivityId = ref()
/** 单选中时触发 */
const handleSingleSelected = (seckillActivityVO: SeckillActivityVO) => {
  emits(CHANGE_EVENT, seckillActivityVO)
  // 关闭弹窗
  dialogVisible.value = false
  // 记住上次选择的ID
  selectedActivityId.value = seckillActivityVO.id
}

/** 多选完成 */
const handleEmitChange = () => {
  // 关闭弹窗
  dialogVisible.value = false
  emits(CHANGE_EVENT, [...checkedActivitys.value])
}

/** 确认选择时的触发事件 */
const emits = defineEmits<{
  change: [SeckillActivityApi: SeckillActivityVO | SeckillActivityVO[] | any]
}>()

/** 全选/全不选 */
const handleCheckAll = (checked: boolean) => {
  isCheckAll.value = checked
  isIndeterminate.value = false

  list.value.forEach((seckillActivity) => handleCheckOne(checked, seckillActivity, false))
}

/**
 * 选中一行
 * @param checked 是否选中
 * @param seckillActivity 活动
 * @param isCalcCheckAll 是否计算全选
 */
const handleCheckOne = (
  checked: boolean,
  seckillActivity: SeckillActivityVO,
  isCalcCheckAll: boolean
) => {
  if (checked) {
    checkedActivitys.value.push(seckillActivity)
    checkedStatus.value[seckillActivity.id] = true
  } else {
    const index = findCheckedIndex(seckillActivity)
    if (index > -1) {
      checkedActivitys.value.splice(index, 1)
      checkedStatus.value[seckillActivity.id] = false
      isCheckAll.value = false
    }
  }

  // 计算全选框状态
  if (isCalcCheckAll) {
    calculateIsCheckAll()
  }
}

// 查找活动在已选中活动列表中的索引
const findCheckedIndex = (activityVO: SeckillActivityVO) =>
  checkedActivitys.value.findIndex((item) => item.id === activityVO.id)

// 计算全选框状态
const calculateIsCheckAll = () => {
  isCheckAll.value = list.value.every((activityVO) => checkedStatus.value[activityVO.id])
  // 计算中间状态：不是全部选中 && 任意一个选中
  isIndeterminate.value =
    !isCheckAll.value && list.value.some((activityVO) => checkedStatus.value[activityVO.id])
}

// 分类列表
const categoryList = ref()
// 分类树
const categoryTreeList = ref()
/** 初始化 **/
onMounted(async () => {
  await getList()
  // 获得分类树
  categoryList.value = await ProductCategoryApi.getCategoryList({})
  categoryTreeList.value = handleTree(categoryList.value, 'id', 'parentId')
})
</script>
