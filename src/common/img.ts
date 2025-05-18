

export async function getImageDimensionsViaImageBitmap(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = {
      width: bitmap.width,
      height: bitmap.height
    };
    bitmap.close(); // 释放内存
    return dimensions;
  } catch (error) {
    console.error('无法解析图片: ' + error.message);
    return {
      width: 0,
      height: 0
    }
  }
}