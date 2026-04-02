import { Sparkles } from 'lucide-preact'
import styles from './Message.module.css'

export function Message({ role, content, streaming, noKey, onOpenSettings }) {
  const isUser = role === 'user'

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.user : styles.assistant}`}>
      {!isUser && (
        <div className={styles.avatar}>
          <Sparkles size={16} />
        </div>
      )}
      <div className={`${styles.bubble} ${isUser ? styles.user : styles.assistant}`}>
        {noKey ? (
          <div>
            <p>还没有配置 API Key，点击下方按钮前往设置。</p>
            <button className={styles.settingsLink} onClick={onOpenSettings}>
              打开设置
            </button>
          </div>
        ) : (
          <>
            {content}
            {streaming && !isUser && <span className={styles.cursor} />}
          </>
        )}
      </div>
    </div>
  )
}
