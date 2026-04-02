import { Settings, PanelLeftClose, PanelLeft } from 'lucide-preact'
import styles from './Sidebar.module.css'

export function Sidebar({ collapsed, onToggle }) {
  if (collapsed) {
    return (
      <button className={styles.toggleButton} onClick={onToggle}>
        <PanelLeft size={16} />
      </button>
    )
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.logo}>Pretext Chat</span>
        <button className={styles.iconButton} onClick={onToggle}>
          <PanelLeftClose size={16} />
        </button>
      </div>

      <div className={styles.chatList}>
        <p className={styles.chatListPlaceholder}>No conversations yet</p>
      </div>

      <div className={styles.footer}>
        <button className={styles.iconButton}>
          <Settings size={16} />
        </button>
      </div>
    </aside>
  )
}
