# Pretext Display — Product Spec

> 一个基于 Pretext 的 AI 对话前端。用户自带 API Key，产品提供极致的文本渲染体验。
> 
> **一句话定位：Same AI, better screen.**

---

## 1. 产品概述

### 1.1 是什么
一个 AI Chat 客户端，类似 ChatBox / Cherry Studio / TypingMind，用户接入自己的 LLM API Key（OpenAI、Claude、国内模型等），产品专注于**前端渲染层**的极致体验。

### 1.2 核心技术优势
底层使用 [Pretext](https://github.com/chenglou/pretext) —— 一个纯 JS 文本测量和排版库，完全绕过 DOM reflow。所有文本高度计算都是纯算术运算，不触发浏览器重排。

### 1.3 面试叙事（STAR）
- **S**: 调研主流 AI 对话产品（ChatGPT、Kimi、豆包）时，发现流式输出普遍存在 layout shift、历史消息滚动卡顿、气泡留白浪费空间等渲染层问题
- **T**: 设计并实现一个以渲染性能为核心差异点的 AI Chat 前端
- **A**: 基于开源库 Pretext 构建完整产品，四个核心功能分别对应 Pretext 的四个 API
- **R**: CLS 从 0.3+ 降到 ~0，万条消息流畅滚动，同屏信息密度提升 15-20%

---

## 2. 功能架构

### 2.1 两个视图模式

| 模式 | 入口 | 用途 |
|------|------|------|
| **Chat 模式** | 默认首页 | 日常 AI 对话，所有渲染优化在这里自然落地 |
| **Benchmark 模式** | 设置页 / 侧边栏底部小图标（"Lab" 或 "实验室"），藏深一点 | 左右对比 + 实时性能指标，验证技术价值 |

### 2.2 Chat 模式 — 核心功能

#### 功能 A: 流式零抖动（Zero Layout Shift Streaming）
- **对应 API**: `prepare()` + `layout()`
- **实现**: 每个 token 到来时，先用 Pretext 预计算新文本的高度，提前设置容器高度，然后再写入文本
- **用户感知**: "这个 AI 打字怎么一点都不跳"
- **量化指标**: CLS (Cumulative Layout Shift) 对比

#### 功能 B: 消息虚拟列表（Virtualized Message List）
- **对应 API**: `layout()` 批量预算高度
- **实现**: 所有历史消息只通过 `prepare()` + `layout()` 预计算高度，不实际渲染到 DOM；只有可视区域内的消息才创建真实 DOM 节点；滚动时根据预算高度精确定位
- **用户感知**: "几千条历史消息翻起来还是秒开"
- **量化指标**: 10000 条消息场景下的滚动 FPS、内存占用

#### 功能 C: 智能气泡宽度（Shrinkwrap Bubbles）
- **对应 API**: `walkLineRanges()`
- **实现**: 用 `walkLineRanges` 二分查找保持相同行数的最窄宽度，让气泡精确包裹文本
- **用户感知**: "气泡刚好包住文字，没有多余的空白"
- **量化指标**: 同屏可见消息数对比（预计提升 15-20%）

#### 功能 D: API Key 配置 & 模型选择
- **设计原则**: 填一个 key 就能用，零配置上手
- **自动识别**: 根据 key 前缀自动判断 provider（`sk-ant-` → Anthropic，`sk-` → OpenAI，其他 → 当作 OpenAI 兼容格式）
- **模型列表**: 填完 key 后自动拉取可用模型（OpenAI `/v1/models` 接口），无需手动选 provider
- **可选高级配置**: 折叠式的"自定义 API 地址"输入框，给用中转站/代理的用户（默认隐藏，点击"高级设置"展开）
- **API 调用**: 直接从前端调用各 LLM 的流式 API（SSE / streaming）
- **注意**: 这是纯前端产品，API Key 存在 localStorage，不经过任何后端

**设置面板 UI（极简）：**
```
┌─────────────────────────────┐
│  API Key                    │
│  ┌────────────────────┬──┐  │
│  │ sk-••••••••••••3kF │👁│  │
│  └────────────────────┴──┘  │
│  ✓ Detected: OpenAI         │
│                             │
│  Model                      │
│  ┌────────────────────┬──┐  │
│  │ gpt-4o             │ ▾│  │  ← 自动拉取的模型列表
│  └────────────────────┴──┘  │
│                             │
│  ▸ Advanced settings        │  ← 点击展开自定义 API URL
└─────────────────────────────┘
```

### 2.3 Benchmark 模式

#### 入口
侧边栏底部一个小图标，或设置页面里的一个入口。不在主导航里。日常用户感知不到。

#### 功能
- 左右分屏对比：左侧原生 DOM 渲染 vs 右侧 Pretext 渲染
- 同时播放同一段流式文本（模拟数据，不需要真实 API 调用）
- 三个实时指标卡片：CLS score、Reflow 次数、FPS
- 控制：Token 速度滑块（5-80 token/s）、预设文本样本切换、暗色/亮色切换
- 预设文本样本：中文 AI 问答、英文技术回答、中英混排带 emoji

#### 指标采集方式
- CLS: `PerformanceObserver` 监听 `layout-shift`
- Reflow: 手动计数 `offsetHeight` 读取次数
- FPS: `requestAnimationFrame` 帧间隔计算

---

## 3. 页面结构

### 3.1 整体布局
```
┌─────────────────────────────────────────────┐
│  Sidebar (240px)  │    Main Area (flex-1)   │
│                   │                         │
│  App Logo/Name    │   ┌─────────────────┐   │
│  ───────────      │   │                 │   │
│  Chat history     │   │  Chat / Bench   │   │
│  list             │   │  content area   │   │
│                   │   │                 │   │
│                   │   │                 │   │
│  ───────────      │   │                 │   │
│  Settings         │   ├─────────────────┤   │
│  [Lab] icon       │   │  Input bar      │   │
│                   │   └─────────────────┘   │
└─────────────────────────────────────────────┘
```

### 3.2 Sidebar
- 顶部：产品名称 / Logo
- 中部：对话历史列表（点击切换对话）
- 底部：设置图标 + Lab/实验室图标（Benchmark 入口）
- 可折叠

### 3.3 Chat 主区域
- 消息列表（虚拟滚动）
  - 用户消息：右对齐气泡，浅色背景
  - AI 消息：左对齐气泡，白色背景，Shrinkwrap 宽度
  - 流式输出中的消息：底部有光标闪烁动画
- 底部输入栏
  - 文本输入框（支持多行，Shift+Enter 换行，Enter 发送）
  - 发送按钮
  - 模型选择下拉（当前模型名）

### 3.4 Benchmark 区域
- 顶部控制栏：Token 速度滑块 + 样本选择按钮 + 主题切换
- 中部左右分屏：两个独立的聊天渲染区域
- 底部指标面板：3 个 metric 卡片

---

## 4. 视觉设计

### 4.1 设计方向
**参考 Linear** —— 极简工具感，开发者审美。核心原则：
- 克制：能不加的元素就不加，每个像素都有理由存在
- 高对比度排版层级：标题/正文/辅助文字之间的视觉差距要拉大
- 留白即设计：宽松的间距本身就是高级感的来源
- 无装饰：没有渐变、没有阴影（除极少数功能性场景）、没有圆润的可爱感

### 4.2 配色系统（CSS 变量，写死到 spec 里）

**亮色模式：**
```css
--bg-primary: #FFFFFF;        /* 主背景 */
--bg-secondary: #F9FAFB;      /* 侧边栏、输入框背景 */
--bg-tertiary: #F3F4F6;       /* hover 状态、消息气泡 */
--bg-user-bubble: #F3F4F6;    /* 用户消息气泡 */
--bg-ai-bubble: #FFFFFF;      /* AI 消息气泡（无背景，靠排版区分） */

--text-primary: #111111;      /* 主文字，接近纯黑 */
--text-secondary: #6B7280;    /* 辅助文字 */
--text-tertiary: #9CA3AF;     /* 占位符、时间戳 */

--border: #E5E7EB;            /* 边框，极淡 */
--border-hover: #D1D5DB;      /* hover 边框 */

--accent: #5B5BF0;            /* 强调色：靛蓝偏紫，参考 Linear */
--accent-hover: #4F4FD9;      /* 强调色 hover */
--accent-subtle: #EEF2FF;     /* 强调色浅底（选中状态等） */
```

**暗色模式：**
```css
--bg-primary: #0A0A0A;        /* 主背景，接近纯黑 */
--bg-secondary: #141414;      /* 侧边栏 */
--bg-tertiary: #1E1E1E;       /* hover、气泡 */
--bg-user-bubble: #1E1E1E;
--bg-ai-bubble: #0A0A0A;

--text-primary: #F0F0F0;      /* 主文字 */
--text-secondary: #888888;
--text-tertiary: #555555;

--border: #222222;
--border-hover: #333333;

--accent: #7B7BFF;            /* 暗色下强调色提亮 */
--accent-hover: #6B6BEF;
--accent-subtle: #1A1A2E;
```

### 4.3 字体

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
```

- 从 Google Fonts 加载 Inter（400, 500, 600）和 JetBrains Mono（400）
- Inter 是 Linear 同款字体，辨识度高且中英文混排效果好
- **不用** 系统默认字体，这是区分"高级"和"普通"的关键

字号层级（严格遵守，不要发明新的）：
```
标题:    16px / font-weight: 600 / letter-spacing: -0.01em
正文:    14px / font-weight: 400 / line-height: 1.6
辅助:    12px / font-weight: 400 / color: var(--text-secondary)
代码:    13px / font-family: var(--font-mono)
```

### 4.4 间距系统

基础单位 4px，所有间距是 4 的倍数：
```
4px   — 元素内紧凑间距（图标与文字）
8px   — 相关元素之间
12px  — 小组件内 padding
16px  — 卡片内 padding、段落间距
24px  — 区块之间
32px  — 大区块之间
48px  — 页面级留白
```

### 4.5 边框和圆角

```css
border: 1px solid var(--border);     /* 统一 1px，不用 0.5px */
border-radius: 8px;                  /* 通用圆角 */
border-radius: 12px;                 /* 卡片、气泡 */
border-radius: 20px;                 /* 输入框、按钮（pill 形） */
```

- **没有 box-shadow**，除了输入框 focus 时的 `0 0 0 2px var(--accent-subtle)`
- 边框要么有要么没有，不用"若有若无"的半透明边框

### 4.6 动画

```css
transition: all 150ms ease;          /* 通用过渡，快速干脆 */
```

- 所有动画 150ms，Linear 风格就是快、不拖泥带水
- 流式光标：竖线闪烁 `opacity 0↔1`，周期 800ms
- 消息出现：`opacity 0→1 + translateY(4px→0)`，150ms，不要夸张的滑入
- 侧边栏折叠：宽度过渡 200ms
- **禁止**：弹跳、回弹、慢速淡入淡出、任何花哨的 ease-in-out-back

### 4.7 关键组件设计规范

**侧边栏：**
- 宽度 260px，背景 var(--bg-secondary)
- 右边框 1px solid var(--border)
- 对话列表项：padding 8px 12px，hover 时 bg-tertiary，选中时 accent-subtle 底色 + 左侧 2px accent 色条
- 底部图标区：16px 灰色图标，hover 变 text-primary

**消息气泡：**
- AI 消息：无背景色，左对齐，最大宽度 680px（阅读最优行宽）
- 用户消息：bg-tertiary 背景，右对齐，圆角 12px，padding 12px 16px
- 消息之间间距 24px
- AI 消息头像：左侧一个 24px 的小圆点或字母图标，accent 色

**输入框：**
- 底部固定，bg-secondary 背景，border 1px，圆角 20px（pill 形）
- 内部 padding 12px 16px
- placeholder 颜色 var(--text-tertiary)
- focus 时 border 变 accent，外圈 2px accent-subtle ring
- 发送按钮：圆形 32px，accent 背景，白色箭头图标，禁用时 opacity 0.3

**Benchmark 指标卡片：**
- bg-secondary 背景，无边框，圆角 8px
- 数字大号 24px / 600，标签 12px / secondary
- 好的值用绿色 #10B981，差的值用红色 #EF4444

### 4.8 响应式
MVP 只做桌面端（>= 1024px）。面试展示场景基本都是电脑。

---

## 5. 技术实现

### 5.1 技术栈
- **构建**: Vite
- **框架**: Preact（React 的 3KB 替代品，API 相同，零学习成本）
- **CSS**: CSS Modules（每个组件独立样式文件，不互相污染）+ 全局 CSS 变量
- **核心依赖**: `@chenglou/pretext`
- **字体**: Google Fonts 加载 Inter + JetBrains Mono
- **图标**: Lucide Icons（轻量 SVG 图标库，Linear 同款风格）
- **运行时**: Node.js (开发) / 任意静态托管 (部署)
- **部署**: GitHub Pages

选 Preact 而非 vanilla JS 的理由：
1. 设计规范要求暗色/亮色切换、组件级样式隔离、状态管理（对话列表、流式输出），vanilla JS 代码会很乱
2. Preact 只有 3KB，不影响"轻量高性能"的产品叙事
3. 组件化结构让 Claude Code 改单个组件时不会牵连其他部分
4. 虚拟列表仍然可以手动控制 DOM，Preact 不阻碍底层操作

选 Preact 而非 React 的理由：
1. 体积 3KB vs 40KB+，面试时说"我选了 3KB 的 Preact 而不是 React"本身就是一个产品判断
2. API 完全一样，Claude Code 生成的代码互通

### 5.1.1 初始化命令（给 Claude Code 的）
```bash
npm create vite@latest pretext-display -- --template preact
cd pretext-display
npm install
npm install @chenglou/pretext
npm install lucide-preact
npm run dev
```

### 5.2 核心实现思路

#### 流式零抖动
```js
// 伪代码
async function onStreamToken(token) {
  currentText += token
  const prepared = prepare(currentText, font)
  const { height } = layout(prepared, containerWidth, lineHeight)
  
  // 先设高度，再写文本 → 零 layout shift
  messageElement.style.height = height + 'px'
  messageElement.textContent = currentText
}
```

#### 虚拟列表
```js
// 伪代码：预算所有消息高度
const heights = messages.map(msg => {
  const prepared = prepare(msg.text, font)
  const { height } = layout(prepared, containerWidth, lineHeight)
  return height + padding
})

// 只渲染可视区域
function render(scrollTop, viewportHeight) {
  const { startIndex, endIndex } = getVisibleRange(heights, scrollTop, viewportHeight)
  // 只创建 startIndex..endIndex 的 DOM 节点
}
```

#### Shrinkwrap 气泡
```js
// 伪代码：二分查找最窄宽度
function shrinkwrap(text, font, maxWidth, lineHeight) {
  const prepared = prepareWithSegments(text, font)
  let lo = 0, hi = maxWidth
  
  // 先获取最大宽度下的行数
  let targetLines = 0
  walkLineRanges(prepared, maxWidth, () => targetLines++)
  
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2
    let lines = 0
    walkLineRanges(prepared, mid, () => lines++)
    if (lines <= targetLines) hi = mid
    else lo = mid
  }
  return hi // 最窄宽度，保持相同行数
}
```

### 5.3 LLM API 调用

#### Provider 自动识别
```js
function detectProvider(apiKey) {
  if (apiKey.startsWith('sk-ant-')) return 'anthropic'
  return 'openai' // OpenAI 原生 + 所有 OpenAI 兼容格式（中转站、国内模型等）
}

