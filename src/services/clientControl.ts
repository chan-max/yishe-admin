import * as WebsocketApi from '@/api/system/websocket'
import type { WebsocketConnectionVO } from '@/api/system/websocket'
import { getUserSetting, updateUserSetting } from '@/api/user'
import { ElMessage } from 'element-plus'

/**
 * 客户端控制服务
 * 用于用户操控自己账号登录的客户端
 */
export class ClientControlService {
  /**
   * 获取当前用户自己的客户端连接列表
   * @returns 当前用户的客户端连接列表
   */
  static async getMyClients(): Promise<WebsocketConnectionVO[]> {
    try {
      const response = await WebsocketApi.getMyWebsocketConnectionViews()
      // 处理响应数据：可能是数组，也可能是包装后的对象 { data: [...], code: 0, ... }
      if (Array.isArray(response)) {
        return response
      } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
        return response.data
      } else {
        console.warn('[ClientControlService] 意外的响应格式:', response)
        return []
      }
    } catch (error: any) {
      console.error('[ClientControlService] 获取客户端列表失败:', error)
      ElMessage.error(error?.message || '获取客户端列表失败')
      return []
    }
  }
  
  /**
   * 发送消息到指定的客户端
   * @param connectionId 连接 ID (clientId)
   * @param data 消息数据
   * @param event 事件名称，默认为 'admin-message'
   * @param silent 是否静默发送（不显示成功消息）
   * @returns 是否发送成功
   */
  static async sendMessage(
    connectionId: string,
    data: any,
    event: string = 'admin-message',
    silent: boolean = false
  ): Promise<boolean> {
    try {
      // 先验证该连接是否属于当前用户
      const myClients = await this.getMyClients()
      const targetClient = myClients.find((client) => client.id === connectionId)
      
      if (!targetClient) {
        if (!silent) {
          ElMessage.error('无法操作该客户端：不属于当前用户或连接不存在')
        }
        return false
      }
      
      // 发送消息
      const response = await WebsocketApi.sendMessageToConnection(connectionId, data, event)
      
      if (response.success) {
        if (!silent) {
          ElMessage.success('消息发送成功')
        }
        return true
      } else {
        if (!silent) {
          ElMessage.error(response.message || '消息发送失败')
        }
        return false
      }
    } catch (error: any) {
      console.error('[ClientControlService] 发送消息失败:', error)
      if (!silent) {
        ElMessage.error(error?.message || '发送消息失败')
      }
      return false
    }
  }
  
  /**
   * 发送文本消息到指定的客户端
   * @param connectionId 连接 ID
   * @param text 文本内容
   * @returns 是否发送成功
   */
  static async sendTextMessage(connectionId: string, text: string): Promise<boolean> {
    return this.sendMessage(connectionId, { message: text, type: 'text' })
  }

  static async sendServiceCommand(
    clientId: string,
    service: string,
    action: string,
    payload?: any,
    mode: 'production' | 'debug' | 'maintenance' = 'production',
    silent: boolean = false
  ): Promise<boolean> {
    try {
      const myClients = await this.getMyClients()
      const targetClient = myClients.find((client) => client.id === clientId)

      if (!targetClient) {
        if (!silent) {
          ElMessage.error('无法操作该客户端：不属于当前用户或连接不存在')
        }
        return false
      }

      const response = await WebsocketApi.sendServiceCommand({
        clientId,
        service,
        action,
        mode,
        payload
      })

      if (response.success) {
        if (!silent) {
          ElMessage.success('服务命令已发送')
        }
        return true
      }

      if (!silent) {
        ElMessage.error(response.message || '服务命令发送失败')
      }
      return false
    } catch (error: any) {
      console.error('[ClientControlService] 发送服务命令失败:', error)
      if (!silent) {
        ElMessage.error(error?.message || '发送服务命令失败')
      }
      return false
    }
  }

  static async setPsAutomationEnabled(clientId: string, enabled: boolean, silent: boolean = false): Promise<boolean> {
    try {
      const myClients = await this.getMyClients()
      const targetClient = myClients.find((client) => client.id === clientId)

      if (!targetClient) {
        if (!silent) {
          ElMessage.error('无法操作该客户端：不属于当前用户或连接不存在')
        }
        return false
      }

      const response = enabled
        ? await WebsocketApi.enablePsAutomation(clientId)
        : await WebsocketApi.disablePsAutomation(clientId)

      if (response.success) {
        if (!silent) {
          ElMessage.success(enabled ? '已发送开启自动制作命令' : '已发送关闭自动制作命令')
        }
        return true
      }

      if (!silent) {
        ElMessage.error(response.message || '自动制作命令发送失败')
      }
      return false
    } catch (error: any) {
      console.error('[ClientControlService] 设置自动制作状态失败:', error)
      if (!silent) {
        ElMessage.error(error?.message || '设置自动制作状态失败')
      }
      return false
    }
  }

  static async setPsAutomationAutoDispatchEnabled(
    clientId: string,
    enabled: boolean,
    silent: boolean = false
  ): Promise<boolean> {
    try {
      const myClients = await this.getMyClients()
      const targetClient = myClients.find((client) => client.id === clientId)

      if (!targetClient) {
        if (!silent) {
          ElMessage.error('无法操作该客户端：不属于当前用户或节点不存在')
        }
        return false
      }

      const response = await WebsocketApi.togglePsAutomationAutoDispatch(clientId, enabled)
      if (response.success) {
        if (!silent) {
          ElMessage.success(enabled ? '已开启节点自动调度' : '已关闭节点自动调度')
        }
        return true
      }

      if (!silent) {
        ElMessage.error(response.message || '节点自动调度更新失败')
      }
      return false
    } catch (error: any) {
      console.error('[ClientControlService] 设置节点自动调度失败:', error)
      if (!silent) {
        ElMessage.error(error?.message || '设置节点自动调度失败')
      }
      return false
    }
  }

  static async getPsAutomationUserSetting(): Promise<{ autoSchedulingEnabled: boolean }> {
    try {
      const response: any = await getUserSetting({ key: 'psAutomation' })
      const data = response?.data || response || {}
      return {
        autoSchedulingEnabled: !!data?.autoSchedulingEnabled
      }
    } catch (error: any) {
      console.error('[ClientControlService] 获取用户调度设置失败:', error)
      return { autoSchedulingEnabled: false }
    }
  }

  static async setPsAutomationUserAutoScheduling(
    enabled: boolean,
    silent: boolean = false
  ): Promise<{ success: boolean; dispatched?: boolean; reason?: string; message?: string }> {
    try {
      await updateUserSetting({
        key: 'psAutomation',
        data: {
          autoSchedulingEnabled: enabled
        }
      })

      let triggerResult:
        | { success: boolean; dispatched: boolean; reason?: string; message?: string }
        | undefined

      if (enabled) {
        const response = await WebsocketApi.triggerPsdSetAutoDispatch()
        triggerResult = {
          success: !!response?.success,
          dispatched: !!response?.dispatched,
          reason: response?.reason,
          message: response?.message
        }
      }

      if (!silent) {
        if (!enabled) {
          ElMessage.success('已关闭服务端自动调度')
        } else if (triggerResult?.dispatched) {
          ElMessage.success(triggerResult.message || '已开启自动调度，并开始制作待处理套图')
        } else {
          ElMessage.success(triggerResult?.message || '已开启服务端自动调度')
        }
      }
      return {
        success: true,
        dispatched: triggerResult?.dispatched,
        reason: triggerResult?.reason,
        message: triggerResult?.message
      }
    } catch (error: any) {
      console.error('[ClientControlService] 设置用户调度开关失败:', error)
      if (!silent) {
        ElMessage.error(error?.message || '设置服务端自动调度失败')
      }
      return {
        success: false,
        dispatched: false,
        message: error?.message || '设置服务端自动调度失败'
      }
    }
  }
  
  /**
   * 检查连接是否属于当前用户
   * @param connectionId 连接 ID
   * @returns 是否属于当前用户
   */
  static async isMyClient(connectionId: string): Promise<boolean> {
    const myClients = await this.getMyClients()
    return myClients.some((client) => client.id === connectionId)
  }
  
  /**
   * 获取当前用户的客户端数量
   * @returns 客户端数量
   */
  static async getMyClientCount(): Promise<number> {
    const myClients = await this.getMyClients()
    return myClients.length
  }
}
