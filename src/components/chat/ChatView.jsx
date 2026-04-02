import { ArrowUp } from 'lucide-preact'
import styles from './ChatView.module.css'

export function ChatView({ sidebarCollapsed }) {
  return (
    <main className={styles.chatView}>
      <div className={styles.messageArea}>
        <div className={styles.emptyState}>
          <p>Send a message to start a conversation</p>
        </div>
      </div>

      <div className={styles.inputBar} style={{ left: sidebarCollapsed ? 0 : 260 }}>
        <div className={styles.inputWrapper}>
          <textarea
            className={styles.input}
            placeholder="Type a message..."
            rows={1}
          />
          <button className={styles.sendButton}>
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </main>
  )
}
