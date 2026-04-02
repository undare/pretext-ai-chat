import { useRef, useEffect, useState } from 'preact/hooks'
import { Sparkles } from 'lucide-preact'
import { renderMarkdown } from '../../lib/markdown'
import { measureMessageHeight } from '../../lib/pretext-engine'
import styles from './Message.module.css'

export function Message({ role, content, streaming, noKey, onOpenSettings }) {
  const isUser = role === 'user'

  if (isUser) {
    return (
      <div className={styles.userRow}>
        <div className={styles.userBubble}>
          {noKey ? (
            <div>
              <p>还没有配置 API Key，点击下方按钮前往设置。</p>
              <button className={styles.settingsLink} onClick={onOpenSettings}>
                打开设置
              </button>
            </div>
          ) : (
            content
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.assistantRow}>
      <div className={styles.avatar}>
        <Sparkles size={16} />
      </div>
      {streaming ? (
        <StreamingContent content={content} />
      ) : (
        <div className={styles.assistantContent}>
          {noKey ? (
            <div>
              <p>还没有配置 API Key，点击下方按钮前往设置。</p>
              <button className={styles.settingsLink} onClick={onOpenSettings}>
                打开设置
              </button>
            </div>
          ) : (
            <div className={styles.markdown}>
              {renderMarkdown(content)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StreamingContent({ content }) {
  const containerRef = useRef(null)
  const [minHeight, setMinHeight] = useState(0)
  const widthRef = useRef(0)

  useEffect(() => {
    if (containerRef.current && widthRef.current === 0) {
      widthRef.current = containerRef.current.offsetWidth
    }
  }, [])

  useEffect(() => {
    if (!content || widthRef.current === 0) return
    const { height } = measureMessageHeight(content, widthRef.current)
    if (height > minHeight) {
      setMinHeight(height)
    }
  }, [content])

  return (
    <div
      ref={containerRef}
      className={styles.assistantContent}
      style={{ minHeight: minHeight > 0 ? minHeight + 'px' : undefined }}
    >
      <div className={styles.markdown}>
        {renderMarkdown(content)}
      </div>
      <span className={styles.cursor} />
    </div>
  )
}
