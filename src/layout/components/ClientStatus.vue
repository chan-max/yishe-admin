<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-11 06:42:44
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-11 08:01:36
 * @FilePath: /yishe-admin/src/layout/components/ClientStatus.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script lang="tsx">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { ElTooltip } from 'element-plus'

export default defineComponent({
  name: 'ClientStatus',
  setup() {
    const isLocalConnected = ref(false)
    const isRemoteConnected = ref(false)
    let localTimer: number | null = null
    let remoteTimer: number | null = null

    const checkLocalConnection = async () => {
      try {
        const response = await fetch('http://localhost:1519')
        isLocalConnected.value = response.ok
      } catch (error) {
        isLocalConnected.value = false
      }
    }

    const checkRemoteConnection = async () => {
      try {
        const response = await fetch('https://1s.design:1520/api/test')
        isRemoteConnected.value = response.ok
      } catch (error) {
        isRemoteConnected.value = false
      }
    }

    onMounted(() => {
      checkLocalConnection()
      checkRemoteConnection()
      localTimer = window.setInterval(checkLocalConnection, 5000)
      remoteTimer = window.setInterval(checkRemoteConnection, 10000)
    })

    onUnmounted(() => {
      if (localTimer) {
        window.clearInterval(localTimer)
      }
      if (remoteTimer) {
        window.clearInterval(remoteTimer)
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