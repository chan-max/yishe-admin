import { NativeWindowMessenger } from '@/utils/nativeWindowMessenger'
import { getAccessToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'

export interface DesignModelData {
  materialIds: string[]
  designModelIds: string[]
}

export class DesignToolMessenger {
  private messenger: NativeWindowMessenger | null = null
  private pingInterval: number | null = null
  private pongTimeout: number | null = null
  private adminPingTimeout: number | null = null
  private isConnected = false
  public onConnectionChange?: (connected: boolean) => void

  constructor(onConnectionChange?: (connected: boolean) => void) {
    this.onConnectionChange = onConnectionChange
  }

  // 打开设计工具窗口
  openDesignTool(): Promise<boolean> {
    return new Promise((resolve) => {
      this.cleanup()
      
      const token = getAccessToken()
      const baseUrl = import.meta.env.PROD ? 'http://49.232.186.238:1522' : 'http://localhost:1522'
      const url = `${baseUrl}/#/design?token=${encodeURIComponent(token)}`
      
      this.messenger = new NativeWindowMessenger()
      this.messenger.openChild(url)

      // 监听 pong
      this.messenger.on('pong', () => {
        this.isConnected = true
        this.onConnectionChange?.(true)
        if (this.pongTimeout) {
          clearTimeout(this.pongTimeout)
          this.pongTimeout = null
        }
        resolve(true)
      })

      // 监听 customEvent 也作为连接成功的标志
      this.messenger.on('customEvent', (data) => {
        if (!this.isConnected) {
          this.isConnected = true
          this.onConnectionChange?.(true)
        }
        ElMessage.success(JSON.stringify(data))
      })

      // 监听 adminPing 并回复 adminPong
      this.messenger.on('adminPing', () => {
        this.messenger?.send('adminPong', null)
        if (this.adminPingTimeout) clearTimeout(this.adminPingTimeout)
        this.adminPingTimeout = window.setTimeout(() => {
          this.isConnected = false
          this.onConnectionChange?.(false)
        }, 3500)
      })

      // 启动心跳检测
      this.pingInterval = window.setInterval(() => {
        this.messenger?.send('ping', null)
        this.pongTimeout = window.setTimeout(() => {
          this.isConnected = false
          this.onConnectionChange?.(false)
          ElMessage.error('设计工具无响应，连接断开！')
          this.cleanup()
          resolve(false)
        }, 3000)
      }, 5000)

      // 发送测试消息
      setTimeout(() => {
        this.messenger?.send('test', null)
      }, 1000)
    })
  }

  // 发送设计模型数据到子窗口
  sendDesignModelData(data: DesignModelData): boolean {
    if (!this.messenger) {
      ElMessage.error('设计工具未连接，请先连接设计工具')
      return false
    }

    try {
      // 直接发送数据，NativeWindowMessenger 会自动处理序列化
      this.messenger.send('designModelData', data)
      return true
    } catch (error) {
      ElMessage.error('发送数据失败')
      console.error('发送设计模型数据失败:', error)
      return false
    }
  }

  // 检查连接状态
  isDesignToolConnected(): boolean {
    return this.isConnected
  }

  // 清理资源
  cleanup() {
    if (this.messenger) {
      this.messenger.destroy && this.messenger.destroy()
      this.messenger = null
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout)
      this.pongTimeout = null
    }
    if (this.adminPingTimeout) {
      clearTimeout(this.adminPingTimeout)
      this.adminPingTimeout = null
    }
    this.isConnected = false
    this.onConnectionChange?.(false)
  }

  // 销毁实例
  destroy() {
    this.cleanup()
  }
}

// 创建全局实例
let globalDesignToolMessenger: DesignToolMessenger | null = null

export function getDesignToolMessenger(): DesignToolMessenger {
  if (!globalDesignToolMessenger) {
    globalDesignToolMessenger = new DesignToolMessenger()
  }
  return globalDesignToolMessenger
}

export function destroyDesignToolMessenger() {
  if (globalDesignToolMessenger) {
    globalDesignToolMessenger.destroy()
    globalDesignToolMessenger = null
  }
} 