import { useUserStore } from '@/store/modules/user'
import * as WebsocketApi from '@/api/system/websocket'
import type { WebsocketConnectionVO } from '@/api/system/websocket'
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
      // 获取所有连接
      const allConnections = await WebsocketApi.getWebsocketConnections()
      
      // 获取当前用户信息
      const userStore = useUserStore()
      const currentUser = userStore.getUser
      
      if (!currentUser || !currentUser.id) {
        ElMessage.warning('请先登录')
        return []
      }
      
      // 过滤出当前用户的客户端连接
      // 通过 clientInfo.user.id 匹配（服务端会将 tokenUser 写入 clientInfo.user）
      const myClients = allConnections.filter((conn) => {
        // 只显示客户端连接，不显示管理后台连接
        const clientSource = conn.clientSource || conn.query?.clientSource
        if (clientSource !== '客户端') {
          return false
        }
        
        // 检查连接中的用户信息是否匹配当前用户
        const connUserId = 
          conn.userId || 
          conn.clientInfo?.user?.id ||
          (conn as any).tokenUser?.id
        
        if (!connUserId) {
          return false
        }
        
        // 转换为字符串比较，避免类型不一致
        return String(connUserId) === String(currentUser.id)
      })
      
      return myClients
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

