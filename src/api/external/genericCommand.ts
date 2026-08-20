/**
 * 通用客户端 service-command 封装
 * 用于 news/data-tools/shopify 等本地服务能力
 */
import { sendServiceCommand } from '@/api/system/websocket'
import { websocketClient } from '@/services/websocketClient'

export interface GenericCommandResponse {
  success: boolean
  message: string
  data?: any
}

export function genericSendCommand(
  clientId: string,
  pluginKey: string,
  name: string,
  payload?: Record<string, any>,
): Promise<GenericCommandResponse> {
  return sendServiceCommand({
    target: { clientId, pluginKey },
    command: { name, payload: payload || {} },
    mode: 'production',
  }) as Promise<GenericCommandResponse>
}

export function genericWaitForResult(
  commandId: string,
  timeoutMs = 60000,
): Promise<GenericCommandResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      websocketClient.events.off('serviceCommandResult', handler)
      reject(new Error('等待命令结果超时'))
    }, timeoutMs)
    const handler = (event: any) => {
      if (event.commandId === commandId) {
        clearTimeout(timer)
        websocketClient.events.off('serviceCommandResult', handler)
        resolve({ success: event.success, message: event.message, data: event.data })
      }
    }
    websocketClient.events.on('serviceCommandResult', handler)
  })
}

export async function genericSearchAndWait(
  clientId: string,
  pluginKey: string,
  payload: Record<string, any>,
): Promise<any> {
  const res = await genericSendCommand(clientId, pluginKey, 'search', payload)
  const cmdId = res.data?.commandId || (res as any).commandId
  if (!res.success || !cmdId) {
    throw new Error(res.message || '命令发送失败')
  }
  const result = await genericWaitForResult(cmdId)
  if (!result.success) {
    throw new Error(result.message || '搜索失败')
  }
  return result.data || {}
}