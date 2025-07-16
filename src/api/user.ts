/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-07-16 20:19:37
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-07-16 20:39:53
 * @FilePath: /design-server/Users/jackie/workspace/yishe-admin/src/api/user.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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