<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-11 06:42:44
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-30 07:11:23
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
import { NativeWindowMessenger } from '@/utils/nativeWindowMessenger'
import { getAccessToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'

export default defineComponent({
  name: 'ClientStatus',
  setup() {
    let timers: { localTimer: number, remoteTimer: number } | null = null
    // openDesignTool 相关变量
    let messenger: NativeWindowMessenger | null = null
    let pingInterval: number | null = null
    let pongTimeout: number | null = null
    let adminPingTimeout: number | null = null
    const loading = ref(false)
    const clientLoading = ref(false)
    // 断开清理
    function cleanupMessenger() {
      if (messenger) {
        messenger.destroy && messenger.destroy()
        messenger = null
      }
      if (pingInterval) {
        clearInterval(pingInterval)
        pingInterval = null
      }
      if (pongTimeout) {
        clearTimeout(pongTimeout)
        pongTimeout = null
      }
      if (adminPingTimeout) {
        clearTimeout(adminPingTimeout)
        adminPingTimeout = null
      }
      loading.value = false
      setDesignToolConnected(false)
    }
    // 打开设计工具逻辑
    function openDesignTool() {
      loading.value = true
      cleanupMessenger()
      const token = getAccessToken()
      const baseUrl = import.meta.env.PROD ? 'http://49.232.186.238:1522' : 'http://localhost:1522'
      const url = `${baseUrl}/#/design?token=${encodeURIComponent(token)}`
      messenger = new NativeWindowMessenger()
      messenger.openChild(url)
      // 监听子窗口消息
      messenger.on('customEvent', (data) => {
        ElMessage.success('收到子窗口消息: ' + JSON.stringify(data))
      })
      // 监听 pong
      messenger.on('pong', () => {
        setDesignToolConnected(true)
        loading.value = false
        if (pongTimeout) {
          clearTimeout(pongTimeout)
          pongTimeout = null
        }
      })
      // 监听 adminPing 并回复 adminPong
      messenger.on('adminPing', () => {
        messenger?.send('adminPong', null)
        if (adminPingTimeout) clearTimeout(adminPingTimeout)
        adminPingTimeout = window.setTimeout(() => {
          setDesignToolConnected(false)
        }, 3500)
      })
      pingInterval = window.setInterval(() => {
        messenger?.send('ping', null)
        pongTimeout = window.setTimeout(() => {
          setDesignToolConnected(false)
          loading.value = false
          ElMessage.error('子窗口无响应，连接断开！')
          cleanupMessenger()
        }, 3000)
      }, 5000)
      setTimeout(() => {
        messenger?.send('test', null)
      }, 1000)
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