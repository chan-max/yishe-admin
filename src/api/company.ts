import request from '@/config/axios'

// ==================== 管理员接口 ====================

// 获取公司列表
export function getCompanyList(params: any) {
  return request.post({
    url: '/company/page',
    data: params
  })
}

// 获取单个公司信息
export function getCompanyById(id: string) {
  return request.get({
    url: '/company',
    params: { id }
  })
}

// 创建公司
export function createCompany(data: any) {
  return request.post({
    url: '/company/create',
    data
  })
}

// 更新公司信息
export function updateCompany(data: any) {
  return request.post({
    url: '/company/update',
    data
  })
}

// 删除公司
export function deleteCompany(id: string) {
  return request.post({
    url: '/company/delete',
    data: { id }
  })
}

// ==================== 用户自服务接口 ====================

// 用户自助创建公司
export function selfCreateCompany(data: { name: string; description?: string }) {
  return request.post({
    url: '/company/self-create',
    data
  })
}

// 通过邀请码加入公司
export function joinCompanyByCode(data: { inviteCode: string }) {
  return request.post({
    url: '/company/join-by-code',
    data
  })
}

// 获取我的公司信息（含成员列表）
export function getMyCompany() {
  return request.get({
    url: '/company/my-company'
  })
}

// 重新生成邀请码
export function regenerateInviteCode() {
  return request.post({
    url: '/company/regenerate-invite-code',
    data: {}
  })
}

// 移除成员
export function removeMember(memberId: number) {
  return request.post({
    url: '/company/remove-member',
    data: { memberId }
  })
}

// 退出公司
export function leaveCompany() {
  return request.post({
    url: '/company/leave',
    data: {}
  })
}

// 解散公司
export function dissolveCompany() {
  return request.post({
    url: '/company/dissolve',
    data: {}
  })
} 