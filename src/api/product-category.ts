
import request from '@/config/axios';

export const productCategoryApi = {
  // 获取列表
  getList(data: any) {
    return request.post({
      url: '/product-category/page',
      data,
    });
  },

  // 获取所有（不分页）
  getAll() {
    return request.get({
      url: '/product-category',
    });
  },

  // 获取详情
  getDetail(id: string) {
    return request.get({
      url: `/product-category/${id}`,
    });
  },

  // 新增
  add(data: any) {
    return request.post({
      url: '/product-category/create',
      data,
    });
  },

  // 修改
  update(data: any) {
    return request.post({
      url: '/product-category/update',
      data,
    });
  },

  // 删除
  delete(id: string) {
    return request.post({
      url: '/product-category/delete',
      data: { id },
    });
  },
};
