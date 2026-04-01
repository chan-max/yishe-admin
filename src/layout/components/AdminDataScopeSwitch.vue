<template>
  <div v-if="visible" class="admin-data-scope">
    <span class="admin-data-scope__label">数据</span>
    <el-select
      v-model="selectedValue"
      class="admin-data-scope__select"
      filterable
      :loading="loading"
      placeholder="选择范围"
      @visible-change="handleVisibleChange"
      @change="handleChange"
    >
      <el-option label="我的数据" value="self" />
      <el-option label="全部数据" value="all" />
      <el-option-group v-if="userOptions.length" label="指定用户">
        <el-option
          v-for="item in userOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-option-group>
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserList } from '@/api/user'
import { useDataScopeStore } from '@/store/modules/dataScope'
import { useUserStore } from '@/store/modules/user'

type UserOption = {
  value: string
  label: string
  userId: string
}

const userStore = useUserStore()
const dataScopeStore = useDataScopeStore()
const loading = ref(false)
const loaded = ref(false)
const userOptions = ref<UserOption[]>([])

const visible = computed(() => !!userStore.user?.isAdmin)

const selectedValue = computed({
  get: () => {
    if (dataScopeStore.mode === 'all') {
      return 'all'
    }
    if (dataScopeStore.mode === 'user' && dataScopeStore.userId) {
      return `user:${dataScopeStore.userId}`
    }
    return 'self'
  },
  set: (_value: string) => undefined
})

async function loadUsers() {
  if (loading.value || loaded.value || !visible.value) {
    return
  }
  loading.value = true
  try {
    const res = await getUserList({ currentPage: 1, pageSize: 1000 })
    const currentUserId = String(userStore.user?.id || '')
    userOptions.value = (res.list || [])
      .map((item: any) => ({
        value: `user:${String(item.id)}`,
        label: `${item.name || item.account} (${item.account})`,
        userId: String(item.id)
      }))
      .filter((item: UserOption) => item.userId !== currentUserId)
    loaded.value = true
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

function handleVisibleChange(show: boolean) {
  if (show) {
    loadUsers()
  }
}

function handleChange(value: string) {
  if (value === 'all') {
    dataScopeStore.setAll()
    return
  }

  if (value === 'self' || !value) {
    dataScopeStore.setSelf()
    return
  }

  if (value.startsWith('user:')) {
    const userId = value.slice(5)
    const option = userOptions.value.find((item) => item.userId === userId)
    if (!option) {
      dataScopeStore.setSelf()
      return
    }
    dataScopeStore.setUser(option.userId, option.label)
  }
}

onMounted(() => {
  if (dataScopeStore.mode === 'user' && dataScopeStore.userId) {
    loadUsers()
  }
})
</script>

<style scoped>
.admin-data-scope {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  padding: 0 2px;
}

.admin-data-scope__label {
  font-size: 11px;
  font-weight: 600;
  color: color-mix(in srgb, var(--top-header-text-color) 66%, transparent 34%);
  white-space: nowrap;
}

.admin-data-scope__select {
  width: 144px;
  min-width: 0;
}

.admin-data-scope :deep(.el-select__wrapper) {
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--top-header-hover-color);
  box-shadow: none;
}

.admin-data-scope :deep(.el-select__selected-item),
.admin-data-scope :deep(.el-select__selection) {
  font-size: 12px;
}

@media (max-width: 768px) {
  .admin-data-scope__label {
    display: none;
  }

  .admin-data-scope__select {
    width: 118px;
  }

  .admin-data-scope :deep(.el-select__wrapper) {
    min-height: 28px;
    padding: 0 8px;
  }
}

@media (max-width: 640px) {
  .admin-data-scope {
    padding: 0;
  }

  .admin-data-scope__select {
    width: 104px;
  }
}
</style>
