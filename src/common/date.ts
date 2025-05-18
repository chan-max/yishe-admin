

// export function formatTimestamp(params) {

//     if(!params){
//         return ''
//     }

//     const year = params[0];
//     const month = String(params[1]).padStart(2, '0');  // 补零
//     const day = String(params[2]).padStart(2, '0');    // 补零
//     const hours = String(params[3]).padStart(2, '0');  // 补零
//     const minutes = String(params[4]).padStart(2, '0'); // 补零

//     return `${year}-${month}-${day} ${hours}:${minutes}`; // 返回格式化时间
// }


export function formatTimestamp(timestamp) {
    if(!timestamp){
      return ''
    }
    const date = new Date(timestamp);
  
    // 提取年、月、日、时、分、秒
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需要 +1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    // 组合成 "年-月-日 时:分:秒" 的格式
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

