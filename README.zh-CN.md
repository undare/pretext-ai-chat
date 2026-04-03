# ⚡ Pretext AI Chat

Same AI, better screen — 基于 Pretext 的 AI 聊天客户端，流式输出零抖动。

**[🌐 在线体验](https://fluten.github.io/pretext-ai-chat/)** · **[🇺🇸 English](./README.md)**

## 🤔 这是什么？

一个自带 API Key 的 AI 聊天前端（支持 OpenAI / Anthropic）。产品不做模型，专注渲染层——让流式输出像放电影一样丝滑，彻底消除页面抖动。

核心依赖是 [`@chenglou/pretext`](https://github.com/chenglou/pretext)，一个纯 JavaScript 文本测量库，完全绕过 DOM reflow。

## ✨ 技术亮点

### 1. 流式输出零抖动

传统聊天界面在流式输出时会不停抖动，因为每来一个字浏览器就要重新计算布局（reflow）。Pretext 在文字写入 DOM 之前就用纯 JS 算好了精确高度——容器预设尺寸，页面永远不跳。

### 2. 智能气泡宽度（Shrinkwrap）

消息气泡自动收缩到最窄宽度，同时保持行数不变。短消息不会撑满整行，而是紧凑包裹文字。基于 `layout()` 的二分查找实现。

### 3. 虚拟滚动列表

所有消息的高度通过 `prepare()` + `layout()` 预先计算，无需渲染。DOM 中只存在可见区域的消息。1000+ 条消息滚动依然流畅。

### 4. 渲染 Benchmark

内置左右分屏对比：原生 DOM 渲染 vs Pretext 渲染。实时观察 reflow 次数、高度跳变和视觉稳定性。

## 🚀 快速开始

```bash
git clone https://github.com/fluten/pretext-ai-chat.git
cd pretext-ai-chat
npm install
npm run dev
```

打开 `http://localhost:5173`，在设置中输入你的 API Key 即可开始对话。

## 🛠 技术栈

| 层级 | 选型 |
|------|------|
| 构建 | Vite |
| 框架 | Preact（3KB 的 React 替代品） |
| 样式 | CSS Modules + CSS 变量 |
| 核心 | [@chenglou/pretext](https://github.com/chenglou/pretext) |
| 图标 | Lucide |
| 字体 | Inter + JetBrains Mono |

无后端、无数据库，一切在浏览器中运行。

## 📄 许可证

MIT
