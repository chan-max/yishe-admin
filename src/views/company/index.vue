<template>
  <div class="organization-page">
    <!-- 无组织：创建/加入引导 -->
    <el-skeleton v-if="loading" :rows="8" animated />

    <EmptyState
      v-else-if="!hasCompany"
      @created="onCompanyChanged"
      @joined="onCompanyChanged"
    />

    <!-- 有组织：组织仪表盘 -->
    <CompanyDashboard
      v-else
      :company="company"
      @refresh="loadMyCompany"
      @left="onCompanyChanged"
      @dissolved="onCompanyChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import EmptyState from './components/EmptyState.vue'
import CompanyDashboard from './components/CompanyDashboard.vue'
import { getMyCompany } from '@/api/company'
import { useUserStore } from '@/store/modules/user'

const hasCompany = ref(false)
const company = ref<any>(null)
const loading = ref(false)
const userStore = useUserStore()

async function loadMyCompany() {
  loading.value = true
  try {
    const res = await getMyCompany()
    // Axios 拦截器返回 { code, data, ... }；保留直接返回实体时的兼容性。
    const companyData = res?.data ?? res
    if (companyData) {
      company.value = companyData
      hasCompany.value = true
      userStore.setUserCompanyAction(companyData)
    } else {
      company.value = null
      hasCompany.value = false
      userStore.setUserCompanyAction()
    }
  } catch (error) {
    console.error('❌ 获取组织信息失败:', error)
    company.value = null
    hasCompany.value = false
  } finally {
    loading.value = false
  }
}

function onCompanyChanged() {
  loadMyCompany()
}

onMounted(() => {
  loadMyCompany()
})
</script>

<style scoped>
.organization-page {
  width: 100%;
  min-height: 100%;
}
</style>
