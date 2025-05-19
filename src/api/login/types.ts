/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-04-01 07:04:47
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-05-19 07:48:21
 * @FilePath: /yudao-ui-admin-vue3/src/api/login/types.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export type UserLoginVO = {
  username: string
  password: string
  socialType?: string
  socialCode?: string
  socialState?: string
}

export type TokenType = {
  token: string // 访问令牌
}

export type UserVO = {
  id: number
  username: string
  nickname: string
  deptId: number
  email: string
  mobile: string
  sex: number
  avatar: string
  loginIp: string
  loginDate: string
}

export type RegisterVO = {
  username: string
  password: string
}
