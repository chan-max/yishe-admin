import request from '@/config/axios'

// 获取开放用户列表
export function getPublicUserList(params: any) {
  return request.post({
    url: '/public-user/page',
    data: params
  })
}

// 获取开放用户信息
export function getPublicUserInfo(id: string) {
  return request.post({
    url: '/public-user/getUserInfo',
    data: { id }
  })
}

// 创建开放用户
export function createPublicUser(data: any) {
  return request.post({
    url: '/public-user/register',
    data
  })
}

// 更新开放用户信息
export function updatePublicUser(data: any) {
  return request.post({
    url: '/public-user/update',
    data
  })
}

// 删除开放用户
export function deletePublicUser(id: string) {
  return request.post({
    url: '/public-user/delete',
    data: { id }
  })
}

