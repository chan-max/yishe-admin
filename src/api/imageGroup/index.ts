import request from "@/config/axios";

export interface ImageGroupSticker {
  id: string;
  url?: string | null;
  name?: string | null;
  groupId?: string | null;
  slotType?: string | null;
  sortOrder?: number | null;
}

export interface ImageGroupItem {
  id: string;
  name: string;
  coverUrl?: string | null;
  description?: string | null;
  meta?: Record<string, any> | null;
  userId?: number | null;
  folderId?: string | null;
  folder?: string | null;
  createTime?: string;
  updateTime?: string;
  stickersCount: number;
  stickers: ImageGroupSticker[];
}

export interface ImageGroupMemberInput {
  stickerId: string;
  slotType?: string;
  sortOrder?: number;
}

export interface ImageGroupInput {
  name: string;
  coverUrl?: string;
  description?: string;
  meta?: Record<string, any>;
  folderId?: string | null;
  stickers?: ImageGroupMemberInput[];
}

export interface ImageGroupPageResult {
  list: ImageGroupItem[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export const imageGroupApi = {
  create: (data: ImageGroupInput) => request.post<ImageGroupItem>({ url: "/image-group", data }),

  page: (params: {
    id?: string;
    pageNo?: number;
    pageSize?: number;
    searchText?: string;
    folderId?: string;
  }) => request.get<ImageGroupPageResult>({ url: "/image-group/page", params }),

  getDetail: (id: string) => request.get<ImageGroupItem>({ url: `/image-group/${id}` }),

  update: (id: string, data: Partial<Omit<ImageGroupInput, "stickers" | "folderId">>) =>
    request.patch<ImageGroupItem>({ url: `/image-group/${id}`, data }),

  remove: (id: string) => request.delete<boolean>({ url: `/image-group/${id}` }),

  addStickers: (id: string, data: { stickers: ImageGroupMemberInput[] }) =>
    request.post<ImageGroupItem>({ url: `/image-group/${id}/add-stickers`, data }),

  removeStickers: (id: string, data: { stickerIds: string[] }) =>
    request.post<ImageGroupItem>({ url: `/image-group/${id}/remove-stickers`, data }),

  moveToFolder: (data: { ids: string[]; folderId: string | null }) =>
    request.post<{ success: boolean; movedCount: number }>({
      url: "/image-group/batch-move",
      data,
    }),
};
