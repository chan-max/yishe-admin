

/**
 * 带节流的数组循环
 * @param {Array} array - 要遍历的数组
 * @param {Function} callback - 每次循环的回调函数
 * @param {number} batchSize - 每批处理的元素数量
 * @param {number} delay - 每批处理后的延迟时间（毫秒）
 */
export function throttleLoop(array, callback, batchSize = 10, delay = 100) {
  let index = 0;

  function processBatch() {
    const end = Math.min(index + batchSize, array.length);
    for (; index < end; index++) {
      callback(array[index], index, array);
    }

    if (index < array.length) {
      // 如果还有剩余元素，继续处理下一批
      setTimeout(processBatch, delay);
    }
  }

  // 启动循环
  processBatch();
}


/**
 * 带节流的数组循环（使用 requestAnimationFrame）
 * @param {Array} array - 要遍历的数组
 * @param {Function} callback - 每次循环的回调函数
 * @param {number} batchSize - 每批处理的元素数量
 */
export function throttleLoopWithRAF(array, callback, batchSize = 10) {
  let index = 0;

  function processBatch() {
    const start = performance.now();
    let end = Math.min(index + batchSize, array.length);

    // 处理当前批次
    for (; index < end; index++) {
      callback(array[index], index, array);
    }

    // 如果还有剩余元素，继续处理下一批
    if (index < array.length) {
      if (performance.now() - start < 16) {
        // 如果当前批次处理时间小于 16ms（约 60fps），继续处理下一批
        processBatch();
      } else {
        // 否则，等待下一帧
        requestAnimationFrame(processBatch);
      }
    }
  }

  // 启动循环
  processBatch();
}