<template>
  <el-card shadow="never" class="mr-4 w-full">
    <div class="flex flex-col" v-if="!loading">
      <template v-for="item, index in config.properties?.filter((item) => !item.isSale)">
        <template v-if="components['controlTypeComponent' + item.controlType]">
          <component :is="components['controlTypeComponent' + item.controlType]" :config="item" ref="componentRefs"
            @change="change($event, index)" v-show="showComponent(config.properties[index])" :show="showComponent(config.properties[index])"></component>
        </template>
        <template>
          --
        </template>
      </template>
    </div>
    <div v-else> 正在加载... </div>
  </el-card>
</template>

<script setup lang="ts">
import controlTypeComponent0 from './controlTypeComponents/controlTypeComponent0.vue'
import controlTypeComponent1 from './controlTypeComponents/controlTypeComponent1.vue'
import controlTypeComponent16 from './controlTypeComponents/controlTypeComponent16.vue'

/**
 * 示例
*/

const components = {
  controlTypeComponent1,
  controlTypeComponent0,
  controlTypeComponent16,
}

const props = defineProps({
  config: {
  } as any,
  loading: {
    default: false
  }
})

const emits = defineEmits(['change'])

const form = ref([])

const flatedForm = computed(() => {
  return form.value.flat()
})

// 根据限制条件是否展示组件
function showComponent(c) {
  let ptid = c.parentTemplatePid

  if (ptid == 0 || !ptid) {
    return true
  }

  // 存在限制父节点

  let p = props.config.properties.find((item) => item.templatePid == ptid)

  if (!p) {
    return
  }


  let pSameValue = flatedForm.value.find((item) => {
    return item?.templatePid == p.templatePid
  })

  if (!pSameValue?.vid) {
    return false
  }

  if (!c.templatePropertyValueParentList) {
    return false
  }

  let isSelect = c.templatePropertyValueParentList.some((item) => {

    let parentVidList = item.parentVidList

    let eq = parentVidList.some((ite) => {
      return pSameValue.vid == ite
    })

    return eq
  })

  return isSelect
}

function change($event, index) {
  form.value[index] = $event
  // 暂时只有一层，所以直接平铺即可

  const flated = form.value.flat()
  console.log('表单配置', flated)
  emits('change', flated)
}

const componentRefs = ref([])

defineExpose({
  async init(data) {
    componentRefs.value.forEach((cref) => {
      cref.init(data)
    })
  },
  async validate() {
    await Promise.all(componentRefs.value.map((item) => item.validate()))
  }
})

</script>