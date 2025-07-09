<!--
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-04-01 07:04:47
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-10 05:36:21
 * @FilePath: /yishe-admin/src/layout/components/ToolHeader.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script lang="tsx">
import { defineComponent, computed, ref, provide } from 'vue'
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

function openDesignTool() {
  cleanupMessenger()
  const token = getAccessToken()
  const baseUrl = import.meta.env.PROD ? 'http://49.232.186.238:1522' : 'http://localhost:1522'
  const url = `${baseUrl}/#/design?token=${encodeURIComponent(token)}`
  messenger = new NativeWindowMessenger()
  messenger.openChild(url, '_blank')
  // 监听子窗口消息
  messenger.on('customEvent', (data) => {
    ElMessage.success('收到子窗口消息: ' + JSON.stringify(data))
  })
  // 监听 pong
  messenger.on('pong', () => {
    setDesignToolConnected(true)
    if (pongTimeout) {
      clearTimeout(pongTimeout)
      pongTimeout = null
    }
  })
  // 监听 adminPing 并回复 adminPong
  messenger.on('adminPing', () => {
    messenger?.send('adminPong', null)
    if (!adminConnected.value) {
      adminConnected.value = true
    }
    if (adminPingTimeout) clearTimeout(adminPingTimeout)
    adminPingTimeout = window.setTimeout(() => {
      adminConnected.value = false
    }, 3500)
  })
  pingInterval = window.setInterval(() => {
    messenger?.send('ping', null)
    pongTimeout = window.setTimeout(() => {
      setDesignToolConnected(false)
      ElMessage.error('子窗口无响应，连接断开！')
      cleanupMessenger()
    }, 3000)
  }, 5000)
  setTimeout(() => {
    messenger?.send('test', null)
  }, 1000)
}

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
          <ElButton type="primary" size="small" onClick={openDesignTool} style="margin-right: 8px;">打开设计工具</ElButton>
          <ClientStatus />
          {screenfull.value ? (
            <Screenfull class="custom-hover" color="var(--top-header-text-color)"></Screenfull>
          ) : undefined}
    
          <UserInfo></UserInfo>
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
</style>
