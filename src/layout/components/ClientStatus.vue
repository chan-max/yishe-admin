<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-11 06:42:44
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-11 05:50:02
 * @FilePath: /yishe-admin/src/layout/components/ClientStatus.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script lang="tsx">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { ElTooltip } from 'element-plus'
import { 
  isLocalConnected, 
  isRemoteConnected,
  isDesignToolConnected,
  startConnectionChecks,
  clearConnectionChecks,
  setDesignToolConnected
} from '@/stores/connectionStatus'
import { getDesignToolMessenger } from '@/utils/designToolMessenger'
import { ElMessage } from 'element-plus'

export default defineComponent({
  name: 'ClientStatus',
  setup() {
    let timers: { localTimer: number, remoteTimer: number } | null = null
    const loading = ref(false)
    const clientLoading = ref(false)
    
    // 获取设计工具通信实例
    const designToolMessenger = getDesignToolMessenger()
    
    // 打开设计工具逻辑
    async function openDesignTool() {
      loading.value = true
      try {
        const success = await designToolMessenger.openDesignTool()
        if (success) {
          setDesignToolConnected(true)
        }
      } catch (error) {
        console.error('打开设计工具失败:', error)
        ElMessage.error('打开设计工具失败')
      } finally {
        loading.value = false
      }
    }
    
    // 监听连接状态变化
    designToolMessenger.onConnectionChange = (connected: boolean) => {
      setDesignToolConnected(connected)
    }

    // 启动客户端
    function openClient() {
      if (clientLoading.value) return
      clientLoading.value = true
      window.open('yishe://')
      setTimeout(() => {
        clientLoading.value = false
      }, 2000)
    }

    onMounted(() => {
      timers = startConnectionChecks()
    })

    onUnmounted(() => {
      if (timers) {
        clearConnectionChecks(timers)
      }
    })

    return () => (
      <div class="flex items-center">
        {/* 客户端下载链接，未启动时显示 */}
        {(
          <a
            href="http://49.232.186.238:1525"
            target="_blank"
            style="margin-right:8px;color:#409EFF;text-decoration:underline;font-size:10px;"
            onclick="event.stopPropagation()"
            onClick={e => e.stopPropagation()}
          >
            客户端下载
          </a>
        )}
        {/* 本地客户端状态 */}
        <ElTooltip
          content={isLocalConnected.value ? '本地客户端已启动' : '点击启动客户端'}
          placement="bottom"
        >
          <div class="custom-hover flex items-center" style={{cursor: isLocalConnected.value ? 'default' : 'pointer'}} onClick={() => { if (!isLocalConnected.value && !clientLoading.value) openClient() }}>
            <div
              class="w-2 h-2 rounded-full mr-1"
              style={{
                backgroundColor: isLocalConnected.value ? '#67C23A' : '#F56C6C',
                boxShadow: isLocalConnected.value 
                  ? '0 0 8px rgba(103, 194, 58, 0.5)' 
                  : '0 0 8px rgba(245, 108, 108, 0.5)'
              }}
            />
            <span 
              class="text-[10px] font-bold flex items-center" 
              style={{ color: isLocalConnected.value ? '#67C23A' : '#F56C6C' }}
            >
              {isLocalConnected.value ? '客户端已启动' : '客户端未启动'}
              {clientLoading.value && (
                <svg class="animate-spin ml-1" width="12" height="12" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#409EFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="31.415, 31.415" transform="rotate(0 25 25)">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
              )}
            </span>
          </div>
        </ElTooltip>

        {/* 远程服务状态 */}
        <ElTooltip
          content={isRemoteConnected.value ? '远程服务已连接' : '远程服务未连接'}
          placement="bottom"
        >
          <div class="custom-hover flex items-center gap-1">
            <div
              class="w-2 h-2 rounded-full mr-1"
              style={{
                backgroundColor: isRemoteConnected.value ? '#67C23A' : '#F56C6C',
                boxShadow: isRemoteConnected.value 
                  ? '0 0 8px rgba(103, 194, 58, 0.5)' 
                  : '0 0 8px rgba(245, 108, 108, 0.5)'
              }}
            />
            <span 
              class="text-[10px] font-bold" 
              style={{ color: isRemoteConnected.value ? '#67C23A' : '#F56C6C' }}
            >
              {isRemoteConnected.value ? '远程已连接' : '远程未连接'}
            </span>
          </div>
        </ElTooltip>

        {/* 设计工具连接状态 */}
        <ElTooltip
          content={isDesignToolConnected.value ? '设计工具已连接' : '点击连接设计工具'}
          placement="bottom"
        >
          <div class="custom-hover flex items-center gap-1" style={{cursor: isDesignToolConnected.value ? 'default' : 'pointer'}} onClick={() => { if (!isDesignToolConnected.value && !loading.value) openDesignTool() }}>
            <div
              class="w-2 h-2 rounded-full mr-1"
              style={{
                backgroundColor: isDesignToolConnected.value ? '#67C23A' : '#F56C6C',
                boxShadow: isDesignToolConnected.value 
                  ? '0 0 8px rgba(103, 194, 58, 0.5)' 
                  : '0 0 8px rgba(245, 108, 108, 0.5)'
              }}
            />
            <span 
              class="text-[10px] font-bold flex items-center" 
              style={{ color: isDesignToolConnected.value ? '#67C23A' : '#F56C6C' }}
            >
              {isDesignToolConnected.value ? '设计工具已连接' : '设计工具未连接'}
              {loading.value && (
                <svg class="animate-spin ml-1" width="12" height="12" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#409EFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="31.415, 31.415" transform="rotate(0 25 25)">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
              )}
            </span>
          </div>
        </ElTooltip>
      </div>
    )
  }
})
</script> 