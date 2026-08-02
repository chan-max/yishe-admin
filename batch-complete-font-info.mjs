#!/usr/bin/env node
/**
 * 字体库信息批量补全脚本
 * 
 * 功能：
 * 1. 获取所有有缩略图但缺少信息的字体
 * 2. 调用 AI 补全接口分析字体并生成 name/description/keywords/category
 * 3. 支持并发处理和断点续传
 * 
 * 用法：
 *   node batch-complete-font-info.mjs [起始页] [并发数]
 * 
 * 示例：
 *   node batch-complete-font-info.mjs 1 3    # 从第1页开始，3并发
 *   node batch-complete-font-info.mjs 10 5   # 从第10页开始，5并发
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiYWNjb3VudCI6ImphY2tpZSIsInRlcm1pbmFsVHlwZSI6ImFkbWluIiwidG9rZW5JZCI6Ijc2ZDUzN2E0LTFiYTQtNGFhNS04OTU3LTA3MjI3NTA3MjE5NCIsImlhdCI6MTc4NTQ5MDAxNCwiZXhwIjoyMTAxMDY2MDE0fQ.2ZtokckzvlrQQwBQryeAGkrnnWUVXZQwb6DvYFZq3D4";
const BASE_URL = "http://localhost:1520/api";
const PAGE_SIZE = 20;
const START_PAGE = parseInt(process.argv[2]) || 1;
const CONCURRENCY = parseInt(process.argv[3]) || 3;

// 断点续传文件
const CHECKPOINT_FILE = ".font-complete-checkpoint.json";

// 统计
let stats = {
  totalProcessed: 0,
  totalSkipped: 0,
  totalFailed: 0,
  totalPages: 0,
  startTime: Date.now(),
};

// 已处理的 ID 记录（用于断点续传）
let processedIds = new Set();

// 加载断点
function loadCheckpoint() {
  if (existsSync(CHECKPOINT_FILE)) {
    try {
      const data = JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf-8'));
      processedIds = new Set(data.processedIds || []);
      console.log(`📂 加载断点：已处理 ${processedIds.size} 个字体`);
    } catch (e) {
      console.log('⚠️ 断点文件损坏，从头开始');
    }
  }
}

// 保存断点
function saveCheckpoint() {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify({
    processedIds: Array.from(processedIds),
    timestamp: new Date().toISOString(),
  }, null, 2));
}

// 判断字体是否需要补全信息
function needsCompletion(item) {
  // 没有缩略图的跳过
  if (!item.thumbnail) return false;
  
  // 已有完整信息的跳过
  if (item.name && item.description && item.keywords && item.category) {
    // 检查是否是低质量信息
    const nameQuality = item.name.length >= 3 && !/^(字体|font|未命名|test)/i.test(item.name);
    const descQuality = item.description.length >= 50;
    const keywordsQuality = item.keywords.split(',').length >= 5;
    
    if (nameQuality && descQuality && keywordsQuality) {
      return false; // 信息质量好，跳过
    }
  }
  
  return true;
}

// 获取字体列表
async function fetchPage(page) {
  const res = await fetch(`${BASE_URL}/font-template/page`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ currentPage: page, pageSize: PAGE_SIZE })
  });
  const json = await res.json();
  if (!json.data?.list) throw new Error(`Failed to fetch page ${page}: ${JSON.stringify(json)}`);
  return json.data;
}

// AI 补全字体信息
async function aiComplete(id) {
  const res = await fetch(`${BASE_URL}/font-template/ai-complete/${id}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });
  const json = await res.json();
  return json;
}

// 处理单个字体
async function processFont(item) {
  if (processedIds.has(item.id)) {
    stats.totalSkipped++;
    return { status: 'skipped', id: item.id };
  }

  try {
    const result = await aiComplete(item.id);
    
    if (result.data?.accepted || result.data?.queued || result.code === 0) {
      stats.totalProcessed++;
      processedIds.add(item.id);
      return { status: 'success', id: item.id, name: item.name };
    } else {
      stats.totalFailed++;
      return { status: 'failed', id: item.id, error: result.message || 'unknown error' };
    }
  } catch (err) {
    stats.totalFailed++;
    return { status: 'failed', id: item.id, error: err.message };
  }
}

// 并发处理
async function processWithConcurrency(items, concurrency) {
  let index = 0;
  const results = [];

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const item = items[i];
      const result = await processFont(item);
      results.push(result);
      
      // 每处理 10 个保存一次断点
      if (stats.totalProcessed % 10 === 0) {
        saveCheckpoint();
      }
    }
  }

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);
  return results;
}

// 打印进度
function printProgress(page, pageResults) {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const success = pageResults.filter(r => r.status === 'success').length;
  const skipped = pageResults.filter(r => r.status === 'skipped').length;
  const failed = pageResults.filter(r => r.status === 'failed').length;
  
  console.log(`  ✓ 第 ${page} 页完成: 成功 ${success}, 跳过 ${skipped}, 失败 ${failed} (${elapsed}s)`);
  
  if (failed > 0) {
    const failedItems = pageResults.filter(r => r.status === 'failed');
    console.log(`    失败项: ${failedItems.slice(0, 3).map(r => r.error).join('; ')}`);
  }
}

// 主函数
async function main() {
  console.log(`\n🚀 字体库信息批量补全`);
  console.log(`   起始页: ${START_PAGE}, 每页: ${PAGE_SIZE}, 并发: ${CONCURRENCY}\n`);

  // 加载断点（只加载已处理的 ID 列表，不改变起始页）
  loadCheckpoint();

  // 获取第一页获取总数
  const firstPage = await fetchPage(START_PAGE);
  stats.totalPages = firstPage.total ? Math.ceil(firstPage.total / PAGE_SIZE) : 0;
  console.log(`   总字体: ${firstPage.total}, 总页数: ${stats.totalPages}\n`);

  // 处理第一页
  const fontsToProcess = firstPage.list.filter(needsCompletion);
  console.log(`  📄 第 ${START_PAGE} 页: ${firstPage.list.length} 个字体, ${fontsToProcess.length} 个需要补全`);
  
  if (fontsToProcess.length > 0) {
    const results = await processWithConcurrency(fontsToProcess, CONCURRENCY);
    printProgress(START_PAGE, results);
  } else {
    console.log(`  ⏭️ 第 ${START_PAGE} 页: 全部跳过`);
  }

  // 处理后续页
  for (let page = START_PAGE + 1; page <= stats.totalPages; page++) {
    // 每 20 页打印一次总体进度
    if ((page - START_PAGE) % 20 === 0) {
      const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
      console.log(`\n  ⏳ 总进度: 已处理 ${stats.totalProcessed} 个, 跳过 ${stats.totalSkipped} 个, 失败 ${stats.totalFailed} 个 (${elapsed}s)\n`);
    }

    try {
      const pageData = await fetchPage(page);
      if (pageData.list.length === 0) continue;

      const fontsToProcess = pageData.list.filter(needsCompletion);
      console.log(`  📄 第 ${page} 页: ${pageData.list.length} 个字体, ${fontsToProcess.length} 个需要补全`);

      if (fontsToProcess.length > 0) {
        const results = await processWithConcurrency(fontsToProcess, CONCURRENCY);
        printProgress(page, results);
      } else {
        console.log(`  ⏭️ 第 ${page} 页: 全部跳过`);
      }

    } catch (err) {
      console.error(`  ✗ 第 ${page} 页失败: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000)); // 失败后等待 2 秒
    }

    // 每页之间间隔 500ms
    await new Promise(r => setTimeout(r, 500));
  }

  // 保存最终断点
  saveCheckpoint();

  // 打印最终统计
  const totalTime = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ 字体库信息批量补全完成!`);
  console.log(`   总处理: ${stats.totalProcessed} 个字体`);
  console.log(`   跳过: ${stats.totalSkipped} 个 (信息已完整)`);
  console.log(`   失败: ${stats.totalFailed} 个`);
  console.log(`   耗时: ${totalTime}s`);
  console.log(`${"=".repeat(60)}\n`);
}

// 运行
main().catch(err => {
  console.error("Fatal error:", err);
  saveCheckpoint(); // 出错时也保存断点
  process.exit(1);
});
