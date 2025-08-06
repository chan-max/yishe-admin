import request from '@/config/axios'

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