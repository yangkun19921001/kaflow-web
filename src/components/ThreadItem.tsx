import React from 'react';
import { Thread } from '../services/threadService';

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
 * 展示会话的基本信息：场景图标和首条消息
 */
const ThreadItem: React.FC<ThreadItemProps> = ({ thread, isActive, onClick, configName }) => {
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
      </div>

      {/* 激活状态指示器 */}
      {isActive && <div className="thread-item-indicator" />}
    </div>
  );
};

export default ThreadItem;

