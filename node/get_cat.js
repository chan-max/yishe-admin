import { temuPost } from "./auth.js";
import { sleep } from "./utils.js";
import fs from 'fs/promises';
import path from 'path';

var successId = 0;

/**
 * 获取指定父分类下的子分类列表（无限重试）
 * @param {number|null} parentCatId - 父分类ID，null表示获取顶级分类
 * @param {number} retryCount - 当前重试次数（用于计算退避时间）
 * @returns {Promise<Array>} 分类列表
 */
async function getTemuCat(parentCatId = '', retryCount = 0) {
  try {
    const res = await temuPost('bg.goods.cats.get', parentCatId ? { parentCatId } : {});
    
    if (!res?.success) {
      throw new Error(res?.message || '获取分类失败');
    }

    successId++;
    console.log('successId', successId);
    return res?.result?.categoryDTOList || [];
  } catch (error) {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

    console.warn(
      `获取分类失败，正在无限重试... (已尝试 ${retryCount} 次，下次等待 ${delay / 1000} 秒)`,
      error.message
    );
    
    await sleep(delay);
    return getTemuCat(parentCatId, retryCount + 1);
  }
}

/**
 * 递归构建完整的分类树结构（自动无限重试）
 * @param {number|null} parentCatId - 父分类ID，null表示从顶级开始
 * @param {number} depth - 当前递归深度（用于调试）
 * @returns {Promise<Array>} 完整的树形分类结构
 */
async function getCategoryTree(parentCatId = null, depth = 0) {
  try {
    const categories = await getTemuCat(parentCatId);
    
    if (depth === 0) {
      console.log('正在构建分类树（无限重试模式）...');
    }

    const tree = await Promise.all(
      categories.map(async (category) => {
        // 只有当 isLeaf 为 false 时才获取子节点
        const children = category.isLeaf === false 
          ? await getCategoryTree(category.catId, depth + 1)
          : [];
        
        return {
          ...category,
          children
        };
      })
    );

    return tree;
  } catch (error) {
    console.error('严重错误（可能逻辑错误）：', error);
    throw error;
  }
}

/**
 * 将分类树写入文件
 * @param {object} data - 要写入的数据
 * @param {string} filePath - 文件路径
 */
async function writeToFile(data, filePath = 'cat.json') {
  try {
    const dir = path.dirname(filePath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`分类树已成功写入 ${filePath}`);
  } catch (error) {
    console.error('写入文件失败:', error);
    throw error;
  }
}

// 主执行函数
async function main() {
  try {
    const startTime = Date.now();
    const categoryTree = await getCategoryTree();
    const endTime = Date.now();
    
    console.log('分类树构建完成，耗时:', (endTime - startTime) / 1000, '秒');
    
    await writeToFile(categoryTree);
    
    return categoryTree;
  } catch (error) {
    console.error('构建分类树失败（无限重试模式下不应出现此错误）:', error);
    throw error;
  }
}

// 执行主函数
main().catch(console.error);