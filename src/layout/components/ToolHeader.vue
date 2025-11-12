<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-04-01 07:04:47
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-11-13 06:22:44
 * @FilePath: /yishe-admin/src/layout/components/ToolHeader.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script lang="tsx">
import { defineComponent, computed, ref, provide, onMounted, onUnmounted } from 'vue'
import { Message } from '@/layout/components//Message'
import { Collapse } from '@/layout/components/Collapse'
import { UserInfo } from '@/layout/components/UserInfo'
import { Screenfull } from '@/layout/components/Screenfull'
import { Breadcrumb } from '@/layout/components/Breadcrumb'
import { SizeDropdown } from '@/layout/components/SizeDropdown'
import { LocaleDropdown } from '@/layout/components/LocaleDropdown'
import RouterSearch from '@/components/RouterSearch/index.vue'
import ClientStatus from '@/layout/components/ClientStatus.vue'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { ElButton, ElMessage } from 'element-plus'
import { NativeWindowMessenger } from '@/utils/nativeWindowMessenger'
import { setDesignToolConnected } from '@/stores/connectionStatus'
import { getAccessToken } from '@/utils/auth'
import { saveTokenToClient } from '@/api/user'
import { checkClientAuthorized } from '@/stores/connectionStatus'
import FloatingUtilityButton from '@/components/FloatingUtilityButton/index.vue'

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('tool-header')

const appStore = useAppStore()

// 面包屑
const breadcrumb = computed(() => appStore.getBreadcrumb)

// 折叠图标
const hamburger = computed(() => appStore.getHamburger)

// 全屏图标
const screenfull = computed(() => appStore.getScreenfull)

// 搜索图片
const search = computed(() => appStore.search)

// 尺寸图标
const size = computed(() => appStore.getSize)

// 布局
const layout = computed(() => appStore.getLayout)

// 多语言图标
const locale = computed(() => appStore.getLocale)

// 消息图标
const message = computed(() => appStore.getMessage)

// 新增通信逻辑
let messenger: NativeWindowMessenger | null = null
let pingInterval: number | null = null
let pongTimeout: number | null = null
const adminConnected = ref(false)
provide('adminConnected', adminConnected)
let adminPingTimeout: number | null = null

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
  adminConnected.value = false
  setDesignToolConnected(false)
}

// 删除 openDesignTool 相关函数和引用

const handleClientAuth = async () => {
  const token = getAccessToken();
  if (!token) {
    ElMessage.error('未获取到 token');
    return;
  }
  try {
    await saveTokenToClient(token);
    ElMessage.success('客户端授权成功');
    checkClientAuthorized();
  } catch (e) {
    ElMessage.error('客户端授权失败');
  }
};

// 新增响应式屏幕宽度判断
const isWideScreen = ref(true)
function updateScreen() {
  isWideScreen.value = window.innerWidth >= 768
}
onMounted(() => {
  updateScreen()
  window.addEventListener('resize', updateScreen)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateScreen)
})

export default defineComponent({
  name: 'ToolHeader',
  setup() {
    return () => (
      <div
        id={`${variables.namespace}-tool-header`}
        class={[
          prefixCls,
          'h-[var(--top-tool-height)] relative px-[var(--top-tool-p-x)] flex items-center justify-between',
          'dark:bg-[var(--el-bg-color)]'
        ]}
      >
        {layout.value !== 'top' ? (
          <div class="h-full flex items-center">
            {hamburger.value && layout.value !== 'cutMenu' ? (
              <Collapse class="custom-hover" color="var(--top-header-text-color)"></Collapse>
            ) : undefined}
            {breadcrumb.value ? <Breadcrumb class="lt-md:hidden"></Breadcrumb> : undefined}
          </div>
        ) : undefined}
        <div class="h-full flex items-center">
          {/* 打开设计工具 */}
          { /*  <div class="client-status-wrapper"><ClientStatus /></div> */}
          {screenfull.value ? (
            <Screenfull class="custom-hover" color="var(--top-header-text-color)"></Screenfull>
          ) : undefined}
    
          <UserInfo></UserInfo>

          {/* <FloatingUtilityButton/> */}
        </div>
      </div>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tool-header;

.#{$prefix-cls} {
  transition: left var(--transition-time-02);
}
@media (max-width: 767px) {
  .client-status-wrapper {
    display: none !important;
  }
}
</style>
