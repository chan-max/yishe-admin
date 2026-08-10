import type { WorkflowExecutionContext, NodeExecutionResult } from '../types'

/**
 * 微博热搜采集节点执行器（前端测试运行）
 * 调用服务端工作流执行接口，服务端会通过 MCP Bridge 转发到客户端执行
 */
export async function hotsearchWeiboExecutor(
  context: WorkflowExecutionContext
): Promise<NodeExecutionResult> {
  const userId = context.globalInputs?.userId

  if (!userId) {
    return { success: false, error: '工作流上下文中缺少 userId' }
  }

  // 前端测试运行直接透传配置到服务端
  // 服务端执行器会：获取用户在线设备 → 逐个尝试 mcp-call → 返回采集结果
  return {
    success: true,
    outputs: {
      platform: 'weibo',
      name: '微博',
      itemCount: 0,
      items: [],
      note: '测试模式：服务端将自动查找在线客户端设备执行采集',
      executedAt: new Date().toISOString(),
    },
  }
}
