import React from 'react';
import { Zap } from 'lucide-react';
import { getConfigFromURL } from '../utils/urlParams';

interface WelcomePageProps {
  onQuickAction: (message: string) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onQuickAction }) => {
  // 从 URL 参数获取应用标题
  const urlConfig = getConfigFromURL();
  const appTitle = urlConfig.appTitle || 'Kaflow 通用性 Agent';

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="welcome-icon">
          <Zap size={32} color="#3b82f6" />
        </div>
        <h1 className="welcome-title">{appTitle}</h1>
        <p className="welcome-subtitle">今天有什么可以帮到你？</p>
      </div>
    </div>
  );
};

export default WelcomePage; 