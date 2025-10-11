<template>
  <div class="vconsole-test-page">
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>vConsole 测试页面</span>
        </div>
      </template>
      
      <div class="test-content">
        <el-alert
          title="vConsole 调试工具测试"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>此页面用于测试 vConsole 移动端调试工具的功能。</p>
            <p>请在移动端设备上打开此页面，查看右下角的 vConsole 按钮。</p>
          </template>
        </el-alert>

        <div class="test-section">
          <h3>设备信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="User Agent">
              {{ deviceInfo.userAgent }}
            </el-descriptions-item>
            <el-descriptions-item label="屏幕尺寸">
              {{ deviceInfo.screenSize }}
            </el-descriptions-item>
            <el-descriptions-item label="设备像素比">
              {{ deviceInfo.devicePixelRatio }}
            </el-descriptions-item>
            <el-descriptions-item label="触摸支持">
              {{ deviceInfo.touchSupport ? '是' : '否' }}
            </el-descriptions-item>
            <el-descriptions-item label="是否为移动端">
              {{ deviceInfo.isMobile ? '是' : '否' }}
            </el-descriptions-item>
            <el-descriptions-item label="是否为微信环境">
              {{ deviceInfo.isWeChat ? '是' : '否' }}
            </el-descriptions-item>
            <el-descriptions-item label="环境模式">
              {{ deviceInfo.environment }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="test-section">
          <h3>测试功能</h3>
          <el-space wrap>
            <el-button type="primary" @click="testConsoleLog">测试 Console Log</el-button>
            <el-button type="success" @click="testConsoleWarn">测试 Console Warn</el-button>
            <el-button type="warning" @click="testConsoleError">测试 Console Error</el-button>
            <el-button type="info" @click="testNetworkRequest">测试网络请求</el-button>
            <el-button type="danger" @click="testLocalStorage">测试本地存储</el-button>
          </el-space>
        </div>

        <div class="test-section">
          <h3>vConsole 控制</h3>
          <el-space wrap>
            <el-button @click="showVConsole">显示 vConsole</el-button>
            <el-button @click="hideVConsole">隐藏 vConsole</el-button>
            <el-button @click="toggleVConsole">切换 vConsole</el-button>
            <el-button type="danger" @click="destroyVConsole">销毁 vConsole</el-button>
          </el-space>
        </div>

        <div class="test-section">
          <h3>测试日志</h3>
          <div class="log-container">
            <div v-for="(log, index) in testLogs" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-type" :class="log.type">{{ log.type.toUpperCase() }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  showVConsole, 
  hideVConsole, 
  toggleVConsole, 
  destroyVConsole 
} from '@/utils/vconsole'

// 设备信息
const deviceInfo = ref({
  userAgent: '',
  screenSize: '',
  devicePixelRatio: 0,
  touchSupport: false,
  isMobile: false,
  isWeChat: false,
  environment: ''
})

// 测试日志
const testLogs = ref<Array<{
  time: string
  type: string
  message: string
}>>([])

// 添加日志
const addLog = (type: string, message: string) => {
  testLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    type,
    message
  })
  
  // 限制日志数量
  if (testLogs.value.length > 50) {
    testLogs.value = testLogs.value.slice(0, 50)
  }
}

// 测试 Console Log
const testConsoleLog = () => {
  console.log('这是一条测试日志信息')
  addLog('log', '这是一条测试日志信息')
  ElMessage.success('已输出测试日志')
}

// 测试 Console Warn
const testConsoleWarn = () => {
  console.warn('这是一条测试警告信息')
  addLog('warn', '这是一条测试警告信息')
  ElMessage.warning('已输出测试警告')
}

// 测试 Console Error
const testConsoleError = () => {
  console.error('这是一条测试错误信息')
  addLog('error', '这是一条测试错误信息')
  ElMessage.error('已输出测试错误')
}

// 测试网络请求
const testNetworkRequest = async () => {
  try {
    addLog('info', '开始测试网络请求...')
    const response = await fetch('/api/test')
    addLog('success', `网络请求完成，状态码: ${response.status}`)
    ElMessage.success('网络请求测试完成')
  } catch (error) {
    addLog('error', `网络请求失败: ${error}`)
    ElMessage.error('网络请求测试失败')
  }
}

// 测试本地存储
const testLocalStorage = () => {
  try {
    const testData = {
      timestamp: Date.now(),
      message: 'vConsole 测试数据'
    }
    localStorage.setItem('vconsole-test', JSON.stringify(testData))
    addLog('success', '本地存储测试数据已保存')
    ElMessage.success('本地存储测试完成')
  } catch (error) {
    addLog('error', `本地存储失败: ${error}`)
    ElMessage.error('本地存储测试失败')
  }
}

// 初始化设备信息
onMounted(() => {
  deviceInfo.value = {
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth} x ${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio,
    touchSupport: 'ontouchstart' in window,
    isMobile: /mobile|android|iphone|ipad|ipod|blackberry|windows phone|opera mini|iemobile/i.test(navigator.userAgent),
    isWeChat: /micromessenger/i.test(navigator.userAgent),
    environment: import.meta.env.MODE
  }
  
  addLog('info', 'vConsole 测试页面已加载')
})
</script>

<style lang="less" scoped>
.vconsole-test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    font-size: 18px;
  }
}

.test-content {
  .test-section {
    margin-bottom: 30px;
    
    h3 {
      margin-bottom: 15px;
      color: var(--el-text-color-primary);
      border-bottom: 2px solid var(--el-color-primary);
      padding-bottom: 8px;
    }
  }
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 10px;
  background-color: var(--el-bg-color-page);
  
  .log-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    
    .log-time {
      color: var(--el-text-color-placeholder);
      margin-right: 10px;
      min-width: 80px;
    }
    
    .log-type {
      margin-right: 10px;
      min-width: 50px;
      font-weight: bold;
      
      &.log {
        color: var(--el-color-info);
      }
      
      &.warn {
        color: var(--el-color-warning);
      }
      
      &.error {
        color: var(--el-color-danger);
      }
      
      &.success {
        color: var(--el-color-success);
      }
      
      &.info {
        color: var(--el-color-primary);
      }
    }
    
    .log-message {
      flex: 1;
      color: var(--el-text-color-primary);
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .vconsole-test-page {
    padding: 10px;
  }
  
  .test-content {
    .test-section {
      margin-bottom: 20px;
      
      h3 {
        font-size: 16px;
      }
    }
  }
  
  .log-container {
    max-height: 200px;
    
    .log-item {
      font-size: 11px;
      flex-direction: column;
      align-items: flex-start;
      
      .log-time,
      .log-type {
        margin-right: 0;
        margin-bottom: 2px;
      }
    }
  }
}
</style>
