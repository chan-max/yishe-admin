import request from '@/config/axios'

export interface RoleItem {
  id: number
  roleKey: string
  roleName: string
  remark?: string
  menuKeys?: string[]
  createTime?: string
  updateTime?: string
}

export interface RolePageResult {
  currentPage: number
  pageSize: number
  total: number
  totalPage: number
  list: RoleItem[]
}

// 分页查询角色
export function getRolePage(data: any) {
  return request.post<RolePageResult>({
    url: '/role/page',
    data
  })
}

// 查询全部角色（不含分页，用于分配）
export function getAllRoles() {
  return request.post<RoleItem[]>({
    url: '/role/list',
    data: {}
  })
}

// 新建角色
export function createRole(data: Partial<RoleItem>) {
  return request.post<RoleItem>({
    url: '/role/create',
    data
  })
}

// 更新角色（含菜单权限）
export function updateRole(data: Partial<RoleItem>) {
  return request.post<RoleItem>({
    url: '/role/update',
    data
  })
}

// 删除角色
export function deleteRole(id: number) {
  return request.post<{ success: boolean; roleKey: string }>({
    url: '/role/delete',
    data: { id }
  })
}