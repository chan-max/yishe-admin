import request from "@/config/axios";

export interface EcomSelectionAnalysisTask {
  id: string;
  name: string;
  analysisType: string;
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
  recentRuns?: EcomSelectionAnalysisRun[];
}

export interface EcomSelectionAnalysisRun {
  id: string;
  taskId: string;
  taskName?: string;
  creator?: string;
  analysisType: string;
  status: string;
  aiModel?: string | null;
  sourceConfigSnapshot?: Record<string, any> | null;
  optionsSnapshot?: Record<string, any> | null;
  sourceStatsData?: Record<string, any> | null;
  sourceRecordIdsData?: string[] | null;
  normalizedItemsData?: Array<Record<string, any>> | null;
  resultData?: Record<string, any> | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
  userId?: number | null;
  createTime?: string;
  updateTime?: string;
  task?: EcomSelectionAnalysisTask | null;
}

export const getEcomSelectionAnalysisTaskList = (params?: Record<string, any>) => {
  return request.get<{
    list: EcomSelectionAnalysisTask[];
    total: number;
    pageNo: number;
    pageSize: number;
  }>({
    url: "/ecom-selection-analysis/task/list",
    params,
  });
};

export const getEcomSelectionAnalysisTaskDetail = (id: string) => {
  return request.get<EcomSelectionAnalysisTask>({
    url: `/ecom-selection-analysis/task/${id}`,
  });
};

export const createEcomSelectionAnalysisTask = (data: Record<string, any>) => {
  return request.post<EcomSelectionAnalysisTask>({
    url: "/ecom-selection-analysis/task",
    data,
  });
};

export const updateEcomSelectionAnalysisTask = (
  id: string,
  data: Record<string, any>,
) => {
  return request.patch<EcomSelectionAnalysisTask>({
    url: `/ecom-selection-analysis/task/${id}`,
    data,
  });
};

export const deleteEcomSelectionAnalysisTask = (id: string) => {
  return request.delete<{
    success: boolean;
    id: string;
    taskCount?: number;
    runCount?: number;
  }>({
    url: `/ecom-selection-analysis/task/${id}`,
  });
};

export const batchDeleteEcomSelectionAnalysisTask = (ids: string[]) => {
  return request.post<{
    success: boolean;
    message?: string;
    taskCount?: number;
    runCount?: number;
  }>({
    url: "/ecom-selection-analysis/task/batch-delete",
    data: { ids },
  });
};

export const triggerEcomSelectionAnalysisTask = (id: string) => {
  return request.post<EcomSelectionAnalysisRun>({
    url: `/ecom-selection-analysis/task/${id}/trigger`,
  });
};

export const getEcomSelectionAnalysisRunList = (params?: Record<string, any>) => {
  return request.get<{
    list: EcomSelectionAnalysisRun[];
    total: number;
    pageNo: number;
    pageSize: number;
  }>({
    url: "/ecom-selection-analysis/run/list",
    params,
  });
};

export const getEcomSelectionAnalysisRunDetail = (id: string) => {
  return request.get<EcomSelectionAnalysisRun>({
    url: `/ecom-selection-analysis/run/${id}`,
  });
};

export const deleteEcomSelectionAnalysisRun = (id: string) => {
  return request.delete<{
    success: boolean;
    id: string;
    runCount?: number;
  }>({
    url: `/ecom-selection-analysis/run/${id}`,
  });
};

export const batchDeleteEcomSelectionAnalysisRun = (ids: string[]) => {
  return request.post<{
    success: boolean;
    message?: string;
    runCount?: number;
  }>({
    url: "/ecom-selection-analysis/run/batch-delete",
    data: { ids },
  });
};
