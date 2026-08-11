import type { WorkflowExecutionContext, NodeExecutionResult } from '../types'

/**
 * 热搜采集节点执行器（前端测试运行通用版）
 * 支持所有 hotsearch_* 平台节点
 * 服务端通过 MCP Bridge 转发到客户端执行
 */
export async function hotsearchWeiboExecutor(
  node: any,
  context: WorkflowExecutionContext
): Promise<NodeExecutionResult> {
  const userId = context.globalInputs?.userId

  if (!userId) {
    return { success: false, error: '工作流上下文中缺少 userId' }
  }

  // 从节点类型提取平台 key
  const platformKey = node.type?.replace('hotsearch_', '') || 'weibo'
  const platformName = node.data?.config?.name || platformKey

  // 前端测试运行返回模拟数据
  return {
    success: true,
    outputs: {
      platform: platformKey,
      name: platformName,
      itemCount: 0,
      items: [],
      note: '测试模式：服务端将自动查找在线客户端设备执行采集',
      executedAt: new Date().toISOString(),
    },
  }
}
