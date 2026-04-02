import { useState, useRef, useCallback } from 'preact/hooks'
import { loadSettings, getDefaultBaseUrl } from '../lib/api'
import { streamChat } from '../lib/stream'

export function useChat(messages, onMessagesChange) {
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef(null)

  const send = useCallback(async (text) => {
    const settings = loadSettings()
    if (!settings.apiKey || !settings.model) {
      const userMessage = { role: 'user', content: text }
      const noKeyMessage = { role: 'assistant', content: '', noKey: true }
      onMessagesChange([...messages, userMessage, noKeyMessage])
      return
    }

    const userMessage = { role: 'user', content: text }
    const assistantMessage = { role: 'assistant', content: '' }
    const updated = [...messages, userMessage, assistantMessage]
    onMessagesChange(updated)
    setStreaming(true)

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const baseUrl = settings.baseUrl || getDefaultBaseUrl(settings.provider)
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }))

      const stream = streamChat(settings.apiKey, baseUrl, settings.model, apiMessages, abortController.signal)
      let current = updated

      for await (const token of stream) {
        if (abortController.signal.aborted) break
        const next = [...current]
        const last = next[next.length - 1]
        next[next.length - 1] = { ...last, content: last.content + token }
        current = next
        onMessagesChange(next)
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        const next = [...messages, userMessage, { role: 'assistant', content: err.message }]
        onMessagesChange(next)
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [messages, onMessagesChange])

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
  }, [])

  return { streaming, send, stop }
}
