<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-11 06:42:44
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-08-06 08:22:16
 * @FilePath: /yishe-admin/src/layout/components/ClientStatus.vue
-->
<script lang="tsx">
import { defineComponent, onMounted, onUnmounted, ref, computed } from 'vue'
import { ElTooltip } from 'element-plus'
import {
  isLocalConnected,
  isRemoteConnected,
  myClients,
  refreshMyClients,
  startConnectionChecks,
  clearConnectionChecks
} from '@/stores/connectionStatus'
import PsConsoleDialog from '@/components/PsConsoleDialog/index.vue'

export default defineComponent({
  name: 'ClientStatus',
  setup() {
    let timers: { localTimer: number, remoteTimer: number } | null = null
    const clientLoading = ref(false)
    const clientDialogVisible = ref(false)
    const clientCount = computed(() => myClients.value.length)
    let clientCountTimer: number | null = null

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
      // 启动连接检查
      startConnectionChecks();

      timers = {
        localTimer: 0,
        remoteTimer: 0
      };

      // 初始化客户端连接数
      void refreshMyClients()
      clientCountTimer = window.setInterval(() => {
        void refreshMyClients()
      }, 3000)
    })

    onUnmounted(() => {
      if (timers) {
        clearConnectionChecks(timers)
      }
      // 清理客户端连接数定时器
      if (clientCountTimer) {
        clearInterval(clientCountTimer)
        clientCountTimer = null
      }
    })

    return () => (
      <div class="flex items-center ">
        {/* 本地客户端状态 */}
        <ElTooltip
          content={isLocalConnected.value ? '点击打开 PS 控制台' : '点击启动客户端'}
          placement="bottom"
        >
          <div class="custom-hover flex items-center" style={{ cursor: 'pointer' }} onClick={() => {
            if (!isLocalConnected.value && !clientLoading.value) {
              openClient()
            } else if (isLocalConnected.value) {
              clientDialogVisible.value = true
            }
          }}>
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
              {isLocalConnected.value
                ? `客户端已连接 (${clientCount.value})`
                : '客户端未启动'}
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

        {/* PS 控制台弹窗 */}
        <PsConsoleDialog
          modelValue={clientDialogVisible.value}
          onUpdate:modelValue={(val: boolean) => {
            clientDialogVisible.value = val
            // 弹窗关闭时刷新连接数
            if (!val) {
              void refreshMyClients()
            }
          }}
        />
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
      </div>
    )
  }
})
</script>
