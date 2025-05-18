<template>
  <div>
    <el-checkbox-group v-model="checkList">
      <el-checkbox label="高" :value="20002" />
      <el-checkbox label="宽" :value="20003" disabled />
      <el-checkbox label="长" :value="20004" disabled />
    </el-checkbox-group>
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="101" label="自定义尺码" width="240" />
      <el-table-column prop="20002" label="高" width="240" v-if="checkList.includes(20002)">
        <template #default="scope">
          <el-input v-model="scope.row[20002]" type="number" min="0" placeholder="请输入"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="20003" label="宽" width="120">
        <template #default="scope">
          <el-input v-model="scope.row[20003]" type="number" min="0" placeholder="请输入"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="20004" label="长" width="120">
        <template #default="scope">
          <el-input v-model="scope.row[20004]" type="number" min="0" placeholder="请输入"></el-input>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
const props = defineProps({
  config: {
    default: {}
  },
  size: {
    default: []
  }
})

const emits = defineEmits(['change'])

watch(() => props.size, () => {

  let newTable = props.size.map((size) => {

    let existRow = tableData.value.find((row) => row['101'] == size)

    return {
      '101': size,
      ...existRow
    }
  })

  tableData.value = newTable
})

const checkList = ref([20003, 20004])
const tableData = ref([])

watch(tableData, () => {

  const sizeMeta = props.config.sizeSpecMeta.elementList.filter((item) => {
    return checkList.value.includes(item.id)
  })

  emits('change', tableData, sizeMeta)
})


defineExpose({
  validate() {
    
  },
  init(data) {
    if(!data){
      return
    }
    tableData.value = data
  }
})
</script>