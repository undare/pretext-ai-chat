import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import { X } from 'lucide-preact'
import { prepare, layout } from '@chenglou/pretext'
import { FONT, LINE_HEIGHT } from '../../lib/pretext-engine'
import styles from './LabView.module.css'

const DEFAULT_TEST_TEXT = '你好 Hello，这是一段用于验证 Pretext 引擎的测试文本 🚀 Pretext 可以在不触发 DOM reflow 的情况下精确预测文本高度。这对于流式输出、虚拟列表和智能气泡宽度计算都至关重要。The quick brown fox jumps over the lazy dog. 中英文混排和 emoji 都需要正确处理。测试不同宽度下的换行行为是否与实际渲染一致。'

const STREAMING_TEXT = '人工智能正在深刻改变我们的生活方式。从自然语言处理到计算机视觉，从自动驾驶到医疗诊断，AI 技术已经渗透到各个领域。在文本渲染这个看似简单的场景中，传统的 DOM reflow 机制会导致页面在流式输出时不断抖动。Pretext 通过纯 JavaScript 实现文本测量和排版，完全绕过 DOM reflow，在文本写入之前就精确预测渲染高度。这意味着容器可以提前设置好正确的高度，文本写入时不会触发任何 layout shift，实现真正的零抖动流式输出体验。'

