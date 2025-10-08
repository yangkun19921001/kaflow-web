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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
      </div>
    </div>
  );
};

export default MessageCard; 