import request from "@/config/axios";

export interface ExtensionCollectVO {
  id: number;
  userId: number | null;
  collectType: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
  data: any;
  aiAnalysis: any | null;
  userTags: string[] | null;
  userNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  uploader?: {
    id: number;
    account: string;
    name: string;
  };
}

export interface ExtensionCollectPageParams {
  currentPage?: number;
  pageSize?: number;
  collectType?: string;
  search?: string;
}

export const ExtensionCollectApi = {
  // 分页查询采集记录
  getPage: async (data: ExtensionCollectPageParams) => {
    return await request.post<{ list: ExtensionCollectVO[]; total: number }>({
      url: "/extension-collect/page",
      data,
    });
  },

  // 获取采集记录详情
  getDetail: async (id: number) => {
    return await request.get<ExtensionCollectVO>({
      url: `/extension-collect/${id}`,
    });
  },

  // 创建采集记录
  create: async (data: any) => {
    return await request.post({ url: "/extension-collect", data });
  },

  // 更新采集记录
  update: async (id: number, data: any) => {
    return await request.patch({ url: `/extension-collect/${id}`, data });
  },

  // 删除采集记录
  delete: async (id: number) => {
    return await request.delete({ url: `/extension-collect/${id}` });
  },

  // 获取统计数据
  getStatistics: async () => {
    return await request.get({ url: "/extension-collect/statistics" });
  },
};
