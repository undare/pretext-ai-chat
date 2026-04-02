import { useState, useRef } from 'preact/hooks'
import { Settings, PanelLeftClose, PanelLeft, Sun, Moon, Plus, MoreHorizontal } from 'lucide-preact'
import styles from './Sidebar.module.css'

export function Sidebar({
  collapsed,
  onToggle,
  dark,
  onToggleTheme,
  onOpenSettings,
  conversations,
  activeId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat
}) {
  const [menuId, setMenuId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  if (collapsed) {
    return (
      <button className={styles.toggleButton} onClick={onToggle}>
        <PanelLeft size={16} />
      </button>
    )
  }

  const handleMoreClick = (e, id) => {
    e.stopPropagation()
    if (menuId === id) {
      setMenuId(null)
      return
    }
    document.activeElement?.blur()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.left })
    setMenuId(id)
  }

  const handleRename = (id, currentTitle) => {
    setMenuId(null)
    setEditingId(id)
    setEditValue(currentTitle || '')
  }

  const handleRenameSubmit = (id) => {
    const trimmed = editValue.trim()
    if (trimmed) onRenameChat(id, trimmed)
    setEditingId(null)
    setEditValue('')
  }

  const handleRenameKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameSubmit(id)
    }
    if (e.key === 'Escape') {
      setEditingId(null)
      setEditValue('')
    }
  }

  const handleDelete = (id) => {
    setMenuId(null)
    if (confirm('确定要删除这个对话吗？')) {
      onDeleteChat(id)
    }
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.logo}>Pretext Chat</span>
        <div className={styles.headerActions}>
          <button className={styles.iconButton} onClick={onNewChat}>
            <Plus size={16} />
          </button>
          <button className={styles.iconButton} onClick={onToggle}>
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>

      <div className={styles.chatList}>
        {conversations.length === 0 ? (
          <p className={styles.chatListPlaceholder}>No conversations yet</p>
        ) : (
          conversations.map(c => (
            <div
              key={c.id}
              className={`${styles.chatItem} ${c.id === activeId ? styles.active : ''}`}
              onClick={() => onSelectChat(c.id)}
            >
              {editingId === c.id ? (
                <input
                  className={styles.renameInput}
                  value={editValue}
                  onInput={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleRenameKeyDown(e, c.id)}
                  onBlur={() => handleRenameSubmit(c.id)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className={styles.chatTitle}>{c.title || 'New conversation'}</span>
                  <button
                    className={styles.moreButton}
                    onClick={(e) => handleMoreClick(e, c.id)}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {menuId && (
        <div className={styles.menuOverlay} onClick={() => setMenuId(null)}>
          <div
            className={styles.menu}
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.menuItem}
              onClick={() => handleRename(menuId, conversations.find(c => c.id === menuId)?.title)}
            >
              Rename
            </button>
            <button
              className={styles.menuItem}
              onClick={() => handleDelete(menuId)}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <button className={styles.iconButton} onClick={onToggleTheme}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className={styles.iconButton} onClick={onOpenSettings}>
          <Settings size={16} />
        </button>
      </div>
    </aside>
  )
}
