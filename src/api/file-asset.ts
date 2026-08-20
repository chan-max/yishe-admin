import request from "@/config/axios";

export interface FileAssetItem {
  id: string;
  provider: string;
  bucket: string;
  region: string;
  objectKey: string;
  url?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  size?: number | null;
  ownerId?: number | null;
  sourceApp: string;
  sourceModule?: string | null;
  category?: string | null;
  status: string;
  createdAt: string;
}

export const getFileAssetPageApi = (params: {
  page?: number;
  pageSize?: number;
  provider?: string;
  sourceApp?: string;
  keyword?: string;
}) => request.get({ url: "/file-asset/page", params });

export const getFileAssetDetailApi = (id: string) =>
  request.get({ url: `/file-asset/${id}` });


export const registerFileAssetBestEffort = (data: Record<string, any>) =>
  request.post({ url: "/file-asset/register", data }).catch((error: any) => {
    console.warn("[file-asset] 登记失败，不影响原有上传", error?.message || error);
    return null;
  });
