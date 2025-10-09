import React from 'react';
import { Loader2 } from 'lucide-react';
import { Message } from '../hooks/useSSE';
import MarkdownRenderer from './MarkdownRenderer';
import ToolCallCard from './ToolCallCard';

interface MessageCardProps {
  message: Message;
  isStreaming?: boolean;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, isStreaming = false }) => {

  /**
   * 格式化时间显示
   * 今天只显示时间，非今天显示日期+时间
   */
  const formatTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const timeStr = date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    // 如果是今天，只显示时间
    if (messageDate.getTime() === today.getTime()) {
      return timeStr;
    }
    
    // 如果是昨天
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    if (messageDate.getTime() === yesterday.getTime()) {
      return `昨天 ${timeStr}`;
    }
    
    // 如果是今年，显示月日
    if (now.getFullYear() === date.getFullYear()) {
      const dateStr = date.toLocaleDateString('zh-CN', { 
        month: 'numeric', 
        day: 'numeric' 
      });
      return `${dateStr} ${timeStr}`;
    }
    
    // 更早的消息，显示完整日期
    const dateStr = date.toLocaleDateString('zh-CN', { 
      year: 'numeric',
      month: 'numeric', 
      day: 'numeric' 
    });
    return `${dateStr} ${timeStr}`;
  };

  // 渲染用户消息 - 简化样式，去掉头像
  if (message.role === 'user') {
    return (
      <div className="message-wrapper user-message">
        <div className="user-bubble">
          <MarkdownRenderer content={message.content || ''} />
          <div className="message-time user-time">
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  // 渲染AI助手消息 - 简化版，类似 Cursor/DeepSeek 风格
  const isCurrentlyStreaming = message.isStreaming || isStreaming;

  return (
    <div className="message-wrapper assistant-message">
      <div className="assistant-content">
        {/* 移除了 header，直接显示内容 */}
        <div className="assistant-body">
          {message.contentItems && message.contentItems.length > 0 ? (
            message.contentItems.map((item: any, index: number) => (
              <div key={index} className="content-item">
                {item.type === 'text' && item.content && (
                  <MarkdownRenderer content={item.content} />
                )}
                {item.type === 'tool_call' && item.toolCall && (
                  <ToolCallCard toolCall={item.toolCall} />
                )}
              </div>
            ))
          ) : (
            message.content && <MarkdownRenderer content={message.content} />
          )}
          
          {isCurrentlyStreaming && (
            <div className="streaming-indicator">
              <Loader2 size={14} className="animate-spin" />
              <span>正在推理中...</span>
            </div>
          )}
        </div>
        
        {/* 消息时间戳 - 右下角 */}
        <div className="message-time assistant-time">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default MessageCard; 