/**
 * 会话服务
 * 负责与后端会话相关 API 交互
 */

// 基础 URL，从环境变量获取
const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8102';

/**
 * 会话线程信息
 */
export interface Thread {
  thread_id: string;
  username: string;
  first_message: string;
  last_updated: string;
  message_count: number;
  config_id: string;
}

/**
 * 获取会话列表请求参数
 */
export interface GetThreadsRequest {
  username?: string;
  page?: number;
  page_size?: number;
  order?: 'asc' | 'desc';
}

/**
 * 获取会话列表响应
 */
export interface GetThreadsResponse {
  username?: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  threads: Thread[];
}

/**
 * 历史消息中的单条消息
 */
export interface HistoryMessage {
  type: string;
  content: string;
  role: string;
  additional_kwargs?: any;
  tool_call_id?: string | null;
  timestamp?: string | null;
}

/**
 * 历史消息检查点
 */
export interface HistoryCheckpoint {
  checkpoint_id: string;
  messages: HistoryMessage[];
  metadata: {
    source: string;
    step: number;
    parents: any;
  };
  created_at: string;
  updated_at: string;
}

/**
 * 获取历史消息请求参数
 */
export interface GetHistoryRequest {
  thread_id: string;
  page?: number;
  page_size?: number;
  order?: 'asc' | 'desc';
}

/**
 * 获取历史消息响应
 */
export interface GetHistoryResponse {
  thread_id: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  messages: HistoryCheckpoint[];
  config_id: string;
  error: string | null;
}

/**
 * 获取指定用户的会话列表
 * @param request 请求参数
 * @returns 会话列表响应数据
 */
export const fetchThreads = async (request: GetThreadsRequest): Promise<GetThreadsResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/api/chat/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: request.username,
        page: request.page || 1,
        page_size: request.page_size || 10,
        order: request.order || 'desc',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GetThreadsResponse = await response.json();
    console.log('获取会话列表成功:', data);

    return data;
  } catch (error) {
    console.error('获取会话列表失败:', error);
    throw error;
  }
};

/**
 * 获取指定会话的历史消息
 * @param request 请求参数
 * @returns 历史消息响应数据
 */
export const fetchHistory = async (request: GetHistoryRequest): Promise<GetHistoryResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/api/chat/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        thread_id: request.thread_id,
        page: request.page || 1,
        page_size: request.page_size || 10,
        order: request.order || 'desc',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GetHistoryResponse = await response.json();
    console.log('获取历史消息成功:', data);

    return data;
  } catch (error) {
    console.error('获取历史消息失败:', error);
    throw error;
  }
};

