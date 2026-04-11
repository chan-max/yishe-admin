import request from "@/config/axios";

export interface EcomPlatformCollectTask {
  id: string;
  name: string;
  platform: string;
  taskType?: string | null;
  configData?: Record<string, any> | null;
  creator?: string;
  userId?: number | null;
  createTime?: string;
  updateTime?: string;
}

export interface EcomCollectTaskSnapshot {
  name?: string;
  platform?: string;
  taskType?: string | null;
  configData?: Record<string, any> | null;
}

export interface EcomPlatformCollectRun {
  id: string;
  taskId: string;
  taskName?: string;
  platform?: string;
  taskType?: string | null;
  status: string;
  taskSnapshot?: EcomCollectTaskSnapshot | null;
  assignedClientId?: string | null;
  assignedMachineCode?: string | null;
  commandId?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  summaryData?: Record<string, any> | null;
  errorMessage?: string | null;
  task?: EcomPlatformCollectTask | null;
  createTime?: string;
  updateTime?: string;
}

export interface EcomPlatformRawRecord {
  id: string;
  taskId: string;
  taskName?: string;
  runId: string;
  platform?: string;
  taskType?: string | null;
  taskSnapshot?: EcomCollectTaskSnapshot | null;
  runStatus?: string | null;
  finishedAt?: string | null;
  summaryData?: Record<string, any> | null;
  summaryMessage?: string | null;
  recordsCount?: number | null;
  snapshotCount?: number | null;
  capturedAt?: string | null;
  collectData?: Record<string, any> | null;
  snapshotData?: any;
  task?: EcomPlatformCollectTask | null;
  run?: EcomPlatformCollectRun | null;
  createTime?: string;
  updateTime?: string;
}

export interface EcomCollectFieldOption {
  label: string;
  value: string | number | boolean;
  description?: string;
}

export interface EcomCollectFieldSchema {
  key: string;
  label: string;
  component:
    | "input"
    | "textarea"
    | "input-number"
    | "url"
    | "select"
    | "switch"
    | "json"
    | "array-text";
  valueType?: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  examples?: any[];
  options?: EcomCollectFieldOption[];
}

export interface EcomCollectSceneSchema {
  value: string;
  label: string;
  description?: string;
  availability?: string;
  availabilityLabel?: string;
  runnable?: boolean;
  verification?: string;
  verificationLabel?: string;
  reason?: string | null;
  fields?: EcomCollectFieldSchema[];
  docs?: {
    overview?: string;
    notes?: string[];
    examples?: Array<{
      title?: string;
      description?: string;
      payload?: Record<string, any>;
    }>;
  };
}

export interface EcomCollectTaskTypeSchema {
  value: string;
  taskType?: string;
  label: string;
  description?: string;
  platform?: string;
  collectScene?: string;
  entityType?: string;
  availability?: string;
  availabilityLabel?: string;
  runnable?: boolean;
  verification?: string;
  verificationLabel?: string;
  reason?: string | null;
  fields?: EcomCollectFieldSchema[];
  docs?: {
    overview?: string;
    notes?: string[];
    examples?: Array<{
      title?: string;
      description?: string;
      payload?: Record<string, any>;
    }>;
  };
}

export interface EcomCollectPlatformSchema {
  value: string;
  label: string;
  regions?: string[];
  status?: string;
  statusLabel?: string;
  runnable?: boolean;
  reason?: string | null;
  supportedScenes?: string[];
  supportedTaskTypes?: string[];
  scenes?: EcomCollectSceneSchema[];
  taskTypes?: EcomCollectTaskTypeSchema[];
  docs?: {
    overview?: string;
    notes?: string[];
  };
  maintenance?: {
    moduleDir?: string;
    selectorFile?: string;
    readmeFile?: string;
    notes?: string[];
  };
  verification?: Record<string, string>;
  sourceClientId?: string | null;
  sourceMachineCode?: string | null;
  sourceUpdatedAt?: string | null;
}

export interface EcomPlatformCollectCatalog {
  schemaVersion?: number;
  generatedAt?: string | null;
  platforms: EcomCollectPlatformSchema[];
  meta?: {
    capabilityClientCount?: number;
    onlineCapabilityClientCount?: number;
    generatedAt?: string | null;
    source?: string;
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

export const batchDeleteEcomPlatformCollectTask = (ids: string[]) => {
  return request.post<{
    success: boolean;
    message?: string;
    taskCount?: number;
    runCount?: number;
    rawRecordCount?: number;
    snapshotCount?: number;
  }>({
    url: "/ecom-platform-collect/task/batch-delete",
    data: { ids },
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

export const deleteEcomPlatformCollectRun = (id: string) => {
  return request.delete<{
    success: boolean;
    id: string;
  }>({
    url: `/ecom-platform-collect/run/${id}`,
  });
};

export const batchDeleteEcomPlatformCollectRun = (ids: string[]) => {
  return request.post<{
    success: boolean;
    message?: string;
    runCount?: number;
    rawRecordCount?: number;
    snapshotCount?: number;
  }>({
    url: "/ecom-platform-collect/run/batch-delete",
    data: { ids },
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

export const deleteEcomPlatformRawRecord = (id: string) => {
  return request.delete<{
    success: boolean;
    id: string;
  }>({
    url: `/ecom-platform-collect/raw-record/${id}`,
  });
};

export const batchDeleteEcomPlatformRawRecord = (ids: string[]) => {
  return request.post<{
    success: boolean;
    message?: string;
    rawRecordCount?: number;
    snapshotCount?: number;
  }>({
    url: "/ecom-platform-collect/raw-record/batch-delete",
    data: { ids },
  });
};
