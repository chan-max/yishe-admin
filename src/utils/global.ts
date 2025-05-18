import { ElMessage } from "element-plus";


export function GlobalDefine(app){
  app.config.globalProperties.ElMessage = ElMessage
}