# KaFlow Web

<div align="center">

![KaFlow Web](https://img.shields.io/badge/KaFlow--Web-v0.1.0-blue)
![React](https://img.shields.io/badge/React-19.1.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178c6)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5.27+-1890ff)
![License](https://img.shields.io/badge/License-MIT-yellow)

**KaFlow-Py 的现代化 Web 交互界面**

[English](./README_EN.md) | 简体中文

</div>

## 📖 简介

KaFlow Web 是 [KaFlow-Py](https://github.com/yangkun19921001/kaflow-py) 的前端交互界面，提供现代化、美观的 AI Agent 对话体验。通过 Server-Sent Events (SSE) 实现实时流式响应，让用户可以像使用 ChatGPT 一样与 AI Agent 进行自然对话。

![](http://devyk.top/2022/202510051404583.gif)


### 核心特性

- 🎨 **现代化 UI** - 基于 Ant Design 5.x，精美的用户界面
- ⚡ **实时流式响应** - 基于 SSE 技术，实时展示 AI 回复
- 🎯 **场景快速切换** - 支持多个 AI Agent 场景一键切换
- 💬 **智能对话** - 支持多轮对话、上下文记忆
- 🛠️ **工具调用可视化** - 实时展示工具调用过程和结果
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🎭 **Markdown 渲染** - 支持代码高亮、表格、列表等

### 技术栈

- **React** 19.1.1 - 前端框架
- **TypeScript** 4.9+ - 类型安全
- **Ant Design** 5.27.4 - UI 组件库
- **React Markdown** - Markdown 渲染
- **Lucide React** - 图标库

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────┐
│              KaFlow Web 架构                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  组件层 (Components)                             │
├─────────────────────────────────────────────────┤
│  • KaFlowChat      - 主聊天组件                 │
│  • MessageCard     - 消息卡片                   │
│  • ChatInput       - 输入框                     │
│  • ScenarioSelector - 场景选择器                │
│  • ToolCallCard    - 工具调用卡片               │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Hooks 层 (Custom Hooks)                        │
├─────────────────────────────────────────────────┤
│  • useSSE          - SSE 连接管理               │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  服务层 (Services)                               │
├─────────────────────────────────────────────────┤
│  • configService   - 配置服务                   │
└─────────────────────────────────────────────────┘
                    │
                    ▼ HTTP/SSE
┌─────────────────────────────────────────────────┐
│  后端 API (KaFlow-Py)                           │
├─────────────────────────────────────────────────┤
│  • /api/configs    - 获取场景列表               │
│  • /api/chat/stream - 流式对话                  │
└─────────────────────────────────────────────────┘
```

## 📦 功能清单

### 场景选择器

- 🔄 自动从后端获取场景列表
- 🎨 美观的下拉选择器
- 🔀 切换场景时可选择是否清空历史消息
- 🎯 默认选中设备故障排查助手

### 智能对话界面

- 👤 用户消息和 AI 消息 - 单独的气泡样式
- 🛠️ 工具调用 - 特殊卡片展示
- 🎭 Markdown 支持（代码高亮、表格、列表等）

### 工具调用可视化

支持的工具展示：
- 🔍 搜索
- 🌐 浏览器自动化
- 🔧 SSH 远程工具

### SSE 流式响应

基于 `useSSE` Hook 实现的实时流式响应。

### 智能滚动控制

- ✅ 默认自动滚动到最新消息
- ✅ 用户手动滚动时暂停自动滚动
- ✅ 滚动到底部时恢复自动滚动
- ✅ 150ms 防抖优化

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yangkun19921001/kaflow-web.git
cd kaflow-web
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置后端地址

创建 `.env` 文件：

```bash
REACT_APP_BASE_URL=http://localhost:8102
```

### 4. 启动开发服务器

```bash
npm start

# 访问 http://localhost:3000
```



## 🎨 样式设计

### 主题配置

```typescript
const theme = {
  token: {
    colorPrimary: '#3b82f6',    // 主色调
    borderRadius: 8,             // 圆角
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
  }
};
```

## 📱 浏览器支持

| 浏览器 | 版本 |
|--------|------|
| Chrome | 最新版 |
| Firefox | 最新版 |
| Safari | 最新版 |
| Edge | 最新版 |

**注意**: 需要支持 ES6+ 和 SSE (Server-Sent Events)

## 📄 License

本项目采用 [MIT License](./LICENSE) 开源协议。

## 🙏 感谢

感谢以下开源项目的支持：

- [React](https://react.dev/) - 前端框架
- [Ant Design](https://ant.design/) - UI 组件库
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown 渲染
- [Lucide Icons](https://lucide.dev/) - 图标库

---

<div align="center">

**如果觉得项目不错，请给个 ⭐️ Star 支持一下！**

Made with ❤️ by DevYK

</div>
