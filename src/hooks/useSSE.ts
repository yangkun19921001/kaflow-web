import { useState, useRef, useCallback } from 'react';

export interface ContentItem {
  type: 'text' | 'tool_call';
  content?: string;
  toolCall?: ToolCall;
  timestamp: Date;
}

export interface ToolCall {
  id: string;
  toolCallId?: string;
  index?: number;
  name: string;
  args: any;
  parsedArgs?: any;
  status: 'executing' | 'completed' | 'failed';
  result?: string;
  timestamp: Date;
  completedAt?: Date;
  toolName?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  agent?: string;
  threadId?: string;
  contentItems?: ContentItem[];
  isStreaming?: boolean;
  isCompleted?: boolean;
  isReport?: boolean;
  finishReason?: string;
  lastRunId?: string;
  timestamp: Date;
  lastUpdated?: Date;
  toolCalls?: ToolCall[];
}

export interface SSEEvent {
  event: string;
  data: any;
}


async function* fetchStream(url: string, init?: RequestInit): AsyncIterable<SSEEvent> {
  console.log('🚀 fetchStream开始:', { url, init });
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Accept": "text/event-stream",
      },
      ...init,
    });
    
    console.log('✅ fetch请求成功，状态码:', response.status);
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch from ${url}: ${response.status}`);
    }
    
    const reader = response.body
      ?.pipeThrough(new TextDecoderStream())
      .getReader();
      
    if (!reader) {
      throw new Error("Response body is not readable");
    }
    
    let buffer = "";
    let eventCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('✅ 流读取完成');
        break;
      }
      
      buffer += value;
      
      while (true) {
        const index = buffer.indexOf("\n\n");
        if (index === -1) {
          break;
        }
        const chunk = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        const event = parseEvent(chunk);
        if (event) {
          eventCount++;
          yield event;
        }
      }
    }
  } catch (error) {
    console.error('💥 fetchStream错误:', error);
    throw error;
  }
}

/**
 * 解析SSE事件
 */
function parseEvent(chunk: string): SSEEvent | undefined {
  let resultEvent = "message";
  let resultData: string | null = null;
  
  for (const line of chunk.split("\n")) {
    const pos = line.indexOf(": ");
    if (pos === -1) {
      continue;
    }
    const key = line.slice(0, pos);
    const value = line.slice(pos + 2);
    if (key === "event") {
      resultEvent = value;
    } else if (key === "data") {
      resultData = value;
    }
  }
  
  if (resultEvent === "message" && resultData === null) {
    return undefined;
  }
  
  return {
    event: resultEvent,
    data: resultData,
  };
}

/**
 * 构建完整的API URL
 */
function resolveApiURL(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  console.log('🔧 构建完整的API URL:', process.env.REACT_APP_BASE_URL);
  return `${process.env.REACT_APP_BASE_URL}/api/${path}`;
}

/**
 * SSE (Server-Sent Events) 处理Hook
 */
export function useSSE() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const toolCallsRef = useRef<Map<string, ToolCall>>(new Map());

  const getAgentKey = useCallback((threadId: string, agent: string) => {
    return `${threadId}-${agent}`;
  }, []);

  const clearCaches = useCallback(() => {
    toolCallsRef.current.clear();
  }, []);

  const addUserMessage = useCallback((content: string): Message => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    return userMessage;
  }, []);

  const handleMessageChunk = useCallback((data: any) => {
    const { id, agent, content, finish_reason, role, thread_id } = data;
    const safeContent = content || '';
    const agentKey = getAgentKey(thread_id, agent);

    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      
      let existingMessageIndex = -1;
      let existingMessage: Message | null = null;
      
      for (let i = updatedMessages.length - 1; i >= 0; i--) {
        const msg = updatedMessages[i];
        if (msg.role === 'assistant' && 
            msg.agent === agent && 
            msg.threadId === thread_id && 
            !msg.isCompleted) {
          existingMessageIndex = i;
          existingMessage = msg;
          break;
        }
      }
      
      if (existingMessage && existingMessageIndex >= 0) {
        const currentContentItems = existingMessage.contentItems || [];
        let updatedContentItems = [...currentContentItems];
        
        if (safeContent) {
          const lastItem = updatedContentItems[updatedContentItems.length - 1];
          if (lastItem && lastItem.type === 'text') {
            updatedContentItems[updatedContentItems.length - 1] = {
              ...lastItem,
              content: lastItem.content + safeContent
            };
          } else {
            updatedContentItems.push({
              type: 'text',
              content: safeContent,
              timestamp: new Date()
            });
          }
        }

        const updatedMessage: Message = {
          ...existingMessage,
          contentItems: updatedContentItems,
          isStreaming: finish_reason !== 'stop',
          isCompleted: finish_reason === 'stop',
          finishReason: finish_reason,
          lastRunId: id,
          lastUpdated: new Date()
        };

        updatedMessages[existingMessageIndex] = updatedMessage;
        return updatedMessages;
      } else {
        if (safeContent || !finish_reason) {
          const initialContentItems: ContentItem[] = safeContent ? [{
            type: 'text',
            content: safeContent,
            timestamp: new Date()
          }] : [];

          const newMessage: Message = {
            id: `${agentKey}-${Date.now()}`,
            role: role || 'assistant',
            agent: agent || 'AI助手',
            threadId: thread_id,
            contentItems: initialContentItems,
            isStreaming: finish_reason !== 'stop',
            isCompleted: finish_reason === 'stop',
            finishReason: finish_reason,
            lastRunId: id,
            timestamp: new Date(),
            lastUpdated: new Date(),
            toolCalls: []
          };
          
          return [...updatedMessages, newMessage];
        }
        return updatedMessages;
      }
    });
  }, [getAgentKey]);

  const handleToolCalls = useCallback((data: any) => {
    const { id, tool_calls, agent, thread_id } = data;
    
    if (!tool_calls || !Array.isArray(tool_calls)) {
      return;
    }

    clearCaches();

    const newTools = tool_calls.map((toolCall: any, index: number) => {
      const { id: toolId, name, args, type } = toolCall;
      const toolKey = toolId || `${id}-${index}`;

      const newTool: ToolCall = {
        id: toolKey,
        toolCallId: toolId,
        index,
        name: name || '未知工具',
        args: args || {},
        parsedArgs: args || {},
        status: 'executing',
        timestamp: new Date()
      };

      toolCallsRef.current.set(toolKey, newTool);
      return newTool;
    });

    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      
      let targetMessageIndex = -1;
      for (let i = updatedMessages.length - 1; i >= 0; i--) {
        const msg = updatedMessages[i];
        if (msg.role === 'assistant' && 
            msg.agent === agent && 
            msg.threadId === thread_id &&
            !msg.isCompleted) {
          targetMessageIndex = i;
          break;
        }
      }
      
      if (targetMessageIndex >= 0) {
        const currentMessage = updatedMessages[targetMessageIndex];
        const currentContentItems = currentMessage.contentItems || [];
        
        const newContentItems: ContentItem[] = [
          ...currentContentItems,
          ...newTools.map(newTool => ({
            type: 'tool_call' as const,
            toolCall: newTool,
            timestamp: new Date()
          }))
        ];

        updatedMessages[targetMessageIndex] = {
          ...currentMessage,
          contentItems: newContentItems,
          toolCalls: Array.from(toolCallsRef.current.values())
        };
      } else {
        const agentKey = getAgentKey(thread_id, agent);
        const newMessage: Message = {
          id: `${agentKey}-${Date.now()}`,
          role: 'assistant',
          agent: agent || 'AI助手',
          threadId: thread_id,
          contentItems: newTools.map(newTool => ({
            type: 'tool_call' as const,
            toolCall: newTool,
            timestamp: new Date()
          })),
          isStreaming: true,
          isCompleted: false,
          finishReason: undefined,
          lastRunId: id,
          timestamp: new Date(),
          lastUpdated: new Date(),
          toolCalls: Array.from(toolCallsRef.current.values())
        };
        
        updatedMessages.push(newMessage);
      }
      
      return updatedMessages;
    });
  }, [clearCaches, getAgentKey]);

  const handleToolCallResult = useCallback((data: any) => {
    const { tool_call_id, content, tool_name } = data;

    let matchedToolKey: string | null = null;
    let matchedTool: ToolCall | null = null;

    toolCallsRef.current.forEach((toolCall, toolKey) => {
      const isExactMatch = toolCall.toolCallId === tool_call_id;
      const isIdIncluded = toolCall.id && toolCall.id.includes(tool_call_id);
      const isKeyIncluded = toolKey.includes(tool_call_id);
      
      if (isExactMatch || isIdIncluded || isKeyIncluded) {
        matchedToolKey = toolKey;
        matchedTool = toolCall;
        
        toolCall.status = 'completed';
        toolCall.result = content;
        toolCall.completedAt = new Date();
        
        if (tool_name) {
          toolCall.toolName = tool_name;
        }
      }
    });

    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      
      for (let i = 0; i < updatedMessages.length; i++) {
        const msg = updatedMessages[i];
        
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          updatedMessages[i] = {
            ...msg,
            toolCalls: Array.from(toolCallsRef.current.values())
          };
        }
        
        if (msg.contentItems && msg.contentItems.length > 0) {
          const updatedContentItems = msg.contentItems.map(item => {
            if (item.type === 'tool_call' && item.toolCall && 
                (item.toolCall.toolCallId === tool_call_id || 
                 item.toolCall.id === tool_call_id ||
                 (item.toolCall.id && item.toolCall.id.includes(tool_call_id)))) {
              return {
                ...item,
                toolCall: toolCallsRef.current.get(matchedToolKey!) || item.toolCall
              };
            }
            return item;
          });
          
          updatedMessages[i] = {
            ...updatedMessages[i],
            contentItems: updatedContentItems
          };
        }
      }
      
      return updatedMessages;
    });
  }, []);

  const handleFinalReport = useCallback((data: any) => {
    const { report } = data;
    const reportMessage: Message = {
      id: `report-${Date.now()}`,
      role: 'assistant',
      content: report,
      isReport: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, reportMessage]);
  }, []);


  const handleCancelled = useCallback((data: any) => {
    console.log('🛑 收到取消事件:', data);
    setIsStreaming(false);
    setIsConnected(false);
    
    // 更新最后一条未完成的消息状态，包括工具调用状态
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      
      // 找到最后一条正在流式传输的 assistant 消息
      for (let i = updatedMessages.length - 1; i >= 0; i--) {
        const msg = updatedMessages[i];
        if (msg.role === 'assistant' && msg.isStreaming && !msg.isCompleted) {
          const now = new Date();
          
          // 更新 contentItems 中的工具调用状态
          const updatedContentItems = msg.contentItems?.map(item => {
            if (item.type === 'tool_call' && item.toolCall?.status === 'executing') {
              return {
                ...item,
                toolCall: {
                  ...item.toolCall,
                  status: 'completed' as const,
                  result: item.toolCall.result || '⚠️ 已取消',
                  completedAt: now
                }
              };
            }
            return item;
          });
          
          // 更新 toolCalls 数组中的工具调用状态
          const updatedToolCalls = msg.toolCalls?.map(tool => {
            if (tool.status === 'executing') {
              return {
                ...tool,
                status: 'completed' as const,
                result: tool.result || '⚠️ 已取消',
                completedAt: now
              };
            }
            return tool;
          });
          
          // 同步更新 toolCallsRef
          if (updatedToolCalls) {
            updatedToolCalls.forEach(tool => {
              if (tool.id) {
                toolCallsRef.current.set(tool.id, tool);
              }
            });
          }
          
          // 标记为已完成，停止流式传输状态
          updatedMessages[i] = {
            ...msg,
            isStreaming: false,
            isCompleted: true,
            finishReason: 'cancelled',
            lastUpdated: now,
            contentItems: updatedContentItems,
            toolCalls: updatedToolCalls
          };
          
          console.log('✅ 已更新消息和工具调用状态为已取消');
          break;
        }
      }
      
      return updatedMessages;
    });
  }, []);

  const handleError = useCallback((data: any) => {
    console.error('💥 收到错误事件:', data);
    const errorMessage = data.error || data.message || '未知错误';
    setError(errorMessage);
    
    // 标记最后一条未完成的消息为完成状态
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      
      // 找到最后一条正在流式传输的 assistant 消息
      for (let i = updatedMessages.length - 1; i >= 0; i--) {
        const msg = updatedMessages[i];
        if (msg.role === 'assistant' && (msg.isStreaming || !msg.isCompleted)) {
          const now = new Date();
          
          // 更新 contentItems 中的工具调用状态
          const updatedContentItems = msg.contentItems?.map(item => {
            if (item.type === 'tool_call' && item.toolCall?.status === 'executing') {
              return {
                ...item,
                toolCall: {
                  ...item.toolCall,
                  status: 'failed' as const,
                  result: item.toolCall.result || `❌ 错误: ${errorMessage}`,
                  completedAt: now
                }
              };
            }
            return item;
          });
          
          // 更新 toolCalls 数组中的工具调用状态
          const updatedToolCalls = msg.toolCalls?.map(tool => {
            if (tool.status === 'executing') {
              return {
                ...tool,
                status: 'failed' as const,
                result: tool.result || `❌ 错误: ${errorMessage}`,
                completedAt: now
              };
            }
            return tool;
          });
          
          // 同步更新 toolCallsRef
          if (updatedToolCalls) {
            updatedToolCalls.forEach(tool => {
              if (tool.id) {
                toolCallsRef.current.set(tool.id, tool);
              }
            });
          }
          
          // 标记为已完成，停止流式传输状态
          updatedMessages[i] = {
            ...msg,
            isStreaming: false,
            isCompleted: true,
            finishReason: 'error',
            lastUpdated: now,
            contentItems: updatedContentItems,
            toolCalls: updatedToolCalls
          };
          
          console.log('✅ 已更新消息状态为错误');
          break;
        }
      }
      
      return updatedMessages;
    });
  }, []);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    try {
      const eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      switch (event.event) {
        case 'message_chunk':
          handleMessageChunk(eventData);
          break;
        case 'tool_calls':
          handleToolCalls(eventData);
          break;
        case 'tool_call_result':
          handleToolCallResult(eventData);
          break;
        case 'final_report':
          handleFinalReport(eventData);
          break;
        case 'cancelled':
          handleCancelled(eventData);
          break;
        case 'error':
          handleError(eventData);
          break;
        default:
          console.log('🔍 Unknown event type:', event.event);
      }
    } catch (error) {
      console.error('💥 Error handling SSE event:', error);
      setError(`事件处理错误: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [handleMessageChunk, handleToolCalls, handleToolCallResult, handleFinalReport, handleCancelled]);

  const connect = useCallback(async (path: string, requestBody: any) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setIsStreaming(true);
    setIsConnected(true);
    setError(null);
    clearCaches();

    const fullUrl = resolveApiURL(path);
    
    console.log('🔧 开始SSE连接...');
    console.log('🎯 完整URL:', fullUrl);

    try {
      const stream = fetchStream(fullUrl, {
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      for await (const event of stream) {
        if (!event || !event.event) {
          continue;
        }
        
        handleSSEEvent({
          event: event.event,
          data: event.data
        });
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🛑 SSE连接被中断');
      } else {
        console.error('💥 SSE连接错误:', error);
        setError(error instanceof Error ? error.message : 'SSE连接失败');
      }
    } finally {
      setIsStreaming(false);
      setIsConnected(false);
    }
  }, [handleSSEEvent, clearCaches]);

  const disconnect = useCallback(() => {
    console.log('🛑 用户请求停止生成');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('✅ 已发送中断信号');
    }
    setIsStreaming(false);
    setIsConnected(false);
    
    // 立即更新最后一条未完成的消息状态，包括工具调用状态
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      
      // 找到最后一条正在流式传输的 assistant 消息
      for (let i = updatedMessages.length - 1; i >= 0; i--) {
        const msg = updatedMessages[i];
        if (msg.role === 'assistant' && (msg.isStreaming || !msg.isCompleted)) {
          const now = new Date();
          
          // 更新 contentItems 中的工具调用状态
          const updatedContentItems = msg.contentItems?.map(item => {
            if (item.type === 'tool_call' && item.toolCall?.status === 'executing') {
              return {
                ...item,
                toolCall: {
                  ...item.toolCall,
                  status: 'completed' as const,
                  result: item.toolCall.result || '⚠️ 已取消',
                  completedAt: now
                }
              };
            }
            return item;
          });
          
          // 更新 toolCalls 数组中的工具调用状态
          const updatedToolCalls = msg.toolCalls?.map(tool => {
            if (tool.status === 'executing') {
              return {
                ...tool,
                status: 'completed' as const,
                result: tool.result || '⚠️ 已取消',
                completedAt: now
              };
            }
            return tool;
          });
          
          // 同步更新 toolCallsRef
          if (updatedToolCalls) {
            updatedToolCalls.forEach(tool => {
              if (tool.id) {
                toolCallsRef.current.set(tool.id, tool);
              }
            });
          }
          
          // 标记消息为已完成，停止流式传输状态
          updatedMessages[i] = {
            ...msg,
            isStreaming: false,
            isCompleted: true,
            finishReason: 'cancelled',
            lastUpdated: now,
            contentItems: updatedContentItems,
            toolCalls: updatedToolCalls
          };
          
          console.log('✅ 已立即更新消息和工具调用状态为已取消');
          break;
        }
      }
      
      return updatedMessages;
    });
    
    console.log('✅ 状态已重置');
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    clearCaches();
    setError(null);
  }, [clearCaches]);

  /**
   * 直接设置历史消息（用于加载历史记录）
   */
  const setHistoryMessages = useCallback((historyMessages: Message[]) => {
    setMessages(historyMessages);
    clearCaches();
    setError(null);
    console.log('已设置历史消息，共', historyMessages.length, '条');
  }, [clearCaches]);

  return {
    messages,
    isConnected,
    isStreaming,
    error,
    connect,
    disconnect,
    clearMessages,
    addUserMessage,
    setHistoryMessages
  };
}