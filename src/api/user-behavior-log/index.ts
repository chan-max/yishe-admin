import request from '@/config/axios';

export interface UserBehaviorLogItem {
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
}

export interface UserBehaviorLogQueryParam {
  currentPage?: number;
  pageSize?: number;
  action?: string;
  publicUserId?: string;
  searchText?: string;
  startTime?: string;
  endTime?: string;
}

export interface UserBehaviorLogPageResult {
  list: UserBehaviorLogItem[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export const UserBehaviorLogApi = {
  // 分页查询独立站开放用户行为日志
  getPage: (data: UserBehaviorLogQueryParam): Promise<UserBehaviorLogPageResult> => {
    return request.post({ url: '/api/user-behavior-log/page', data });
  },

  // 获取独立站开放用户行为日志统计
  getStats: (): Promise<{ totalLogs: number; actionStats: any[] }> => {
    return request.get({ url: '/api/user-behavior-log/stats' });
  },
};
