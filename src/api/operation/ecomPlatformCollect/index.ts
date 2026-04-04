import request from "@/config/axios";

export interface EcomPlatformCollectTask {
  id: string;
  name: string;
  platform: string;
  collectScene: string;
  targetClientId?: string | null;
  targetMachineCode?: string | null;
  intervalMinutes: number;
  nextRunAt?: string | null;
  isActive: boolean;
  configData?: Record<string, any> | null;
  lastRunAt?: string | null;
  lastSuccessAt?: string | null;
  lastStatus?: string | null;
  creator?: string;
  userId?: number | null;
  createTime?: string;
  updateTime?: string;
}

export interface EcomPlatformCollectRun {
  id: string;
  taskId: string;
  taskName?: string;
  platform?: string;
  collectScene?: string;
  status: string;
  triggerMode: string;
  assignedClientId?: string | null;
  assignedMachineCode?: string | null;
  commandId?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  timeoutAt?: string | null;
  summaryData?: Record<string, any> | null;
  errorMessage?: string | null;
  createTime?: string;
  updateTime?: string;
}

export interface EcomPlatformRawRecord {
  id: string;
  taskId: string;
  taskName?: string;
  runId: string;
  platform?: string;
  collectScene?: string;
  recordKey?: string | null;
  sourceUrl?: string | null;
  capturedAt?: string | null;
  rawPayload?: Record<string, any> | null;
  snapshotData?: Record<string, any> | null;
  createTime?: string;
  updateTime?: string;
}

export interface EcomPlatformCollectCatalog {
  platforms: Array<{
    value: string;
    label: string;
    regions?: string[];
    supportedScenes?: string[];
  }>;
  scenes: Array<{
    value: string;
    label: string;
    description?: string;
    requirements?: {
      keyword?: boolean;
      targetUrl?: boolean;
      pagination?: boolean;
    };
  }>;
  defaults: {
    intervalMinutes: number;
    minIntervalMinutes: number;
  };
}

export const getEcomPlatformCollectCatalog = () => {
  return request.get<EcomPlatformCollectCatalog>({
    url: "/ecom-platform-collect/catalog",
  });
};

export const getEcomPlatformCollectTaskList = (params?: Record<string, any>) => {
  return request.get<{
    list: EcomPlatformCollectTask[];
    total: number;
    pageNo: number;
    pageSize: number;
  }>({
    url: "/ecom-platform-collect/task/list",
    params,
  });
};

export const getEcomPlatformCollectTaskDetail = (id: string) => {
  return request.get<EcomPlatformCollectTask>({
    url: `/ecom-platform-collect/task/${id}`,
  });
};

export const createEcomPlatformCollectTask = (data: Record<string, any>) => {
  return request.post<EcomPlatformCollectTask>({
    url: "/ecom-platform-collect/task",
    data,
  });
};

export const updateEcomPlatformCollectTask = (
  id: string,
  data: Record<string, any>,
) => {
  return request.patch<EcomPlatformCollectTask>({
    url: `/ecom-platform-collect/task/${id}`,
    data,
  });
};

export const deleteEcomPlatformCollectTask = (id: string) => {
  return request.delete<{
    success: boolean;
    id: string;
  }>({
    url: `/ecom-platform-collect/task/${id}`,
  });
};

export const triggerEcomPlatformCollectTask = (id: string) => {
  return request.post<{
    success: boolean;
    message?: string;
    data?: {
      taskId: string;
      runId: string;
    };
  }>({
    url: `/ecom-platform-collect/task/${id}/trigger`,
  });
};

export const getEcomPlatformCollectRunList = (params?: Record<string, any>) => {
  return request.get<{
    list: EcomPlatformCollectRun[];
    total: number;
    pageNo: number;
    pageSize: number;
  }>({
    url: "/ecom-platform-collect/run/list",
    params,
  });
};

export const getEcomPlatformCollectRunDetail = (id: string) => {
  return request.get<EcomPlatformCollectRun>({
    url: `/ecom-platform-collect/run/${id}`,
  });
};

export const getEcomPlatformRawRecordList = (params?: Record<string, any>) => {
  return request.get<{
    list: EcomPlatformRawRecord[];
    total: number;
    pageNo: number;
    pageSize: number;
  }>({
    url: "/ecom-platform-collect/raw-record/list",
    params,
  });
};

export const getEcomPlatformRawRecordDetail = (id: string) => {
  return request.get<EcomPlatformRawRecord>({
    url: `/ecom-platform-collect/raw-record/${id}`,
  });
};
