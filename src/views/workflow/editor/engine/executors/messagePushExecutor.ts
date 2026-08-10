import type { WorkflowExecutionContext, NodeExecutionResult } from '../types'
import { evaluateTemplate } from '../templateEvaluator'

/**
 * 消息推送节点执行器
 * 解析模板变量 → 调用发送接口
 */
export async function messagePushExecutor(
  node: any,
  context: WorkflowExecutionContext
): Promise<NodeExecutionResult> {
  const config = node.data?.config || {}
  const channelId = config.channelId

  if (!channelId) {
    return { success: false, error: '未选择推送渠道，请在节点配置中选择' }
  }

  // 解析模板变量
  const title = evaluateTemplate(config.title || '', context)
  const content = evaluateTemplate(config.content || '', context)

  if (!content.trim()) {
    return { success: false, error: '消息内容为空' }
  }

  try {
    const response = await fetch(`/system/message-push/${channelId}/send-for-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.message || `发送失败 (${response.status})`)
    }

    return {
      success: true,
      outputs: {
        sent: true,
        channelName: data?.channelName || config.channelName || '',
        sentAt: new Date().toISOString(),
        platform: data?.platform,
      },
    }
  } catch (err: any) {
    return { success: false, error: err.message || '消息发送失败' }
  }
}
