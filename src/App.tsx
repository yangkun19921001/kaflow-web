import React, { useState, useEffect } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import KaFlowChat from './components/KaFlowChat';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Thread } from './services/threadService';
import { fetchConfigs } from './services/configService';
import { ConfigItem } from './types/config';
import { getConfigFromURL, isInIframe, sendMessageToParent } from './utils/urlParams';
import './styles/App.css';
import 'antd/dist/reset.css';

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const [currentThreadId, setCurrentThreadId] = useState<string>('');
  const [currentConfigId, setCurrentConfigId] = useState<string>('1');
  const [availableConfigs, setAvailableConfigs] = useState<ConfigItem[]>([]);
  const [shouldLoadHistory, setShouldLoadHistory] = useState<boolean>(false); // 是否应该加载历史
  
  // 从 URL 参数获取配置
  const urlConfig = getConfigFromURL();
  const username = urlConfig.username || 'guest@kaflow.ai'; // 从URL参数获取，或使用默认值
  const inIframe = isInIframe();
  
  // 保存 disconnect 函数的引用
  const disconnectRef = React.useRef<(() => void) | null>(null);
  
  // iframe 模式日志
  useEffect(() => {
    if (inIframe) {
      console.log('🖼️  运行在 iframe 中');
      console.log('   - username:', username);
      console.log('   - hideHeader:', urlConfig.hideHeader);
      console.log('   - hideSidebar:', urlConfig.hideSidebar);
      
      // 通知父窗口已就绪
      sendMessageToParent('ready', { username });
    }
  }, [inIframe, username, urlConfig.hideHeader, urlConfig.hideSidebar]);

  /**
   * 加载可用配置列表
   */
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const response = await fetchConfigs();
        setAvailableConfigs(response.configs);
      } catch (error) {
        console.error('加载配置列表失败:', error);
      }
    };

    loadConfigs();
  }, []);

  /**
   * 处理会话选择（点击历史会话）
   */
  const handleThreadSelect = (thread: Thread) => {
    console.log('📖 选择历史会话:', thread);
    setCurrentThreadId(thread.thread_id);
    setCurrentConfigId(thread.config_id);
    setShouldLoadHistory(true); // 点击历史会话时，需要加载历史消息
  };

  /**
   * 处理新建会话
   */
  const handleNewChat = (configId: string) => {
    console.log('🆕 [新建会话] 开始创建新会话，场景ID:', configId);
    
    // 1. 先停止当前的SSE连接（如果有的话）
    if (disconnectRef.current) {
      console.log('🛑 [新建会话] 步骤1: 停止当前SSE连接');
      disconnectRef.current();
    } else {
      console.log('ℹ️  [新建会话] 没有活动的SSE连接');
    }
    
    // 2. 生成新的 thread_id
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const newThreadId = `${username}_${generateUUID()}_${configId}`;
    console.log('✅ [新建会话] 步骤2: 生成新的thread_id:', newThreadId);
    
    setCurrentThreadId(newThreadId);
    setCurrentConfigId(configId);
    setShouldLoadHistory(false); // 新建会话时，不需要加载历史消息
    
    console.log('✅ [新建会话] 创建完成');
  };
  
  /**
   * 从 KaFlowChat 获取 disconnect 函数
   */
  const handleDisconnectRef = (disconnect: () => void) => {
    disconnectRef.current = disconnect;
    console.log('✅ disconnect 函数已注册到 App');
  };

  /**
   * 处理 thread_id 变化（从 KaFlowChat 传来）
   */
  const handleThreadIdChange = (threadId: string) => {
    setCurrentThreadId(threadId);
  };

  // 根据 URL 参数决定是否显示侧边栏和头部
  const showSidebar = !urlConfig.hideSidebar;
  const showHeader = !urlConfig.hideHeader;
  
  return (
    <ConfigProvider 
      locale={zhCN}
      theme={{
        algorithm: theme === 'light' ? undefined : undefined,
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        },
        components: {
          Button: {
            borderRadius: 8,
            fontWeight: 500,
          },
          Card: {
            borderRadius: 12,
            boxShadow: theme === 'light' 
              ? '0 2px 8px rgba(0, 0, 0, 0.08)' 
              : '0 2px 8px rgba(0, 0, 0, 0.3)',
          },
          Input: {
            borderRadius: 8,
          },
          Avatar: {
            boxShadow: theme === 'light'
              ? '0 2px 8px rgba(0, 0, 0, 0.1)'
              : '0 2px 8px rgba(0, 0, 0, 0.3)',
          },
          Tag: {
            borderRadius: 6,
          },
          Modal: {
            contentBg: theme === 'light' ? '#ffffff' : '#2f2f2f',
            headerBg: theme === 'light' ? '#ffffff' : '#2f2f2f',
            titleColor: theme === 'light' ? '#111827' : '#ffffff',
            colorText: theme === 'light' ? '#374151' : '#e5e7eb',
          },
        },
      }}
    >
      <AntdApp>
        <div className={`App ${inIframe ? 'iframe-mode' : ''}`}>
          {/* 主题切换按钮 */}
          {showHeader && (
            <div className="theme-toggle-container">
              <ThemeToggle />
            </div>
          )}

          {/* 主布局：侧边栏 + 聊天区域 */}
          <div className={`app-layout ${!showSidebar ? 'no-sidebar' : ''}`}>
            {/* 侧边栏 */}
            {showSidebar && (
              <Sidebar
                username={username}
                activeThreadId={currentThreadId}
                onThreadSelect={handleThreadSelect}
                onNewChat={handleNewChat}
                availableConfigs={availableConfigs}
              />
            )}

            {/* 聊天区域 */}
            <div className="app-main-content">
              <KaFlowChat
                currentThreadId={currentThreadId}
                currentConfigId={currentConfigId}
                username={username}
                onThreadIdChange={handleThreadIdChange}
                onDisconnectRef={handleDisconnectRef}
                shouldLoadHistory={shouldLoadHistory}
              />
            </div>
          </div>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
