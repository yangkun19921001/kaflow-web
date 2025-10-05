/**
 * 配置服务
 * 负责与后端 API 交互，获取配置列表
 */

import { ConfigsResponse } from '../types/config';

// 基础 URL，从环境变量获取
const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8102';

/**
 * 获取配置列表
 * @returns 配置列表响应数据
 */
export const fetchConfigs = async (): Promise<ConfigsResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/api/configs`);
    
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


