import axios from 'axios';

// 创建 axios 实例
const service = axios.create({
  // 使用环境变量中的API基础路径
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 10000
});

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 保持原有的response对象结构，同时添加简化访问
    // 这样既兼容旧代码的 response.data.code，也支持新代码的 response.code
    const result = response.data;
    // 在response对象上添加data中的属性，方便直接访问
    Object.keys(result).forEach(key => {
      if (!(key in response)) {
        response[key] = result[key];
      }
    });
    return response;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

export default service;