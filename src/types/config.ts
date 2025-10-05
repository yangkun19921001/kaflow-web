/**
 * 配置类型定义
 * 用于定义 API 返回的配置数据结构
 */

// 单个配置项
export interface ConfigItem {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  file_name: string;
  agents_count: number;
  nodes_count: number;
  edges_count: number;
  cached: boolean;
}

// 配置列表响应
export interface ConfigsResponse {
  configs: ConfigItem[];
  total: number;
  cached_count: number;
  timestamp: string;
}


