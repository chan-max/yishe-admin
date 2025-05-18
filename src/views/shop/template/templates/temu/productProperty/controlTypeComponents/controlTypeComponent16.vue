<template>
  <el-form-item :label="config.name + ' :'" label-width="140" :required="config.required">
    <div>
      <div class="flex flex-col gap-2">
        <div class="flex gap-2" v-for="form, index in formList">
          <el-select style="width: 160px" placeholder="请选择" v-model="form.vid" @change="change">
            <el-option v-for="item in config.values" :key="item.vid" :label="item.value" :value="item.vid"
              :disabled="isSelectOptionDisabled(item)" />
          </el-select>
          <numberInput :min="Number(config.minValue)" :max="Number(config.maxValue)" :precision="config.valuePrecision"
            v-model="form.input" style="width: 120px;" placeholder="请输入" @input="change"></numberInput>
          <el-select style="width: 100px" placeholder="单位" v-model="form.unit" @change="change">
            <el-option v-for="item in config.valueUnit" :key="item" :label="item" :value="item" />
          </el-select>
          <el-button v-if="index != 0" :icon="Delete" type="danger" link @click="deleteItem(index)"></el-button>
        </div>
      </div>
      <div class="pt-4">
        <el-button @click="addItem" type="primary"> 添加 </el-button>
      </div>
    </div>
  </el-form-item>
</template>
<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue'
import numberInput from './numberInput.vue'

const props = defineProps({
  config: {
    default: {} as any
  },
  show:{
    
  }
})

// valueRule = 1 相加必须为 100

const formList: any = ref([

])

function addItem() {

  formList.value.push({
    vid: '',
    input: '',
    unit: props.config.valueUnit[0]
  })
}

// 默认加一个
addItem()

function deleteItem(index) {
  formList.value.splice(index, 1)
}

const emits = defineEmits(['change'])

function change() {
  const val = formList.value.map((item) => {
    let selectItem = props.config.values.find((ite) => ite.vid == item.vid)
    return {
      "valueUnit": item.unit,
      "propValue": selectItem?.value,
      "propName": props.config.name,
      "refPid": props.config.refPid,
      "numberInputValue": item.input,
      "vid": item.vid,
      "controlType": props.config.controlType,
      "pid": props.config.pid,
      "templatePid": props.config.templatePid,
    }
  })
  emits('change', val)
}

function isSelectOptionDisabled(item) {
  let selectedList = formList.value.map((item) => item.vid)
  return selectedList.includes(item.vid)
}

defineExpose({
  init(data) {
    // 这里使用的是所有数据，需要自行过滤
    if (!data?.length) {
      return
    }
    let items = data.filter((item) =>{
      return  item.templatePid == props.config.templatePid
    })
    
    if(!items.length){
      return
    }
  
    formList.value = items.map((item) => {
      return {
        vid: Number(item.vid),
        input: item.numberInputValue,
        unit: item.valueUnit
      }
    })
  },
  async validate() {
    if (props.config.required) {

      if (!props.show) {
        return
      }

      const res = formList.value.reduce((res, form) => {
        let inp = Number(form.input)

        if (!isNaN(inp)) {
          res += inp
        }
        return res
      }, 0)

      if (res != 100) {
        throw ElMessage.warning('所有比例之和需等于100')
      }
    }
  }
})
</script>
<style></style>