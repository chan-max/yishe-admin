import request from "@/config/axios";

export interface ServiceFileCacheItem {
  key: string;
  url: string;
  filePath: string;
  filename: string;
  size: number;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  hit: boolean;
}

export interface ServiceFileCacheListPayload {
  total: number;
  totalSize: number;
  cacheDir: string;
  items: ServiceFileCacheItem[];
}

export const getServiceFileCacheList = () => {
  return request.get<ServiceFileCacheListPayload>({
    url: "/service-file-cache/list",
  });
};

export const ensureServiceFileCache = (url: string) => {
  return request.post<ServiceFileCacheItem>({
    url: "/service-file-cache/ensure",
    data: { url },
  });
};

export const clearServiceFileCache = (url?: string) => {
  return request.delete<{ deletedCount: number; remainingCount: number }>({
    url: "/service-file-cache/clear",
    data: url ? { url } : {},
  });
};
