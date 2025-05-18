<template>
  <el-select v-model="model" clearable style="width: 160px" @change="$emit('change',model)">
    <el-option v-for="item in userList" :label="item.nickname" :value="item.id" :key="item.id">
      <div class="flex items-center gap-2">
        {{ item.nickname }}
        <el-tag round v-if="userStore.user.id == item.id" size="small" type="success" effect="dark"> 我 </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStoreWithOut } from '@/store/modules/user'
import { getUserPage } from '@/api/system/user'

const model = defineModel()

const userList = ref([])

const userStore = useUserStoreWithOut()

async function initUserList() {
  const res = await getUserPage({
    pageNo: 1,
    pageSize: 99,
  })
  let targetId = userStore.user.id;
  let list = res.list
  const sortedList = [...list].sort((a, b) => {
    if (a.id == targetId) return -1; // a 是目标，排前面
    if (b.id == targetId) return 1;  // b 是目标，排前面
    return 0;
  });
  userList.value = sortedList
}

initUserList()
</script>