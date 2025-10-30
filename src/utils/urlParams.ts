/**
 * URL 参数工具
 * 用于从 URL 查询参数中获取配置
 */

export interface URLConfig {
  username?: string;
  apiUrl?: string;
  hideHeader?: boolean;
  hideSidebar?: boolean;
  appTitle?: string;
  theme?: 'light' | 'dark';
  root?: boolean;
}

/**
 * 从 URL 查询参数中获取配置
 */
export function getConfigFromURL(): URLConfig {
  const params = new URLSearchParams(window.location.search);
  
  return {
    username: params.get('username') || undefined,
    appTitle: params.get('appTitle') || "Kaflow 通用性 Agent",
    apiUrl: params.get('apiUrl') || undefined,
    hideHeader: params.get('hideHeader') === 'true',
    hideSidebar: params.get('hideSidebar') === 'true',
    root: params.get('root') === 'true',//是否是管理用户
    theme: (params.get('theme') as 'light' | 'dark') || undefined,
  };
}

/**
 * 检测是否在 iframe 中运行
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

/**
 * 获取 API URL（优先级：URL参数 > 环境变量 > 默认值）
 */
export function getApiUrl(): string {
  const urlConfig = getConfigFromURL();
  
  // 1. URL 参数
  if (urlConfig.apiUrl) {
    console.log('🔗 使用 URL 参数中的 API 地址:', urlConfig.apiUrl);
    return urlConfig.apiUrl;
  }
  
  // 2. 环境变量
  if (process.env.REACT_APP_KAFLOW_URL) {
    console.log('🔗 使用环境变量中的 API 地址:', process.env.REACT_APP_KAFLOW_URL);
    return process.env.REACT_APP_KAFLOW_URL;
  }
  
  // 3. 默认值
  const defaultUrl = 'http://localhost:8101';
  console.log('🔗 使用默认 API 地址:', defaultUrl);
  return defaultUrl;
}

/**
 * 向父窗口发送消息（用于 iframe 通信）
 */
export function sendMessageToParent(type: string, data: any) {
  if (isInIframe() && window.parent) {
    window.parent.postMessage(
      {
        source: 'kaflow-web',
        type,
        data,
      },
      '*' // 生产环境应指定具体的 origin
    );
  }
}

/**
 * 监听来自父窗口的消息
 */
export function listenToParentMessages(
  callback: (type: string, data: any) => void
): () => void {
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.source === 'kaflow-parent') {
      callback(event.data.type, event.data.data);
    }
  };

  window.addEventListener('message', handleMessage);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}

