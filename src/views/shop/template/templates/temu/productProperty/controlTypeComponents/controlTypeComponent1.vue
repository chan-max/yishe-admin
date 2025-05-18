<template>
  <el-form-item :label="config.name + ' :'" label-width="140" :required="config.required">
    <el-checkbox-group v-if="config.chooseMaxNum != 1" v-model="checked" @change="handleCheckedChange" size="default"
      :max="config.chooseMaxNum">
      <el-checkbox v-for="value in config.values" :key="value.vid" :label="value.value" :value="value.vid">
        {{ value.value }}
      </el-checkbox>
    </el-checkbox-group>
    <el-select v-else style="width:320px" v-model="singleChecked" @change="handleCheckedChange" :filterable="true">
      <el-option v-for="value in config.values" :key="value.vid" :label="value.value" :value="value.vid">
      </el-option>
    </el-select>
  </el-form-item>
  <!-- {{ config }} -->
</template>
<script lang="ts" setup>

/**
 * 因为可以多选，所以始终向外部抛出一个数组
*/

const checked = ref()

// 单选时候不用checkbox
const singleChecked = ref()

const props = defineProps({
  config: {
    default: {} as any
  },
  show: {
    default: {}
  }
})

const emits = defineEmits(['change'])

// function handleCheckedChange(values) {
//   // values 需要展开
//   const val = {
//     vid: values, // 在values中
//     valueUnit: props.config.valueUnit,  // 有
//     pid: props.config.pid, // 有
//     templatePid: props.config.templatePid, // 有
//     numberInputValue: props.config.numberInputValue, // 有
//     // propValue: '', 中文，先不需要
//     // propName: '',
//     refPid: props.config.refPid // 有
//   }

//   // model.value = val
//   emits('change', val)
// }


function handleCheckedChange(values) {
  if (!Array.isArray(values)) {
    values = [values]
  }
  // values 需要展开
  const val = values.map((item) => {

    let selectItem = props.config.values.find((i) => i.vid == item)

    return {
      vid: item, // 在values中
      valueUnit: props.config.valueUnit[0],  // 有
      pid: props.config.pid, // 有
      templatePid: props.config.templatePid, // 有
      numberInputValue: props.config.numberInputValue, // 有
      propValue: selectItem?.value,
      propName: props.config.name,
      refPid: props.config.refPid // 有
    }
  })
  // model.value = val
  emits('change', val)
}

defineExpose({
  init(data) {
    if (!data?.length) {
      return
    }
    let items = data.filter((item) => item.templatePid == props.config.templatePid)

    if (!items.length) {
      return
    }

    // 单选
    if (props.config.chooseMaxNum == 1) {
      // 应该只有一个
      let item = items[0]
      singleChecked.value = Number(item.vid)

      // 这是强制触发更新
      handleCheckedChange(singleChecked.value)
    } else {
      checked.value = items.map((item) => Number(item.vid))
      // 这是强制触发更新
      handleCheckedChange(checked.value)
    }

  },
  async validate() {

    if(!props.show){
      return
    }

    if (props.config.required) {
      if (!checked.value?.length && !singleChecked.value) {
        throw ElMessage.warning(`商品属性缺少 ${props.config.name}`)
      }
    }
  }
})
</script>