/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-05-19 05:55:18
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-08-14 07:28:58
 * @FilePath: /yishe-scripts/Users/jackie/workspace/yishe-admin/src/components/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { App } from 'vue'
import { Icon } from './Icon'
import { setupAppLoading } from './AppLoading'
import formItem from './Erp/formItem.vue'
import SingleImage from './SingleImage.vue'
import RemoteSelect from './RemoteSelect/index.vue'
import DateRangePicker from './DateRangePicker.vue'
import ImagePreview from './ImagePreview/index.vue'

export const setupGlobCom = (app: App<Element>): void => {
  setupAppLoading(app)
  app.component('DateRangePicker', DateRangePicker)
  app.component('FormItem', formItem)
  app.component('SingleImage', SingleImage)
  app.component('RemoteSelect', RemoteSelect)
  app.component('Icon', Icon)
  app.component('ImagePreview', ImagePreview)
}
