import request from '@/config/axios'

/**
 * OAuth 2.0 API
 *
 * 流程：
 * 1. 客户端跳转 /oauth/authorize?client_id=xxx&redirect_uri=xxx
 * 2. 前端调用 getAuthorizeInfo 获取客户端信息
 * 3. 用户确认后调用 confirmAuthorize 获取授权码
 * 4. 客户端用授权码调用 exchangeToken 换取 token
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

/** 确认授权，获取授权码 */
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

/** 授权码换 token（客户端调用） */
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
