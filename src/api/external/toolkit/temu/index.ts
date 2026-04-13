import request from "@/config/axios";

export type TemuRegionKey = "global" | "us" | "eu" | "seller";

export interface TemuCatalogAction {
  key: string;
  label: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
  regionHints: TemuRegionKey[];
  status: "available" | "planned";
}

export interface TemuCatalogGroup {
  key: string;
  label: string;
  description: string;
  actions: TemuCatalogAction[];
}

export interface TemuCatalogPayload {
  platform: string;
  groups: TemuCatalogGroup[];
}

export interface TemuActionResponse<TResult = Record<string, any>> {
  success: boolean;
  action?: string;
  message?: string;
  profileId?: string;
  region?: TemuRegionKey;
  request?: {
    url?: string;
    status?: number;
  };
  result?: TResult;
  raw?: Record<string, any> | null;
}

export const getTemuCatalog = () => {
  return request.get<TemuCatalogPayload>({
    url: "/temu/catalog",
  });
};

export const executeTemuAction = <TResult = Record<string, any>>(
  endpoint: string,
  data: Record<string, any>,
) => {
  return request.post<TemuActionResponse<TResult>>({
    url: endpoint,
    data,
  });
};
