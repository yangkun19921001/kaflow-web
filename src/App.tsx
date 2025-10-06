import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import KaFlowChat from './components/KaFlowChat';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import './styles/App.css';
import 'antd/dist/reset.css';

const AppContent: React.FC = () => {
  const { theme } = useTheme();

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
        <div className="App">
          <div className="theme-toggle-container">
            <ThemeToggle />
          </div>
          <KaFlowChat />
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
