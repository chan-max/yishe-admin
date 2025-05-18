import type { App } from 'vue'
import { Icon } from './Icon'
import formItem from './Erp/formItem.vue'
import SingleImage from './SingleImage.vue'
import RemoteSelect from './RemoteSelect/index.vue'
import DateRangePicker from './DateRangePicker.vue'

export const setupGlobCom = (app: App<Element>): void => {
  app.component('DateRangePicker', DateRangePicker)
  app.component('formItem', formItem)
  app.component('SingleImage', SingleImage)
  app.component('RemoteSelect', RemoteSelect)
  app.component('Icon', Icon)
}
