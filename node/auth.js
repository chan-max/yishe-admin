import axios from 'axios';
import crypto from 'crypto'
import moment from 'moment'

function generateSignature(params, appSecret) {
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
        }, {});
    let concatenatedString = '';
    for (const [key, value] of Object.entries(sortedParams)) {
        concatenatedString += `${key}${value}`;
    }

    const signString = `${appSecret}${concatenatedString}${appSecret}`;
    const md5Hash = crypto.createHash('md5').update(signString).digest('hex').toUpperCase();

    return md5Hash;
}

export async function temuPost(url, postData = {}) {
    const headers = {
        "content-type": "application/json"
    };
    const rootUrl = "https://openapi.kuajingmaihuo.com/openapi/router";

    // 正式 
    const appSecret = "0f007f759712c09a1b4c212f28c52e698dc27860";
    const accessToken = "imnm6ykauekhcckofvzwkgzv1mjyqlooqxmxhfekk0hnapxovscgronh"
    const appKey = "e05618c64b49f08008da3d1eb40f7db8"

    // 测试用
    // const appKey = "72bc9e4143e960b2134e1cdf22fec651"
    // const appSecret = "c54100b5b15d69d5cf0db9e8a653333a60f73c23";
    // const accessToken ="cuweioka4gl92b08acchbuknwlp7mcy3vdszuqhgupgsliajom9g7j2r"

    const timestamp = Math.floor(Date.now() / 1000);

    const data = {
        "type": url,
        "timestamp": timestamp,
        "app_key": appKey,
        "data_type": "JSON",
        "access_token": accessToken,
        ...postData
    };

    const sign = generateSignature(data, appSecret);
    data["sign"] = sign;
    const jsonData = JSON.stringify(data);

    const _data = {
        "type": url,
        "timestamp": timestamp,
        "app_key": appKey,
        "access_token": accessToken,
        "data_type": "JSON",
        ...postData,
    }

    _data['sign'] = sign

    const _dataStr = JSON.stringify(_data)

    try {
        const response = await axios.post(rootUrl, _dataStr, { headers });
        return response.data
    } catch (error) {
        console.error('请求失败', error);
    }
}

