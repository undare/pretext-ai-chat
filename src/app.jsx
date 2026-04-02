import { useState } from 'preact/hooks'
import { Sidebar } from './components/sidebar/Sidebar'
import { ChatView } from './components/chat/ChatView'
import styles from './app.module.css'

export function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className={styles.layout}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <ChatView sidebarCollapsed={sidebarCollapsed} />
    </div>
  )
}
