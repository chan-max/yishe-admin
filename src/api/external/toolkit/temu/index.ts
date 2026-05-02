import request from "@/config/axios";

export type TemuRegionKey = "global" | "us" | "eu" | "seller";

export interface TemuCatalogAction {
  key: string;
  label: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
  regionHints: TemuRegionKey[];
  status: "available" | "planned";
}

export interface TemuCatalogGroup {
  key: string;
  label: string;
  description: string;
  actions: TemuCatalogAction[];
}

export interface TemuCatalogPayload {
  platform: string;
  groups: TemuCatalogGroup[];
}

export interface TemuActionResponse<TResult = Record<string, any>> {
  success: boolean;
  action?: string;
  message?: string;
  profileId?: string;
  region?: TemuRegionKey;
  request?: {
    url?: string;
    status?: number;
  };
  result?: TResult;
  raw?: Record<string, any> | null;
}

export type TemuTaskRunStatus = "queued" | "running" | "completed" | "failed";
export type TemuTaskRunLogLevel = "info" | "success" | "warning" | "error";

export interface TemuTaskRunOperator {
  id: number;
  account?: string;
  name?: string;
}

export interface TemuTaskRunLogEntry {
  time: string;
  level: TemuTaskRunLogLevel | string;
  message: string;
  detail?: any;
}

export interface TemuTaskRunSummary {
  id: number;
  actionKey: string;
  actionLabel: string;
  status: TemuTaskRunStatus | string;
  profileId?: string | null;
  region?: TemuRegionKey | null;
  errorText?: string | null;
  durationMs?: number | null;
  startedAt?: string | Date | null;
  finishedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  uploader?: TemuTaskRunOperator | null;
}

export interface TemuTaskRunDetail extends TemuTaskRunSummary {
  message?: string;
  params?: Record<string, any> | null;
  result?: TemuActionResponse | Record<string, any> | null;
  logs?: TemuTaskRunLogEntry[];
}

export interface TemuTaskRunPagePayload {
  list: TemuTaskRunSummary[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export const getTemuCatalog = () => {
  return request.get<TemuCatalogPayload>({
    url: "/temu/catalog",
  });
};

export const executeTemuAction = <TResult = Record<string, any>>(
  endpoint: string,
  data: Record<string, any>,
) => {
  return request.post<TemuActionResponse<TResult>>({
    url: endpoint,
    data,
  });
};

export const createTemuTaskRun = (data: {
  actionKey: string;
  payload?: Record<string, any>;
}) => {
  return request.post<TemuTaskRunDetail>({
    url: "/temu/task-run/create",
    data,
  });
};

export const getTemuTaskRunPage = (data: {
  currentPage?: number;
  pageSize?: number;
  actionKey?: string;
  status?: string;
  profileId?: string;
  region?: TemuRegionKey;
}) => {
  return request.post<TemuTaskRunPagePayload>({
    url: "/temu/task-run/page",
    data,
  });
};

export const getTemuTaskRun = (id: number | string) => {
  return request.get<TemuTaskRunDetail | null>({
    url: "/temu/task-run/get",
    params: { id },
  });
};

export const retryTemuTaskRun = (id: number | string) => {
  return request.post<TemuTaskRunDetail>({
    url: "/temu/task-run/retry",
    data: { id },
  });
};

export const deleteTemuTaskRun = (id: number | string) => {
  return request.delete<{ id: number }>({
    url: `/temu/task-run/${encodeURIComponent(String(id))}`,
    params: { id },
  });
};

export const batchDeleteTemuTaskRuns = (ids: Array<number | string>) => {
  return request.post<{ ids: number[]; deletedCount: number }>({
    url: "/temu/task-run/batch-delete",
    data: {
      ids: (Array.isArray(ids) ? ids : [])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    },
  });
};

export const markTemuTaskRunPriceReviewRow = (data: {
  id: number | string;
  rowKey: string;
  action: "confirm" | "abandon" | "reprice";
  status: "success" | "failed";
  completedLabel?: string;
  message?: string;
  markInvalid?: boolean;
  price?: number;
}) => {
  return request.post<TemuTaskRunDetail>({
    url: "/temu/task-run/price-review-mark",
    data,
  });
};

export const markTemuTaskRunJitRow = (data: {
  id: number | string;
  rowKey: string;
  action: "open" | "stock";
  status: "success" | "failed";
  message?: string;
  markOpened?: boolean;
  stockMaintained?: boolean;
  finalNum?: number;
}) => {
  return request.post<TemuTaskRunDetail>({
    url: "/temu/task-run/jit-mark",
    data,
  });
};
