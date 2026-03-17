import request from '@/config/axios'

export function getCodeScriptList(data) {
  return request.post({
    url: '/code-script/page',
    data,
  })
}

export function getCodeScript(id: number | string) {
  return request.get({
    url: `/code-script/get?id=${id}`,
  })
}

export function getCodeScriptSandboxHealth() {
  return request.get({
    url: '/code-script/sandbox/health',
  })
}

export function createCodeScript(data) {
  return request.post({
    url: '/code-script/create',
    data,
  })
}

export function updateCodeScript(data) {
  return request.put({
    url: '/code-script/update',
    data,
  })
}

export function deleteCodeScript(data) {
  return request.delete({
    url: '/code-script/delete',
    data,
  })
}

export function runCodeScript(data) {
  return request.post({
    url: '/code-script/run',
    data,
  })
}

export function getCodeScriptRunList(data) {
  return request.post({
    url: '/code-script/run/page',
    data,
  })
}

export function getCodeScriptRun(id: number | string) {
  return request.get({
    url: `/code-script/run/get?id=${id}`,
  })
}

export function deleteCodeScriptRun(data) {
  return request.delete({
    url: '/code-script/run/delete',
    data,
  })
}
