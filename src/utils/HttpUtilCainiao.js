import axios from 'axios';

// 菜鸟专用HTTP工具，用于调用大包查询接口
const HttpUtilCainiao = axios.create({
  baseURL: process.env.VUE_APP_CAINIAO_BASE_URL,
  timeout: 3000
});

// 响应拦截器
HttpUtilCainiao.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default HttpUtilCainiao;
