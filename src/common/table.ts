
import { formatTimestamp } from "@/common/date";

export const TABLE_TIME_COLUMN_WIDTH = 168;
export const TABLE_OPERATION_COLUMN_WIDTH = 120;

export const formatTableDateTime = (value: unknown) => {
  if (!value) return "-";
  return formatTimestamp(value);
};

export const buildTimeColumn = (
  title: string,
  field = "createTime",
  width = TABLE_TIME_COLUMN_WIDTH,
  extra: Record<string, unknown> = {},
): any => ({
  title,
  field,
  width,
  showOverflow: true,
  className: "table-time-cell",
  formatter: ({ cellValue }: { cellValue: unknown }) => formatTableDateTime(cellValue),
  ...extra,
});

export const buildOperationColumn = (
  slotName = "operationDefaultSlot",
  width = TABLE_OPERATION_COLUMN_WIDTH,
  extra: Record<string, unknown> = {},
): any => ({
  title: "操作",
  field: "operation",
  fixed: "right" as const,
  width,
  className: "table-operation-cell",
  slots: {
    default: slotName,
  },
  ...extra,
});

export const commonGridOptions = {
  size: "mini" as const,
  border: "inner" as const,
  columnConfig: {
    resizable: true,
  },
  rowConfig: {
    resizable: true,
  },
  resizableConfig: {},
  customConfig: {
    // storage: {
    //     resizable: true,
    // }
  },
};
