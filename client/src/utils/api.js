// API配置文件
const getApiBaseUrl = () => {
  // 开发环境使用本地后端
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  
  // 生产环境使用Vercel后端
  // 请将下面的URL替换为您的Vercel应用URL
  return 'https://your-vercel-app.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();

// 创建axios实例
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
