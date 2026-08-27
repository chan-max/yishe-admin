import { store } from '@/store'
import { defineStore } from 'pinia'
import { getAccessToken, getRefreshToken, removeToken } from '@/utils/auth'
import { CACHE_KEY, useCache, deleteUserCache } from '@/hooks/web/useCache'
import { getInfo, loginOut } from '@/api/login'
import { useGlobalWebsocket } from '@/common/websocket'
import { useEventBus, useWebSocket } from '@vueuse/core'
import { initOssClient } from '@/api/oss'
import { ElNotification } from 'element-plus'
import { websocketClient } from '@/services/websocketClient'

const { wsCache } = useCache()

interface UserVO {
  id: number
  account?: string
  avatar: string
  name: string
  deptId: number
  shortName: string
  isAdmin?: boolean
  expireTime?: string
  setting?: Record<string, any>
  company?: {
    id: string
    name: string
    inviteCode: string
    description: string
    expireTime?: string
  }
}

interface UserInfoVO {
  // USER 缓存
  shortName?: string, // 新增的简称
  permissions: Set<string>
  roles: string[]
  isSetUser: boolean
  user: UserVO
  ws: any
  oss: any
}

export const useUserStore = defineStore('admin-user', {
  state: (): UserInfoVO => ({
    ws: null,
    oss: null,
    permissions: new Set<string>(),
    roles: [],
    isSetUser: false,
    user: {
      id: 0,
      avatar: '',
      name: '',
      deptId: 0,
      shortName: '',
      isAdmin: false,
      expireTime: '',
      company: undefined
    }
  }),
  getters: {
    getPermissions(): Set<string> {
      return this.permissions
    },
    getRoles(): string[] {
      return this.roles
    },
    getIsSetUser(): boolean {
      return this.isSetUser
    },
    getUser(): UserVO {
      return this.user
    }
  },
  actions: {
    async setUserInfoAction() {
      if (!getAccessToken()) {
        this.resetState()
        return null
      }
      let userInfo = wsCache.get(CACHE_KEY.USER)

      // 延迟执行，避免频繁请求
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(null)
        }, 1999);
      })
      
      // 尝试获取用户信息，最多重试2次
      let retryCount = 0
      const maxRetries = 2
      
      console.log('🔄 开始获取用户信息...')
      
      while (retryCount < maxRetries) {
        try {
          console.log(`📡 尝试获取用户信息 (第 ${retryCount + 1} 次)`)
          userInfo = await getInfo()
          console.log('✅ 成功获取用户信息:', userInfo)
          
          // 检查返回的数据是否有效
          if (!userInfo || !userInfo.id) {
            throw new Error('获取到的用户信息无效')
          }
          
          break // 成功获取，跳出循环
        } catch (e: any) {
          retryCount++
          console.error(`❌ 获取用户信息失败 (尝试 ${retryCount}/${maxRetries}):`, e)
          
          // 详细记录错误信息
          if (e?.response) {
            console.error('响应状态:', e.response.status)
            console.error('响应数据:', e.response.data)
          }
          
          // 检查是否是token相关的问题（只有明确的认证失败才退出）
          const isAuthError = 
            e?.response?.status === 401 || 
            e?.code === 401 ||
            (typeof e === 'string' && e.includes('登录超时')) ||
            (e?.response?.data?.code === 401) ||
            (e?.message?.includes('401') || e?.message?.includes('Unauthorized'))
          
          if (isAuthError) {
            // 只有明确的认证错误时才退出登录
            console.error('🚫 认证失败，退出登录')
            await this.loginOut()
            return
          }
          
          // 如果是最后一次尝试失败，使用缓存数据
          if (retryCount >= maxRetries) {
            console.warn('⚠️ 多次尝试失败，尝试使用缓存的用户信息')
            userInfo = wsCache.get(CACHE_KEY.USER)
            if (!userInfo) {
              // 如果缓存也没有，且不是认证错误，抛出错误而不是退出登录
              console.error('🚫 无缓存数据且获取失败')
              throw new Error('获取用户信息失败，请刷新页面重试')
            } else {
              console.log('✅ 使用缓存的用户信息:', userInfo)
            }
            break
          }
          
          // 等待一段时间后重试
          console.log('⏳ 等待1秒后重试...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      // 如果最终还是没有获取到用户信息，抛出错误
      if (!userInfo || !userInfo.id) {
        console.error('🚫 无法获取用户信息')
        throw new Error('获取用户信息失败，请刷新页面重试')
      }
      // this.permissions = new Set(userInfo.permissions)
      // this.roles = userInfo.roles
      this.user = userInfo
      this.isSetUser = true
      wsCache.set(CACHE_KEY.USER, userInfo)
      wsCache.set(CACHE_KEY.ROLE_ROUTERS, userInfo.menus)

      // 用户信息获取成功后，启动 WebSocket 连接
      // 只有在成功获取用户信息后才建立连接
      try {
        const { startWebSocketConnection } = await import('@/stores/connectionStatus')
        startWebSocketConnection()
        console.log('✅ 用户信息获取成功，已启动 WebSocket 连接')
      } catch (error) {
        console.error('❌ 启动 WebSocket 连接失败:', error)
      }

      // this.initWebsocket();
      // this.initOSS()
      console.log('setUserInfoAction', '初始化项目位置')
    },
    async setUserAvatarAction(avatar: string) {
      const userInfo = wsCache.get(CACHE_KEY.USER)
      if (!userInfo || !userInfo.id) return
      this.user.avatar = avatar
      userInfo.avatar = avatar
      wsCache.set(CACHE_KEY.USER, userInfo)
    },
    async setUserNicknameAction(nickname: string) {
      const userInfo = wsCache.get(CACHE_KEY.USER)
      if (!userInfo || !userInfo.id) return
      this.user.nickname = nickname
      userInfo.nickname = nickname
      wsCache.set(CACHE_KEY.USER, userInfo)
    },
    /** 同步组织自服务操作后的头部展示与本地用户缓存。 */
    setUserCompanyAction(company?: UserVO['company']) {
      const normalizedCompany = company
        ? {
            id: company.id,
            name: company.name,
            inviteCode: company.inviteCode,
            description: company.description,
            expireTime: company.expireTime,
          }
        : undefined

      this.user.company = normalizedCompany
      const userInfo = wsCache.get(CACHE_KEY.USER)
      if (userInfo?.id === this.user.id) {
        userInfo.company = normalizedCompany
        wsCache.set(CACHE_KEY.USER, userInfo)
      }
    },
    async loginOut() {
      try {
        // 断开 WebSocket 连接
        websocketClient.disconnect()
        
        // 调用后端登出接口，清理当前设备的token
        await loginOut()
      } catch (error) {
        console.error('登出接口调用失败:', error)
      } finally {
        // 无论接口是否成功，都清理本地登录信息
        removeToken()
        deleteUserCache() // 删除用户缓存
        this.resetState()
        
        // 跳转到首页
        window.location.href = '/'
      }
    },

    resetState() {
      this.permissions = new Set<string>()
      this.roles = []
      this.isSetUser = false
      this.user = {
        id: 0,
        avatar: '',
        account: '',
        nickname: '',
        deptId: 0
      }
    },

    initWebsocket() {
      const resolveInfraWsUrl = () => {
        if (import.meta.env.DEV && typeof window !== 'undefined') {
          const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
          return `${wsProtocol}://${window.location.host}/infra/ws`
        }
        return (import.meta.env.VITE_BASE_URL + '/infra/ws').replace('http', 'ws')
      }

      const server = ref(
        resolveInfraWsUrl() +
        '?token=' +
        getRefreshToken() // 使用 getRefreshToken() 方法，而不使用 getAccessToken() 方法的原因：WebSocket 无法方便的刷新访问令牌
      ) // WebSocket 服务地址
      const getIsOpen = computed(() => status.value === 'OPEN') // WebSocket 连接是否打开

      const message = useMessage() // 消息弹窗

      /** 发起 WebSocket 连接 */
      const { status, data, send, close, open } = useWebSocket(server.value, {
        autoReconnect: true,
        heartbeat: {
          interval:30000,
          pongTimeout:15000,
        },
      })

      const eventBus = useEventBus('erp')

      watchEffect(() => {
        if (!data.value) {
          return
        }
        try {

          if (data.value === 'pong') {
            return
          }
          // console.log('ws',Date.now())
          // console.log('收到websocket 消息',data.value)

          // 2.1 解析 type 消息类型
          const jsonMessage = JSON.parse(data.value)
          const type = jsonMessage.type
          const content = JSON.parse(jsonMessage.content)
          if (!type) {
            message.error('未知的消息类型：' + data.value)
            return
          }

         // // 标题生成了
          if (type == 'make_publish_title') {
            eventBus.emit({
              type:'make_publish_title', content
             })
            return
          }

          // // 套图制作了
          if (type == 'make_publish_image') {
            eventBus.emit({
              type:'make_publish_image', content
            })
            return
          }

          // // 发布更新了
          if (type == 'publish_upload') {
            eventBus.emit({
              type:'publish_upload', content
            })
            return
          }

          message.error('未处理消息：' + data.value)
        } catch (error) {
          message.error('处理消息发生异常：' + data.value)
          console.error(error)
        }
      })


      const instance = {
        isOnline: getIsOpen,
        data,
        send,
        close,
        open
      }

      this.ws = instance
      return
    },
    async initOSS() {
      const res = await initOssClient()
      this.oss = res
    }
  }
})

export const useUserStoreWithOut = () => {
  return useUserStore(store)
}
