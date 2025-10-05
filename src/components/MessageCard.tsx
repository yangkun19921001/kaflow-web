import React from 'react';
import { Avatar, Tag } from 'antd';
import { Bot, CheckCircle, Loader2 } from 'lucide-react';
import { Message } from '../hooks/useSSE';
import MarkdownRenderer from './MarkdownRenderer';
import ToolCallCard from './ToolCallCard';

interface MessageCardProps {
  message: Message;
  isStreaming?: boolean;
}

// Agent 配置
const AGENT_CONFIG: Record<string, {
  name: string;
  color: string;
  description: string;
}> = {
  coordinator: {
    name: '智能协调器',
    color: '#3b82f6',
    description: '负责任务分析和分流'
  },
  ops_react_agent: {
    name: '运维分析师',
    color: '#10b981',
    description: '执行系统检查和分析'
  },
  ops_report: {
    name: '报告生成器',
    color: '#8b5cf6',
    description: '生成专业运维报告'
  },
  chat_agent_with_mcp: {
    name: 'AI智能助手',
    color: '#3b82f6',
    description: 'AI智能助手'
  }
};

const MessageCard: React.FC<MessageCardProps> = ({ message, isStreaming = false }) => {
  const getAgentConfig = (agentName?: string) => {
    return AGENT_CONFIG[agentName || ''] || {
      name: agentName || 'AI助手',
      color: '#6b7280',
      description: 'AI智能助手'
    };
  };

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

  // 渲染AI助手消息
  const agentConfig = getAgentConfig(message.agent);
  const isCompleted = message.isCompleted;
  const isCurrentlyStreaming = message.isStreaming || isStreaming;

  return (
    <div className="message-wrapper assistant-message">
      <div className="assistant-content">
        <div className="assistant-header">
          <Avatar 
            icon={<Bot size={16} />} 
            style={{ backgroundColor: agentConfig.color }}
            size={32}
          />
          <div className="agent-info">
            <div className="agent-name-row">
              <span className="agent-name">{agentConfig.name}</span>
              {isCurrentlyStreaming && (
                <Tag 
                  color="#1890ff" 
                  icon={<Loader2 size={12} className="animate-spin" />}
                  style={{ 
                    backgroundColor: 'rgba(24, 144, 255, 0.1)',
                    border: '1px solid rgba(24, 144, 255, 0.3)',
                    color: '#1890ff'
                  }}
                >
                  生成中
                </Tag>
              )}
              {isCompleted && (
                <Tag 
                  color="#52c41a" 
                  icon={<CheckCircle size={12} />}
                  style={{ 
                    backgroundColor: 'rgba(82, 196, 26, 0.1)',
                    border: '1px solid rgba(82, 196, 26, 0.3)',
                    color: '#52c41a'
                  }}
                >
                  已完成
                </Tag>
              )}
            </div>
            <span className="message-time">
              {formatTime(message.lastUpdated || message.timestamp)}
            </span>
          </div>
        </div>
        
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
              <Loader2 size={14} className="animate-spin" style={{ color: agentConfig.color }} />
              <span>正在思考中...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard; 