import request from '@/config/axios';

export type ProductCommentVO = {
  id: string;
  ownerUserId?: number | null;
  ownerUser?: {
    id: number;
    account: string;
    name?: string;
  } | null;
  targetType: string;
  targetId: string;
  publicUserId?: number | null;
  publicUserAccount?: string | null;
  publicUserName?: string | null;
  publicUserAvatar?: string | null;
  publicUser?: {
    id: number;
    account: string;
    name?: string;
    avatar?: string;
  } | null;
  rootId?: string | null;
  parentId?: string | null;
  replyToUserId?: number | null;
  replyToUserName?: string | null;
  rating: number;
  content: string;
  images?: string[] | null;
  likeCount: number;
  status: string;
  replyContent?: string | null;
  replyTime?: string | null;
  createTime: string;
  updateTime: string;
};

export type ProductCommentPageParam = {
  currentPage?: number;
  pageSize?: number;
  status?: string;
  targetId?: string;
  searchText?: string;
};

// 后台管理员分页查询商品评论 (带权限隔离)
export const getProductCommentPage = (params: ProductCommentPageParam) => {
  return request.post<{ list: ProductCommentVO[]; total: number; currentPage: number; pageSize: number }>({
    url: '/product-comment/page',
    data: params,
  });
};

// 官方商家回复评论
export const replyProductComment = (id: string, replyContent: string) => {
  return request.post<ProductCommentVO>({
    url: '/product-comment/reply',
    data: { id, replyContent },
  });
};

// 批量修改评论状态 (approved | rejected | hidden)
export const batchUpdateCommentStatus = (ids: string[], status: string) => {
  return request.post<{ success: boolean; count: number }>({
    url: '/product-comment/batch-status',
    data: { ids, status },
  });
};

// 单条删除评论 (带权限隔离)
export const deleteProductComment = (id: string) => {
  return request.delete<boolean>({
    url: `/product-comment/${id}`,
  });
};

// 批量删除评论 (带权限隔离)
export const deleteProductCommentBatch = (ids: string[]) => {
  return request.post<{ success: boolean; count: number }>({
    url: '/product-comment/delete-batch',
    data: { ids },
  });
};
