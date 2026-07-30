#!/usr/bin/env node
/**
 * 字体库全量AI文案优化（单个请求 + 并发）
 * 遍历所有字体，逐个调用 AI 重新分析并优化文案
 */

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiYWNjb3VudCI6ImphY2tpZSIsInRlcm1pbmFsVHlwZSI6ImFkbWluIiwidG9rZW5JZCI6IjdjYmI0ZGRjLWNlYWYtNDRlZi1iNDg5LWVhYWUxMDA4NDNjOCIsImlhdCI6MTc4NTA1NDk2MCwiZXhwIjoyMTAwNjMwOTYwfQ.s7NJCzJRnVW8iqQlrhM1mWKf7vdbF3Em6g5nPXpzpqM";
const BASE_URL = "http://localhost:1520/api";
const PAGE_SIZE = 50;
const START_PAGE = parseInt(process.argv[2]) || 1;
const CONCURRENCY = 3;

let totalProcessed = 0;
let totalFailed = 0;
let totalPages = 0;

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

async function processWithConcurrency(items, concurrency) {
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const item = items[i];
      try {
        const result = await aiComplete(item.id);
        if (result.data?.accepted || result.data?.queued) {
          totalProcessed++;
        } else {
          totalFailed++;
          console.error(`  ✗ ${item.name}: ${result.message || 'unknown error'}`);
        }
      } catch (err) {
        totalFailed++;
        console.error(`  ✗ ${item.name}: ${err.message}`);
      }
    }
  }

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);
}

async function main() {
  console.log(`\n🚀 字体库全量AI文案优化`);
  console.log(`   起始页: ${START_PAGE}, 每页: ${PAGE_SIZE}, 并发: ${CONCURRENCY}\n`);

  const firstPage = await fetchPage(START_PAGE);
  totalPages = firstPage.total ? Math.ceil(firstPage.total / PAGE_SIZE) : 0;
  console.log(`   总字体: ${firstPage.total}, 总页数: ${totalPages}\n`);

  // 处理第一页
  console.log(`  📄 第 ${START_PAGE} 页: ${firstPage.list.length} 个字体`);
  await processWithConcurrency(firstPage.list, CONCURRENCY);
  console.log(`  ✓ 第 ${START_PAGE} 页完成 (已处理: ${totalProcessed}, 失败: ${totalFailed})\n`);

  // 处理后续页
  for (let page = START_PAGE + 1; page <= totalPages; page++) {
    if ((page - START_PAGE) % 20 === 0) {
      console.log(`\n  ⏳ 进度汇报: 已处理 ${totalProcessed} 个, 失败 ${totalFailed} 个`);
      console.log(`     当前页: ${page}/${totalPages}\n`);
    }

    try {
      const pageData = await fetchPage(page);
      if (pageData.list.length === 0) continue;

      console.log(`  📄 第 ${page} 页: ${pageData.list.length} 个字体`);
      await processWithConcurrency(pageData.list, CONCURRENCY);

    } catch (err) {
      console.error(`  ✗ 第 ${page} 页失败: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ 字体库全量优化完成!`);
  console.log(`   总处理: ${totalProcessed} 个字体`);
  console.log(`   失败: ${totalFailed} 个`);
  console.log(`${"=".repeat(60)}\n`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
