import axios from 'axios';
import moment from 'moment';

// MCS专用HTTP工具，用于调用AGV调度系统接口
const HttpUtilMcs = axios.create({
  baseURL: process.env.VUE_APP_MCS_BASE_URL,
  timeout: 10000
});

// 请求拦截器 —— 注入 MCS 公共请求头
HttpUtilMcs.interceptors.request.use(
  (config) => {
    config.headers['X-Lr-appkey'] = 'mcs';
    config.headers['X-Lr-request-id'] = String(Date.now());
    config.headers['X-Lr-version'] = 'v2.0';
    // Authorization: nonce + method + timestamp
    const nonce = Math.random().toString(36).substring(2, 9);
    const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss+08:00');
    config.headers[
      'Authorization'
    ] = `nonce="${nonce}",method="HMAC-SHA256",timestamp="${timestamp}"`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
HttpUtilMcs.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default HttpUtilMcs;
