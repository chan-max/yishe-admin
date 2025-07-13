import { NativeWindowMessenger } from '@/utils/nativeWindowMessenger'
import { getAccessToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'

export interface DesignModelData {
  materialIds: string[]
  designModelIds: string[]
}

export class DesignToolMessenger {
  private messenger: NativeWindowMessenger | null = null
  private adminPingInterval: number | null = null
  private adminPingTimeout: number | null = null
  private isConnected = false
  private connectionChangeTimeout: number | null = null
  private windowCheckInterval: number | null = null
  public onConnectionChange?: (connected: boolean) => void

  constructor(onConnectionChange?: (connected: boolean) => void) {
    this.onConnectionChange = onConnectionChange
  }

  // 防抖的状态变化通知
  private notifyConnectionChange(connected: boolean) {
    if (this.connectionChangeTimeout) {
      clearTimeout(this.connectionChangeTimeout)
    }
    
    this.connectionChangeTimeout = window.setTimeout(() => {
      // 总是更新状态并通知回调，确保状态同步
      this.isConnected = connected
      this.onConnectionChange?.(connected)
    }, 100) // 100ms 防抖
  }

  // 启动心跳检测
  private startHeartbeat() {
    // 清理旧的心跳检测
    this.stopHeartbeat()
    
    // 监听 adminPong 响应
    this.messenger?.on('adminPong', () => {
      // 收到 adminPong 说明连接正常，重置超时
      if (this.adminPingTimeout) {
        clearTimeout(this.adminPingTimeout)
        this.adminPingTimeout = null
      }
      // 设置新的超时检测 - 但不立即断开，只是标记为可能断开
      this.adminPingTimeout = window.setTimeout(() => {
        // 检查窗口是否还存在
        if (this.messenger && this.messenger.isWindowOpen()) {
          // 窗口存在，保持连接状态，继续尝试心跳
          console.log('心跳超时但窗口存在，保持连接状态')
          this.adminPingTimeout = null
        } else {
          // 窗口不存在，才真正断开
          this.isConnected = false
          this.notifyConnectionChange(false)
          ElMessage.error('设计工具窗口已关闭，连接断开！')
          this.cleanup()
        }
      }, 5000) // 5秒超时
    })

    // 定时发送 adminPing
    this.adminPingInterval = window.setInterval(() => {
      this.messenger?.send('adminPing', null)
    }, 5000) // 每5秒发送一次

    // 监听窗口状态变化
    this.windowCheckInterval = window.setInterval(() => {
      if (this.messenger && !this.messenger.isWindowOpen()) {
        // 窗口已关闭，断开连接
        this.isConnected = false
        this.notifyConnectionChange(false)
        ElMessage.error('设计工具窗口已关闭，连接断开！')
        this.cleanup()
      }
    }, 2000) // 每2秒检查一次窗口状态

    // 首次立即发送
    setTimeout(() => {
      this.messenger?.send('adminPing', null)
    }, 1000)
  }

  // 停止心跳检测
  private stopHeartbeat() {
    if (this.adminPingInterval) {
      clearInterval(this.adminPingInterval)
      this.adminPingInterval = null
    }
    if (this.adminPingTimeout) {
      clearTimeout(this.adminPingTimeout)
      this.adminPingTimeout = null
    }
    if (this.windowCheckInterval) {
      clearInterval(this.windowCheckInterval)
      this.windowCheckInterval = null
    }
  }

  // 打开设计工具窗口
  openDesignTool(): Promise<boolean> {
    return new Promise((resolve) => {
      // 清理旧的连接，但不立即设置状态为false
      this.cleanupWithoutStateChange()
      
      const token = getAccessToken()
      const baseUrl = import.meta.env.PROD ? 'http://49.232.186.238:1522' : 'http://localhost:1522'
      const url = `${baseUrl}/#/design?token=${encodeURIComponent(token)}`
      
      this.messenger = new NativeWindowMessenger()
      this.messenger.openChild(url)

      // 监听 customEvent 作为连接成功的标志
      this.messenger.on('customEvent', (data) => {
        if (!this.isConnected) {
          this.isConnected = true
          this.notifyConnectionChange(true)
        }
        ElMessage.success(JSON.stringify(data))
      })

      // 监听模型保存成功消息
      this.messenger.on('modelSaved', (data) => {
        // data: { modelId, materialId }
        ElMessage.success(`模型保存成功：模型ID=${data.modelId}，素材ID=${data.materialId}`)
      })

      // 启动心跳检测
      this.startHeartbeat()

      // 发送测试消息
      setTimeout(() => {
        this.messenger?.send('test', null)
      }, 1000)
      
      // 设置连接超时
      setTimeout(() => {
        if (!this.isConnected) {
          resolve(false)
        }
      }, 10000) // 10秒后如果还没连接成功，认为失败
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

  // 清理资源，但不立即设置连接状态为false
  private cleanupWithoutStateChange() {
    if (this.messenger) {
      this.messenger.destroy && this.messenger.destroy()
      this.messenger = null
    }
    this.stopHeartbeat() // 清理心跳检测
    if (this.connectionChangeTimeout) {
      clearTimeout(this.connectionChangeTimeout)
      this.connectionChangeTimeout = null
    }
  }

  // 清理资源
  cleanup() {
    this.cleanupWithoutStateChange()
    this.notifyConnectionChange(false)
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