#!/usr/bin/env node
/**
 * 批量补全素材图文字信息
 * 从指定页码开始，自动检测空白素材并调用 AI 生成信息
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiYWNjb3VudCI6ImphY2tpZSIsInRlcm1pbmFsVHlwZSI6ImFkbWluIiwidG9rZW5JZCI6IjdjYmI0ZGRjLWNlYWYtNDRlZi1iNDg5LWVhYWUxMDA4NDNjOCIsImlhdCI6MTc4NTA1NDk2MCwiZXhwIjoyMTAwNjMwOTYwfQ.s7NJCzJRnVW8iqQlrhM1mWKf7vdbF3Em6g5nPXpzpqM";
const BASE_URL = "http://localhost:1520/api";
const PAGE_SIZE = 50;
const START_PAGE = parseInt(process.argv[2]) || 46;
const CONCURRENCY = 3; // 并发数，避免过载

let totalProcessed = 0;
let totalSkipped = 0;
let totalFailed = 0;
let totalPages = 0;

async function fetchPage(page) {
  const url = `${BASE_URL}/sticker/page?currentPage=${page}&pageSize=${PAGE_SIZE}&sort=createTime%20desc`;
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${TOKEN}` }
  });
  const json = await res.json();
  if (!json.data?.list) throw new Error(`Failed to fetch page ${page}: ${JSON.stringify(json)}`);
  return json.data;
}

async function generateInfo(id) {
  const res = await fetch(`${BASE_URL}/sticker/ai-generate-info`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id })
  });
  const json = await res.json();
  return json;
}

function findEmptyItems(list) {
  return list.filter(item => {
    // 1. 描述为空的
    const descEmpty = !item.description || item.description.trim() === "";
    // 2. name 以 hengyouxin_ 开头的（爬取垃圾数据，需要重新生成）
    const isHengyouxin = item.name && item.name.startsWith("hengyouxin_");
    // 3. name 包含 TEMU_ 的（爬取原始数据，需要重新生成）
    const isTemu = item.name && item.name.includes("TEMU_");
    return descEmpty || isHengyouxin || isTemu;
  });
}

async function processWithConcurrency(items, concurrency) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const item = items[i];
      try {
        const result = await generateInfo(item.id);
        if (result.data?.accepted || result.data?.queued) {
          totalProcessed++;
        } else {
          totalFailed++;
          console.error(`  ✗ ${item.code}: ${result.message || 'unknown error'}`);
        }
      } catch (err) {
        totalFailed++;
        console.error(`  ✗ ${item.code}: ${err.message}`);
      }
    }
  }

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);
}

async function main() {
  console.log(`\n🚀 素材文字信息批量补全`);
  console.log(`   起始页: ${START_PAGE}, 每页: ${PAGE_SIZE}, 并发: ${CONCURRENCY}\n`);

  // 先获取总页数
  const firstPage = await fetchPage(START_PAGE);
  totalPages = firstPage.total ? Math.ceil(firstPage.total / PAGE_SIZE) : 0;

  // 找到第一页的空白项
  const firstEmpty = findEmptyItems(firstPage.list);

  if (firstEmpty.length === 0) {
    console.log(`  第 ${START_PAGE} 页无空白素材，继续扫描...\n`);
  }

  // 处理第一页
  if (firstEmpty.length > 0) {
    console.log(`  📄 第 ${START_PAGE} 页: 发现 ${firstEmpty.length} 个空白素材，开始处理...`);
    await processWithConcurrency(firstEmpty, CONCURRENCY);
    console.log(`  ✓ 第 ${START_PAGE} 页完成 (已处理: ${totalProcessed}, 跳过: ${totalSkipped}, 失败: ${totalFailed})\n`);
  }

  // 处理后续页
  for (let page = START_PAGE + 1; page <= totalPages; page++) {
    // 每10页汇报一次进度
    if ((page - START_PAGE) % 10 === 0) {
      console.log(`\n  ⏳ 进度汇报: 已处理 ${totalProcessed} 个, 跳过 ${totalSkipped} 个, 失败 ${totalFailed} 个`);
      console.log(`     当前页: ${page}/${totalPages}\n`);
    }

    try {
      const pageData = await fetchPage(page);
      const emptyItems = findEmptyItems(pageData.list);

      if (emptyItems.length === 0) {
        continue; // 无空白，静默跳过
      }

      console.log(`  📄 第 ${page} 页: ${emptyItems.length} 个空白素材`);

      await processWithConcurrency(emptyItems, CONCURRENCY);

    } catch (err) {
      console.error(`  ✗ 第 ${page} 页失败: ${err.message}`);
      // 出错后等待一下再继续
      await new Promise(r => setTimeout(r, 2000));
    }

    // 每页之间短暂间隔，避免API限流
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ 批量处理完成!`);
  console.log(`   总处理: ${totalProcessed} 个素材`);
  console.log(`   跳过(已有信息): ${totalSkipped} 个`);
  console.log(`   失败: ${totalFailed} 个`);
  console.log(`${"=".repeat(60)}\n`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
