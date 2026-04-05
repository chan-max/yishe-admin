import request from "@/config/axios";

export interface EcomSelectionSupplyMatchTask {
  id: string;
  name: string;
  matchType: string;
  sourceConfig?: Record<string, any> | null;
  optionsData?: Record<string, any> | null;
  creator?: string;
  lastRunAt?: string | null;
  lastRunId?: string | null;
  lastRunStatus?: string | null;
  lastResultSummary?: Record<string, any> | null;
  userId?: number | null;
  createTime?: string;
  updateTime?: string;
  recentRuns?: EcomSelectionSupplyMatchRun[];
}

export interface EcomSelectionSupplyMatchRun {
  id: string;
  taskId: string;
  taskName?: string;
  creator?: string;
  matchType: string;
  analysisRunId?: string | null;
  status: string;
  assignedClientId?: string | null;
  assignedMachineCode?: string | null;
  commandId?: string | null;
  sourceConfigSnapshot?: Record<string, any> | null;
  optionsSnapshot?: Record<string, any> | null;
  sourceItemsData?: Array<Record<string, any>> | null;
  summaryData?: Record<string, any> | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
  createTime?: string;
  updateTime?: string;
  task?: EcomSelectionSupplyMatchTask | null;
  items?: EcomSelectionSupplyMatchItem[];
}

export interface EcomSelectionSupplyMatchItem {
  id: string;
  taskId: string;
  runId: string;
  analysisRunId?: string | null;
  sourceRecordId?: string | null;
  sourcePlatform?: string | null;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
  supplierPlatform: string;
  supplierRecordKey?: string | null;
  supplierUrl?: string | null;
  sourceQuery?: string | null;
  queryIndex?: number | null;
  matchRank?: number | null;
  matchScore?: number | null;
  title?: string | null;
  priceText?: string | null;
  shopName?: string | null;
  imageUrl?: string | null;
  capturedAt?: string | null;
  listingData?: Record<string, any> | null;
  detailData?: Record<string, any> | null;
  comparisonData?: Record<string, any> | null;
  rawPayload?: Record<string, any> | null;
  snapshotData?: Record<string, any> | null;
  createTime?: string;
  updateTime?: string;
}

export const getEcomSelectionSupplyMatchTaskList = (params?: Record<string, any>) => {
  return request.get<{
    list: EcomSelectionSupplyMatchTask[];
    total: number;
    pageNo: number;
    pageSize: number;
  }>({
    url: "/ecom-selection-supply-match/task/list",
    params,
  });
};

export const getEcomSelectionSupplyMatchTaskDetail = (id: string) => {
  return request.get<EcomSelectionSupplyMatchTask>({
    url: `/ecom-selection-supply-match/task/${id}`,
  });
};

export const createEcomSelectionSupplyMatchTask = (data: Record<string, any>) => {
  return request.post<EcomSelectionSupplyMatchTask>({
    url: "/ecom-selection-supply-match/task",
    data,
  });
};

export const updateEcomSelectionSupplyMatchTask = (
  id: string,
  data: Record<string, any>,
) => {
  return request.patch<EcomSelectionSupplyMatchTask>({
    url: `/ecom-selection-supply-match/task/${id}`,
    data,
  });
};

export const deleteEcomSelectionSupplyMatchTask = (id: string) => {
  return request.delete<{
    success: boolean;
    id: string;
    taskCount?: number;
    runCount?: number;
    itemCount?: number;
  }>({
    url: `/ecom-selection-supply-match/task/${id}`,
  });
};

export const batchDeleteEcomSelectionSupplyMatchTask = (ids: string[]) => {
  return request.post<{
    success: boolean;
    message?: string;
    taskCount?: number;
    runCount?: number;
    itemCount?: number;
  }>({
    url: "/ecom-selection-supply-match/task/batch-delete",
    data: { ids },
  });
};

export const triggerEcomSelectionSupplyMatchTask = (id: string) => {
  return request.post<EcomSelectionSupplyMatchRun>({
    url: `/ecom-selection-supply-match/task/${id}/trigger`,
  });
};

export const getEcomSelectionSupplyMatchRunList = (params?: Record<string, any>) => {
  return request.get<{
    list: EcomSelectionSupplyMatchRun[];
    total: number;
    pageNo: number;
    pageSize: number;
  }>({
    url: "/ecom-selection-supply-match/run/list",
    params,
  });
};

export const getEcomSelectionSupplyMatchRunDetail = (id: string) => {
  return request.get<EcomSelectionSupplyMatchRun>({
    url: `/ecom-selection-supply-match/run/${id}`,
  });
};

export const deleteEcomSelectionSupplyMatchRun = (id: string) => {
  return request.delete<{
    success: boolean;
    id: string;
    runCount?: number;
    itemCount?: number;
  }>({
    url: `/ecom-selection-supply-match/run/${id}`,
  });
};

export const batchDeleteEcomSelectionSupplyMatchRun = (ids: string[]) => {
  return request.post<{
    success: boolean;
    message?: string;
    runCount?: number;
    itemCount?: number;
  }>({
    url: "/ecom-selection-supply-match/run/batch-delete",
    data: { ids },
  });
};

export const getEcomSelectionSupplyMatchItemList = (params?: Record<string, any>) => {
  return request.get<{
    list: EcomSelectionSupplyMatchItem[];
    total: number;
    pageNo: number;
    pageSize: number;
  }>({
    url: "/ecom-selection-supply-match/item/list",
    params,
  });
};

export const getEcomSelectionSupplyMatchItemDetail = (id: string) => {
  return request.get<EcomSelectionSupplyMatchItem>({
    url: `/ecom-selection-supply-match/item/${id}`,
  });
};
