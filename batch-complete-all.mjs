#!/usr/bin/env node
/**
 * 统一资源信息补全和分类脚本
 * 同时处理：字体库 + PSD模板
 * 
 * 功能：
 * 1. AI 补全信息（name, description, keywords, category）
 * 2. 自动创建多层级文件夹并归类
 * 
 * 用法：
 *   node batch-complete-all.mjs [类型] [起始页] [并发数]
 * 
 * 示例：
 *   node batch-complete-all.mjs all 1 2    # 处理所有类型
 *   node batch-complete-all.mjs font 1 2   # 只处理字体
 *   node batch-complete-all.mjs psd 1 2    # 只处理PSD模板
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiYWNjb3VudCI6ImphY2tpZSIsInRlcm1pbmFsVHlwZSI6ImFkbWluIiwidG9rZW5JZCI6Ijc2ZDUzN2E0LTFiYTQtNGFhNS04OTU3LTA3MjI3NTA3MjE5NCIsImlhdCI6MTc4NTQ5MDAxNCwiZXhwIjoyMTAxMDY2MDE0fQ.2ZtokckzvlrQQwBQryeAGkrnnWUVXZQwb6DvYFZq3D4";
const BASE_URL = "http://localhost:1520/api";
const PAGE_SIZE = 20;

// 命令行参数
const TYPE = process.argv[2] || 'all'; // all, font, psd
const START_PAGE = parseInt(process.argv[3]) || 1;
const CONCURRENCY = parseInt(process.argv[4]) || 2;

// 资源类型配置
const RESOURCE_TYPES = {
  font: {
    name: '字体库',
    apiPrefix: '/font-template',
    folderCategory: 'fonttemplate',
    checkpointFile: '.font-complete-checkpoint.json',
    organizeCheckpoint: '.font-organize-checkpoint.json',
    // 分类映射
    categoryMap: {
      '标题字': '标题字', '标题字体': '标题字', 'display': '标题字',
      '正文字': '正文字', '正文字体': '正文字', 'body': '正文字', '黑体': '正文字',
      '手写体': '手写体', '手写字': '手写体', 'handwriting': '手写体', '楷体': '手写体',
      '装饰体': '装饰体', 'decorative': '装饰体', '卡通体': '装饰体',
      '衬线体': '衬线体', 'serif': '衬线体', '宋体': '衬线体', '仿宋': '衬线体',
      '无衬线': '无衬线体', 'sans-serif': '无衬线体', 'sans': '无衬线体',
      '等线体': '等线体', '等宽体': '等线体', 'monospace': '等线体',
      '哥特体': '哥特体', '像素体': '像素体', '圆体': '圆体',
    },
    languageMap: {
      'zh-CN': '中文字体', 'zh-TW': '中文字体', 'zh': '中文字体',
      'en': '英文字体', 'ja': '日文字体', 'ko': '韩文字体',
      'ru': '俄文字体', 'ar': '阿拉伯文字体',
    }
  },
  psd: {
    name: 'PSD模板',
    apiPrefix: '/psd-template',
    folderCategory: 'psdtemplate',
    checkpointFile: '.psd-complete-checkpoint.json',
    organizeCheckpoint: '.psd-organize-checkpoint.json',
    // PSD模板分类映射
    categoryMap: {
      '电商': '电商', '海报': '海报', 'Banner': 'Banner', 'banner': 'Banner',
      '名片': '名片', 'Logo': 'Logo', 'logo': 'Logo',
      '社交': '社交媒体', '微信': '社交媒体', '小红书': '社交媒体',
      '名片': '名片', '邀请函': '邀请函', '证书': '证书',
      'UI': 'UI设计', 'APP': 'UI设计', '界面': 'UI设计',
      '视频': '视频', '封面': '封面', '头像': '头像',
    },
    languageMap: {
      'zh-CN': '中文模板', 'zh-TW': '中文模板',
      'en': '英文模板', 'ja': '日文模板', 'ko': '韩文模板',
    }
  }
};

// 确定处理哪些类型
const typesToProcess = TYPE === 'all' ? ['font', 'psd'] : [TYPE];

// 统计
let allStats = {};

// 已处理的 ID 记录
let processedIds = {};

// 文件夹缓存
let folderCache = new Map();

// 加载断点
function loadCheckpoint(type) {
  const config = RESOURCE_TYPES[type];
  const file = config.checkpointFile;
  if (existsSync(file)) {
    try {
      const data = JSON.parse(readFileSync(file, 'utf-8'));
      processedIds[type] = new Set(data.processedIds || []);
      console.log(`📂 [${config.name}] 加载断点：${processedIds[type].size} 个`);
    } catch (e) {
      processedIds[type] = new Set();
    }
  } else {
    processedIds[type] = new Set();
  }
}

// 保存断点
function saveCheckpoint(type) {
  const config = RESOURCE_TYPES[type];
  writeFileSync(config.checkpointFile, JSON.stringify({
    processedIds: Array.from(processedIds[type] || []),
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
async function getFolderTree(folderCategory) {
  const json = await apiRequest(`/sticker/sticker-folder/tree?folderCategory=${folderCategory}`);
  return json.data || [];
}

// 创建文件夹
async function createFolder(name, parentId, folderCategory) {
  const json = await apiRequest('/sticker/sticker-folder/create', 'POST', {
    name, parentId, folderCategory
  });
  if (json.code === 0 || json.data) return json.data;
  throw new Error(json.message || '创建文件夹失败');
}

// 初始化文件夹缓存
async function initFolderCache(type) {
  const config = RESOURCE_TYPES[type];
  console.log(`📁 [${config.name}] 初始化文件夹缓存...`);
  const tree = await getFolderTree(config.folderCategory);
  
  function flattenFolders(folders, parentPath = '') {
    for (const folder of folders) {
      const fullPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
      folderCache.set(`${type}:${fullPath}`, folder.id);
      if (folder.children?.length > 0) {
        flattenFolders(folder.children, fullPath);
      }
    }
  }
  
  flattenFolders(tree);
  console.log(`   已缓存 ${tree.length} 个根文件夹`);
}

// 获取或创建多层级文件夹
async function getOrCreateFolderPath(type, pathParts) {
  const config = RESOURCE_TYPES[type];
  let currentParentId = null;
  let currentPath = '';
  
  for (const part of pathParts) {
    currentPath = currentParentId ? `${currentPath}/${part}` : part;
    const cacheKey = `${type}:${currentPath}`;
    
    if (folderCache.has(cacheKey)) {
      currentParentId = folderCache.get(cacheKey);
      continue;
    }
    
    try {
      const folder = await createFolder(part, currentParentId, config.folderCategory);
      if (folder?.id) {
        folderCache.set(cacheKey, folder.id);
        currentParentId = folder.id;
        console.log(`  📁 创建: ${currentPath}`);
      }
    } catch (err) {
      console.error(`  ✗ 创建失败: ${currentPath} - ${err.message}`);
      return null;
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  return currentParentId;
}

// 确定分类路径
function getCategoryPath(type, item) {
  const config = RESOURCE_TYPES[type];
  const category = item.category || '';
  const languages = item.languages || [];
  
  // 第一层：语言/大类
  let langFolder = '其他';
  if (languages.length > 0) {
    for (const lang of languages) {
      if (config.languageMap[lang]) {
        langFolder = config.languageMap[lang];
        break;
      }
    }
  }
  
  if (langFolder === '其他') {
    const nameLower = (item.name || '').toLowerCase();
    const combined = nameLower + (item.description || '').toLowerCase();
    
    if (type === 'font') {
      if (combined.includes('中文') || combined.includes('思源') || /[\u4e00-\u9fa5]/.test(item.name || '')) {
        langFolder = '中文字体';
      } else if (/[a-zA-Z]/.test(item.name || '') && !/[\u4e00-\u9fa5]/.test(item.name || '')) {
        langFolder = '英文字体';
      }
    } else if (type === 'psd') {
      if (/[\u4e00-\u9fa5]/.test(item.name || '')) {
        langFolder = '中文模板';
      } else {
        langFolder = '英文模板';
      }
    }
  }
  
  // 第二层：类型
  let typeFolder = '其他';
  const categoryLower = (category || '').toLowerCase();
  const nameAndDesc = ((item.name || '') + ' ' + (item.description || '')).toLowerCase();
  
  // 先从category匹配
  for (const [key, value] of Object.entries(config.categoryMap)) {
    if (categoryLower.includes(key.toLowerCase())) {
      typeFolder = value;
      break;
    }
  }
  
  // 如果还是其他，从名称和描述推断
  if (typeFolder === '其他') {
    if (type === 'psd') {
      if (nameAndDesc.includes('电商') || nameAndDesc.includes('商品') || nameAndDesc.includes('产品')) typeFolder = '电商';
      else if (nameAndDesc.includes('海报') || nameAndDesc.includes('宣传')) typeFolder = '海报';
      else if (nameAndDesc.includes('名片')) typeFolder = '名片';
      else if (nameAndDesc.includes('logo') || nameAndDesc.includes('标志')) typeFolder = 'Logo';
      else if (nameAndDesc.includes('banner') || nameAndDesc.includes('横幅')) typeFolder = 'Banner';
      else if (nameAndDesc.includes('社交') || nameAndDesc.includes('微信') || nameAndDesc.includes('小红书')) typeFolder = '社交媒体';
      else if (nameAndDesc.includes('ui') || nameAndDesc.includes('界面') || nameAndDesc.includes('app')) typeFolder = 'UI设计';
      else if (nameAndDesc.includes('封面') || nameAndDesc.includes('头图')) typeFolder = '封面';
      else if (nameAndDesc.includes('邀请') || nameAndDesc.includes('请柬')) typeFolder = '邀请函';
      else if (nameAndDesc.includes('证书') || nameAndDesc.includes('奖状')) typeFolder = '证书';
      else if (nameAndDesc.includes('杯') || nameAndDesc.includes('马克杯')) typeFolder = '产品样机';
      else if (nameAndDesc.includes('广告') || nameAndDesc.includes('户外')) typeFolder = '广告';
    } else if (type === 'font') {
      if (nameAndDesc.includes('标题') || nameAndDesc.includes('粗') || nameAndDesc.includes('bold')) typeFolder = '标题字';
      else if (nameAndDesc.includes('正文') || nameAndDesc.includes('细') || nameAndDesc.includes('light')) typeFolder = '正文字';
      else if (nameAndDesc.includes('手写') || nameAndDesc.includes('楷')) typeFolder = '手写体';
      else if (nameAndDesc.includes('衬线') || nameAndDesc.includes('serif') || nameAndDesc.includes('宋')) typeFolder = '衬线体';
      else if (nameAndDesc.includes('无衬线') || nameAndDesc.includes('sans')) typeFolder = '无衬线体';
    }
  }
  
  return [langFolder, typeFolder];
}

// 获取资源列表
async function fetchPage(type, page) {
  const config = RESOURCE_TYPES[type];
  const json = await apiRequest(`${config.apiPrefix}/page`, 'POST', { currentPage: page, pageSize: PAGE_SIZE });
  if (!json.data?.list) throw new Error(`Failed to fetch page ${page}`);
  return json.data;
}

// 获取资源详情
async function getDetail(type, id) {
  const config = RESOURCE_TYPES[type];
  const json = await apiRequest(`${config.apiPrefix}/${id}`);
  return json.data;
}

// AI 补全
async function aiComplete(type, id) {
  const config = RESOURCE_TYPES[type];
  return apiRequest(`${config.apiPrefix}/ai-complete/${id}`, 'POST', {});
}

// 移动到文件夹
async function moveToFolder(type, id, folderId) {
  const config = RESOURCE_TYPES[type];
  return apiRequest(`${config.apiPrefix}/batch-move`, 'POST', { ids: [id], folderId });
}

// 判断是否需要处理
function needsProcessing(item) {
  // 没有缩略图和URL的跳过
  if (!item.thumbnail && !item.url) return false;
  
  // 没有文件夹的需要处理
  if (!item.folderId) return true;
  
  return false;
}

// 判断是否需要AI补全
function needsAiComplete(item) {
  // 已有完整信息的跳过
  if (item.name && item.description && item.keywords && item.category) {
    const nameQuality = item.name.length >= 3 && !/^(字体|font|未命名|test|PSD|psd)/i.test(item.name);
    const descQuality = item.description.length >= 30;
    const keywordsQuality = (item.keywords || '').split(',').length >= 3;
    
    if (nameQuality && descQuality && keywordsQuality) {
      return false; // 信息质量好，跳过AI补全
    }
  }
  return true;
}

// 处理单个资源
async function processItem(type, item) {
  if (processedIds[type]?.has(item.id)) {
    return { status: 'skipped', id: item.id };
  }

  try {
    let detail = item;
    
    // 如果需要AI补全
    if (needsAiComplete(item)) {
      const result = await aiComplete(type, item.id);
      if (!result.data?.accepted && !result.data?.queued && result.code !== 0) {
        return { status: 'failed', id: item.id, error: result.message || 'AI补全失败' };
      }
      
      // 等待AI处理完成（异步任务需要更长时间）
      await new Promise(r => setTimeout(r, 5000));
      
      // 获取更新后的详情
      detail = await getDetail(type, item.id);
      if (!detail) return { status: 'failed', id: item.id, error: '获取详情失败' };
    }
    
    // 确定分类路径
    const [langFolder, typeFolder] = getCategoryPath(type, detail);
    
    // 创建文件夹
    const folderId = await getOrCreateFolderPath(type, [langFolder, typeFolder]);
    if (!folderId) return { status: 'failed', id: item.id, error: '创建文件夹失败' };
    
    // 移动
    if (!detail.folderId || detail.folderId !== folderId) {
      await moveToFolder(type, item.id, folderId);
      console.log(`  📂 ${detail.name || item.id} → ${langFolder}/${typeFolder}`);
    }
    
    processedIds[type]?.add(item.id);
    return { status: 'success', id: item.id };
  } catch (err) {
    return { status: 'failed', id: item.id, error: err.message };
  }
}

// 并发处理
async function processWithConcurrency(type, items, concurrency) {
  let index = 0;
  const results = [];

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const result = await processItem(type, items[i]);
      results.push(result);
      if (results.length % 5 === 0) saveCheckpoint(type);
    }
  }

  await Promise.all(Array(concurrency).fill(null).map(() => worker()));
  return results;
}

// 处理单个类型
async function processType(type) {
  const config = RESOURCE_TYPES[type];
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 开始处理: ${config.name}`);
  console.log(`${"=".repeat(60)}\n`);

  loadCheckpoint(type);
  await initFolderCache(type);

  const firstPage = await fetchPage(type, START_PAGE);
  const totalPages = firstPage.total ? Math.ceil(firstPage.total / PAGE_SIZE) : 0;
  console.log(`   总数: ${firstPage.total}, 总页数: ${totalPages}\n`);

  let processed = 0, skipped = 0, failed = 0;

  for (let page = START_PAGE; page <= totalPages; page++) {
    try {
      const pageData = page === START_PAGE ? firstPage : await fetchPage(type, page);
      if (pageData.list.length === 0) continue;

      const itemsToProcess = pageData.list.filter(needsProcessing);
      
      if (itemsToProcess.length > 0) {
        console.log(`  📄 第 ${page} 页: ${itemsToProcess.length} 个需要处理`);
        const results = await processWithConcurrency(type, itemsToProcess, CONCURRENCY);
        
        const success = results.filter(r => r.status === 'success').length;
        const fail = results.filter(r => r.status === 'failed').length;
        processed += success;
        failed += fail;
        
        console.log(`  ✓ 完成: 成功 ${success}, 失败 ${fail}`);
      }
    } catch (err) {
      console.error(`  ✗ 第 ${page} 页失败: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }

    await new Promise(r => setTimeout(r, 500));
  }

  saveCheckpoint(type);
  console.log(`\n✅ ${config.name}处理完成: 成功 ${processed}, 失败 ${failed}\n`);
  
  return { type: config.name, processed, failed };
}

// 主函数
async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 统一资源信息补全和分类`);
  console.log(`   处理类型: ${typesToProcess.join(', ')}`);
  console.log(`   起始页: ${START_PAGE}, 并发: ${CONCURRENCY}`);
  console.log(`${"=".repeat(60)}`);

  const results = [];
  
  for (const type of typesToProcess) {
    if (!RESOURCE_TYPES[type]) {
      console.error(`未知类型: ${type}`);
      continue;
    }
    const result = await processType(type);
    results.push(result);
  }

  // 打印汇总
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 汇总`);
  console.log(`${"=".repeat(60)}`);
  for (const r of results) {
    console.log(`  ${r.type}: 成功 ${r.processed}, 失败 ${r.failed}`);
  }
  console.log(`${"=".repeat(60)}\n`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  typesToProcess.forEach(type => saveCheckpoint(type));
  process.exit(1);
});
