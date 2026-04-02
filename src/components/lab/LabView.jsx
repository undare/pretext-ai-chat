import { useState, useEffect, useRef } from 'preact/hooks'
import { X } from 'lucide-preact'
import { prepare, layout } from '@chenglou/pretext'
import { FONT, LINE_HEIGHT } from '../../lib/pretext-engine'
import styles from './LabView.module.css'

const DEFAULT_TEST_TEXT = '你好 Hello，这是一段用于验证 Pretext 引擎的测试文本 🚀 Pretext 可以在不触发 DOM reflow 的情况下精确预测文本高度。这对于流式输出、虚拟列表和智能气泡宽度计算都至关重要。The quick brown fox jumps over the lazy dog. 中英文混排和 emoji 都需要正确处理。测试不同宽度下的换行行为是否与实际渲染一致。'

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
