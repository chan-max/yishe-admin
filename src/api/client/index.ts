/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-06-11 21:40:46
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-11 22:17:08
 * @FilePath: /yishe-admin/src/api/client/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/config/axios'

const LOCAL_CLIENT_SERVER = 'http://localhost:1519'

export async function publishToSocialMedia(data){
  return await request.post({ url: `${LOCAL_CLIENT_SERVER}/api/publishProductToSocialMedia`, data })
}