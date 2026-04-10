import request from '@/config/axios'

// 客户端授权：将 token 传递给 electron 客户端
export function saveTokenToClient(token: string): Promise<boolean> {
  // 通过 HTTP POST 发送 token 到本地客户端
  return fetch('http://localhost:1519/api/saveToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) return true
      return Promise.reject(new Error(data.message || '授权失败'))
    })
}

export function isClientAuthorized(): Promise<boolean> {
  if (typeof window !== 'undefined' && (window as any).api && typeof (window as any).api.isTokenExist === 'function') {
    return (window as any).api.isTokenExist()
  } else {
    return Promise.resolve(false)
  }
}

// 获取用户列表
export function getUserList(params: any) {
  return request.post({
    url: '/user/page',
    data: params
  })
}

// 获取用户信息
export function getUserInfo(id: string) {
  return request.post({
    url: '/user/getUserInfo',
    data: { id }
  })
}

// 创建用户
export function createUser(data: any) {
  return request.post({
    url: '/user/register',
    data
  })
}

// 更新用户信息
export function updateUser(data: any) {
  return request.post({
    url: '/user/update',
    data
  })
}

// 删除用户
export function deleteUser(id: string) {
  return request.post({
    url: '/user/delete',
    data: { id }
  })
}

// 修改用户密码
export function updateUserPassword(data: any) {
  return request.post({
    url: '/user/updatePass',
    data
  })
}

export function getUserSetting(data?: { key?: string }) {
  return request.post({
    url: '/user/getSetting',
    data: data || {}
  })
}

export function updateUserSetting(data: { key?: string; data?: any; setting?: Record<string, any> }) {
  return request.post({
    url: '/user/updateSetting',
    data
  })
}

export function getUserAccessSetting(data: { userId: string }) {
  return request.post({
    url: '/user/getAccessSetting',
    data
  })
}

export function updateUserAccessSetting(data: { userId: string; accessControl: Record<string, any> }) {
  return request.post({
    url: '/user/updateAccessSetting',
    data
  })
}

export function getOpenApiSetting() {
  return request.post({
    url: '/user/getOpenApiSetting',
    data: {}
  })
}

export interface UserAiSetting {
  version?: number
  featureKeys: Record<string, number>
  updatedAt?: string
}

export interface UserMessagePushSummary {
  id: number
  name: string
  platform: string
  enabled: boolean
  remark: string
}

export interface UserMessagePushSetting {
  defaultMessagePushId: number | null
  defaultMessagePush: UserMessagePushSummary | null
}

export function getAiSetting() {
  return request.post<UserAiSetting>({
    url: '/user/getAiSetting',
    data: {}
  })
}

export function updateAiSetting(aiSetting: UserAiSetting) {
  return request.post<UserAiSetting>({
    url: '/user/updateAiSetting',
    data: { aiSetting }
  })
}

export function getMessagePushSetting() {
  return request.post<UserMessagePushSetting>({
    url: '/user/getMessagePushSetting',
    data: {}
  })
}

export function updateMessagePushSetting(defaultMessagePushId: number | null) {
  return request.post<UserMessagePushSetting>({
    url: '/user/updateMessagePushSetting',
    data: { defaultMessagePushId }
  })
}

export function updateOpenApiSetting(data: { enabled: boolean }) {
  return request.post({
    url: '/user/updateOpenApiSetting',
    data
  })
}

export function generateOpenApiKey() {
  return request.post({
    url: '/user/generateOpenApiKey',
    data: {}
  })
}
