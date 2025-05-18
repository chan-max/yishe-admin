

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
