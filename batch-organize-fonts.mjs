#!/usr/bin/env node
/**
 * 字体库自动分类到文件夹脚本（多层级）
 * 
 * 文件夹结构：
 * ├── 中文字体
 * │   ├── 标题字
 * │   ├── 正文字
 * │   ├── 手写体
 * │   └── 装饰体
 * ├── 英文字体
 * │   ├── 衬线体
 * │   ├── 无衬线体
 * │   └── 等宽体
 * ├── 日文字体
 * ├── 韩文字体
 * └── 其他
 * 
 * 用法：
 *   node batch-organize-fonts.mjs [起始页] [并发数]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiYWNjb3VudCI6ImphY2tpZSIsInRlcm1pbmFsVHlwZSI6ImFkbWluIiwidG9rZW5JZCI6Ijc2ZDUzN2E0LTFiYTQtNGFhNS04OTU3LTA3MjI3NTA3MjE5NCIsImlhdCI6MTc4NTQ5MDAxNCwiZXhwIjoyMTAxMDY2MDE0fQ.2ZtokckzvlrQQwBQryeAGkrnnWUVXZQwb6DvYFZq3D4";
const BASE_URL = "http://localhost:1520/api";
const PAGE_SIZE = 20;
const START_PAGE = parseInt(process.argv[2]) || 1;
const CONCURRENCY = parseInt(process.argv[3]) || 2;
const FOLDER_CATEGORY = "fonttemplate";

// 分类映射
const CATEGORY_MAP = {
  '标题字': '标题字', '标题字体': '标题字', 'display': '标题字',
  '正文字': '正文字', '正文字体': '正文字', 'body': '正文字', '黑体': '正文字',
  '手写体': '手写体', '手写字': '手写体', 'handwriting': '手写体', '楷体': '手写体',
  '装饰体': '装饰体', 'decorative': '装饰体', '卡通体': '装饰体',
  '衬线体': '衬线体', 'serif': '衬线体', '宋体': '衬线体', '仿宋': '衬线体',
  '无衬线': '无衬线体', 'sans-serif': '无衬线体', 'sans': '无衬线体',
  '等线体': '等线体', '等宽体': '等线体', 'monospace': '等线体', '等宽': '等线体',
  '哥特体': '哥特体', '像素体': '像素体', '圆体': '圆体',
};

// 语言分类
const LANGUAGE_MAP = {
  'zh-CN': '中文字体', 'zh-TW': '中文字体', 'zh': '中文字体',
  'en': '英文字体', 'ja': '日文字体', 'ko': '韩文字体',
  'ru': '俄文字体', 'ar': '阿拉伯文字体',
};

// 统计
let stats = { totalProcessed: 0, totalSkipped: 0, totalFailed: 0, totalPages: 0, startTime: Date.now() };

// 已处理的 ID 记录
let processedIds = new Set();

// 文件夹缓存（path -> id）
let folderCache = new Map();

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

const CHECKPOINT_FILE = ".font-organize-checkpoint.json";

// 保存断点
function saveCheckpoint() {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify({
    processedIds: Array.from(processedIds),
    timestamp: new Date().toISOString(),
  }, null, 2));
}

// API 请求
async function apiRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE_URL}${url}`, options);
  return res.json();
}

// 获取文件夹树
async function getFolderTree() {
  const json = await apiRequest(`/sticker/sticker-folder/tree?folderCategory=${FOLDER_CATEGORY}`);
  return json.data || [];
}

// 创建文件夹
async function createFolder(name, parentId = null) {
  const json = await apiRequest('/sticker/sticker-folder/create', 'POST', {
    name, parentId, folderCategory: FOLDER_CATEGORY
  });
  if (json.code === 0 || json.data) return json.data;
  throw new Error(json.message || '创建文件夹失败');
}

// 移动字体到文件夹
async function moveFontToFolder(fontId, folderId) {
  return apiRequest('/font-template/batch-move', 'POST', {
    ids: [fontId], folderId
  });
}

// 获取字体详情
async function getFontDetail(id) {
  const json = await apiRequest(`/font-template/${id}`);
  return json.data;
}

// AI 补全字体信息
async function aiComplete(id) {
  return apiRequest(`/font-template/ai-complete/${id}`, 'POST', {});
}

// 初始化文件夹缓存
async function initFolderCache() {
  console.log('📁 初始化文件夹缓存...');
  const tree = await getFolderTree();
  
  function flattenFolders(folders, parentPath = '') {
    for (const folder of folders) {
      const fullPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
      folderCache.set(fullPath, folder.id);
      if (folder.children?.length > 0) {
        flattenFolders(folder.children, fullPath);
      }
    }
  }
  
  flattenFolders(tree);
  console.log(`   已缓存 ${folderCache.size} 个文件夹`);
}

// 获取或创建文件夹（支持多层级）
async function getOrCreateFolderPath(pathParts) {
  let currentParentId = null;
  let currentPath = '';
  
  for (const part of pathParts) {
    currentPath = currentParentId ? `${currentPath}/${part}` : part;
    
    // 检查缓存
    if (folderCache.has(currentPath)) {
      currentParentId = folderCache.get(currentPath);
      continue;
    }
    
    // 创建文件夹
    try {
      const folder = await createFolder(part, currentParentId);
      if (folder?.id) {
        folderCache.set(currentPath, folder.id);
        currentParentId = folder.id;
        stats.foldersCreated++;
        console.log(`  📁 创建: ${currentPath}`);
      }
    } catch (err) {
      console.error(`  ✗ 创建失败: ${currentPath} - ${err.message}`);
      return null;
    }
    
    // 间隔避免过快
    await new Promise(r => setTimeout(r, 100));
  }
  
  return currentParentId;
}

// 确定字体的分类路径
function getFontCategoryPath(fontDetail) {
  const category = fontDetail.category || '';
  const languages = fontDetail.languages || [];
  
  // 1. 确定语言分类（第一层）
  let langFolder = '其他';
  
  // 从 languages 字段判断
  if (languages.length > 0) {
    for (const lang of languages) {
      if (LANGUAGE_MAP[lang]) {
        langFolder = LANGUAGE_MAP[lang];
        break;
      }
    }
  }
  
  // 从名称/描述中判断
  const nameLower = (fontDetail.name || '').toLowerCase();
  const descLower = (fontDetail.description || '').toLowerCase();
  const combined = nameLower + descLower;
  
  if (langFolder === '其他') {
    if (combined.includes('中文') || combined.includes('思源') || combined.includes('方正') || 
        combined.includes('黑体') || combined.includes('宋体') || combined.includes('楷体') ||
        /[\u4e00-\u9fa5]/.test(fontDetail.name || '')) {
      langFolder = '中文字体';
    } else if (combined.includes('japanese') || combined.includes('日文') || combined.includes('gothic') && combined.includes('koz')) {
      langFolder = '日文字体';
    } else if (combined.includes('korean') || combined.includes('韩文') || combined.includes('맑은')) {
      langFolder = '韩文字体';
    } else if (/[a-zA-Z]/.test(fontDetail.name || '') && !/[\u4e00-\u9fa5]/.test(fontDetail.name || '')) {
      langFolder = '英文字体';
    }
  }
  
  // 2. 确定类型分类（第二层）
  let typeFolder = '其他';
  const categoryLower = category.toLowerCase();
  
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (categoryLower.includes(key.toLowerCase()) || combined.includes(key.toLowerCase())) {
      typeFolder = value;
      break;
    }
  }
  
  return [langFolder, typeFolder];
}

// 判断字体是否需要处理
function needsProcessing(item) {
  if (!item.thumbnail) return false;
  // 没有文件夹的需要处理
  if (!item.folderId) return true;
  return false;
}

// 获取字体列表
async function fetchPage(page) {
  const json = await apiRequest('/font-template/page', 'POST', { currentPage: page, pageSize: PAGE_SIZE });
  if (!json.data?.list) throw new Error(`Failed to fetch page ${page}`);
  return json.data;
}

// 处理单个字体
async function processFont(item) {
  if (processedIds.has(item.id)) {
    stats.totalSkipped++;
    return { status: 'skipped', id: item.id };
  }

  try {
    // 1. AI 补全信息
    const result = await aiComplete(item.id);
    
    if (!result.data?.accepted && !result.data?.queued && result.code !== 0) {
      stats.totalFailed++;
      return { status: 'failed', id: item.id, error: result.message || 'AI补全失败' };
    }
    
    // 等待 AI 处理完成
    await new Promise(r => setTimeout(r, 2000));
    
    // 2. 获取更新后的字体详情
    const fontDetail = await getFontDetail(item.id);
    if (!fontDetail) {
      stats.totalFailed++;
      return { status: 'failed', id: item.id, error: '获取字体详情失败' };
    }
    
    // 3. 确定分类路径
    const [langFolder, typeFolder] = getFontCategoryPath(fontDetail);
    
    // 4. 获取或创建多层级文件夹
    const folderId = await getOrCreateFolderPath([langFolder, typeFolder]);
    if (!folderId) {
      stats.totalFailed++;
      return { status: 'failed', id: item.id, error: '创建文件夹失败' };
    }
    
    // 5. 移动字体到文件夹
    if (!fontDetail.folderId || fontDetail.folderId !== folderId) {
      const moveResult = await moveFontToFolder(item.id, folderId);
      if (moveResult.code === 0 || moveResult.data) {
        stats.fontsMoved++;
        console.log(`  📂 ${fontDetail.name || item.id} → ${langFolder}/${typeFolder}`);
      } else {
        console.error(`  ✗ 移动失败: ${fontDetail.name || item.id}`);
      }
    }
    
    stats.totalProcessed++;
    processedIds.add(item.id);
    return { status: 'success', id: item.id };
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
      const result = await processFont(items[i]);
      results.push(result);
      if (stats.totalProcessed % 5 === 0) saveCheckpoint();
    }
  }

  await Promise.all(Array(concurrency).fill(null).map(() => worker()));
  return results;
}

// 打印进度
function printProgress(page, pageResults) {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const success = pageResults.filter(r => r.status === 'success').length;
  const skipped = pageResults.filter(r => r.status === 'skipped').length;
  const failed = pageResults.filter(r => r.status === 'failed').length;
  
  console.log(`  ✓ 第 ${page} 页: 成功 ${success}, 跳过 ${skipped}, 失败 ${failed} (${elapsed}s)`);
}

// 主函数
async function main() {
  console.log(`\n🚀 字体库自动分类到文件夹（多层级）`);
  console.log(`   起始页: ${START_PAGE}, 并发: ${CONCURRENCY}\n`);

  loadCheckpoint();
  await initFolderCache();

  const firstPage = await fetchPage(START_PAGE);
  stats.totalPages = firstPage.total ? Math.ceil(firstPage.total / PAGE_SIZE) : 0;
  console.log(`   总字体: ${firstPage.total}, 总页数: ${stats.totalPages}\n`);

  for (let page = START_PAGE; page <= stats.totalPages; page++) {
    if ((page - START_PAGE) % 20 === 0 && page !== START_PAGE) {
      const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
      console.log(`\n  ⏳ 进度: 已处理 ${stats.totalProcessed} 个, 文件夹 ${stats.foldersCreated} 个, 移动 ${stats.fontsMoved} 个 (${elapsed}s)\n`);
    }

    try {
      const pageData = page === START_PAGE ? firstPage : await fetchPage(page);
      if (pageData.list.length === 0) continue;

      const fontsToProcess = pageData.list.filter(needsProcessing);
      
      if (fontsToProcess.length > 0) {
        console.log(`  📄 第 ${page} 页: ${fontsToProcess.length} 个需要处理`);
        const results = await processWithConcurrency(fontsToProcess, CONCURRENCY);
        printProgress(page, results);
      }
    } catch (err) {
      console.error(`  ✗ 第 ${page} 页失败: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }

    await new Promise(r => setTimeout(r, 500));
  }

  saveCheckpoint();

  const totalTime = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ 完成! 处理 ${stats.totalProcessed} 个, 移动 ${stats.fontsMoved} 个, 创建 ${stats.foldersCreated} 个文件夹 (${totalTime}s)`);
  console.log(`${"=".repeat(60)}\n`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  saveCheckpoint();
  process.exit(1);
});
