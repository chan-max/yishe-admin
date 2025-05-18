<template>
  <el-form-item :label="config.name + ' :'" label-width="140" :required="config.required">
    <div class="flex gap-2">
      <el-input v-model="form.input" style="width: 360px;" placeholder="请输入" @input="change"></el-input>
      <el-select style="width: 100px" placeholder="单位" v-model="form.unit" @change="change">
        <el-option v-for="item in config.valueUnit" :key="item" :label="item" :value="item" />
      </el-select>
    </div>
  </el-form-item>
</template>
<script setup lang="ts">
const props = defineProps({
  config: {
    default: {} as any
  },
  show:{
    
  }
})

const form = ref({
  input: '',
  unit: ''
})

form.value.unit = props.config.valueUnit[0]

const emits = defineEmits(['change'])

function change() {
  const val = {
    "valueUnit": form.value.unit,
    "propValue": form.value.input, // 就是这样的
    "propName": props.config.name,
    "refPid": props.config.refPid,
    "vid": 0,
    "controlType": props.config.controlType,
    "pid": props.config.pid,
    "templatePid": props.config.templatePid,
    "valueExtendInfo": ""
  }
  emits('change', val)
}


defineExpose({
  init(data) {
    if (!data?.length) {
      return
    }
    // 一个输入框和一个下拉
    let items = data.filter((item) => item.templatePid == props.config.templatePid)
    if (!items.length) {
      return
    }

    form.value.input = items[0].propValue
    form.value.unit = items[0].valueUnit
    // 这里使用的是所有数据，需要自行过滤
  },
  async validate() {
    if (props.config.required) {
      if (!props.show) {
        return
      }
      if (!form.value.input) {
        throw ElMessage.warning(`商品属性缺少 ${props.config.name}`)
      }
    }
  }
})
</script>
<style></style>