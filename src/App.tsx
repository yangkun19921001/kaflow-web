import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import KaFlowChat from './components/KaFlowChat';
import './styles/App.css';
import 'antd/dist/reset.css';

const App: React.FC = () => {
  return (
    <ConfigProvider 
      locale={zhCN}
      theme={{
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          },
          Input: {
            borderRadius: 8,
          },
          Avatar: {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
          Tag: {
            borderRadius: 6,
          },
        },
      }}
    >
      <AntdApp>
        <div className="App">
          <KaFlowChat />
        </div>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
