import request from "@/config/axios";

export type EcomSelectionAnalysisType =
  | "hot_selling_selection"
  | "custom_prompt_extract"
  | "pod_pattern_analysis";

export interface EcomSelectionAnalysisOverview {
  summary?: string;
  confidence?: string;
  opportunityDirection?: string;
  datasetAssessment?: string;
  methodSummary?: string;
}

export interface EcomSelectionAnalysisCustomResult {
  title?: string;
  view?: "gallery" | "table" | "list" | "json" | string;
  columns?: Array<{
    key: string;
    label: string;
  }>;
  items?: any[];
  notes?: string[];
}

export interface EcomSelectionAnalysisOutput {
  overview?: EcomSelectionAnalysisOverview | null;
  hotKeywords?: Array<Record<string, any>>;
  recommendedProducts?: Array<Record<string, any>>;
  platformInsights?: Array<Record<string, any>>;
  selectionStrategy?: string[];
  riskNotes?: string[];
  nextActions?: string[];
  customResult?: EcomSelectionAnalysisCustomResult | null;
  resultNotes?: string[];
}

export interface EcomSelectionAnalysisOutputPreview {
  overviewSummary?: string | null;
  resultCount?: number;
  errorMessage?: string | null;
}

export interface EcomSelectionAnalysisRunSummary {
  sourceSummary?: Record<string, any> | null;
  outputPreview?: EcomSelectionAnalysisOutputPreview | null;
  message?: string | null;
}

export interface EcomSelectionAnalysisTask {
  id: string;
  name: string;
  analysisType: EcomSelectionAnalysisType | string;
  sourceConfig?: Record<string, any> | null;
  analysisConfig?: Record<string, any> | null;
  creator?: string;
  lastRunAt?: string | null;
  lastRunId?: string | null;
  lastRunStatus?: string | null;
  lastRunSummary?: {
    runId?: string | null;
    status?: string | null;
    finishedAt?: string | null;
    sourceSummary?: Record<string, any> | null;
    overviewSummary?: string | null;
    resultCount?: number;
    errorMessage?: string | null;
  } | null;
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
  analysisType: EcomSelectionAnalysisType | string;
  status: string;
  aiModel?: string | null;
  sourceSnapshot?: Record<string, any> | null;
  analysisConfigSnapshot?: Record<string, any> | null;
  summary?: EcomSelectionAnalysisRunSummary | null;
  resultId?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
  userId?: number | null;
  createTime?: string;
  updateTime?: string;
}

export interface EcomSelectionAnalysisResult {
  id: string;
  taskId: string;
  runId: string;
  taskName?: string;
  creator?: string;
  analysisType: EcomSelectionAnalysisType | string;
  analyzedAt?: string | null;
  sourceSummary?: Record<string, any> | null;
  sourceItems?: Array<Record<string, any>> | null;
  output?: EcomSelectionAnalysisOutput | null;
  userId?: number | null;
  createTime?: string;
  updateTime?: string;
  runStatus?: string | null;
  aiModel?: string | null;
  runFinishedAt?: string | null;
  runErrorMessage?: string | null;
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

export const updateEcomSelectionAnalysisTask = (id: string, data: Record<string, any>) => {
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
    resultCount?: number;
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
    resultCount?: number;
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
    resultCount?: number;
  }>({
    url: `/ecom-selection-analysis/run/${id}`,
  });
};

export const batchDeleteEcomSelectionAnalysisRun = (ids: string[]) => {
  return request.post<{
    success: boolean;
    message?: string;
    runCount?: number;
    resultCount?: number;
  }>({
    url: "/ecom-selection-analysis/run/batch-delete",
    data: { ids },
  });
};

export const getEcomSelectionAnalysisResultList = (params?: Record<string, any>) => {
  return request.get<{
    list: EcomSelectionAnalysisResult[];
    total: number;
    pageNo: number;
    pageSize: number;
  }>({
    url: "/ecom-selection-analysis/result/list",
    params,
  });
};

export const getEcomSelectionAnalysisResultDetail = (id: string) => {
  return request.get<EcomSelectionAnalysisResult>({
    url: `/ecom-selection-analysis/result/${id}`,
  });
};

export const deleteEcomSelectionAnalysisResult = (id: string) => {
  return request.delete<{
    success: boolean;
    id: string;
    resultCount?: number;
  }>({
    url: `/ecom-selection-analysis/result/${id}`,
  });
};

export const batchDeleteEcomSelectionAnalysisResult = (ids: string[]) => {
  return request.post<{
    success: boolean;
    message?: string;
    resultCount?: number;
  }>({
    url: "/ecom-selection-analysis/result/batch-delete",
    data: { ids },
  });
};
