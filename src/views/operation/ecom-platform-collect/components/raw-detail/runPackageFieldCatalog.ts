import type {
  EcomCollectRunRecord,
  EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
import { getRawPackageRecords } from "../../shared";

export interface RunPackageFieldCatalogEntry {
  path: string;
  coverageCount: number;
  total: number;
  coverageRatio: number;
  valueTypes: string[];
  sampleValues: string[];
}

interface FieldAccumulator {
  path: string;
  coverageCount: number;
  valueTypes: Set<string>;
  sampleValues: string[];
}

const MAX_RECORD_SCAN = 120;
const MAX_OBJECT_DEPTH = 4;
const MAX_SAMPLE_VALUES = 3;
const MAX_FIELD_COUNT = 120;

function inferValueType(value: unknown) {
  if (Array.isArray(value)) {
    return "array";
  }
  if (value === null) {
    return "null";
  }
  return typeof value;
}

function normalizeSampleValue(value: unknown) {
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
    const preview = value
      .slice(0, 3)
      .map((item) => normalizeSampleValue(item))
      .filter(Boolean);
    return preview.length ? `[${preview.join(", ")}]` : "[]";
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

function ensureEntry(
  map: Map<string, FieldAccumulator>,
  path: string,
): FieldAccumulator {
  const current = map.get(path);
  if (current) {
    return current;
  }
  const created: FieldAccumulator = {
    path,
    coverageCount: 0,
    valueTypes: new Set<string>(),
    sampleValues: [],
  };
  map.set(path, created);
  return created;
}

function pushSampleValue(entry: FieldAccumulator, value: unknown) {
  const normalized = normalizeSampleValue(value);
  if (
    !normalized ||
    entry.sampleValues.includes(normalized) ||
    entry.sampleValues.length >= MAX_SAMPLE_VALUES
  ) {
    return;
  }
  entry.sampleValues.push(normalized);
}

function walkRecordValue(
  value: unknown,
  path: string,
  depth: number,
  visited: Set<string>,
  map: Map<string, FieldAccumulator>,
) {
  if (!path || depth > MAX_OBJECT_DEPTH || value === undefined) {
    return;
  }

  const entry = ensureEntry(map, path);
  entry.valueTypes.add(inferValueType(value));
  pushSampleValue(entry, value);
  if (!visited.has(path)) {
    visited.add(path);
    entry.coverageCount += 1;
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return;
    }

    const arrayPath = `${path}[]`;
    const arrayEntry = ensureEntry(map, arrayPath);
    arrayEntry.valueTypes.add("array-item");
    if (!visited.has(arrayPath)) {
      visited.add(arrayPath);
      arrayEntry.coverageCount += 1;
    }

    value.slice(0, 3).forEach((item) => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        Object.entries(item).forEach(([key, childValue]) => {
          walkRecordValue(
            childValue,
            `${arrayPath}.${key}`,
            depth + 1,
            visited,
            map,
          );
        });
        return;
      }

      arrayEntry.valueTypes.add(inferValueType(item));
      pushSampleValue(arrayEntry, item);
    });

    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value as Record<string, any>).forEach(([key, childValue]) => {
      const childPath = path ? `${path}.${key}` : key;
      walkRecordValue(childValue, childPath, depth + 1, visited, map);
    });
  }
}

function buildRecordFieldCatalog(records: EcomCollectRunRecord[]) {
  const limitedRecords = records.slice(0, MAX_RECORD_SCAN);
  const total = limitedRecords.length;
  if (!total) {
    return [] as RunPackageFieldCatalogEntry[];
  }

  const map = new Map<string, FieldAccumulator>();

  limitedRecords.forEach((record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      return;
    }

    const visited = new Set<string>();
    Object.entries(record).forEach(([key, value]) => {
      walkRecordValue(value, key, 1, visited, map);
    });
  });

  return Array.from(map.values())
    .map((entry) => ({
      path: entry.path,
      coverageCount: entry.coverageCount,
      total,
      coverageRatio: total ? entry.coverageCount / total : 0,
      valueTypes: Array.from(entry.valueTypes),
      sampleValues: entry.sampleValues,
    }))
    .filter((entry) => !entry.path.endsWith("[]"))
    .sort((a, b) => {
      if (a.coverageCount !== b.coverageCount) {
        return b.coverageCount - a.coverageCount;
      }
      return a.path.localeCompare(b.path);
    })
    .slice(0, MAX_FIELD_COUNT);
}

export function buildRunPackageFieldCatalog(
  row: EcomPlatformRawRecord,
) {
  return buildRecordFieldCatalog(getRawPackageRecords(row));
}
