import request from "@/config/axios";

export interface EcomPlatformCollectTask {
  id: string;
  name: string;
  platform: string;
  taskType?: string | null;
  configData?: Record<string, any> | null;
  executionContext?: Record<string, any> | null;
  creator?: string;
  userId?: number | null;
  createTime?: string;
  updateTime?: string;
}

export type EcomCollectRunRecord = Record<string, any>;
export type EcomCollectRunSnapshot = Record<string, any>;
export type EcomCollectRunDebugMeta = Record<string, any>;

export interface EcomCollectRunResultSummary extends Record<string, any> {
  message?: string;
  recordsCount?: number;
  snapshotCount?: number;
  updatedAt?: string;
}

export interface EcomCollectRunSummaryData extends Record<string, any> {
  message?: string;
  recordsCount?: number;
  snapshotCount?: number;
  updatedAt?: string;
}

export interface EcomCollectRunResultPackage<
  RecordItem extends EcomCollectRunRecord = EcomCollectRunRecord,
  SnapshotItem extends EcomCollectRunSnapshot = EcomCollectRunSnapshot,
> extends Record<string, any> {
  packageType?: string;
  taskType?: string;
  summary?: EcomCollectRunResultSummary | null;
  records?: RecordItem[];
  snapshots?: SnapshotItem[];
  debugMeta?: EcomCollectRunDebugMeta | null;
}

export interface EcomPlatformCollectRun {
  id: string;
  taskId: string;
  taskName?: string;
  platform?: string;
  taskType?: string | null;
  status: string;
  assignedClientId?: string | null;
  assignedMachineCode?: string | null;
  commandId?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  summaryData?: EcomCollectRunSummaryData | null;
  errorMessage?: string | null;
  createTime?: string;
  updateTime?: string;
}

export interface EcomPlatformRawRecord {
  id: string;
  taskId: string;
  runId: string;
  capturedAt?: string | null;
  collectData?: EcomCollectRunResultPackage | null;
  snapshotData?: any[] | null;
  userId?: number | null;
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

export interface EcomCollectOutputFieldSchema {
  key: string;
  label: string;
  description?: string;
  valueType?: string;
  stability?: string;
  examples?: any[];
}

export interface EcomCollectAccessSchema {
  login?: string;
  loginLabel?: string;
  requiresLogin?: boolean;
  canRunWithoutLogin?: boolean;
  captcha?: string;
  captchaLabel?: string;
  antiBot?: string;
  antiBotLabel?: string;
  notes?: string[];
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
  access?: EcomCollectAccessSchema;
  fields?: EcomCollectFieldSchema[];
  docs?: {
    overview?: string;
    notes?: string[];
    packageFields?: EcomCollectOutputFieldSchema[];
    recordFields?: EcomCollectOutputFieldSchema[];
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
  access?: EcomCollectAccessSchema;
  fields?: EcomCollectFieldSchema[];
  docs?: {
    overview?: string;
    notes?: string[];
    packageFields?: EcomCollectOutputFieldSchema[];
    recordFields?: EcomCollectOutputFieldSchema[];
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
  access?: EcomCollectAccessSchema;
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

export interface EcomCollectFeatureSchema {
  value: string;
  featureKey: string;
  taskType: string;
  label: string;
  description?: string;
  platform: string;
  platformLabel: string;
  collectScene?: string;
  entityType?: string;
  runnable: boolean;
  availability?: string;
  availabilityLabel?: string;
  verification?: string;
  verificationLabel?: string;
  reason?: string | null;
  access?: EcomCollectAccessSchema;
  fields?: EcomCollectFieldSchema[];
  docs?: EcomCollectTaskTypeSchema["docs"];
  sourceClientId?: string | null;
  sourceMachineCode?: string | null;
  sourceUpdatedAt?: string | null;
}

export interface EcomPlatformCollectFeatureCatalog {
  schemaVersion?: number;
  generatedAt?: string | null;
  list: EcomCollectFeatureSchema[];
  total: number;
  meta?: {
    capabilityClientCount?: number;
    onlineCapabilityClientCount?: number;
    generatedAt?: string | null;
    source?: string;
    platformCount?: number;
    runnableFeatureCount?: number;
  };
}

export interface EcomPlatformCollectDiagnosticsRequest {
  platforms?: string[];
  taskTypes?: string[];
  keyword?: string;
  debugPort?: number;
  maxItems?: number;
  maxPages?: number;
  perRunTimeoutMs?: number;
  clientId?: string;
  profileId?: string;
  captureSnapshots?: boolean;
}

export interface EcomPlatformCollectDiagnosticItem {
  platform: string;
  platformLabel: string;
  taskType?: string | null;
  taskLabel?: string | null;
  status: "success" | "failed" | "skipped" | "unsupported" | "timeout";
  canCollect: boolean;
  recordsCount: number;
  message: string;
  reason?: string | null;
  taskId?: string | null;
  runId?: string | null;
  assignedClientId?: string | null;
  assignedMachineCode?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  elapsedMs?: number | null;
  sampleFields?: string[];
  sampleTitle?: string | null;
  sampleUrl?: string | null;
  configData?: Record<string, any>;
}

export interface EcomPlatformCollectDiagnosticsResult {
  success: boolean;
  generatedAt?: string;
  options?: Record<string, any>;
  summary: {
    total: number;
    canCollectCount: number;
    failedCount: number;
    skippedCount: number;
    unsupportedCount: number;
    timeoutCount: number;
    canCollectPlatforms: string[];
    failedPlatforms: string[];
    skippedPlatforms: string[];
    unsupportedPlatforms: string[];
    timeoutPlatforms: string[];
    canCollectTaskTypes?: string[];
    failedTaskTypes?: string[];
    skippedTaskTypes?: string[];
    unsupportedTaskTypes?: string[];
    timeoutTaskTypes?: string[];
    recommendations?: string[];
  };
  analysis?: {
    headline?: string;
    recommendations?: string[];
  };
  items: EcomPlatformCollectDiagnosticItem[];
}

export const getEcomPlatformCollectCatalog = () => {
  return request.get<EcomPlatformCollectCatalog>({
    url: "/ecom-platform-collect/catalog",
  });
};

export const getEcomPlatformCollectFeatures = () => {
  return request.get<EcomPlatformCollectFeatureCatalog>({
    url: "/ecom-platform-collect/features",
  });
};

export const runEcomPlatformCollectDiagnostics = (
  data: EcomPlatformCollectDiagnosticsRequest,
) => {
  return request.post<EcomPlatformCollectDiagnosticsResult>({
    url: "/ecom-platform-collect/diagnostics/run",
    data,
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

export const triggerEcomPlatformCollectTask = (
  id: string,
  data?: Record<string, any>,
) => {
  return request.post<{
    success: boolean;
    message?: string;
    data?: {
      taskId: string;
      runId: string;
    };
  }>({
    url: `/ecom-platform-collect/task/${id}/trigger`,
    data,
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

export const resetActiveEcomPlatformCollectRuns = () => {
  return request.post<{
    success: boolean;
    message?: string;
    resetCount: number;
    runIds: string[];
  }>({
    url: "/ecom-platform-collect/run/reset-active",
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
