

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
