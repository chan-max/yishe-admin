import request from "@/config/axios";
import type {
  BrowserAutomationClientVO,
  BrowserAutomationCommandResponse,
  BrowserAutomationProfilesPayload,
  BrowserAutomationSmallFeatureItem,
} from "@/api/external/browserAutomation";

export type ToolkitClientVO = BrowserAutomationClientVO;
export type ToolkitProfilesPayload = BrowserAutomationProfilesPayload;
export type ToolkitToolItem = BrowserAutomationSmallFeatureItem;

export const getToolkitClients = () => {
  return request.get<ToolkitClientVO[]>({
    url: "/external/toolkit/clients",
  });
};

export const getToolkitProfiles = (clientId: string) => {
  return request.get<BrowserAutomationCommandResponse>({
    url: `/external/toolkit/${clientId}/profiles`,
  });
};

export const getToolkitTools = (clientId: string) => {
  return request.get<BrowserAutomationCommandResponse>({
    url: `/external/toolkit/${clientId}/tools`,
  });
};

export const runToolkitTool = (clientId: string, data: Record<string, any>) => {
  return request.post<BrowserAutomationCommandResponse>({
    url: `/external/toolkit/${clientId}/tools/run`,
    data,
  });
};
