import React, { useState, useRef, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useSSE } from '../hooks/useSSE';
import MessageCard from './MessageCard';
import ChatInput from './ChatInput';
import WelcomePage from './WelcomePage';
import ScenarioSelector from './ScenarioSelector';

const KaFlowChat: React.FC = () => {
  const [uniqueThreadId, setUniqueThreadId] = useState('');
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('1'); // 默认选择设备故障排查助手
  const [selectedConfigName, setSelectedConfigName] = useState<string>('设备故障排查助手');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 使用 SSE Hook
  const { 
    messages, 
    isConnected, 
    isStreaming, 
    error, 
    connect, 
    disconnect, 
    clearMessages, 
    addUserMessage 
  } = useSSE();

  // 生成唯一的thread_id
  useEffect(() => {
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const generateUniqueThreadId = () => {
      const email = 'yang1001yk@gmail.com';
      const uuid = generateUUID();
      const threadId = `${email}_${uuid}`;
      setUniqueThreadId(threadId);
      console.log('Generated unique thread_id:', threadId);
    };
    
    generateUniqueThreadId();
  }, []);

  // 智能滚动控制
  const scrollToBottom = useCallback(() => {
    if (isAutoScrollEnabled && !isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAutoScrollEnabled, isUserScrolling]);

  // 监听用户滚动行为
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (isAtBottom) {
      setIsAutoScrollEnabled(true);
      setIsUserScrolling(false);
    } else {
      if (!isUserScrolling) {
        setIsUserScrolling(true);
        setIsAutoScrollEnabled(false);
      }
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  }, [isUserScrolling]);

  // 监听消息变化，自动滚动
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // 处理场景选择
  const handleScenarioSelect = (configId: string, configName: string) => {
    setSelectedConfigId(configId);
    setSelectedConfigName(configName);
    console.log('选择场景:', configId, configName);
  };

  // 处理切换场景后清空消息
  const handleClearMessages = () => {
    clearMessages();
    console.log('已清空消息历史');
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
      
      // 构建请求体
      const requestBody = {
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ],
        config_id: parseInt(selectedConfigId),
        thread_id: uniqueThreadId+'_'+selectedConfigId,
      };
      
      console.log('Sending request:', requestBody);
      
      // 使用 SSE 连接
      await connect('chat/stream', requestBody);
      
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error(`发送失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        {messages.length === 0 ? (
          <WelcomePage onQuickAction={sendMessage} />
        ) : (
          <>
            {messages.map((message: any, index: number) => (
              <MessageCard 
                key={message.id || index} 
                message={message} 
                isStreaming={isStreaming && index === messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入区域 */}
      <div className="chat-input-wrapper">

        
        {/* 输入框 */}
        <ChatInput 
          onSendMessage={sendMessage}
          isStreaming={isStreaming}
        />
        
        {/* 场景选择器 */}
        <ScenarioSelector
          selectedConfigId={selectedConfigId}
          onSelect={handleScenarioSelect}
          onClearMessages={handleClearMessages}
          hasMessages={messages.length > 0}
          disabled={isStreaming}
        />

      </div>
    </div>
  );
};

export default KaFlowChat; 