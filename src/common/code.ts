/**
 * 生成随机商品番号
 * 规则：随机1-5个字母 + '-' + 随机1-5个数字
 * @returns {string} 生成的番号
 */
export function generateProductCode(): string {
  // 生成随机1-5个字母
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letterCount = Math.floor(Math.random() * 5) + 1;
  let letterPart = '';
  for (let i = 0; i < letterCount; i++) {
    letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // 生成随机1-5个数字
  const numberCount = Math.floor(Math.random() * 5) + 1;
  let numberPart = '';
  for (let i = 0; i < numberCount; i++) {
    numberPart += Math.floor(Math.random() * 10).toString();
  }

  return `${letterPart}-${numberPart}`;
} 