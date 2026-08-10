<template>
  <div class="excel-preview" v-loading="loading" element-loading-text="加载 Excel 文件中...">
    <div v-if="error" class="excel-preview__error">
      <el-icon :size="48"><i class="el-icon-warning" /></el-icon>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="sheets.length" class="excel-preview__content">
      <el-tabs v-model="activeSheet" type="card" size="small">
        <el-tab-pane
          v-for="sheet in sheets"
          :key="sheet.name"
          :label="sheet.name"
          :name="sheet.name"
        >
          <div class="excel-preview__table-wrap">
            <table class="excel-preview__table">
              <thead v-if="sheet.headers.length">
                <tr>
                  <th class="excel-preview__index">#</th>
                  <th v-for="(h, i) in sheet.headers" :key="i">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in sheet.rows" :key="ri">
                  <td class="excel-preview__index">{{ ri + 1 }}</td>
                  <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="excel-preview__info">
            共 {{ sheet.rows.length }} 行 × {{ sheet.headers.length }} 列
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import * as XLSX from "xlsx";

interface SheetData {
  name: string;
  headers: string[];
  rows: any[][];
}

const props = defineProps<{
  fileUrl: string;
}>();

const loading = ref(false);
const error = ref("");
const sheets = ref<SheetData[]>([]);
const activeSheet = ref("");

const loadExcel = async (url: string) => {
  if (!url) return;
  loading.value = true;
  error.value = "";
  sheets.value = [];

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buffer = await resp.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const result: SheetData[] = [];
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const json = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });
      if (!json.length) continue;

      // 第一行作为表头
      const headers = json[0].map((h: any) => String(h || ""));
      const rows = json.slice(1).map((row) =>
        headers.map((_, i) => {
          const val = row[i];
          return val != null ? String(val) : "";
        })
      );

      result.push({ name, headers, rows });
    }

    sheets.value = result;
    activeSheet.value = result[0]?.name || "";
  } catch (e: any) {
    error.value = `加载失败: ${e?.message || "未知错误"}`;
  } finally {
    loading.value = false;
  }
};

watch(() => props.fileUrl, loadExcel, { immediate: true });
</script>

<style scoped>
.excel-preview {
  width: 100%;
  min-height: 200px;
}

.excel-preview__error {
  padding: 40px;
  color: var(--el-color-danger);
  text-align: center;
}

.excel-preview__content {
  width: 100%;
}

.excel-preview__table-wrap {
  max-height: 65vh;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.excel-preview__table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.excel-preview__table th,
.excel-preview__table td {
  max-width: 300px;
  padding: 6px 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid var(--el-border-color-lighter);
}

.excel-preview__table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-weight: 600;
  background: var(--el-fill-color-light);
}

.excel-preview__table tbody tr:hover {
  background: var(--el-fill-color-lighter);
}

.excel-preview__index {
  width: 50px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-align: center;
  background: var(--el-fill-color-lighter);
}

.excel-preview__info {
  padding: 8px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: right;
}
</style>
