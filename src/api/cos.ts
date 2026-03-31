/*
 * @Author: chan-max jackieontheway666@gmail.com
 * @Date: 2025-05-24 15:47:05
 * @LastEditors: chan-max jackieontheway666@gmail.com
 * @LastEditTime: 2025-11-20 07:30:07
 * @FilePath: /yishe-admin/src/api/cos.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import { generateUUID } from '@/utils'
import COS from 'cos-js-sdk-v5'
import { saveAs } from 'file-saver'
import request from '@/config/axios'
import * as CryptoJS from 'crypto-js'

let _cos = null
let _cosConfig = null

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 解密函数（使用 AES-256-CBC）
const decryptConfig = (encryptedString: string) => {
  const SECRET_KEY = '1s';
  
  try {
    // 使用 AES-256-CBC 解密
    const decrypted = CryptoJS.AES.decrypt(encryptedString, SECRET_KEY, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // 转换为字符串
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('解密失败：返回结果为空');
    }
    
    // 解析 JSON 对象
    const config = JSON.parse(decryptedString);
    
    return config;
  } catch (error: any) {
    throw new Error(`解密配置失败: ${error?.message || '未知错误'}`)
  }
}

const extractEncryptedConfig = (payload: any): string => {
  if (typeof payload === 'string') {
    return payload
  }
  if (payload && typeof payload.data === 'string') {
    return payload.data
  }
  throw new Error('COS配置响应格式无效')
}

// 初始化COS配置，只在项目启动时调用一次
export const initCOS = async () => {
  if (_cos) {
    return _cos
  }

  let lastError: any = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await request.post({
        url: '/getBasicConfig'
      })

      const encryptedConfig = extractEncryptedConfig(res)
      _cosConfig = decryptConfig(encryptedConfig)

      _cos = new COS({
        SecretId: _cosConfig.SecretId,
        SecretKey: _cosConfig.SecretKey,
        Bucket: _cosConfig.Bucket,
        Region: _cosConfig.Region
      } as any)

      return _cos
    } catch (error: any) {
      lastError = error
      if (attempt < 3) {
        await sleep(500 * attempt)
      }
    }
  }

  throw lastError
}

export const getCOS = () => {
  if (!_cos) {
    throw new Error('COS未初始化，请先调用initCOS()')
  }
  return _cos
}

/**
 * 上传文件到 COS
 * @param file 文件对象
 * @param key 文件在 COS 中的存储路径（可选，如果提供则直接使用）
 * @param category 文件分类（如 sticker, product, psd-template 等，应与实体名称一致）
 * @param account 用户账号（可选，默认从 userStore 获取）
 * @param entityId 实体ID（可选，如 PSD 模板 ID、字体模板 ID 等）
 * @param isThumbnail 是否为缩略图（可选）
 */
export async function uploadToCOS({
  file,
  key,
  category,
  account,
  entityId,
  isThumbnail
}: {
  file: File
  key?: string
  category?: string
  account?: string
  entityId?: string | number
  isThumbnail?: boolean
}) {
  // 确保 COS 已初始化
  if (!_cos) {
    try {
      await initCOS()
    } catch {
      throw new Error('COS未初始化，无法上传文件')
    }
  }
  
  const cos = getCOS()
  
  // 验证文件对象
  if (!file) {
    throw new Error('文件对象不能为空')
  }
  
  if (!(file instanceof File) && !(file instanceof Blob)) {
    throw new Error('文件对象类型不正确')
  }
  
  // 如果没有提供 key，且提供了 category，则生成新格式的 key
  let finalKey = key
  if (!finalKey && category) {
    // 获取用户账号
    let userAccount = account
    if (!userAccount) {
      try {
        // 尝试从 localStorage 获取用户信息
        const userInfoStr = localStorage.getItem('USER')
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr)
          userAccount = userInfo?.user?.account || userInfo?.user?.shortName || userInfo?.user?.name || 'anonymous'
        }
      } catch {
      }
      if (!userAccount) {
        userAccount = 'anonymous'
      }
    }
    
    // 清理账号名称
    userAccount = userAccount.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase().substring(0, 50)
    // 确保 userAccount 不为空
    if (!userAccount || userAccount.trim() === '') {
      userAccount = 'anonymous'
    }
    
    // 生成日期字符串
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    
    // 生成时间戳
    const timestamp = now.getTime()
    
    // 清理文件名
    const sanitizeFilename = (filename: string) => {
      if (!filename) return 'file'
      return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200)
    }
    
    const sanitizedFilename = sanitizeFilename(file.name || 'file')
    
    // 处理 entityId
    const sanitizedEntityId = entityId 
      ? String(entityId).replace(/[^a-zA-Z0-9_-]/g, '_')
      : ''
    
    // 处理缩略图文件名
    const finalFilename = isThumbnail && sanitizedEntityId
      ? `thumbnail_${timestamp}_${sanitizedFilename}`
      : `${timestamp}_${sanitizedFilename}`
    
    // 生成路径
    if (sanitizedEntityId) {
      finalKey = `${category}/${dateStr}/${userAccount}/${sanitizedEntityId}/${finalFilename}`
    } else {
      finalKey = `${category}/${dateStr}/${userAccount}/${finalFilename}`
    }
  } else if (!finalKey) {
    // 旧格式（向后兼容）
    finalKey = new Date().getTime() + '_1s_' + generateUUID()
  }
  
  try {
    const res = await cos.uploadFile({
      Key: String(finalKey),
      Body: file,
      Bucket: cos.options.Bucket,
      Region: cos.options.Region
    })
    return {
      url: `https://${res.Location}`,
      key: finalKey
    }
  } catch (e: any) {
    const errorMessage = e?.message || e?.toString() || '未知错误'
    throw new Error(`COS上传失败: ${errorMessage}`)
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
          reject(err)
        } else {
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
          reject(err)
        } else {
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
