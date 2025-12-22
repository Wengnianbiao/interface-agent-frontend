import axios from 'axios';

// 创建 axios 实例
const service = axios.create({
  // 使用环境变量中的API基础路径
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 10000
});

export default service;