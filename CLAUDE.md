# CLAUDE.md

## Project overview

Pretext Display 是一个基于 Pretext 的 AI Chat 前端客户端。用户自带 LLM API Key，产品专注于前端渲染层的极致体验。定位：Same AI, better screen。

核心技术依赖是 `@chenglou/pretext`，一个纯 JS 文本测量和排版库，完全绕过 DOM reflow。

## Tech stack

- **Build**: Vite
- **Framework**: Preact (NOT React — 3KB alternative, same API)
- **Styling**: CSS Modules (`.module.css`) + global CSS variables in `src/styles/global.css`
- **Core dep**: `@chenglou/pretext`
- **Icons**: Lucide (`lucide-preact`)
- **Fonts**: Inter (400, 500, 600) + JetBrains Mono (400) via Google Fonts
- **No backend** — pure frontend, API keys stored in localStorage

## Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server
npm run build        # production build → dist/
npm run preview      # preview production build locally
```

## Project structure

```
src/
├── main.jsx                      # entry point, renders <App />
├── app.jsx                       # root component (layout + routing + theme)
├── app.module.css
├── styles/
│   ├── global.css                # CSS variables, reset, font imports
│   └── theme.js                  # theme toggle logic (localStorage + class on <html>)
├── components/
│   ├── sidebar/                  # Sidebar, ChatList, Settings
│   ├── chat/                     # ChatView, MessageList, Message, StreamingMessage, InputBar
│   └── benchmark/                # BenchView, MetricCard, samples
├── lib/
│   ├── pretext-engine.js         # Pretext wrapper (prepare/layout/shrinkwrap)
│   ├── stream.js                 # SSE stream parser
│   ├── api.js                    # Unified LLM API: auto-detect provider from key, fetch models, stream chat
│   └── metrics.js                # CLS / Reflow / FPS collection
└── hooks/
    ├── useChat.js                # conversation state
    ├── useStream.js              # streaming output
    └── useTheme.js               # theme toggle
```

## Key architecture decisions

### API Key — auto-detect, zero config

The Settings panel is deliberately simple: one input for the API key, that's it.

- `sk-ant-*` → Anthropic provider, base URL `https://api.anthropic.com`
- `sk-*` or anything else → OpenAI-compatible, base URL `https://api.openai.com`
- User can optionally set a custom base URL (hidden under "Advanced settings" toggle) for proxies / relay services
- After key is entered, auto-fetch model list via `/v1/models` endpoint
- Model dropdown only appears after successful key validation
- All stored in localStorage: `{ apiKey, baseUrl, model, provider }`

Do NOT create separate provider/model selection dropdowns. The key itself tells us the provider.

### Pretext integration — four features, four APIs

| Feature | Pretext API | What it does |
|---------|-------------|--------------|
| Zero layout shift streaming | `prepare()` + `layout()` | Pre-calculate text height before writing DOM → no jitter |
| Virtualized message list | `layout()` batch | Pre-calculate all message heights without rendering → only visible messages in DOM |
| Shrinkwrap bubbles | `walkLineRanges()` | Binary search for tightest bubble width that keeps same line count |
| Benchmark comparison | All of the above | Side-by-side native vs Pretext rendering with real-time metrics |

### Pretext API usage patterns

```js
// Zero layout shift: predict height, then write
import { prepare, layout } from '@chenglou/pretext'
const prepared = prepare(text, '14px Inter')
const { height } = layout(prepared, containerWidth, 22.4) // 14px * 1.6 line-height
element.style.height = height + 'px'
element.textContent = text

// Shrinkwrap: binary search for tightest width
import { prepareWithSegments, walkLineRanges } from '@chenglou/pretext'
const prepared = prepareWithSegments(text, '14px Inter')
// get line count at max width, then binary search for min width with same line count

// Virtual list: batch height calculation
// prepare() + layout() for every message, store heights array
// only render messages within viewport based on scroll position
```

### Font string must match CSS

The font string passed to `prepare()` MUST exactly match the CSS font declaration on the rendered element. Our body text is `14px Inter` with `line-height: 1.6` (= 22.4px). If the font string and CSS diverge, height predictions will be wrong.

## Design system — STRICT RULES

Reference: Linear-inspired, developer aesthetic. Read SPEC.md Section 4 for full details.

### Colors (CSS variables defined in global.css)

- Light: white bg, #111 text, #E5E7EB borders, #5B5BF0 accent
- Dark: #0A0A0A bg, #F0F0F0 text, #222 borders, #7B7BFF accent
- Theme toggle switches a class on `<html>`, all components use CSS variables

### Typography — only these four levels

```
Title:    16px / weight 600 / letter-spacing -0.01em
Body:     14px / weight 400 / line-height 1.6
Caption:  12px / weight 400 / color var(--text-secondary)
Code:     13px / font-family var(--font-mono)
```

Do NOT invent new font sizes or weights. Stick to these four.

### Spacing — multiples of 4px only

4, 8, 12, 16, 24, 32, 48. No other values.

### Animation — 150ms everything

```css
transition: all 150ms ease;
```

No bouncing, no elastic easing, no slow fades. Fast and crisp.

### Borders and shadows

- Borders: 1px solid var(--border). Never 0.5px, never 2px (except focus ring).
- Shadows: NONE. Only exception: input focus → `box-shadow: 0 0 0 2px var(--accent-subtle)`
- Border-radius: 8px (default), 12px (cards/bubbles), 20px (pill buttons/inputs)

### Component specifics

**Sidebar**: 260px wide, bg-secondary, right border. Selected chat = accent-subtle bg + 2px left accent bar.

**AI messages**: No background. Left-aligned. Max-width 680px. 24px accent dot avatar on left.

**User messages**: bg-tertiary background. Right-aligned. border-radius 12px.

**Input bar**: Fixed bottom. bg-secondary. border-radius 20px (pill). Focus = accent border + ring.

**Send button**: 32px circle, accent bg, white arrow icon. Disabled = opacity 0.3.

## Code style

- Preact components: functional components with hooks
- File naming: PascalCase for components (`Message.jsx`), camelCase for utils (`pretext-engine.js`)
- CSS Modules: import as `styles`, use as `className={styles.container}`
- No inline styles except dynamic values (e.g. `style={{ height: calculatedHeight }}`)
- Prefer `const` over `let`
- No TypeScript (keep it simple for this MVP)

## Common pitfalls

1. **Pretext font string mismatch**: If `prepare('text', '14px Inter')` doesn't match the CSS `font: 400 14px/1.6 Inter`, height calculations will be off. Always keep them in sync.
2. **Pretext caching**: Don't call `prepare()` on every keystroke during streaming. Cache the prepared result and only re-prepare when necessary.
3. **Virtual list scroll**: The virtual list must use absolute positioning with `transform: translateY()`, not padding/margin, for smooth scrolling.
4. **Dark mode**: Every color must use CSS variables. Never hardcode colors like `color: #333` — invisible in dark mode.
5. **Benchmark isolation**: The left (native) panel in benchmark must NOT use Pretext at all — that's the whole point of the comparison.

## What NOT to do

- Do NOT add React. This project uses Preact intentionally (3KB vs 40KB).
- Do NOT add Tailwind or other CSS frameworks. We use CSS Modules + CSS variables.
- Do NOT add a backend or database. Everything is localStorage.
- Do NOT use `system-ui` font — it's inaccurate with Pretext on macOS.
- Do NOT add gradients, box-shadows, or decorative elements. The design is deliberately minimal.
- Do NOT make animations longer than 200ms. The style is fast and snappy.
