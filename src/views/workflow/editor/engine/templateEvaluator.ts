import type { WorkflowExecutionContext } from './types'

/**
 * 客户端模板变量求值器
 * 支持解析字符串中带有 {{ node_id.variable }} 或 {{ input.param }} 的表达式
 */
export function evaluateTemplate(
  templateStr: string,
  context: WorkflowExecutionContext
): string {
  if (typeof templateStr !== 'string') return templateStr

  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, expression) => {
    const value = resolveExpression(expression, context)
    if (value === undefined || value === null) {
      return ''
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  })
}

/**
 * 递归从 Context 中提取表达式的值
 */
export function resolveExpression(
  expression: string,
  context: WorkflowExecutionContext
): any {
  const parts = expression.trim().split('.')
  if (parts.length === 0) return undefined

  const rootKey = parts[0]

  // 1. 全局输入参数例如 {{ input.keyword }}
  if (rootKey === 'input') {
    let current = context.globalInputs
    for (let i = 1; i < parts.length; i++) {
      if (current && typeof current === 'object') {
        current = current[parts[i]]
      } else {
        return undefined
      }
    }
    return current
  }

  // 2. 上游节点输出例如 {{ llm_1.text }}
  const targetOutputs = context.nodeOutputs.get(rootKey)
  if (!targetOutputs) return undefined

  let current: any = targetOutputs
  for (let i = 1; i < parts.length; i++) {
    if (current && typeof current === 'object') {
      current = current[parts[i]]
    } else {
      return undefined
    }
  }
  return current
}
