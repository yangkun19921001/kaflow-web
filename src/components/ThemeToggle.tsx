import React from 'react';
import { Button } from 'antd';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="text"
      icon={theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      onClick={toggleTheme}
      className="theme-toggle-btn"
      title={theme === 'light' ? '切换到夜间模式' : '切换到日间模式'}
    />
  );
};

export default ThemeToggle;

