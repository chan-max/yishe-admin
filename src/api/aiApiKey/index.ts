import request from "@/config/axios";

export interface AiApiKeyConfig {
  id?: number;
  name: string;
  platform: string;
  apiKey?: string;
  maskedApiKey?: string;
  enabled: boolean;
  expiresAt?: string | null;
  remark?: string;
  userId?: number | null;
  uploader?: {
    id?: number;
    account?: string;
    name?: string;
  } | null;
  createTime?: string;
  updateTime?: string;
}

export const getAiApiKeyList = () => request.get<AiApiKeyConfig[]>({ url: "/system/ai-api-key" });

export const getAiApiKeyDetail = (id: number) =>
  request.get<AiApiKeyConfig>({ url: `/system/ai-api-key/${id}` });

export const createAiApiKey = (data: AiApiKeyConfig) =>
  request.post({ url: "/system/ai-api-key", data });

export const updateAiApiKey = (id: number, data: AiApiKeyConfig) =>
  request.patch({ url: `/system/ai-api-key/${id}`, data });

export const deleteAiApiKey = (id: number) => request.delete({ url: `/system/ai-api-key/${id}` });
