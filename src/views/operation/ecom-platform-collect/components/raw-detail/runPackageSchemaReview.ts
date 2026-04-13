import type {
  EcomCollectOutputFieldSchema,
  EcomPlatformCollectCatalog,
  EcomPlatformRawRecord,
} from "@/api/operation/ecomPlatformCollect";
import {
  getRawPackage,
  getRawPlatform,
  getRawTaskType,
  getTaskTypeSchema,
} from "../../shared";
import type { RunPackageFieldCatalogEntry } from "./runPackageFieldCatalog";
import { buildRunPackageFieldCatalog } from "./runPackageFieldCatalog";

export interface RunPackageExpectedFieldReviewItem {
  key: string;
  normalizedKey: string;
  label: string;
  description: string;
  stability: string;
  examples: any[];
  found: boolean;
  coverageCount: number;
  total: number;
  coverageRatio: number;
  valueTypes: string[];
}

export interface RunPackagePackageFieldReviewItem {
  key: string;
  normalizedKey: string;
  label: string;
  description: string;
  stability: string;
  examples: any[];
  present: boolean;
}

export interface RunPackageSchemaReview {
  packageFields: RunPackagePackageFieldReviewItem[];
  recordFields: RunPackageExpectedFieldReviewItem[];
  missingCoreRecordFields: RunPackageExpectedFieldReviewItem[];
  undocumentedRecordFields: RunPackageFieldCatalogEntry[];
  undocumentedPackageFields: string[];
}

const normalizeFieldKey = (value: unknown) =>
  String(value || "")
    .trim()
    .replace(/\[\]/g, "");

const normalizeOutputFields = (value: unknown) =>
  Array.from(
    new Map(
      (Array.isArray(value) ? value : [])
        .filter(
          (item): item is EcomCollectOutputFieldSchema =>
            !!item &&
            typeof item === "object" &&
            !!normalizeFieldKey((item as EcomCollectOutputFieldSchema).key),
        )
        .map((item) => [normalizeFieldKey(item.key), item]),
    ).values(),
  );

export function buildRunPackageSchemaReview(
  row: EcomPlatformRawRecord,
  catalog: EcomPlatformCollectCatalog,
): RunPackageSchemaReview {
  const taskType = getTaskTypeSchema(
    catalog,
    getRawPlatform(row),
    getRawTaskType(row),
  );
  const rawPackage = getRawPackage(row);
  const fieldCatalog = buildRunPackageFieldCatalog(row);

  const actualTopLevelRecordFields = fieldCatalog.filter(
    (item) => !String(item.path || "").includes("."),
  );
  const actualRecordFieldMap = new Map(
    actualTopLevelRecordFields.map((item) => [normalizeFieldKey(item.path), item]),
  );

  const expectedRecordFields = normalizeOutputFields(taskType?.docs?.recordFields).map(
    (field) => {
      const normalizedKey = normalizeFieldKey(field.key);
      const matched = actualRecordFieldMap.get(normalizedKey);
      return {
        key: String(field.key || "").trim(),
        normalizedKey,
        label: String(field.label || field.key || "").trim() || normalizedKey,
        description: String(field.description || "").trim(),
        stability: String(field.stability || "optional").trim() || "optional",
        examples: Array.isArray(field.examples) ? field.examples : [],
        found: !!matched,
        coverageCount: matched?.coverageCount || 0,
        total: matched?.total || 0,
        coverageRatio: matched?.coverageRatio || 0,
        valueTypes: Array.isArray(matched?.valueTypes) ? matched.valueTypes : [],
      };
    },
  );

  const expectedRecordFieldKeys = new Set(
    expectedRecordFields.map((item) => item.normalizedKey).filter(Boolean),
  );

  const missingCoreRecordFields = expectedRecordFields.filter(
    (item) => item.stability === "core" && !item.found,
  );

  const undocumentedRecordFields = actualTopLevelRecordFields.filter(
    (item) => !expectedRecordFieldKeys.has(normalizeFieldKey(item.path)),
  );

  const expectedPackageFields = normalizeOutputFields(taskType?.docs?.packageFields).map(
    (field) => ({
      key: String(field.key || "").trim(),
      normalizedKey: normalizeFieldKey(field.key),
      label: String(field.label || field.key || "").trim(),
      description: String(field.description || "").trim(),
      stability: String(field.stability || "optional").trim() || "optional",
      examples: Array.isArray(field.examples) ? field.examples : [],
      present: Object.prototype.hasOwnProperty.call(
        rawPackage,
        normalizeFieldKey(field.key),
      ),
    }),
  );

  const expectedPackageFieldKeys = new Set(
    expectedPackageFields.map((item) => item.normalizedKey).filter(Boolean),
  );
  const undocumentedPackageFields = Object.keys(rawPackage || {}).filter(
    (key) => !expectedPackageFieldKeys.has(normalizeFieldKey(key)),
  );

  return {
    packageFields: expectedPackageFields,
    recordFields: expectedRecordFields,
    missingCoreRecordFields,
    undocumentedRecordFields,
    undocumentedPackageFields,
  };
}
