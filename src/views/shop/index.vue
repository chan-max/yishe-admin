<template>
  <ContentWrap>
    <div class="mb-10px">
      <el-button type="primary" @click="openDialog()">新增店铺</el-button>
    </div>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="店铺名称" prop="name" />
      <el-table-column label="Logo" width="100">
        <template #default="{ row }">
          <el-image v-if="row.logo" :src="row.logo" style="width: 50px; height: 50px" fit="contain"
            :preview-src-list="[row.logo]" preview-teleported />
        </template>
      </el-table-column>
      <el-table-column label="描述" prop="description" show-overflow-tooltip />
      <el-table-column label="创建时间">
        <template #default="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row.id)">编辑</el-button>
          <el-button v-admin-only link type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <ShopDialog ref="dialogRef" @success="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getShopList, deleteShop } from '@/api/shop'
import { ElMessage, ElMessageBox } from 'element-plus'
import ShopDialog from './components/ShopDialog.vue'
import { formatDate } from '@/utils/formatTime'

const loading = ref(false)
const list = ref([])
const dialogRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const res = await getShopList()
    list.value = res || []
  } finally {
    loading.value = false
  }
}

const openDialog = (id?: number) => {
  dialogRef.value.open(id)
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除该店铺吗？', '提示', {
      type: 'warning'
    })
    await deleteShop(id)
    ElMessage.success('删除成功')
    getList()
  } catch { }
}

onMounted(() => {
  getList()
})
</script>
