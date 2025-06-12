<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-11 06:42:44
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-12 07:47:05
 * @FilePath: /yishe-admin/src/layout/components/ClientStatus.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script lang="tsx">
import { defineComponent, onMounted, onUnmounted } from 'vue'
import { ElTooltip } from 'element-plus'
import { 
  isLocalConnected, 
  isLocalBrowserConnected, 
  isRemoteConnected,
  startConnectionChecks,
  clearConnectionChecks
} from '@/stores/connectionStatus'

export default defineComponent({
  name: 'ClientStatus',
  setup() {
    let timers: { localTimer: number, remoteTimer: number, localBrowserTimer: number } | null = null

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
        <ElTooltip
          content={isLocalConnected.value ? '本地客户端已启动' : '本地客户端未启动'}
          placement="bottom"
        >
          <div class="custom-hover flex items-center">
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
              class="text-[10px] font-bold" 
              style={{ color: isLocalConnected.value ? '#67C23A' : '#F56C6C' }}
            >
              {isLocalConnected.value ? '客户端已启动' : '客户端未启动'}
            </span>
          </div>
        </ElTooltip>

        <ElTooltip
          content={isLocalBrowserConnected.value ? '本地浏览器已启动' : '本地浏览器未启动'}
          placement="bottom"
        >
          <div class="custom-hover flex items-center gap-1">
            <div
              class="w-2 h-2 rounded-full mr-1"
              style={{
                backgroundColor: isLocalBrowserConnected.value ? '#67C23A' : '#F56C6C',
                boxShadow: isLocalBrowserConnected.value 
                  ? '0 0 8px rgba(103, 194, 58, 0.5)' 
                  : '0 0 8px rgba(245, 108, 108, 0.5)'
              }}
            />
            <span 
              class="text-[10px] font-bold" 
              style={{ color: isLocalBrowserConnected.value ? '#67C23A' : '#F56C6C' }}
            >
              {isLocalBrowserConnected.value ? '本地游览器已启动' : '本地游览器未启动'}
            </span>
          </div>
        </ElTooltip>

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
      </div>
    )
  }
})
</script> 