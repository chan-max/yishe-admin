import request from '@/config/axios'

/** 沙箱健康状态 */
export function getSandboxHealth() {
  return request.get({
    url: '/code-script/sandbox/health',
  })
}

/** 创建临时脚本并执行（用于沙箱控制台） */
export function consoleExecute(data: { code: string; params?: Record<string, any>; timeoutMs?: number }) {
  // 先创建脚本，再执行
  return request.post({
    url: '/code-script/create',
    data: {
      name: `__sandbox_console_${Date.now()}`,
      code: data.code,
      paramsTemplate: JSON.stringify(data.params || {}),
      timeoutMs: data.timeoutMs || 30000,
      isEnabled: true,
    },
  }).then((res: any) => {
    const scriptId = res?.data?.id || res?.id
    if (!scriptId) throw new Error('创建脚本失败')
    return request.post({
      url: '/code-script/run',
      data: { scriptId, params: data.params, timeoutMs: data.timeoutMs },
    })
  })
}

/** 获取沙箱运行记录列表 */
export function getSandboxRunList(data: { currentPage?: number; pageSize?: number }) {
  return request.post({
    url: '/code-script/run/page',
    data,
  })
}

/** 获取单条运行记录详情 */
export function getSandboxRun(id: number | string) {
  return request.get({
    url: `/code-script/run/get?id=${id}`,
  })
}

/** 取消沙箱运行 */
export function cancelSandboxRun(data: { id: number }) {
  return request.post({
    url: '/code-script/run/cancel',
    data,
  })
}

/** 删除运行记录 */
export function deleteSandboxRun(data: { ids: number[] }) {
  return request.delete({
    url: '/code-script/run/delete',
    data,
  })
}
