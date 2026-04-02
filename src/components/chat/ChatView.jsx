import { useState, useRef, useEffect, useCallback } from 'preact/hooks'
import { ArrowUp } from 'lucide-preact'
import { useChat } from '../../hooks/useChat'
import { loadSettings } from '../../lib/api'
import { Message } from './Message'
import styles from './ChatView.module.css'

const PROMPTS = [
  '帮我写一封邮件',
  '解释量子计算',
  '写一段 Python 代码'
]

export function ChatView({ sidebarCollapsed, onOpenSettings, conversation, onUpdateMessages, onEnsureConversation }) {
  const [inputValue, setInputValue] = useState('')
  const messages = conversation?.messages || []
  const messageAreaRef = useRef(null)
  const hasContent = inputValue.trim().length > 0
  const hasApiKey = loadSettings().apiKey

  const handleMessagesChange = useCallback((msgs) => {
    onUpdateMessages(msgs)
  }, [onUpdateMessages])

  const { streaming, send } = useChat(messages, handleMessagesChange)

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (text) => {
    const value = (text || inputValue).trim()
    if (!value || streaming) return
    setInputValue('')
    onEnsureConversation(value)
    send(value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <main className={styles.chatView}>
      <div className={styles.messageArea} ref={messageAreaRef}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            {hasApiKey ? (
              <div className={styles.emptyContent}>
                <p className={styles.emptyTitle}>新对话已就绪</p>
                <div className={styles.prompts}>
                  {PROMPTS.map(p => (
                    <button
                      key={p}
                      className={styles.promptButton}
                      onClick={() => handleSend(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.emptyContent}>
                <p className={styles.emptyTitle}>配置 API Key 即可开始对话</p>
                <button className={styles.goSettings} onClick={onOpenSettings}>
                  前往设置
                </button>
              </div>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <Message
            key={i}
            role={msg.role}
            content={msg.content}
            streaming={streaming && i === messages.length - 1}
            noKey={msg.noKey}
            onOpenSettings={onOpenSettings}
          />
        ))}
      </div>

      <div className={styles.inputBar} style={{ left: sidebarCollapsed ? 0 : 260 }}>
        <div className={styles.inputWrapper}>
          <textarea
            className={styles.input}
            placeholder="Type a message..."
            rows={1}
            value={inputValue}
            onInput={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={`${styles.sendButton} ${hasContent ? styles.active : ''}`}
            onClick={() => handleSend()}
            disabled={!hasContent || streaming}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </main>
  )
}
