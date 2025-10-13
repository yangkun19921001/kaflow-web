import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getConfigFromURL } from '../utils/urlParams';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 优先级：URL 参数 > localStorage > 默认值 'light'
  const [theme, setTheme] = useState<Theme>(() => {
    const urlConfig = getConfigFromURL();
    if (urlConfig.theme) {
      console.log('🎨 从 URL 参数加载主题:', urlConfig.theme);
      return urlConfig.theme;
    }
    const savedTheme = localStorage.getItem('kaflow-theme') as Theme;
    if (savedTheme) {
      console.log('🎨 从 localStorage 加载主题:', savedTheme);
      return savedTheme;
    }
    console.log('🎨 使用默认主题: light');
    return 'light';
  });

  // 主题变化时更新 localStorage 和 document 属性
  useEffect(() => {
    localStorage.setItem('kaflow-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    console.log('🎨 主题已应用:', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

