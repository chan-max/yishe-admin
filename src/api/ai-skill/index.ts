import request from "@/config/axios";

export type AiSkillTarget = "design-agent" | "admin-agent" | "browser-use";

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
  folderId?: string | null;
  shareType?: string | null;
  sourceUserId?: number | null;
  sourceUser?: { id: number; name?: string; account?: string } | null;
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
  folderId?: string | null;
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

export const batchMoveAiSkill = (data: { ids: string[]; folderId: string | null }) =>
  request.post<{ success: boolean; movedCount: number }>({
    url: "/ai-skill/batch-move",
    data,
  });

export const shareAiSkillToUser = (data: { ids: string | string[]; targetUserId: number }) =>
  request.post<{ success: boolean; total: number; failed: any[] }>({
    url: "/ai-skill/share-to-user",
    data,
  });

export const copyAiSkillToUser = (data: { ids: string | string[]; targetUserId: number }) =>
  request.post<{ list: AiSkill[]; total: number; failed: any[] }>({
    url: "/ai-skill/copy-to-user",
    data,
  });

export const moveAiSkillToUser = (data: { ids: string | string[]; targetUserId: number }) =>
  request.post<{ list: AiSkill[]; total: number; failed: any[] }>({
    url: "/ai-skill/move-to-user",
    data,
  });

export const getAiSkillSharedRecords = (id: string) =>
  request.get<{ list: any[]; total: number }>({
    url: `/ai-skill/${id}/shared-records`,
  });
