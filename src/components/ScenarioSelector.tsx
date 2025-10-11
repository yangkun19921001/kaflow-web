/**
 * 场景选择组件
 * 展示可用的 AI 助手场景，用户可以选择不同的场景进行对话
 */

import React, { useState, useEffect } from 'react';
import { Tag, Spin, message, Modal, App } from 'antd';
import { ConfigItem } from '../types/config';
import { fetchConfigs } from '../services/configService';

interface ScenarioSelectorProps {
  selectedConfigId?: string;
  onSelect: (configId: string, configName: string) => void;
  onClearMessages: () => void;
  onDisconnect?: () => void; // 新增：停止当前SSE连接
  hasMessages: boolean;
  disabled?: boolean;
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  selectedConfigId,
  onSelect,
  onClearMessages,
  onDisconnect,
  hasMessages,
  disabled = false,
}) => {
  const { modal } = App.useApp();
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // 加载配置列表
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await fetchConfigs();
      setConfigs(data.configs);
    } catch (error) {
      console.error('加载场景配置失败:', error);
      message.error('加载场景配置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理场景选择
  const handleSelect = (config: ConfigItem) => {
    console.log('点击场景:', config.name, 'ID:', config.id);
    console.log('当前选中的场景 ID:', selectedConfigId);
    console.log('是否有消息:', hasMessages);
    console.log('是否禁用:', disabled);
    
    if (disabled) {
      console.log('场景选择已禁用');
      return;
    }
    
    // 如果点击的是当前已选中的场景，不做任何处理
    if (selectedConfigId === config.id) {
      console.log('点击的是当前已选中的场景，不做任何处理');
      return;
    }
    
    console.log('准备弹出确认对话框');
    
    // 弹出确认对话框
    modal.confirm({
      title: '确认切换场景',
      width: 480,
      zIndex: 9999,
      maskClosable: false,
      getContainer: () => document.body,
      content: (
        <div>
          <p style={{ marginBottom: 12, fontSize: '14px', color: 'var(--text-secondary)' }}>
            {hasMessages ? (
              <>
                切换场景将清空当前所有对话记录，确定要切换到 
                <strong style={{ color: '#3b82f6', margin: '0 4px' }}>{config.name}</strong> 
                吗？
              </>
            ) : (
              <>
                确定要切换到 
                <strong style={{ color: '#3b82f6', margin: '0 4px' }}>{config.name}</strong> 
                吗？
              </>
            )}
          </p>
          <div style={{ 
            padding: '12px 14px', 
            background: 'rgba(59, 130, 246, 0.08)', 
            borderLeft: '3px solid #3b82f6',
            borderRadius: '6px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.7'
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)', fontSize: '14px' }}>
              📋 场景说明
            </div>
            <div>{config.description}</div>
          </div>
        </div>
      ),
      okText: '确认切换',
      cancelText: '取消',
      okType: 'primary',
      centered: true,
      onOk: () => {
        console.log('🔄 开始切换场景...');
        
        // 1. 先停止当前的SSE连接（无论是否在进行中）
        if (onDisconnect) {
          console.log('🛑 停止当前SSE连接...');
          onDisconnect();
        }
        
        // 2. 清空消息和所有loading状态（无论是否有消息）
        // 这确保所有loading动画都被关闭
        console.log('🗑️ 清空消息历史和loading状态...');
        onClearMessages();
        
        // 3. 切换场景
        console.log(`✅ 切换到场景: ${config.name}`);
        onSelect(config.id, config.name);
        
        // 4. 显示成功提示
        message.success(`已切换到 ${config.name}`);
      },
    });
    
    console.log('Modal 确认对话框已调用');
  };

  // 切换显示更多
  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  // 显示的配置数量
  const displayConfigs = showAll ? configs : configs.slice(0, 5);
  const hasMore = configs.length > 5;

  if (loading) {
    return (
      <div className="scenario-selector-loading">
        <Spin size="small" />
        <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>加载场景中...</span>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="scenario-selector-empty">
        暂无可用场景
      </div>
    );
  }

  return (
    <div className="scenario-selector">
      <div className="scenario-tags">
        {displayConfigs.map((config) => {
          const isSelected = selectedConfigId === config.id;
          
          return (
            <Tag
              key={config.id}
              className={`scenario-tag ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => handleSelect(config)}
              style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <span className="scenario-icon">
                {getScenarioIcon(config.name)}
              </span>
              <span className="scenario-name">{config.name}</span>
            </Tag>
          );
        })}
        
        {hasMore && (
          <Tag
            className="scenario-tag more-tag"
            onClick={toggleShowAll}
            style={{ cursor: 'pointer' }}
          >
            <span className="scenario-name">
              {showAll ? '收起' : '更多'}
            </span>
          </Tag>
        )}
      </div>
    </div>
  );
};

/**
 * 根据场景名称返回对应的图标
 * 可以根据实际需求自定义图标映射
 */
const getScenarioIcon = (name: string): string => {
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
  
  return iconMap[name] || '🤖';
};

export default ScenarioSelector;


