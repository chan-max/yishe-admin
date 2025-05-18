<template>
  <el-select v-bind="$attrs" :remote-method="remoteMethod" style="width: 100%">
    <div v-infinite-scroll="loadMore" style="overflow: hidden">
      <el-option
        v-for="item in list"
        :key="item[valueKey]"
        :label="item[labelKey]"
        :value="item[valueKey]"
      />
    </div>
  </el-select>
</template>
 
<script lang="ts" setup name="ScrollSelect">
import { ref, watch } from "vue"
import _ from "lodash"
 
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})
 
const props = defineProps({
  // v-model绑定值不为空时传递初始数据列表
  initialOptions: {
    type: Array,
    default: () => []
  },
  // 传入对应的列表加载api
  methods: {
    type: Function,
    required: true // 或者 true，取决于它是否必须被传递
  },
  // 传入查询关键字
  searchKey: {
    type: String,
    default: ""
  },
  labelKey: {
    type: String,
    default: "name"
  },
  valueKey: {
    type: String,
    default: "id"
  },
  // 查询的其他参数
  queryData: {
    type: Object,
    default: () => {}
  }
})
 
const list = ref([] as any) // 选项列表
const queryFrom = ref({
  current: 1,
  total: 1,
  size: 20
})
 
// 监听 initialOptions 的变化，用于加载初始值
watch(
  () => props.initialOptions,
  newVal => {
    // 如果 modelValue 中的值还未加载到选项中，加载这些数据
    if (newVal && newVal.length > 0) {
      list.value.push(...props.initialOptions)
    }
  },
  { immediate: true }
)
 
// 自定义远程搜索方法
const remoteMethod = (query: string) => {
  queryFrom.value.current = 1
  list.value = []
  queryFrom.value[props.searchKey] = query
  queryFrom.value = { ...queryFrom.value, ...props.queryData }
  getList()
}
 
// 调用props.methods获取下拉数据
const getList = () => {
  props.methods(queryFrom.value).then(res => {
    list.value = [...list.value, ...res.records]
    queryFrom.value.total = Math.ceil(res.total / 20)
  })
}
 
// 获取初始数据
getList()
 
// 无限滚动触底加载
const loadMore = _.debounce(() => {
  if (queryFrom.value.current >= queryFrom.value.total) return
  queryFrom.value.current++
  getList()
}, 200)
</script>