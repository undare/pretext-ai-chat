# ⚡ Pretext AI Chat

Same AI, better screen — a Pretext-powered AI chat client with zero layout shift streaming.

**[🌐 Live Demo](https://fluten.github.io/pretext-ai-chat/)** · **[🇨🇳 中文文档](./README.zh-CN.md)**

## 🤔 What is this?

An AI chat frontend where you bring your own API key (OpenAI / Anthropic). The product focuses entirely on the rendering layer — making streaming output silky smooth by eliminating layout shift.

The core dependency is [`@chenglou/pretext`](https://github.com/chenglou/pretext), a pure JavaScript text measurement library that bypasses DOM reflow entirely.

## ✨ Tech Highlights

### 1. Zero Layout Shift Streaming

Traditional chat UIs jitter during streaming because every new token triggers a browser reflow. Pretext predicts the exact rendered height in pure JS *before* writing to the DOM — the container is pre-sized, so the page never jumps.

### 2. Shrinkwrap Bubbles

Message bubbles automatically shrink to the tightest width that preserves the same line count. Short messages get compact bubbles instead of stretching to full width. Powered by binary search over `layout()`.

### 3. Virtualized Message List

All message heights are calculated via `prepare()` + `layout()` without rendering. Only visible messages exist in the DOM. Scroll through 1000+ messages with no performance drop.

### 4. Rendering Benchmark

Built-in side-by-side comparison: native DOM rendering vs Pretext rendering. Watch reflow counts, height jumps, and visual stability in real time.

## 🚀 Getting Started

```bash
git clone https://github.com/fluten/pretext-ai-chat.git
cd pretext-ai-chat
npm install
npm run dev
```

Open `http://localhost:5173` and enter your API key in Settings.

## 🛠 Tech Stack

| Layer | Choice |
|-------|--------|
| Build | Vite |
| Framework | Preact (3KB React alternative) |
| Styling | CSS Modules + CSS Variables |
| Core | [@chenglou/pretext](https://github.com/chenglou/pretext) |
| Icons | Lucide |
| Fonts | Inter + JetBrains Mono |

No backend. No database. Everything runs in the browser.

## 📄 License

MIT
