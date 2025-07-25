/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-05-24 15:47:05
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-06-18 07:22:31
 * @FilePath: /yishe-admin/src/api/cos.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import { generateUUID } from '@/utils'
import COS from 'cos-js-sdk-v5'
import { saveAs } from 'file-saver'
import request from '@/config/axios'

let _cos = null
let _cosConfig = null

// 解码函数（使用Base64）
const decryptConfig = (encodedConfig: any) => {
  const decrypted = {}
  
  console.log('开始解码配置:', encodedConfig)
  
  for (const [key, value] of Object.entries(encodedConfig)) {
    if (typeof value === 'string') {
      try {
        // 使用Base64解码
        const decoded = atob(value)
        decrypted[key] = decoded
        console.log(`解码成功 ${key}:`, decoded)
      } catch (error) {
        console.error(`解码失败 ${key}:`, error)
        // 如果解码失败，可能是未编码的值
        decrypted[key] = value
      }
    } else {
      decrypted[key] = value
    }
  }
  
  console.log('解码后的配置:', decrypted)
  return decrypted
}

// 初始化COS配置，只在项目启动时调用一次
export const initCOS = async () => {
  if (_cos) {
    return _cos
  }

  try {
    console.log('开始获取COS配置...')
    const res = await request.post({
      url: '/getBasicConfig'
    })
    
    console.log('获取到的原始配置:', res.cos)
    
    // 解码配置
    _cosConfig = decryptConfig(res.cos)
    
    console.log('解码后的COS配置:', _cosConfig)
    
    _cos = new COS({
      SecretId: _cosConfig.SecretId,
      SecretKey: _cosConfig.SecretKey,
      Bucket: _cosConfig.Bucket,
      Region: _cosConfig.Region
    } as any)
    
    console.log('COS客户端初始化成功')
    return _cos
  } catch (error) {
    console.error('获取COS配置失败:', error)
    throw error
  }
}

export const getCOS = () => {
  if (!_cos) {
    throw new Error('COS未初始化，请先调用initCOS()')
  }
  return _cos
}

export async function uploadToCOS({
  file,
  key = new Date().getTime() + '_1s_' + generateUUID()
}) {
  const cos = getCOS()
  try {
    console.log('开始上传文件到COS...')
    const res = await cos.uploadFile({
      Key: String(key),
      Body: file,
      Bucket: cos.options.Bucket,
      Region: cos.options.Region
    })
    console.log('文件上传成功:', res)
    return {
      url: `https://${res.Location}`,
      key
    }
  } catch (e) {
    console.error('文件上传失败:', e)
    throw e
  }
}

export async function deleteCOSFile(key) {
  if (key.startsWith('http')) {
    // 如果是链接则会
    key = key.substring(key.lastIndexOf('/') + 1)
  }

  return new Promise((resolve, reject) => {
    const cos = getCOS()
    key = String(key)
    cos.deleteObject(
      {
        Bucket: cos.options.Bucket,
        Region: cos.options.Region,
        Key: key
      },
      function (err, data) {
        if (err) {
          console.error('删除文件失败:', err)
          reject(err)
        } else {
          console.log('删除文件成功:', data)
          resolve(data)
        }
      }
    )
  })
}

// 复制COS对象
export async function copyCOSObject(sourceUrl, targetKey = null) {
  return new Promise((resolve, reject) => {
    const cos = getCOS()
    
    // 从URL中提取源对象的key
    let sourceKey = sourceUrl
    if (sourceUrl.startsWith('http')) {
      // 移除域名部分，只保留路径
      const urlObj = new URL(sourceUrl)
      sourceKey = urlObj.pathname.substring(1) // 移除开头的斜杠
    }
    
    // 如果没有指定目标key，则生成一个新的
    if (!targetKey) {
      targetKey = new Date().getTime() + '_1s_' + generateUUID()
    }
    
    cos.copyObject(
      {
        Bucket: cos.options.Bucket,
        Region: cos.options.Region,
        Key: targetKey,
        CopySource: `${cos.options.Bucket}.cos.${cos.options.Region}.myqcloud.com/${sourceKey}`
      },
      function (err, data) {
        if (err) {
          console.error('复制文件失败:', err)
          reject(err)
        } else {
          console.log('复制文件成功:', data)
          resolve({
            url: `https://${data.Location}`,
            key: targetKey
          })
        }
      }
    )
  })
}

function removeProtocol(url) {
  if (url.startsWith('http://')) {
    return url.replace('http://', '')
  }

  if (url.startsWith('https://')) {
    return url.replace('https://', '')
  }
}

export function downloadCOSFile(key) {
  const filename = key.split('_1s_')[1]
  if (!filename) {
    return
  }
  return saveAs(key, filename)
}
