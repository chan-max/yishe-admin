/**
 * 文件夹筛选常量
 * 用于统一前后端对文件夹的筛选逻辑
 * 最新标准：ALL（全部）、NOT_GROUP（未分组）、正常文件夹ID
 */

/**
 * 特殊文件夹标识
 */
export const FOLDER_FILTER = {
  /** 全部（不按文件夹筛选） */
  ALL: '__ALL__',
  /** 未分组/根目录（folderId 为空的项） */
  NOT_GROUP: '__NOT_GROUP__',
  /** 旧标识：未分类，已废弃，改用 NOT_GROUP */
  UNCATEGORIZED: '__NOT_GROUP__', // 向后兼容
} as const;

/**
 * 文件夹筛选类型
 */
export type FolderFilterType = typeof FOLDER_FILTER[keyof typeof FOLDER_FILTER] | string | null;

/**
 * 将前端文件夹筛选值转换为后端API参数
 * @param folderId 前端文件夹ID（可能是特殊标识或实际ID）
 * @returns 后端API参数值
 */
export function convertFolderIdToApiParam(folderId: FolderFilterType | null): string | null | undefined {
  if (folderId === FOLDER_FILTER.ALL || folderId === undefined || folderId === null) {
    // 全部：不传递或传递特殊标识
    return FOLDER_FILTER.ALL;
  } else if (folderId === FOLDER_FILTER.NOT_GROUP || folderId === FOLDER_FILTER.UNCATEGORIZED) {
    // 未分组：传递特殊标识
    return FOLDER_FILTER.NOT_GROUP;
  } else {
    // 普通文件夹：传递实际的文件夹ID
    return folderId;
  }
}

/**
 * 判断是否为"全部"筛选
 */
export function isAllFolder(folderId: FolderFilterType | null): boolean {
  return folderId === FOLDER_FILTER.ALL || folderId === undefined || folderId === null;
}

/**
 * 判断是否为"未分组"筛选
 */
export function isNotGroupFolder(folderId: FolderFilterType | null): boolean {
  return folderId === FOLDER_FILTER.NOT_GROUP || folderId === FOLDER_FILTER.UNCATEGORIZED;
}

/**
 * 判断是否为普通文件夹
 */
export function isNormalFolder(folderId: FolderFilterType | null): boolean {
  return (
    folderId !== null &&
    folderId !== undefined &&
    !isAllFolder(folderId) &&
    !isNotGroupFolder(folderId)
  );
}

/**
 * 获取文件夹显示名称
 */
export function getFolderDisplayName(folderId: FolderFilterType | null, folderName?: string): string {
  if (isAllFolder(folderId)) {
    return '全部';
  } else if (isNotGroupFolder(folderId)) {
    return '未分组';
  } else {
    return folderName || '未命名文件夹';
  }
}
