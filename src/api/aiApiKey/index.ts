import request from "@/config/axios";

export interface AiApiKeyConfig {
  id?: number;
  name: string;
  model: string;
  apiKey?: string;
  maskedApiKey?: string;
  baseUrl?: string | null;
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

export interface AiFeatureRegistryItem {
  code: string;
  label: string;
  group: string;
  description: string;
}

export const getAiApiKeyList = () => request.get<AiApiKeyConfig[]>({ url: "/system/ai-api-key" });

export const getAiFeatureRegistry = () =>
  request.get<AiFeatureRegistryItem[]>({ url: "/system/ai-api-key/feature-registry" });

export const getAiApiKeyDetail = (id: number) =>
  request.get<AiApiKeyConfig>({ url: `/system/ai-api-key/${id}` });

export const createAiApiKey = (data: AiApiKeyConfig) =>
  request.post({ url: "/system/ai-api-key", data });

export const updateAiApiKey = (id: number, data: Partial<AiApiKeyConfig>) =>
  request.patch({ url: `/system/ai-api-key/${id}`, data });

export const deleteAiApiKey = (id: number) => request.delete({ url: `/system/ai-api-key/${id}` });
