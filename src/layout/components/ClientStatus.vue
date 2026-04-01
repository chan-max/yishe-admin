<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-11 06:42:44
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-08-06 08:22:16
 * @FilePath: /yishe-admin/src/layout/components/ClientStatus.vue
-->
<script lang="tsx">
import { defineComponent, onMounted, onUnmounted, ref, computed } from "vue";
import { ElTooltip, ElMessage } from "element-plus";
import {
  isLocalConnected,
  isRemoteConnected,
  myClients,
  refreshMyClients,
  startConnectionChecks,
  clearConnectionChecks,
  startWebSocketConnection,
} from "@/stores/connectionStatus";
import ClientConnectionsDialog from "@/components/ClientConnectionsDialog/index.vue";
import { websocketClient } from "@/services/websocketClient";

export default defineComponent({
  name: "ClientStatus",
  setup() {
    let timers: { localTimer: number; remoteTimer: number } | null = null;
    const clientLoading = ref(false);
    const clientDialogVisible = ref(false);
    const hasClientRecords = computed(() => myClients.value.length > 0);
    const onlineClientCount = computed(
      () => myClients.value.filter((client) => client.isOnline).length,
    );
    const offlineClientCount = computed(
      () => myClients.value.filter((client) => !client.isOnline).length,
    );
    const clientStatusText = computed(() => {
      if (onlineClientCount.value > 0) {
        if (offlineClientCount.value > 0) {
          return `客户端已连接 (${onlineClientCount.value} 在线 / ${offlineClientCount.value} 断线)`;
        }
        return `客户端已连接 (${onlineClientCount.value})`;
      }

      if (offlineClientCount.value > 0) {
        return `客户端未连接 (${offlineClientCount.value} 断线)`;
      }

      return "客户端未启动";
    });
    let clientCountTimer: number | null = null;

    // 启动客户端
    function openClient() {
      if (clientLoading.value) return;
      clientLoading.value = true;
      window.open("yishe://");
      setTimeout(() => {
        clientLoading.value = false;
      }, 2000);
    }

    function reconnectRemote() {
      if (isRemoteConnected.value) {
        return;
      }

      const status = websocketClient.state.status;
      if (status === "connecting" || status === "reconnecting") {
        ElMessage.info("远程连接正在恢复中");
        return;
      }

      websocketClient.reconnect();
      startWebSocketConnection();
      ElMessage.success("已发起远程重连");
    }

    onMounted(() => {
      // 启动连接检查
      startConnectionChecks();

      timers = {
        localTimer: 0,
        remoteTimer: 0,
      };

      // 初始化客户端连接数
      void refreshMyClients();
      clientCountTimer = window.setInterval(() => {
        void refreshMyClients();
      }, 3000);
    });

    onUnmounted(() => {
      if (timers) {
        clearConnectionChecks(timers);
      }
      // 清理客户端连接数定时器
      if (clientCountTimer) {
        clearInterval(clientCountTimer);
        clientCountTimer = null;
      }
    });

    return () => (
      <div class="flex items-center whitespace-nowrap">
        {/* 本地客户端状态 */}
        <ElTooltip
          content={hasClientRecords.value ? "点击查看客户端连接" : "点击启动客户端"}
          placement="bottom"
        >
          <div
            class="custom-hover flex items-center whitespace-nowrap"
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (hasClientRecords.value) {
                clientDialogVisible.value = true;
              } else if (!clientLoading.value) {
                openClient();
              }
            }}
          >
            <div
              class="w-2 h-2 rounded-full mr-1"
              style={{
                backgroundColor: isLocalConnected.value ? "#67C23A" : "#F56C6C",
                boxShadow: isLocalConnected.value
                  ? "0 0 8px rgba(103, 194, 58, 0.5)"
                  : "0 0 8px rgba(245, 108, 108, 0.5)",
              }}
            />
            <span
              class="text-[10px] font-bold flex items-center whitespace-nowrap"
              style={{
                color: isLocalConnected.value ? "#67C23A" : "#F56C6C",
                whiteSpace: "nowrap",
              }}
            >
              {clientStatusText.value}
              {clientLoading.value && (
                <svg class="animate-spin ml-1" width="12" height="12" viewBox="0 0 50 50">
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="#409EFF"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-dasharray="31.415, 31.415"
                    transform="rotate(0 25 25)"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 25 25"
                      to="360 25 25"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              )}
            </span>
          </div>
        </ElTooltip>

        <ClientConnectionsDialog
          modelValue={clientDialogVisible.value}
          onUpdate:modelValue={(val: boolean) => {
            clientDialogVisible.value = val;
            // 弹窗关闭时刷新连接数
            if (!val) {
              void refreshMyClients();
            }
          }}
        />
        {/* 远程服务状态 */}
        <ElTooltip
          content={isRemoteConnected.value ? "远程服务已连接" : "点击重新连接远程服务"}
          placement="bottom"
        >
          <div
            class="custom-hover flex items-center gap-1 whitespace-nowrap"
            style={{ cursor: isRemoteConnected.value ? "default" : "pointer" }}
            onClick={() => {
              if (!isRemoteConnected.value) {
                reconnectRemote();
              }
            }}
          >
            <div
              class="w-2 h-2 rounded-full mr-1"
              style={{
                backgroundColor: isRemoteConnected.value ? "#67C23A" : "#F56C6C",
                boxShadow: isRemoteConnected.value
                  ? "0 0 8px rgba(103, 194, 58, 0.5)"
                  : "0 0 8px rgba(245, 108, 108, 0.5)",
              }}
            />
            <span
              class="text-[10px] font-bold whitespace-nowrap"
              style={{
                color: isRemoteConnected.value ? "#67C23A" : "#F56C6C",
                whiteSpace: "nowrap",
              }}
            >
              {isRemoteConnected.value ? "远程已连接" : "远程未连接"}
            </span>
          </div>
        </ElTooltip>
      </div>
    );
  },
});
</script>
