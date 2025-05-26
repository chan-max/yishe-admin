import { readPsd } from 'ag-psd';

// 下载图片的辅助函数
function downloadImage(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 递归渲染图层的函数
function renderLayer(layer, ctx, layerPath = '') {
  let hasContent = false;
  const currentPath = layerPath ? `${layerPath}/${layer.name || '未命名'}` : layer.name || '未命名';

  if (layer.canvas && !layer.hidden) {
    console.log(`渲染图层: ${currentPath}`);
    ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity / 255 : 1;
    ctx.globalCompositeOperation = layer.blendMode === 'multiply' ? 'multiply' : 'source-over';
    ctx.drawImage(layer.canvas, layer.left || 0, layer.top || 0);
    hasContent = true;
  } else {
    console.log(`跳过图层: ${currentPath}（无图像数据或隐藏）`);
  }

  // 递归处理子图层
  if (layer.children && Array.isArray(layer.children)) {
    layer.children.forEach((childLayer) => {
      if (renderLayer(childLayer, ctx, currentPath)) {
        hasContent = true;
      }
    });
  }

  return hasContent;
}

// 将 PSD 渲染为图片的函数
function renderPsdToImage(psd) {
  const canvas = document.createElement('canvas');
  canvas.width = psd.width;
  canvas.height = psd.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建 canvas context');
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let hasVisibleContent = false;

  // 递归渲染所有图层
  if (psd.children && Array.isArray(psd.children)) {
    psd.children.forEach((layer) => {
      if (renderLayer(layer, ctx)) {
        hasVisibleContent = true;
      }
    });
  }

  // 后备：使用合成图像
  if (!hasVisibleContent && psd.canvas) {
    console.log('无可见子图层，渲染合成图像');
    ctx.drawImage(psd.canvas, 0, 0);
    hasVisibleContent = true;
  }

  if (!hasVisibleContent) {
    console.warn('警告：没有找到可渲染的图层或合成图像，输出可能为空白');
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  return canvas.toDataURL('image/png');
}

// 主函数：解析 PSD 并导出为图片
export async function parseAndExportPsd(psdUrl = '/s.psd', outputFilename = 'psd-export.png') {
  try {
    const response = await fetch(psdUrl);
    if (!response.ok) {
      throw new Error(`无法加载 PSD 文件: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    console.log('PSD 文件大小:', arrayBuffer.byteLength, '字节');

    const psd = readPsd(arrayBuffer, {
      skipLayerImageData: false,
      skipCompositeImageData: false,
      skipThumbnail: false
    });

    console.log('PSD 文件信息：');
    console.log(`宽度: ${psd.width}px`);
    console.log(`高度: ${psd.height}px`);
    console.log(`图层数量: ${psd.children?.length || 0}`);
    console.log(`是否有合成图像: ${!!psd.canvas}`);

    // 递归输出图层信息
    function logLayer(layer, layerPath = '') {
      const currentPath = layerPath ? `${layerPath}/${layer.name || '未命名'}` : layer.name || '未命名';
      console.log(`图层: ${currentPath}`);
      console.log(`  类型: ${layer.type || '未知'}`);
      console.log(`  不透明度: ${(layer.opacity !== undefined ? (layer.opacity / 255 * 100).toFixed(2) : 100)}%`);
      console.log(`  隐藏: ${layer.hidden ? '是' : '否'}`);
      console.log(`  位置: (${layer.left || 0}, ${layer.top || 0})`);
      console.log(`  尺寸: (${layer.right - layer.left || 0}, ${layer.bottom - layer.top || 0})`);
      console.log(`  有图像数据: ${!!layer.canvas}`);
      console.log(`  混合模式: ${layer.blendMode || 'normal'}`);
      if (layer.children && Array.isArray(layer.children)) {
        layer.children.forEach((childLayer) => logLayer(childLayer, currentPath));
      }
    }

    if (psd.children && psd.children.length > 0) {
      console.log('\n图层详情：');
      psd.children.forEach((layer) => logLayer(layer));
    } else {
      console.log('无子图层');
    }

    const imageUrl = renderPsdToImage(psd);

    const img = document.createElement('img');
    img.src = imageUrl;
    document.body.appendChild(img);

    downloadImage(imageUrl, outputFilename);

    return {
      psd,
      imageUrl
    };
  } catch (error) {
    console.error('处理 PSD 文件时出错:', error);
    throw error;
  }
}

export const psdTest = parseAndExportPsd;