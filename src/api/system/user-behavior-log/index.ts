import request from '@/config/axios';

export type UserBehaviorLogVO = {
  id: string;
  userId?: number | null;
  publicUserId?: string | null;
  publicUserName?: string | null;
  action: string;
  targetId?: string | null;
  targetName?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  metadata?: Record<string, any> | null;
  createTime: string;
};

export type UserBehaviorLogPageParam = {
  currentPage?: number;
  pageSize?: number;
  action?: string;
  publicUserId?: string;
  searchText?: string;
  startTime?: string;
  endTime?: string;
};

// 查询独立站开放用户行为日志分页列表 (POST)
export const getUserBehaviorLogPage = (params: UserBehaviorLogPageParam) => {
  return request.post<{ list: UserBehaviorLogVO[]; total: number; currentPage: number; pageSize: number }>({
    url: '/user-behavior-log/page',
    data: params,
  });
};

// 查询独立站开放用户行为日志统计 (GET)
export const getUserBehaviorLogStats = () => {
  return request.get<{ totalLogs: number; actionStats: any[] }>({
    url: '/user-behavior-log/stats',
  });
};

// 删除独立站开放用户行为日志 (DELETE)
export const deleteUserBehaviorLog = (id: string | number) => {
  return request.delete<boolean>({
    url: `/user-behavior-log/${id}`,
  });
};

// 批量删除独立站开放用户行为日志 (POST)
export const deleteUserBehaviorLogBatch = (ids: (string | number)[]) => {
  return request.post<{ success: boolean; count: number }>({
    url: '/user-behavior-log/delete-batch',
    data: { ids },
  });
};