function getBaseUrl(provider, customUrl) {
  if (customUrl) return customUrl // 用户自定义的 API 地址优先
  if (provider === 'anthropic') return 'https://api.anthropic.com'
  return 'https://api.openai.com' // 默认 OpenAI
}
```

#### 自动拉取模型列表
```js
async function fetchModels(apiKey, baseUrl) {
  // OpenAI 兼容格式都支持 /v1/models
  const res = await fetch(`${baseUrl}/v1/models`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const data = await res.json()
  return data.data.map(m => m.id).sort()
}
```

#### 流式调用（OpenAI 兼容格式）
```js
async function* streamChat(apiKey, model, messages, baseUrl) {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, stream: true })
  })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  // 解析 SSE 流，逐 token yield
}
```

### 5.4 数据持久化
- API Key: `localStorage`
- 对话历史: `localStorage`（MVP 够用）
- 设置偏好（主题等）: `localStorage`

---

## 6. 项目结构（建议）

```
pretext-display/
├── index.html                    # 入口（加载 Google Fonts）
├── src/
│   ├── main.jsx                  # 应用入口
│   ├── app.jsx                   # 根组件（布局 + 路由 + 主题状态）
│   ├── app.module.css            # 根布局样式
│   │
│   ├── styles/
│   │   ├── global.css            # CSS 变量（配色、字体、间距）+ reset
│   │   └── theme.js              # 主题切换逻辑（localStorage + CSS class）
│   │
│   ├── components/
│   │   ├── sidebar/
│   │   │   ├── Sidebar.jsx       # 侧边栏（对话列表 + 底部图标）
│   │   │   ├── Sidebar.module.css
│   │   │   ├── ChatList.jsx      # 对话历史列表
│   │   │   └── Settings.jsx      # 设置面板（API Key、模型、主题）
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatView.jsx      # Chat 模式主视图
│   │   │   ├── ChatView.module.css
│   │   │   ├── MessageList.jsx   # 虚拟列表（Pretext 预算高度）
│   │   │   ├── Message.jsx       # 单条消息（Shrinkwrap 气泡）
│   │   │   ├── Message.module.css
│   │   │   ├── StreamingMessage.jsx  # 流式渲染中的消息（零抖动）
│   │   │   └── InputBar.jsx      # 底部输入框
│   │   │
│   │   └── benchmark/
│   │       ├── BenchView.jsx     # Benchmark 模式主视图
│   │       ├── BenchView.module.css
│   │       ├── MetricCard.jsx    # 单个指标卡片
│   │       └── samples.js        # 预设文本样本数据
│   │
│   ├── lib/
│   │   ├── pretext-engine.js     # Pretext 封装（prepare/layout/shrinkwrap）
│   │   ├── stream.js             # 通用 SSE 流式解析
│   │   ├── api.js                # 统一 LLM API（自动识别 provider、拉取模型、流式调用）
│   │   └── metrics.js            # CLS / Reflow / FPS 采集工具
│   │
│   └── hooks/
│       ├── useChat.js            # 对话状态管理 hook
│       ├── useStream.js          # 流式输出 hook
│       └── useTheme.js           # 主题切换 hook
│
├── package.json
├── vite.config.js
├── SPEC.md                       # 本文档
└── README.md                     # 项目说明 + 面试话术
```

---

## 7. 开发优先级

### Phase 1: 核心可用（先跑起来）
1. 项目初始化（Vite + Pretext）
2. 侧边栏 + 基本布局
3. API Key 配置 + OpenAI 流式调用
4. Chat 模式：基本消息列表 + 流式渲染（先不加 Pretext 优化）
5. 暗色/亮色主题切换

### Phase 2: Pretext 加持（核心差异点）
6. 流式零抖动：接入 `prepare()` + `layout()`
7. Shrinkwrap 气泡：接入 `walkLineRanges()`
8. 虚拟列表：接入 `layout()` 预算高度

### Phase 3: Benchmark + 收尾
9. Benchmark 模式：左右对比 + 指标面板
10. 对话历史持久化
11. 部署到 GitHub Pages
12. README 完善（含面试叙事）

---

## 8. Benchmark 模式细节

### 8.1 入口设计
- 侧边栏底部，一个小的烧杯/实验室图标
- Hover 提示 "Rendering Lab" 或 "渲染实验室"
- 点击后主区域切换为 Benchmark 视图
- 不在主导航里，不影响产品的"成熟感"

### 8.2 预设文本样本
准备 3-4 段模拟文本：

**样本 1 — 中文 AI 问答**
一段关于某个概念的中文解释，200-300 字，有段落结构。

**样本 2 — 英文技术回答**
一段英文技术解释，含代码片段标记，200-300 words。

**样本 3 — 中英混排 + Emoji**
模拟真实 AI 对话中的混合输出，中英文切换 + emoji + 列表。

### 8.3 对比实现
- 两侧共享同一个定时器，每 tick 同时 push 一个 token
- 左侧（原生）: `element.textContent += token`，浏览器自然 reflow
- 右侧（Pretext）: 先 `prepare()` + `layout()` 预设高度，再写文本
- 指标实时更新，红/绿色区分好坏

---

## 9. 面试加分项（如果时间允许）

- [ ] 消息支持 Markdown 渲染（加粗、代码块、列表）
- [ ] 导出对话为 Markdown 文件
- [ ] 打字机效果的光标动画
- [ ] Benchmark 模式支持录屏/截图对比
- [ ] 移动端基础适配
