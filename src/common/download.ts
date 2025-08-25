

export const downloadCrossOriginImage = async (url, filename) => {
  const response = await fetch(url, { mode: 'cors' });
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename || 'download.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // 释放内存
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
};


export function downloadFileByElement(url, fileName) {
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// 新增：专门处理图片下载的函数，确保文件被下载而不是打开新页面
export async function downloadImage(url, fileName) {
  try {
    // 方法1：尝试跨域下载
    await downloadCrossOriginImage(url, fileName);
    return true;
  } catch (crossOriginError) {
    console.warn('跨域下载失败，尝试fetch方法:', crossOriginError);
    
    try {
      // 方法2：使用fetch下载
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // 释放内存
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      return true;
    } catch (fetchError) {
      console.error('fetch下载失败:', fetchError);
      
      try {
        // 方法3：创建Image对象，转换为canvas下载
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              
              canvas.toBlob((blob) => {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = fileName;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // 释放内存
                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                resolve(true);
              }, 'image/png');
            } catch (canvasError) {
              reject(canvasError);
            }
          };
          img.onerror = () => {
            reject(new Error('图片加载失败'));
          };
          img.src = url;
        });
      } catch (canvasError) {
        console.error('canvas下载失败:', canvasError);
        
        // 方法4：最后尝试直接下载
        try {
          downloadFileByElement(url, fileName);
          return true;
        } catch (directError) {
          console.error('直接下载失败:', directError);
          throw new Error('所有下载方法都失败了');
        }
      }
    }
  }
}

// 新增：增强版图片下载方法（支持跨域，带选项和结果返回）
export async function downloadImageEnhanced(url: string, fileName: string, options?: {
  showMessage?: boolean; // 是否显示消息提示
  fallbackToNewWindow?: boolean; // 失败时是否在新窗口打开
}) {
  const { showMessage = true, fallbackToNewWindow = true } = options || {};
  
  try {
    if (showMessage) {
      console.log('正在准备下载...');
    }
    
    // 确保文件名有正确的扩展名
    if (!fileName.includes('.')) {
      const urlParts = url.split('.');
      const extension = urlParts[urlParts.length - 1]?.split('?')[0] || 'jpg';
      fileName = `${fileName}.${extension}`;
    }
    
    // 使用fetch获取图片数据
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 获取图片的blob数据
    const blob = await response.blob();
    
    // 创建blob URL
    const blobUrl = window.URL.createObjectURL(blob);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    
    // 添加到DOM并触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    
    if (showMessage) {
      console.log('下载完成');
    }
    
    return { success: true, fileName };
  } catch (error) {
    console.error('下载失败:', error);
    
    // 如果fetch失败，尝试备用方法
    if (fallbackToNewWindow) {
      try {
        if (showMessage) {
          console.log('尝试备用下载方法...');
        }
        
        // 备用方法：直接在新窗口打开，用户手动保存
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          if (showMessage) {
            console.warn('图片已在新窗口打开，请右键选择"图片另存为"来下载');
          }
          return { success: false, fallback: true, message: '图片已在新窗口打开，请右键选择"图片另存为"来下载' };
        } else {
          if (showMessage) {
            console.error('无法打开新窗口，请检查浏览器设置');
          }
          return { success: false, fallback: false, message: '无法打开新窗口，请检查浏览器设置' };
        }
      } catch (backupError) {
        if (showMessage) {
          console.error('下载失败，请重试');
        }
        return { success: false, fallback: false, message: '下载失败，请重试' };
      }
    }
    
    return { success: false, fallback: false, message: error.message };
  }
}

// 使用示例：
// 
// 1. 基本使用：
// import { downloadImageEnhanced } from '@/common/download'
// 
// // 下载图片
// downloadImageEnhanced('https://example.com/image.jpg', 'my-image')
// 
// 2. 带选项使用：
// downloadImageEnhanced('https://example.com/image.jpg', 'my-image', {
//   showMessage: false,        // 关闭console消息
//   fallbackToNewWindow: true  // 失败时在新窗口打开
// })
// 
// 3. 处理返回结果：
// const result = await downloadImageEnhanced('https://example.com/image.jpg', 'my-image')
// if (result.success) {
//   console.log('下载下载成功:', result.fileName)
// } else if (result.fallback) {
//   console.log('使用备用方法:', result.message)
// } else {
//   console.log('下载失败:', result.message)
// }
// 
// 4. 在其他组件中使用：
// import { downloadImageEnhanced } from '@/common/download'
// 
// // 在Vue组件中
// const handleDownload = async () => {
//   const result = await downloadImageEnhanced(imageUrl, 'image-name')
//   if (result.success) {
//     ElMessage.success('下载成功')
//     } else {
//     ElMessage.warning(result.message)
//   }
// }
