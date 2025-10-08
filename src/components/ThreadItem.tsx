import React from 'react';
import { Thread } from '../services/threadService';
import { Clock } from 'lucide-react';

interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  onClick: () => void;
  configName?: string; // 场景名称（可选）
}

/**
 * 根据场景名称或配置ID获取对应的图标
 */
const getScenarioIcon = (configName?: string, configId?: string): string => {
  // 场景图标映射表（与 ScenarioSelector 保持一致）
  const iconMap: Record<string, string> = {
    '智能聊天助手': '💬',
    '浏览器自动化助手': '🌐',
    '设备故障排查助手': '🔧',
    '智能翻译助手': '🌍',
    '智能搜索助手': '🔍',
    '旅行规划师': '✈️',
    '图像编辑': '🎨',
    '网页开发': '💻',
    '深入研究': '🔍',
    '图像生成': '🖼️',
  };
  
  // 如果提供了场景名称，使用名称匹配
  if (configName && iconMap[configName]) {
    return iconMap[configName];
  }
  
  // 如果提供了配置ID，根据ID匹配（作为后备）
  const configIdIconMap: Record<string, string> = {
    '1': '🔧', // 设备故障排查助手
    '2': '💬', // 智能聊天助手
    '3': '🌐', // 浏览器自动化助手
    '4': '🔍', // 智能搜索助手
  };
  
  if (configId && configIdIconMap[configId]) {
    return configIdIconMap[configId];
  }
  
  // 默认图标
  return '🤖';
};

/**
 * 单个会话项组件
 * 展示会话的基本信息：首条消息、消息数量、最后更新时间
 */
const ThreadItem: React.FC<ThreadItemProps> = ({ thread, isActive, onClick, configName }) => {
  /**
   * 格式化时间显示
   * 今天显示时间，昨天显示"昨天"，更早显示日期
   */
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const threadDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (threadDate.getTime() === today.getTime()) {
      // 今天 - 显示时间
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (threadDate.getTime() === yesterday.getTime()) {
      // 昨天
      return '昨天';
    } else if (now.getFullYear() === date.getFullYear()) {
      // 今年 - 显示月日
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    } else {
      // 更早 - 显示完整日期
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  /**
   * 截断长文本
   * 超过指定长度的文本会被截断并添加省略号
   */
  const truncateText = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={`thread-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* 会话图标 - 根据场景动态显示 */}
      <div className="thread-item-icon">
        <span className="thread-item-emoji">
          {getScenarioIcon(configName, thread.config_id)}
        </span>
      </div>

      {/* 会话内容 */}
      <div className="thread-item-content">
        {/* 首条消息（标题） */}
        <div className="thread-item-title">
          {truncateText(thread.first_message)}
        </div>

        {/* 底部信息：消息数量和时间 */}
        <div className="thread-item-footer">
          <span className="thread-item-count">
            {thread.message_count} 条消息
          </span>
          <span className="thread-item-divider">·</span>
          <span className="thread-item-time">
            <Clock size={12} />
            {formatTime(thread.last_updated)}
          </span>
        </div>
      </div>

      {/* 激活状态指示器 */}
      {isActive && <div className="thread-item-indicator" />}
    </div>
  );
};

export default ThreadItem;

