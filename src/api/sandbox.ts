import request from '@/config/axios'

/** 沙箱健康状态 */
export function getSandboxHealth() {
  return request.get({
    url: '/sandbox/health',
  })
}

/** 直接执行代码（不经过脚本管理） */
export function consoleExecute(data: { code: string; params?: Record<string, any>; timeoutMs?: number }) {
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

/** 分页查询沙箱运行记录（用户隔离） */
export function getSandboxRunList(data: { currentPage?: number; pageSize?: number; scriptId?: number }) {
  return request.post({
    url: '/sandbox/run/page',
    data,
  })
}

/** 查询单条运行记录详情 */
export function getSandboxRun(id: number | string) {
  return request.get({
    url: `/sandbox/run/get?id=${id}`,
  })
}

/** 取消沙箱运行 */
export function cancelSandboxRun(data: { id: number }) {
  return request.post({
    url: '/sandbox/run/cancel',
    data,
  })
}

/** 删除运行记录 */
export function deleteSandboxRun(data: { ids: number[] }) {
  return request.delete({
    url: '/sandbox/run/delete',
    data,
  })
}
