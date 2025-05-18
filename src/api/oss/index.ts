import { useUserStore } from '@/store/modules/user'
import OSS from 'ali-oss'
import request from '@/config/axios'


function getOSSToken() {
  return request.get({
    url: '/asset/material-sts/ossSTSClient',
  })
}

// 生成client
export async function initOssClient() {
  const data = await getOSSToken()// 获取凭证
  const parseMast = {
    bucket: data.bucketName, // bucket名称
    region: data.region.split('.')[0], // 地域
    accessKeyId: data.accessKeyId,
    accessKeySecret: data.accessKeySecret,
    timeout: 300000,
    stsToken: data.securityToken,
    // expiration: data.expiration,
    refreshSTSToken: async () => {
      const info = await getOSSToken()
      return {
        accessKeyId: info.accessKeyId,
        accessKeySecret: info.accessKeySecret,
        stsToken: info.securityToken
      }
    },
    refreshSTSTokenInterval: data.durationSeconds
  }
  
  return {
    client: new OSS(parseMast),
    config: data
  }
}

export async function uploadOSSFile(file,pathKeyOrPath) {
  const userStore = useUserStore()

  if (!userStore?.oss) {
    return ElMessage.error('oss 未初始化')
  }
  
  const { client, config } = userStore?.oss
  const fileName = file.name;
  const path = config[pathKeyOrPath] || pathKeyOrPath
  
  // const uniqueFileName = `${path}${Date.now()}-${fileName}`;
  // const uniqueFileName = crypto.randomUUID()

  const uniqueFileName = `${path}${Date.now()}/${fileName}`;
  
  return client.put(uniqueFileName, file)
    .then(result => {
      console.log('oss文件上传成功:', result);
      return result;
    })
    .catch(err => {
      ElMessage(`oss 文件上传失败 ${err}`)
      console.error('oss文件上传失败:', err);
      throw err;
    });
}


export function deleteOSSFile(key){
  const userStore = useUserStore()

  if (!userStore?.oss) {
    return ElMessage.error('oss 未初始化')
  }
  
  const { client, config } = userStore?.oss


  return client.delete(key)
    .then(result => {
      console.log('oss文件删除成功:', result);
      return result;
    })
    .catch(err => {
      ElMessage(`oss 文件删除失败 ${err}`)
      console.error('oss文件删除失败:', err);
      throw err;
    });
}
