/**
 * API 配置
 * 统一管理前端与后端的连接地址
 */

const DEFAULT_PORT = (import.meta as any)?.env?.VITE_SOCKET_PORT || 5200;
const DEFAULT_PROTO = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const DEFAULT_HOST = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const IS_SECURE = typeof window !== 'undefined' && window.location.protocol === 'https:';

// 环境变量配置
const ENV_SERVER_URL = (import.meta as any)?.env?.VITE_SERVER_URL || '';
const ENV_SOCKET_URL = (import.meta as any)?.env?.VITE_SOCKET_URL || '';

// 生产环境后端地址
const PRODUCTION_BACKEND = 'https://hxlr.lzyupupup.online';

/**
 * 获取后端API基础地址
 */
export const getApiBaseUrl = (): string => {
  // 优先使用环境变量
  if (ENV_SERVER_URL) return ENV_SERVER_URL;
  
  const host = DEFAULT_HOST || '127.0.0.1';
  
  // 如果是 Vercel 部署，使用生产后端
  if (IS_SECURE && /vercel\.app$/.test(host)) {
    return PRODUCTION_BACKEND;
  }
  
  // 本地开发
  return `${DEFAULT_PROTO}//${host}:${DEFAULT_PORT}`;
};

/**
 * 获取WebSocket连接地址
 */
export const getSocketUrl = (): string => {
  // 优先使用环境变量
  if (ENV_SOCKET_URL) return ENV_SOCKET_URL;
  
  const host = DEFAULT_HOST || '127.0.0.1';
  
  // 如果是 Vercel 部署，使用生产后端
  if (IS_SECURE && /vercel\.app$/.test(host)) {
    return PRODUCTION_BACKEND;
  }
  
  // 本地开发
  return `${DEFAULT_PROTO}//${host}:${DEFAULT_PORT}`;
};

// 导出常量
export const API_BASE = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();

// 打印配置信息（开发调试用）
if (typeof window !== 'undefined') {
  console.log('🌐 API Configuration:', {
    API_BASE,
    SOCKET_URL,
    IS_SECURE,
    HOST: DEFAULT_HOST
  });
}

export default {
  API_BASE,
  SOCKET_URL,
  getApiBaseUrl,
  getSocketUrl
};
