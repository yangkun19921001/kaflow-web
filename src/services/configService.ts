/**
 * 配置服务
 * 负责与后端 API 交互，获取配置列表
 */

import { ConfigsResponse } from '../types/config';
import { getApiUrl } from '../utils/urlParams';

// 基础 URL，优先从 URL 参数获取，其次环境变量
const getBaseUrl = () => getApiUrl();

/**
 * 获取配置列表
 * @returns 配置列表响应数据
 */
export const fetchConfigs = async (): Promise<ConfigsResponse> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/configs`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ConfigsResponse = await response.json();
    console.log('获取配置列表成功:', data);
    
    return data;
  } catch (error) {
    console.error('获取配置列表失败:', error);
    throw error;
  }
};

/**
 * 获取配置名称映射
 * 用于根据 config_id 快速获取配置名称
 * @returns config_id 到 name 的映射对象
 */
export const getConfigNameMap = async (): Promise<Record<string, string>> => {
  try {
    const data = await fetchConfigs();
    const nameMap: Record<string, string> = {};
    
    data.configs.forEach(config => {
      nameMap[config.id] = config.name;
    });
    
    return nameMap;
  } catch (error) {
    console.error('获取配置名称映射失败:', error);
    return {};
  }
};


