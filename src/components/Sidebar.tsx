import React, { useState } from 'react';
import { Bot, Database, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Modal, message } from 'antd';
import ThreadList from './ThreadList';
import { Thread } from '../services/threadService';

/**
 * 一级导航项配置
 */
interface NavItem {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  username: string;
  activeThreadId: string | null;
  onThreadSelect: (thread: Thread) => void;
  onNewChat: (configId: string) => void;
  availableConfigs: Array<{ id: string; name: string; description?: string }>;
}

/**
 * 侧边栏组件
 * 功能：
 * 1. 一级导航：智能体、知识库等
 * 2. 二级内容：会话列表
 * 3. 创建新会话功能
 */
const Sidebar: React.FC<SidebarProps> = ({
  username,
  activeThreadId,
  onThreadSelect,
  onNewChat,
  availableConfigs,
}) => {
  const [activeNav, setActiveNav] = useState<string>('agent');
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false); // 侧边栏折叠状态

  /**
   * 一级导航配置
   */
  const navItems: NavItem[] = [
    {
      id: 'agent',
      name: '智能体',
      icon: <Bot size={20} />,
    },
    {
      id: 'knowledge',
      name: '知识库',
      icon: <Database size={20} />,
    },
  ];

  /**
   * 处理导航切换
   */
  const handleNavClick = (navId: string) => {
    // 如果是收起状态，点击时自动展开
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setActiveNav(navId);
  };

  /**
   * 切换侧边栏折叠状态
   */
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  /**
   * 显示创建新会话对话框
   */
  const handleNewChatClick = () => {
    setIsNewChatModalVisible(true);
  };

  /**
   * 确认创建新会话
   */
  const handleCreateNewChat = () => {
    if (!selectedConfigId) {
      message.warning('请选择一个场景');
      return;
    }

    onNewChat(selectedConfigId);
    setIsNewChatModalVisible(false);
    setSelectedConfigId('');
  };

  /**
   * 取消创建新会话
   */
  const handleCancelNewChat = () => {
    setIsNewChatModalVisible(false);
    setSelectedConfigId('');
  };

  /**
   * 渲染二级内容
   */
  const renderSecondaryContent = () => {
    switch (activeNav) {
      case 'agent':
        return (
          <div className="sidebar-secondary-content">
            {/* 新建会话按钮 */}
            <div className="sidebar-new-chat-section">
              <Button
                type="primary"
                icon={<Plus size={16} />}
                className="sidebar-new-chat-btn"
                onClick={handleNewChatClick}
                block
              >
                新建会话
              </Button>
            </div>

            {/* 会话列表 */}
            <div className="sidebar-thread-list-section">
              <ThreadList
                username={username}
                activeThreadId={activeThreadId}
                onThreadSelect={onThreadSelect}
                configs={availableConfigs}
              />
            </div>
          </div>
        );

      case 'knowledge':
        return (
          <div className="sidebar-secondary-content">
            <div className="sidebar-empty-state">
              <Database size={48} />
              <p>知识库功能即将上线</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 一级导航 */}
      <div className="sidebar-primary-nav">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-nav-item ${
              activeNav === item.id && !isCollapsed ? 'active' : ''
            }`}
            onClick={() => handleNavClick(item.id)}
            role="button"
            tabIndex={0}
            title={isCollapsed ? item.name : ''}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleNavClick(item.id);
              }
            }}
          >
            <div className="sidebar-nav-icon">{item.icon}</div>
            {!isCollapsed && <div className="sidebar-nav-name">{item.name}</div>}
          </div>
        ))}
        
        {/* 底部预留空间：用户和设置 */}
        <div className="sidebar-nav-spacer"></div>
      </div>

      {/* 二级内容区域 */}
      {!isCollapsed && (
        <div className="sidebar-secondary">
          {/* 标题栏 */}
          <div className="sidebar-secondary-header">
            <h2 className="sidebar-secondary-title">
              {navItems.find((item) => item.id === activeNav)?.name || ''}
            </h2>
            {/* 折叠按钮 - 右上角 */}
            <button
              className="sidebar-collapse-btn"
              onClick={toggleCollapse}
              title="收起侧边栏"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* 内容区域 */}
          {renderSecondaryContent()}
        </div>
      )}

      {/* 创建新会话对话框 */}
      <Modal
        title="创建新会话"
        open={isNewChatModalVisible}
        onOk={handleCreateNewChat}
        onCancel={handleCancelNewChat}
        okText="创建"
        cancelText="取消"
        width={480}
        className="new-chat-modal"
      >
        <div className="new-chat-modal-content">
          <p className="new-chat-modal-label">请选择一个场景：</p>
          <div className="new-chat-config-list">
            {availableConfigs.map((config) => (
              <div
                key={config.id}
                className={`new-chat-config-item ${
                  selectedConfigId === config.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedConfigId(config.id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedConfigId(config.id);
                  }
                }}
              >
                <div className="new-chat-config-name">{config.name}</div>
                {config.description && (
                  <div className="new-chat-config-description">
                    {config.description}
                  </div>
                )}
                {selectedConfigId === config.id && (
                  <div className="new-chat-config-check">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;

