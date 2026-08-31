import request from '@/config/axios'

/**
 * OAuth 2.0 API
 *
 * 简化流程（直接返回 token）：
 * 1. 客户端跳转 /oauth/authorize?client_id=xxx&redirect_uri=xxx
 * 2. 前端调用 getAuthorizeInfo 获取客户端信息
 * 3. 用户确认后调用 confirmAuthorizeWithToken 直接获取 token
 * 4. 前端将 token 通过 URL 带回客户端
 */

/** 获取授权页面信息 */
export const getAuthorizeInfo = (params: {
  client_id: string
  redirect_uri: string
  scope?: string
  state?: string
}) => {
  return request.get({
    url: '/oauth/authorize',
    params
  })
}

/** 确认授权，获取授权码（传统 OAuth 流程） */
export const confirmAuthorize = (data: {
  client_id: string
  redirect_uri: string
  scope?: string
  state?: string
}) => {
  return request.post({
    url: '/oauth/authorize/confirm',
    data
  })
}

/** 确认授权并直接返回 token（简化流程） */
export const confirmAuthorizeWithToken = (data: {
  client_id: string
  redirect_uri: string
  scope?: string
  state?: string
}) => {
  return request.post({
    url: '/oauth/authorize/direct-token',
    data
  })
}

/** 授权码换 token（传统 OAuth 流程） */
export const exchangeToken = (data: {
  code: string
  client_id: string
  client_secret: string
  redirect_uri: string
}) => {
  return request.post({
    url: '/oauth/token',
    data
  })
}
