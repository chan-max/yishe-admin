import request from "@/config/axios";

export function getImageProcessingHealth() {
  return request.get({
    url: "/image-processing-record/health",
  });
}

export function getImageProcessingMeta() {
  return request.get({
    url: "/image-processing-record/meta",
  });
}

export async function createImageProcessingRecord(data: {
  title?: string;
  taskType?: string;
  imageUrl?: string;
  processorId?: string;
  operationsJson?: string;
  sourceModule?: string;
  sourceRecordId?: string;
  sourceName?: string;
}) {
  const response: any = await request.postOwned({
    url: "/image-processing-record/create",
    data,
  });
  return response;
}

export function getImageProcessingRecordPage(params: {
  currentPage?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  taskType?: string;
}) {
  return request.get({
    url: "/image-processing-record/page",
    params,
  });
}

export function getImageProcessingRecordDetail(id: string) {
  return request.get({
    url: `/image-processing-record/${id}`,
  });
}

export function deleteImageProcessingRecord(id: string) {
  return request.delete({
    url: `/image-processing-record/${id}`,
  });
}

export function batchDeleteImageProcessingRecord(ids: string[]) {
  return request.post({
    url: "/image-processing-record/batch-delete",
    data: { ids },
  });
}

export function importImageProcessingResults(
  id: string,
  data: {
    resultIndexes?: number[];
    folderId?: string | null;
  },
) {
  return request.post({
    url: `/image-processing-record/${id}/import-results`,
    data,
  });
}
