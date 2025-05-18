<template>
  <el-card shadow="never" class="temu-category-cascader mr-4">
    <div class="pb-2">
      <el-button v-for="item in modelListItems" link type="primary" size="small">{{ item?.catName }}</el-button>
    </div>
    <div class="flex gap-4 flex-wrap">
      <div v-for="options, level in displayOptionsList" class="flex flex-col gap-2" style="width:220px;">
        <div style="width:100%;">
          <el-input :prefix-icon="Search" v-model="searchList[level]" placeholder="搜索类目" clearable></el-input>
        </div>
        <el-cascader-panel v-model="modelList[level]" size="small" :options="options" :props="{ value: 'catId' }"
          @change="cascaderChange(level, $event)">
          <template #default="node">
            <div class="flex justify-between items-center">
              <div style="width:100%;font-size: .8em;">{{ node.data.catName }}</div>
              <el-icon v-show="!node.data.isLeaf">
                <ArrowRight></ArrowRight>
              </el-icon>
            </div>
          </template>
          <template #empty>
            <div v-if="singleLoading">
              加载中...
            </div>
            <div v-else>
              暂无类目~
            </div>
          </template>
        </el-cascader-panel>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue';
import { getTemuTemplateCategoryList } from '@/api/publish/template';
import { ArrowRight, Search } from '@element-plus/icons-vue';

const props = defineProps({
  shopId: {
  }
})

const emits = defineEmits(['change'])

// 绑定的值列表
const modelList = ref([])

// 搜索内容
const searchList = ref([])

// 选中的 每一项具体信息
const modelListItems = computed(() => {
  return modelList.value.map((_, index) => {
    let id = _[0]
    let options = optionsList.value[index]
    let item = options.find((op) => op.catId == id)
    return item
  })
})

const optionsLoading = ref([])

const singleLoading = ref(false)

// 记录当前的分类数组
const optionsList = ref([
  [] // 默认有一个分类
])

// 带搜索词过滤的配置
const displayOptionsList = computed(() => {
  return optionsList.value.map((options, index) => {
    let currentSearchContent = searchList.value[index]
    if (!currentSearchContent) {
      return options
    } else {
      return options.filter((opt) => {
        return opt.catName.includes(currentSearchContent)
      })
    }
  })
})


// 初始化只加载
async function initRootList() {
  let res = await queryList()
  optionsList.value[0] = res
}

initRootList()

async function queryList(parentCatId) {
  singleLoading.value = true
  const res = await getTemuTemplateCategoryList({
    shopId: props.shopId,
    parentCatId
  })
  singleLoading.value = false
  return res
}

async function cascaderChange(level, $event) {
  // $event 就是绑定的值
  let pid = $event[0]

  // 并且清空当前后面的所有分类
  optionsList.value = optionsList.value.map((item, index) => {
    if (index > level) {
      return null
    } else {
      return optionsList.value[index]
    }
  }).filter(Boolean)

  // 以及选中的值
  modelList.value = modelList.value.map((item, index) => {
    if (index > level) {
      return null
    } else {
      return modelList.value[index]
    }
  }).filter(Boolean)

  // 先弄一个空的当作placeholder
  optionsList.value[level + 1] = []

  let list = await queryList(pid)

  optionsList.value[level + 1] = list

  let last = modelListItems.value[modelListItems.value.length - 1]

  let isLeaf = last.isLeaf

  if (isLeaf) {

    let postData = getPostData()
    debugger

    emits('change', modelList.value.map((item) => item[0]), isLeaf, postData)
  }
}

function getPostData() {
  const map = Array.from({ length: 10 }, (_, i) => i).reduce((res, item) => {

    let detailItem = modelListItems.value[item]

    res['cat' + (item + 1)] = detailItem ? detailItem.catId : 0

    return res
  }, {
  })

  return map
}

</script>
<style lang="less">
.temu-category-cascader {
  .el-cascader-menu__wrap.el-scrollbar__wrap {
    height: 280px;
  }

  .el-cascader-menu {
    width: 100%;
  }
}
</style>