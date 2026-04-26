import request from "@/config/axios";

export type FileLogType = "access" | "app" | "error" | "task" | "debug" | "app-out";

export type FileLogTypeOption = {
  type: FileLogType;
  label: string;
};

export type FileLogFile = {
  type: FileLogType;
  fileName: string;
  relativePath: string;
  size: number;
  mtime: string;
  date: string;
  compressed: boolean;
};

export type FileLogLine = {
  id: string;
  type: FileLogType;
  fileName: string;
  lineNumber: number;
  raw: string;
  parsed: any | null;
  time?: string;
  level?: string;
  module?: string;
  message?: string;
  userId?: string | number;
  userName?: string;
  requestId?: string;
  taskId?: string;
};

export type FileLogSearchParams = {
  types?: FileLogType[];
  type?: FileLogType;
  file?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  userId?: string | number;
  userName?: string;
  module?: string;
  level?: string;
  page?: number;
  pageSize?: number;
  lines?: number;
};

export type FileLogSearchResult = {
  list: FileLogLine[];
  total: number;
  page?: number;
  pageSize?: number;
  lines?: number;
  files: FileLogFile[];
};

export const getFileLogMeta = () => {
  return request.get<{ root: string; types: FileLogTypeOption[] }>({
    url: "/system/file-log/meta",
  });
};

export const getFileLogTree = (params?: { startDate?: string; endDate?: string }) => {
  return request.get<{
    root: string;
    children: Array<{ type: FileLogType; label: string; files: FileLogFile[] }>;
  }>({
    url: "/system/file-log/tree",
    params,
  });
};

export const getFileLogFiles = (params?: {
  type?: FileLogType;
  startDate?: string;
  endDate?: string;
}) => {
  return request.get<FileLogFile[]>({
    url: "/system/file-log/files",
    params,
  });
};

export const searchFileLogs = (data: FileLogSearchParams) => {
  return request.post<FileLogSearchResult>({
    url: "/system/file-log/search",
    data,
  });
};

export const tailFileLogs = (data: FileLogSearchParams) => {
  return request.post<FileLogSearchResult>({
    url: "/system/file-log/tail",
    data,
  });
};

export const downloadFileLog = (params: { type: FileLogType; file: string }) => {
  return request.download<Blob>({
    url: "/system/file-log/download",
    params,
  });
};

export const deleteFileLog = (data: { type: FileLogType; file: string }) => {
  return request.post<{ success: boolean; type: FileLogType; fileName: string }>({
    url: "/system/file-log/delete",
    data,
  });
};
