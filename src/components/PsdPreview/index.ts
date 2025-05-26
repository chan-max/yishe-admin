/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-05-24 19:59:50
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-05-24 20:54:32
 * @FilePath: /yishe-admin/src/components/PsdPreview/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import PsdPreview from './index.vue'
import { App } from 'vue'

export { PsdPreview }

export default {
  install(app: App) {
    app.component('PsdPreview', PsdPreview)
  }
} 