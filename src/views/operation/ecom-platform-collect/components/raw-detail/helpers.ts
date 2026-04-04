import type { EcomPlatformRawRecord } from "@/api/operation/ecomPlatformCollect";

export interface PlatformRawFieldDefinition {
  label: string;
  paths: string[];
}

export interface NormalizedSnapshotItem {
  url?: string | null;
  key?: string | null;
  label?: string | null;
  path?: string | null;
}

const PATH_SEGMENT_REGEXP = /([^[.\]]+)|\[(\d+)\]/g;

const tokenizePath = (path: string) => {
  const tokens: Array<string | number> = [];
  String(path || "").replace(PATH_SEGMENT_REGEXP, (_, key, index) => {
    if (key !== undefined) {
      tokens.push(key);
    } else if (index !== undefined) {
      tokens.push(Number(index));
    }
    return "";
  });
  return tokens;
};

export const readPathValue = (source: any, path: string) => {
  if (!path) return undefined;
  return tokenizePath(path).reduce<any>((current, token) => {
    if (current == null) {
      return undefined;
    }
    return current[token as keyof typeof current];
  }, source);
};

export const pickFirstValue = (source: any, paths: string[] = []) => {
  for (const path of paths) {
    const resolved = readPathValue(source, path);
    if (
      resolved !== undefined &&
      resolved !== null &&
      !(typeof resolved === "string" && !resolved.trim()) &&
      !(Array.isArray(resolved) && !resolved.length)
    ) {
      return resolved;
    }
  }
  return undefined;
};

export const normalizeDisplayValue = (value: unknown) => {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeDisplayValue(item))
      .filter(Boolean)
      .join("、");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
};

export const resolveFieldValue = (
  source: any,
  field: PlatformRawFieldDefinition,
) => {
  return normalizeDisplayValue(pickFirstValue(source, field.paths));
};

export const extractStringList = (source: any, paths: string[] = []) => {
  const resolved = pickFirstValue(source, paths);
  if (!resolved) {
    return [];
  }

  if (Array.isArray(resolved)) {
    return resolved
      .map((item) => {
        if (item && typeof item === "object") {
          return normalizeDisplayValue(
            pickFirstValue(item, [
              "url",
              "image",
              "imageUrl",
              "src",
              "original",
              "large",
              "thumb",
            ]),
          );
        }
        return normalizeDisplayValue(item);
      })
      .filter(Boolean);
  }

  const single = normalizeDisplayValue(resolved);
  return single ? [single] : [];
};

export const normalizeSnapshotItems = (value: unknown) => {
  const snapshots: NormalizedSnapshotItem[] = [];
  const visited = new Set<string>();

  const visit = (current: unknown) => {
    if (!current) {
      return;
    }

    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    if (typeof current !== "object") {
      return;
    }

    const record = current as Record<string, any>;
    const url = String(record.url || record.cosUrl || "").trim();
    const key = String(record.key || record.cosKey || "").trim();
    const path = String(record.path || record.filePath || record.localPath || "").trim();
    const label = String(record.stage || record.name || record.label || "").trim();
    const uniqueKey = url || path || key;
    if (uniqueKey && !visited.has(uniqueKey)) {
      visited.add(uniqueKey);
      snapshots.push({
        url: url || null,
        key: key || null,
        label: label || null,
        path: path || null,
      });
    }

    Object.values(record).forEach((item) => {
      if (item && typeof item === "object") {
        visit(item);
      }
    });
  };

  visit(value);
  return snapshots;
};

export const getDefaultHeroTitle = (record: EcomPlatformRawRecord) => {
  return (
    normalizeDisplayValue(
      pickFirstValue(record.rawPayload, [
        "title",
        "name",
        "productName",
        "pageTitle",
        "descriptionText",
      ]),
    ) ||
    record.recordKey ||
    record.id
  );
};
