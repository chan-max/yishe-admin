import request from "@/config/axios";

export interface ProfitExpression {
  id: number;
  platform: string;
  expression: string;
  tenantId?: number | null;
  createTime?: string;
  updateTime?: string;
  creator?: string;
  updater?: string;
  deleted?: boolean;
}

export interface ProfitExpressionPageResult {
  records: ProfitExpression[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

export interface ProfitExpressionSavePayload {
  platform: string;
  expression: string;
}

export const saveOrUpdateProfitExpression = (data: ProfitExpressionSavePayload) => {
  return request.post<boolean>({
    url: "/profit/saveOrUpdate",
    data,
  });
};

export const getProfitExpressionPage = (params?: {
  current?: number;
  size?: number;
  platform?: string;
}) => {
  return request.post<ProfitExpressionPageResult>({
    url: "/profit/page",
    params,
  });
};

export const deleteProfitExpression = (id: number) => {
  return request.delete<boolean>({
    url: `/profit/delete/${id}`,
  });
};
