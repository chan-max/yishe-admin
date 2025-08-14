import { toPng } from 'html-to-image';

/**
 * 将HTML元素转换为PNG文件
 * @param html HTML元素
 * @param name 文件名（可选）
 * @returns Promise<File>
 */
export async function htmlToPngFile(html: HTMLElement, name = ''): Promise<File> {
  const base64 = await toPng(html);
  return base64ToPngFile(base64, name);
}

/**
 * 将base64数据转换为PNG文件
 * @param base64Data base64数据
 * @param name 文件名（可选）
 * @returns File
 */
export function base64ToPngFile(base64Data: string, name = ''): File {
  return base64ToFile(base64Data, (name || new Date().getTime()) + '.png', 'image/png');
}

/**
 * 将base64数据转换为文件
 * @param base64Data base64数据
 * @param tempfilename 临时文件名
 * @param contentType 内容类型
 * @returns File
 */
export function base64ToFile(base64Data: string, tempfilename = (new Date().getTime()) + '.png', contentType = 'image/png'): File {
  contentType = contentType || '';
  const sliceSize = 1024;
  base64Data = base64Data.split(',')[1];
  const byteCharacters = atob(base64Data);
  const bytesLength = byteCharacters.length;
  const slicesCount = Math.ceil(bytesLength / sliceSize);
  const byteArrays = new Array(slicesCount);

  for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    const begin = sliceIndex * sliceSize;
    const end = Math.min(begin + sliceSize, bytesLength);

    const bytes = new Array(end - begin);
    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new File(byteArrays, tempfilename, { type: contentType });
}
