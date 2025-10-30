import React, { useState, useRef, useEffect, useCallback } from 'react';
import { message, Spin } from 'antd';
import { useSSE, Message as SSEMessage, ToolCall } from '../hooks/useSSE';
import MessageCard from './MessageCard';
import ChatInput from './ChatInput';
import WelcomePage from './WelcomePage';
import ScenarioSelector from './ScenarioSelector';
import LoadingMessage from './LoadingMessage';
import { fetchHistory, HistoryCheckpoint } from '../services/threadService';

interface KaFlowChatProps {
  currentThreadId?: string;
  currentConfigId?: string;
  username?: string; // 用户名（从 URL 参数或父组件传入）
  onThreadIdChange?: (threadId: string) => void;
  onDisconnectRef?: (disconnect: () => void) => void; // 传递 disconnect 函数给父组件
  shouldLoadHistory?: boolean; // 是否应该加载历史消息（只有点击历史会话时为 true）
}

const KaFlowChat: React.FC<KaFlowChatProps> = ({
  currentThreadId,
  currentConfigId,
  username = 'devyk@kaflow.ai', // 默认用户名
  onThreadIdChange,
  onDisconnectRef,
  shouldLoadHistory = false, // 默认不加载历史
}) => {
  const [uniqueThreadId, setUniqueThreadId] = useState('');
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string>(currentConfigId || '1'); // 默认选择设备故障排查助手
  const [selectedConfigName, setSelectedConfigName] = useState<string>('设备故障排查助手');
  const [isWaitingResponse, setIsWaitingResponse] = useState(false); // 等待 AI 响应
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // 加载历史消息
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false); // 是否已加载历史
  const [historyPage, setHistoryPage] = useState(1); // 历史消息页码
  const [hasMoreHistory, setHasMoreHistory] = useState(true); // 是否还有更多历史
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false); // 加载更多历史
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false); // 是否需要滚动到底部
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0); // 记录上一次的消息数量
  const previousScrollHeightRef = useRef<number>(0); // 保存之前的滚动高度

  // 使用 SSE Hook
  const { 
    messages, 
    isConnected, 
    isStreaming, 
    error, 
    connect, 
    disconnect, 
    clearMessages, 
    addUserMessage,
    setHistoryMessages
  } = useSSE();
  
  // 将 disconnect 函数传递给父组件
  useEffect(() => {
    if (onDisconnectRef) {
      onDisconnectRef(disconnect);
    }
  }, [disconnect, onDisconnectRef]);

  // 生成唯一的thread_id
  useEffect(() => {
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const generateUniqueThreadId = (configId: string) => {
      const uuid = generateUUID();
      // 格式：username_uuid_configId
      const threadId = `${username}_${uuid}_${configId}`;
      setUniqueThreadId(threadId);
      console.log('Generated unique thread_id:', threadId, 'for user:', username);
      
      // 通知父组件 thread_id 变化
      if (onThreadIdChange) {
        onThreadIdChange(threadId);
      }
    };
    
    // 如果有外部传入的 thread_id，使用外部的
    if (currentThreadId) {
      setUniqueThreadId(currentThreadId);
      console.log('Using external thread_id:', currentThreadId);
    } else {
      // 使用当前选中的 configId 生成 thread_id
      generateUniqueThreadId(selectedConfigId);
    }
  }, [currentThreadId, selectedConfigId, username, onThreadIdChange]);

  // 监听外部 configId 变化
  useEffect(() => {
    if (currentConfigId) {
      setSelectedConfigId(currentConfigId);
    }
  }, [currentConfigId]);

  /**
   * 转换历史消息格式为 SSE Message 格式
   * 支持 Tool 调用的转换和显示
   */
  const convertHistoryToMessages = useCallback((checkpoints: HistoryCheckpoint[]): SSEMessage[] => {
    const convertedMessages: SSEMessage[] = [];
    const toolResultsMap = new Map<string, { result: string; timestamp: Date }>();
    
    // 第一遍：收集所有 tool 结果
    checkpoints.forEach((checkpoint) => {
      if (!checkpoint.messages) return;
      
      checkpoint.messages.forEach((historyMsg) => {
        if (historyMsg.role === 'tool' && historyMsg.tool_call_id) {
          toolResultsMap.set(historyMsg.tool_call_id, {
            result: historyMsg.content,
            timestamp: new Date(checkpoint.created_at),
          });
        }
      });
    });
    
    // 第二遍：转换用户和 AI 消息
    checkpoints.forEach((checkpoint) => {
      if (!checkpoint.messages || checkpoint.messages.length === 0) {
        return;
      }
      
      checkpoint.messages.forEach((historyMsg) => {
        // 跳过 tool 消息（已经在第一遍处理）
        if (historyMsg.role === 'tool') {
          return;
        }
        
        // 转换角色
        let messageRole: 'user' | 'assistant' | null = null;
        if (historyMsg.role === 'human') {
          messageRole = 'user';
        } else if (historyMsg.role === 'ai') {
          messageRole = 'assistant';
        } else if (historyMsg.role === 'user' || historyMsg.role === 'assistant') {
          messageRole = historyMsg.role;
        }

        if (!messageRole) {
          console.warn('未知的消息类型:', historyMsg);
          return;
        }

        // 检查是否已存在相同的消息
        const existingMsg = convertedMessages.find(
          (msg) =>
            msg.content === historyMsg.content &&
            msg.role === messageRole
        );

        if (existingMsg) return;

        const sseMessage: SSEMessage = {
          id: `history-${checkpoint.checkpoint_id}-${messageRole}-${Date.now()}-${Math.random()}`,
          role: messageRole,
          content: historyMsg.content,
          timestamp: new Date(checkpoint.created_at),
          isCompleted: true,
          isStreaming: false,
        };

        // 处理 assistant 消息
        if (messageRole === 'assistant') {
          sseMessage.agent = 'AI助手';
          sseMessage.contentItems = [];
          sseMessage.toolCalls = [];

          // 如果有文本内容，添加文本项
          if (historyMsg.content) {
            sseMessage.contentItems.push({
              type: 'text',
              content: historyMsg.content,
              timestamp: new Date(checkpoint.created_at),
            });
          }

          // 检查是否有 tool_calls（在 additional_kwargs 中）
          if (historyMsg.additional_kwargs?.tool_calls) {
            const toolCalls = historyMsg.additional_kwargs.tool_calls;
            
            toolCalls.forEach((toolCall: any) => {
              const toolCallId = toolCall.id;
              let toolArgs: any = {};
              
              // 解析工具参数
              try {
                toolArgs = typeof toolCall.function?.arguments === 'string'
                  ? JSON.parse(toolCall.function.arguments)
                  : toolCall.function?.arguments || {};
              } catch (e) {
                console.warn('解析 tool 参数失败:', e);
              }

              // 查找对应的 tool 结果
              const toolResult = toolResultsMap.get(toolCallId);
              
              const toolCallData: ToolCall = {
                id: toolCallId,
                name: toolCall.function?.name || 'unknown',
                args: toolArgs,
                status: toolResult ? 'completed' : 'executing',
                result: toolResult?.result,
                timestamp: new Date(checkpoint.created_at),
                completedAt: toolResult?.timestamp,
              };

              // 添加到 toolCalls 数组
              sseMessage.toolCalls!.push(toolCallData);

              // 添加到 contentItems
              sseMessage.contentItems!.push({
                type: 'tool_call',
                toolCall: toolCallData,
                timestamp: new Date(checkpoint.created_at),
              });
            });
          }
        }

        convertedMessages.push(sseMessage);
      });
    });

    console.log('转换历史消息完成，共', convertedMessages.length, '条，包含 tool 调用');
    return convertedMessages;
  }, []);

  /**
   * 加载历史消息（首次加载）
   */
  const loadHistoryMessages = useCallback(
    async (threadId: string) => {
      if (!threadId) return;

      setIsLoadingHistory(true);
      console.log('开始加载历史消息:', threadId);

      try {
        const response = await fetchHistory({
          thread_id: threadId,
          page: 1,
          page_size: 20,
          order: 'desc',
        });

        if (response.messages && response.messages.length > 0) {
          const historyMessages = convertHistoryToMessages(response.messages);
          
          // 直接设置历史消息
          setHistoryMessages(historyMessages);
          lastMessageCountRef.current = historyMessages.length;
          
          // 更新分页信息
          setHistoryPage(1);
          setHasMoreHistory(response.page < response.total_pages);
          setHasLoadedHistory(true);
          
          console.log(`历史消息加载完成，共 ${historyMessages.length} 条，第 ${response.page}/${response.total_pages} 页`);
          
          // 标记需要滚动到底部
          setShouldScrollToBottom(true);
        } else {
          setHasLoadedHistory(true);
          setHasMoreHistory(false);
        }
      } catch (error) {
        console.error('加载历史消息失败:', error);
        message.error('加载历史消息失败');
        setHasLoadedHistory(true);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [convertHistoryToMessages, setHistoryMessages]
  );

  /**
   * 加载更多历史消息（分页加载）
   */
  const loadMoreHistory = useCallback(
    async (threadId: string) => {
      if (!threadId || !hasMoreHistory || isLoadingMoreHistory) {
        return;
      }

      setIsLoadingMoreHistory(true);
      const nextPage = historyPage + 1;
      console.log(`加载更多历史消息，第 ${nextPage} 页`);

      // 保存当前滚动高度
      if (messagesContainerRef.current) {
        previousScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
      }

      try {
        const response = await fetchHistory({
          thread_id: threadId,
          page: nextPage,
          page_size: 20,
          order: 'desc',
        });

        if (response.messages && response.messages.length > 0) {
          const newHistoryMessages = convertHistoryToMessages(response.messages);
          
          // 追加到消息列表前面（因为是更早的消息）
          const mergedMessages = [...newHistoryMessages, ...messages];
          setHistoryMessages(mergedMessages);
          lastMessageCountRef.current = mergedMessages.length;
          
          // 更新分页信息
          setHistoryPage(nextPage);
          setHasMoreHistory(response.page < response.total_pages);
          
          console.log(`加载更多历史完成，新增 ${newHistoryMessages.length} 条，第 ${response.page}/${response.total_pages} 页`);
          
          // 恢复滚动位置（在下一帧）
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              const newScrollHeight = messagesContainerRef.current.scrollHeight;
              const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
              messagesContainerRef.current.scrollTop = scrollDiff;
              console.log(`恢复滚动位置: ${scrollDiff}px`);
            }
          });
        } else {
          setHasMoreHistory(false);
        }
      } catch (error) {
        console.error('加载更多历史失败:', error);
        message.error('加载更多历史失败');
      } finally {
        setIsLoadingMoreHistory(false);
      }
    },
    [historyPage, hasMoreHistory, isLoadingMoreHistory, messages, convertHistoryToMessages, setHistoryMessages]
  );

  /**
   * 监听 currentThreadId 变化，加载对应的历史消息
   * 只有当明确指定 shouldLoadHistory 为 true 时才加载（点击历史会话）
   */
  useEffect(() => {
    if (currentThreadId && shouldLoadHistory) {
      console.log('📖 点击历史会话，加载历史消息:', currentThreadId);
      // 每次切换会话都重新加载（因为 currentThreadId 变化了）
      setHasLoadedHistory(false);
      setHistoryPage(1);
      setHasMoreHistory(true);
      setShouldScrollToBottom(false); // 重置滚动标志
      loadHistoryMessages(currentThreadId);
    } else if (currentThreadId && !shouldLoadHistory) {
      console.log('🆕 新会话，清空聊天区域:', currentThreadId);
      // 清空消息
      clearMessages();
      // 重置所有历史加载状态
      setHasLoadedHistory(false);
      setHistoryPage(1);
      setHasMoreHistory(true);
      setShouldScrollToBottom(false); // 重置滚动标志
      lastMessageCountRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentThreadId, shouldLoadHistory]); // 依赖 currentThreadId 和 shouldLoadHistory

  /**
   * 监听错误状态，显示错误提示并关闭 loading
   */
  useEffect(() => {
    if (error) {
      console.error('❌ SSE 错误:', error);
      
      // 显示错误toast（持续时间更长，更醒目）
      message.error({
        content: `连接异常: ${error}`,
        duration: 5, // 显示5秒
        style: {
          marginTop: '20vh',
        },
      });
      
      // 立即关闭所有 loading 状态
      setIsWaitingResponse(false);
      console.log('✅ 已关闭所有loading状态（由于error）');
    }
  }, [error]);

  /**
   * 监听 isStreaming 状态，当SSE连接结束时关闭 loading
   * 修复bug：SSE异常断开或正常结束时，确保所有loading状态都被关闭
   */
  useEffect(() => {
    console.log('🔍 SSE状态变化:', { isStreaming, isConnected, isWaitingResponse });
    
    if (!isStreaming && !isConnected) {
      console.log('✅ SSE连接已结束，关闭所有loading状态');
      setIsWaitingResponse(false);
    }
  }, [isStreaming, isConnected, isWaitingResponse]);

  // 智能滚动控制
  const scrollToBottom = useCallback((immediate = false) => {
    if (immediate) {
      // 立即滚动到底部（不使用动画）- 直接设置 scrollTop
      if (messagesContainerRef.current && messagesEndRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } else if (isAutoScrollEnabled && !isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAutoScrollEnabled, isUserScrolling]);

  // 监听 shouldScrollToBottom 状态，立即滚动到底部
  useEffect(() => {
    if (shouldScrollToBottom && !isLoadingHistory) {
      console.log('📍 历史消息加载完成，立即滚动到底部（无动画）');
      
      // 使用 requestAnimationFrame 确保 DOM 已更新，然后立即滚动
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom(true);
          setShouldScrollToBottom(false); // 重置标志
        });
      });
    }
  }, [shouldScrollToBottom, isLoadingHistory, scrollToBottom]);

  // 监听用户滚动行为
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    const isAtTop = scrollTop < 100; // 距离顶部小于 100px

    // 处理滚动到底部
    if (isAtBottom) {
      setIsAutoScrollEnabled(true);
      setIsUserScrolling(false);
    } else {
      if (!isUserScrolling) {
        setIsUserScrolling(true);
        setIsAutoScrollEnabled(false);
      }
    }

    // 处理滚动到顶部 - 加载更多历史消息
    if (isAtTop && hasMoreHistory && !isLoadingMoreHistory && currentThreadId) {
      console.log('🔝 滚动到顶部，加载更多历史消息');
      loadMoreHistory(currentThreadId);
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  }, [isUserScrolling, hasMoreHistory, isLoadingMoreHistory, currentThreadId, loadMoreHistory]);

  // 监听消息变化，自动滚动
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // 监听消息变化，关闭 loading
  useEffect(() => {
    // 只有当消息数量增加，且新增的是 assistant 消息时，才关闭 waiting 状态
    if (messages.length > lastMessageCountRef.current) {
      const newMessages = messages.slice(lastMessageCountRef.current);
      const hasNewAssistantMessage = newMessages.some(msg => msg.role === 'assistant');
      
      if (hasNewAssistantMessage && isWaitingResponse) {
        setIsWaitingResponse(false);
      }
      
      lastMessageCountRef.current = messages.length;
    }
  }, [messages, isWaitingResponse]);

  // 处理场景选择
  const handleScenarioSelect = (configId: string, configName: string) => {
    setSelectedConfigId(configId);
    setSelectedConfigName(configName);
    
    // 切换场景时生成新的 thread_id
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    const uuid = generateUUID();
    const newThreadId = `${username}_${uuid}_${configId}`;
    setUniqueThreadId(newThreadId);
    
    console.log('切换场景，生成新的 thread_id:', newThreadId);
    console.log('选择场景:', configId, configName);
    console.log('当前用户:', username);
    
    // 通知父组件 thread_id 变化
    if (onThreadIdChange) {
      onThreadIdChange(newThreadId);
    }
  };

  // 处理切换场景后清空消息
  const handleClearMessages = () => {
    clearMessages();
    lastMessageCountRef.current = 0; // 重置消息计数
    setIsWaitingResponse(false); // 重置等待响应状态，关闭 LoadingMessage
    setIsLoadingHistory(false); // 重置历史加载状态
    setIsLoadingMoreHistory(false); // 重置更多历史加载状态
    setHasLoadedHistory(false); // 重置已加载标记
    setHistoryPage(1); // 重置分页
    setHasMoreHistory(true); // 重置是否还有更多
    setShouldScrollToBottom(false); // 重置滚动标志
    console.log('✅ 已清空消息历史和所有loading状态');
  };

  // 发送消息
  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isStreaming) return;
    
    // 检查是否选择了场景
    if (!selectedConfigId) {
      message.warning('请先选择一个场景');
      return;
    }
    
    try {
      // 添加用户消息
      addUserMessage(userMessage);
      
      // 更新消息计数基准
      lastMessageCountRef.current = messages.length + 1; // +1 因为刚添加了用户消息
      
      // 显示 loading 状态
      setIsWaitingResponse(true);
      
      // 构建请求体
      const requestBody = {
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ],
        config_id: parseInt(selectedConfigId),
        thread_id: uniqueThreadId, // 已包含 configId，不需要重复拼接
      };
      
      console.log('Sending request:', requestBody);
      
      // 使用 SSE 连接
      await connect('chat/stream', requestBody);
      
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error(`发送失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsWaitingResponse(false);
    }
  };

  return (
    <div className="modern-chat-container">
      {/* 消息列表 */}
      <div 
        className="chat-messages" 
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {isLoadingHistory ? (
          // 加载历史消息中
          <div className="chat-loading-history">
            <Spin size="large" />
            <div className="chat-loading-history-text">加载历史消息中...</div>
          </div>
        ) : messages.length === 0 ? (
          <WelcomePage onQuickAction={sendMessage} />
        ) : (
          <>
            {/* 加载更多历史提示 */}
            {isLoadingMoreHistory && (
              <div className="loading-more-history" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                color: 'var(--text-tertiary)',
                fontSize: '14px'
              }}>
                <Spin size="small" />
                <span style={{ marginLeft: 8 }}>加载更多历史...</span>
              </div>
            )}
            {!hasMoreHistory && messages.length > 0 && (
              <div className="no-more-history" style={{
                textAlign: 'center',
                padding: '16px',
                color: 'var(--text-tertiary)',
                fontSize: '12px'
              }}>
                <span>— 没有更多历史消息了 —</span>
              </div>
            )}
            
            {/* 消息列表 */}
            {messages.map((message: any, index: number) => (
              <MessageCard 
                key={message.id || index} 
                message={message} 
                isStreaming={isStreaming && index === messages.length - 1}
              />
            ))}
            
            {/* 显示 loading 状态 */}
            {isWaitingResponse && <LoadingMessage />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入区域 */}
      <div className="chat-input-wrapper">

        
        {/* 输入框 */}
        <ChatInput 
          onSendMessage={sendMessage}
          onStopStreaming={disconnect}
          isStreaming={isStreaming}
        />
        
        {/* 场景选择器 */}
        <ScenarioSelector
          selectedConfigId={selectedConfigId}
          onSelect={handleScenarioSelect}
          onClearMessages={handleClearMessages}
          onDisconnect={disconnect}
          hasMessages={messages.length > 0}
          disabled={isStreaming}
        />

      </div>
    </div>
  );
};

export default KaFlowChat; 