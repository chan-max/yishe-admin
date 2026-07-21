import request from "@/config/axios";

export type AiSkillTarget = "design-agent" | "admin-agent";

export interface AiSkillContent {
  entry: string;
  files: Record<string, string>;
}

export interface AiSkillPermission {
  owned: boolean;
  visibility: "private" | "public";
  canEdit: boolean;
  canDelete: boolean;
  canSetPublic: boolean;
}

export interface AiSkill {
  id?: string;
  userId?: string;
  name: string;
  description?: string | null;
  targets: AiSkillTarget[];
  triggers: string[];
  content: AiSkillContent;
  enabled: boolean;
  isPublic: boolean;
  permission?: AiSkillPermission;
  createTime?: string;
  updateTime?: string;
}

export interface AiSkillPageParams {
  currentPage?: number;
  pageSize?: number;
  keyword?: string;
  target?: AiSkillTarget | "";
  enabled?: boolean;
}

export interface AiSkillPageResult {
  list: AiSkill[];
  total: number;
  currentPage: number;
  pageSize: number;
  totalPage: number;
}

export const getAiSkillPage = (data: AiSkillPageParams) =>
  request.post<AiSkillPageResult>({ url: "/ai-skill/page", data });

export const createAiSkill = (data: AiSkill) =>
  request.post<AiSkill>({ url: "/ai-skill/create", data });

export const updateAiSkill = (data: AiSkill) =>
  request.post<AiSkill>({ url: "/ai-skill/update", data });

export const deleteAiSkill = (ids: string | string[]) =>
  request.post<{ removedCount: number }>({
    url: "/ai-skill/delete",
    data: { ids: Array.isArray(ids) ? ids : [ids] },
  });
