<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-05-19 05:55:18
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-11 07:20:02
 * @FilePath: /yishe-admin/src/views/Home/Index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div>
    <!-- 社交媒体登录状态检测区域 -->
    <div class="mb-4 px-4 py-3 flex items-center min-h-[48px]">
      <h3 class="text-base font-semibold text-blue-800 mr-4 whitespace-nowrap flex items-center">
        <div class="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
        社交媒体登录状态
      </h3>
      <div v-if="loginStatus" class="flex gap-1.5 flex-1">
        <div 
          v-for="(status, platform) in loginStatus" 
          :key="platform"
          class="flex items-start px-3 py-2 rounded-lg border-2 min-w-[110px] max-w-[130px] shadow-sm transition-all duration-200 hover:shadow-md"
          :class="[
            status.isLoggedIn 
              ? 'border-green-600 bg-green-50 shadow-green-300' 
              : (status.status === 'error' 
                ? 'border-red-600 bg-red-50 shadow-red-300' 
                : 'border-orange-500 bg-orange-100 shadow-orange-200')
          ]"
        >
          <div class="w-2 h-2 rounded-full mr-2 flex-shrink-0 mt-0.5 animate-pulse"
            :class="{
              'bg-green-500 shadow-green-400': status.isLoggedIn,
              'bg-red-500 shadow-red-400': !status.isLoggedIn && status.status === 'error',
              'bg-orange-600 shadow-orange-400': !status.isLoggedIn && status.status !== 'error'
            }"
          ></div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-xs truncate"
              :class="{
                'text-green-700': status.isLoggedIn,
                'text-red-700': !status.isLoggedIn && status.status === 'error',
                'text-orange-800': !status.isLoggedIn && status.status !== 'error'
              }"
            >{{ getPlatformDisplayName(String(platform)) }}</div>
            <div class="text-xs font-medium truncate"
              :class="{
                'text-green-600': status.isLoggedIn,
                'text-red-600': !status.isLoggedIn && status.status === 'error',
                'text-orange-600': !status.isLoggedIn && status.status !== 'error'
              }"
            >{{ status.isLoggedIn ? '已登录' : status.message || '未登录' }}</div>
          </div>
        </div>
      </div>
      <div v-else class="flex-1 text-blue-600 text-sm pl-2 whitespace-nowrap font-medium">
        <div class="flex items-center">
          <div class="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
          点击"检测登录状态"按钮查看各平台登录情况
        </div>
      </div>
      <el-button 
        type="primary" 
        :icon="Refresh" 
        @click="checkLoginStatus" 
        :loading="checkingStatus"
        size="default"
        class="ml-4 flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 border-0 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
      >
        检测登录状态
      </el-button>
    </div>
  </div>
 </template>
<script lang="ts" setup>
import { set } from 'lodash-es'
import { EChartsOption } from 'echarts'
import { formatTime } from '@/utils'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import { useUserStore } from '@/store/modules/user'
import { useWatermark } from '@/hooks/web/useWatermark'
import type { WorkplaceTotal, Project, Notice, Shortcut } from './types'
import { pieOptions, barOptions } from './echarts-data'
import { checkSocialMediaLogin } from "@/api/client";

defineOptions({ name: 'Home' })

// 社交媒体登录状态相关
interface PlatformStatus {
  isLoggedIn: boolean;
  status: string;
  message: string;
}

const loginStatus = ref<{ [key: string]: PlatformStatus } | null>(null);
const checkingStatus = ref(false);

// 获取平台显示名称（包含更多平台）
const getPlatformDisplayName = (platform: string) => {
  const platformNames = {
    douyin: '抖音',
    xiaohongshu: '小红书',
    weibo: '微博',
    kuaishou: '快手',
    bilibili: 'B站'
  };
  return platformNames[platform] || platform;
};

// 检查社交媒体登录状态
const checkLoginStatus = async () => {
  checkingStatus.value = true;
  try {
    const res = await checkSocialMediaLogin();
    loginStatus.value = res;
    ElMessage.success("登录状态检查完成");
  } catch (error) {
    ElMessage.error("登录状态检查失败");
  } finally {
    checkingStatus.value = false;
  }
};

</script>