export function LabView({ onClose }) {
  const [activeTab, setActiveTab] = useState('engine-test')

  return (
    <div className={styles.lab}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'benchmark' ? styles.active : ''}`}
            onClick={() => setActiveTab('benchmark')}
          >
            Benchmark
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'engine-test' ? styles.active : ''}`}
            onClick={() => setActiveTab('engine-test')}
          >
            Engine Test
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'streaming-test' ? styles.active : ''}`}
            onClick={() => setActiveTab('streaming-test')}
          >
            Streaming Test
          </button>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'benchmark' && (
          <div className={styles.placeholder}>
            Benchmark 功能开发中...
          </div>
        )}
        {activeTab === 'engine-test' && <EngineTest />}
        {activeTab === 'streaming-test' && <StreamingTest />}
      </div>
    </div>
  )
}

function EngineTest() {
  const [text, setText] = useState(DEFAULT_TEST_TEXT)
  const [width, setWidth] = useState(400)
  const [result, setResult] = useState(null)
  const [domHeight, setDomHeight] = useState(0)
  const [computedFont, setComputedFont] = useState(null)
  const [fontReady, setFontReady] = useState(false)
  const renderRef = useRef(null)

  useEffect(() => {
    document.fonts.ready.then(() => setFontReady(true))
  }, [])

  useEffect(() => {
    if (!text || !fontReady) {
      setResult(null)
      setDomHeight(0)
      return
    }

    const t0 = performance.now()
    const prepared = prepare(text, FONT)
    const t1 = performance.now()
    const layoutResult = layout(prepared, width, LINE_HEIGHT)
    const t2 = performance.now()

    setResult({
      height: layoutResult.height,
      lineCount: layoutResult.lineCount,
      prepareMs: t1 - t0,
      layoutMs: t2 - t1,
    })
  }, [text, width, fontReady])

  useEffect(() => {
    if (!renderRef.current) return
    setDomHeight(renderRef.current.offsetHeight)
    const cs = getComputedStyle(renderRef.current)
    setComputedFont({
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
    })
  }, [text, width, result])

  const diff = result ? Math.abs(result.height - domHeight) : 0
  const matched = result && diff < 1

  return (
    <div className={styles.engineTest}>
      <div className={styles.controls}>
        <div className={styles.field}>
          <label className={styles.label}>测试文本</label>
          <textarea
            className={styles.textarea}
            value={text}
            onInput={(e) => setText(e.target.value)}
            rows={4}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>容器宽度：{width}px</label>
          <input
            type="range"
            min={200}
            max={1200}
            value={width}
            onInput={(e) => setWidth(Number(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.metrics}>
          <div className={styles.metricRow}>
            <span>Pretext font string</span>
            <span className={styles.mono}>'{FONT}'</span>
          </div>
          <div className={styles.metricRow}>
            <span>Pretext lineHeight</span>
            <span className={styles.mono}>{LINE_HEIGHT}px</span>
          </div>
          {computedFont && (
            <>
              <div className={styles.metricRow}>
                <span>CSS font-family</span>
                <span className={styles.mono}>{computedFont.fontFamily}</span>
              </div>
              <div className={styles.metricRow}>
                <span>CSS font-size</span>
                <span className={styles.mono}>{computedFont.fontSize}</span>
              </div>
              <div className={styles.metricRow}>
                <span>CSS line-height</span>
                <span className={styles.mono}>{computedFont.lineHeight}</span>
              </div>
            </>
          )}
          <div className={styles.metricRow}>
            <span>字体加载状态</span>
            <span className={fontReady ? styles.match : styles.mismatch}>
              {fontReady ? '✓ 已加载' : '⏳ 加载中...'}
            </span>
          </div>
        </div>

        {result && (
          <div className={styles.metrics}>
            <div className={styles.metricRow}>
              <span>预计算高度</span><span>{result.height.toFixed(1)} px</span>
            </div>
            <div className={styles.metricRow}>
              <span>行数</span><span>{result.lineCount} 行</span>
            </div>
            <div className={styles.metricRow}>
              <span>prepare() 耗时</span><span>{result.prepareMs.toFixed(2)} ms</span>
            </div>
            <div className={styles.metricRow}>
              <span>layout() 耗时</span><span>{result.layoutMs.toFixed(2)} ms</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.renderArea}>
        <div
          ref={renderRef}
          className={styles.render}
          style={{ width: width + 'px' }}
        >
          {text}
        </div>
      </div>

      {result && (
        <div className={styles.controls}>
          <div className={styles.metrics}>
            <div className={styles.metricRow}>
              <span>实际 DOM 高度</span><span>{domHeight.toFixed(1)} px</span>
            </div>
            <div className={styles.metricRow}>
              <span>差值</span><span>{diff.toFixed(1)} px</span>
            </div>
            <div className={styles.metricRow}>
              <span>匹配结果</span>
              <span className={matched ? styles.match : styles.mismatch}>
                {matched ? '✓ 匹配' : '✗ 不匹配'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function initStats() {
  return { jumps: 0, maxJump: 0, totalDisp: 0 }
}

function initMetrics() {
  return { jumpCount: 0, maxJump: 0, totalDisplacement: 0 }
}

function tickPanel(el, text, usePretext, width) {
  const prepared = prepare(text, FONT)
  const result = layout(prepared, width, LINE_HEIGHT)
  const ceiledHeight = Math.ceil(result.height)

  if (usePretext) {
    el.style.height = ceiledHeight + 'px'
  }

  const h1 = el.offsetHeight
  el.textContent = text
  const h2 = el.offsetHeight

  return { h1, h2, ceiledHeight }
}

function StreamingTest() {
  const [text, setText] = useState(STREAMING_TEXT)
  const [containerWidth, setContainerWidth] = useState(600)
  const [speed, setSpeed] = useState(20)
  const [running, setRunning] = useState(false)
  const [charIndex, setCharIndex] = useState(0)
  const [nativeMetrics, setNativeMetrics] = useState(initMetrics)
  const [pretextMetrics, setPretextMetrics] = useState(initMetrics)
  const [done, setDone] = useState(false)
  const nativeRef = useRef(null)
  const pretextRef = useRef(null)
  const intervalRef = useRef(null)
  const nativeStatsRef = useRef(initStats())
  const pretextStatsRef = useRef(initStats())
  const textRef = useRef(text)
  textRef.current = text

  const intervalMs = Math.round(1000 / speed)

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setRunning(false)
    setCharIndex(0)
    setDone(false)
    nativeStatsRef.current = initStats()
    pretextStatsRef.current = initStats()
    setNativeMetrics(initMetrics())
    setPretextMetrics(initMetrics())
    if (nativeRef.current) {
      nativeRef.current.style.height = ''
      nativeRef.current.textContent = ''
    }
    if (pretextRef.current) {
      pretextRef.current.style.height = ''
      pretextRef.current.textContent = ''
    }
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    nativeStatsRef.current = initStats()
    pretextStatsRef.current = initStats()

    const nEl = nativeRef.current
    const pEl = pretextRef.current
    if (!nEl || !pEl) return

    nEl.textContent = ''
    nEl.style.height = ''
    pEl.textContent = ''
    pEl.style.height = ''

    const w = containerWidth
    const sourceText = textRef.current

    // Pre-set Pretext panel height for first character
    const firstPrepared = prepare(sourceText.slice(0, 1), FONT)
    const firstHeight = Math.ceil(layout(firstPrepared, w, LINE_HEIGHT).height)
    pEl.style.height = firstHeight + 'px'

    setRunning(true)
    setDone(false)
    setCharIndex(0)
    setNativeMetrics(initMetrics())
    setPretextMetrics(initMetrics())

    let idx = 0

    intervalRef.current = setInterval(() => {
      idx++
      if (idx > sourceText.length) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        setRunning(false)
        setDone(true)
        return
      }

      const slice = sourceText.slice(0, idx)

      // Native panel: no style.height, content-driven
      const native = tickPanel(nEl, slice, false, w)

      // Pretext panel: set style.height before writing
      const pretext = tickPanel(pEl, slice, true, w)

      // Record native stats
      const nJumped = native.h1 !== native.h2
      const nJumpSize = Math.abs(native.h2 - native.h1)
      if (nJumped) {
        nativeStatsRef.current.jumps++
        nativeStatsRef.current.totalDisp += nJumpSize
        if (nJumpSize > nativeStatsRef.current.maxJump) nativeStatsRef.current.maxJump = nJumpSize
      }

      // Record pretext stats
      const pJumped = pretext.h1 !== pretext.h2
      const pJumpSize = Math.abs(pretext.h2 - pretext.h1)
      if (pJumped) {
        pretextStatsRef.current.jumps++
        pretextStatsRef.current.totalDisp += pJumpSize
        if (pJumpSize > pretextStatsRef.current.maxJump) pretextStatsRef.current.maxJump = pJumpSize
      }

      // Console log for F12 debugging
      console.log(
        `[${idx}] "${slice.slice(-1)}"`,
        `| 原生 h1:${native.h1} h2:${native.h2} 跳:${nJumped}`,
        `| Pretext h1:${pretext.h1} h2:${pretext.h2} 跳:${pJumped}`,
      )

      setCharIndex(idx)
      setNativeMetrics({
        jumpCount: nativeStatsRef.current.jumps,
        maxJump: nativeStatsRef.current.maxJump,
        totalDisplacement: nativeStatsRef.current.totalDisp,
      })
      setPretextMetrics({
        jumpCount: pretextStatsRef.current.jumps,
        maxJump: pretextStatsRef.current.maxJump,
        totalDisplacement: pretextStatsRef.current.totalDisp,
      })
    }, intervalMs)
  }, [intervalMs, containerWidth, reset])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const reduction = (native, pretext) => {
    if (native === 0) return '—'
    const pct = Math.round((1 - pretext / native) * 100)
    return `↓${pct}%`
  }

  return (
    <div className={styles.engineTest}>
      <div className={styles.controls}>
        <div className={styles.field}>
          <label className={styles.label}>测试文本</label>
          <textarea
            className={styles.textarea}
            value={text}
            onInput={(e) => setText(e.target.value)}
            rows={3}
            disabled={running}
          />
        </div>

        <div className={styles.streamingHeader}>
          <div className={styles.streamingActions}>
            <button
              className={styles.actionButton}
              onClick={running ? reset : start}
            >
              {running ? '停止' : done ? '重新开始' : '开始模拟'}
            </button>
          </div>
          <div className={styles.field} style={{ flex: 1, maxWidth: 200 }}>
            <label className={styles.label}>速度：{speed} char/s（{intervalMs}ms）</label>
            <input
              type="range"
              min={5}
              max={60}
              value={speed}
              onInput={(e) => setSpeed(Number(e.target.value))}
              className={styles.slider}
              disabled={running}
            />
          </div>
          <div className={styles.field} style={{ flex: 1, maxWidth: 200 }}>
            <label className={styles.label}>容器宽度：{containerWidth}px</label>
            <input
              type="range"
              min={200}
              max={900}
              value={containerWidth}
              onInput={(e) => setContainerWidth(Number(e.target.value))}
              className={styles.slider}
              disabled={running}
            />
          </div>
          <div className={styles.streamingProgress}>
            {charIndex} / {text.length} 字符
          </div>
        </div>
      </div>

      <div className={styles.dualPanel}>
        <div className={styles.panel}>
          <div className={styles.panelHeader} style={{ width: containerWidth + 'px' }}>
            <span className={styles.panelTitle}>原生模式（无 Pretext）</span>
            <div className={styles.panelMetrics}>
              <span>跳变 <strong className={nativeMetrics.jumpCount > 0 ? styles.mismatch : undefined}>{nativeMetrics.jumpCount}</strong></span>
              <span>最大 <strong>{nativeMetrics.maxJump}px</strong></span>
              <span>总位移 <strong>{nativeMetrics.totalDisplacement}px</strong></span>
            </div>
          </div>
          <div className={styles.panelRender}>
            <div ref={nativeRef} className={styles.streamingRender} style={{ width: containerWidth + 'px' }} />
            <div className={styles.anchor} style={{ width: containerWidth + 'px' }}></div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader} style={{ width: containerWidth + 'px' }}>
            <span className={styles.panelTitle}>Pretext 模式</span>
            <div className={styles.panelMetrics}>
              <span>跳变 <strong className={pretextMetrics.jumpCount === 0 ? styles.match : styles.mismatch}>{pretextMetrics.jumpCount}</strong></span>
              <span>最大 <strong>{pretextMetrics.maxJump}px</strong></span>
              <span>总位移 <strong>{pretextMetrics.totalDisplacement}px</strong></span>
            </div>
          </div>
          <div className={styles.panelRender}>
            <div ref={pretextRef} className={styles.streamingRender} style={{ width: containerWidth + 'px' }} />
            <div className={styles.anchor} style={{ width: containerWidth + 'px' }}></div>
          </div>
        </div>
      </div>

      {done && (
        <div className={styles.controls}>
          <div className={styles.summary}>
            <div className={styles.summaryTitle}>对比汇总</div>
            <div className={styles.summaryRow}>
              <span>高度跳变</span>
              <span>原生 {nativeMetrics.jumpCount} 次 → Pretext {pretextMetrics.jumpCount} 次 <span className={styles.match}>（{reduction(nativeMetrics.jumpCount, pretextMetrics.jumpCount)}）</span></span>
            </div>
            <div className={styles.summaryRow}>
              <span>最大跳变</span>
              <span>原生 {nativeMetrics.maxJump}px → Pretext {pretextMetrics.maxJump}px <span className={styles.match}>（{reduction(nativeMetrics.maxJump, pretextMetrics.maxJump)}）</span></span>
            </div>
            <div className={styles.summaryRow}>
              <span>总位移</span>
              <span>原生 {nativeMetrics.totalDisplacement}px → Pretext {pretextMetrics.totalDisplacement}px <span className={styles.match}>（{reduction(nativeMetrics.totalDisplacement, pretextMetrics.totalDisplacement)}）</span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
