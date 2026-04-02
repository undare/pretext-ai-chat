import { useState, useEffect, useCallback } from 'preact/hooks'
import { X, Eye, EyeOff, ChevronRight, ChevronDown } from 'lucide-preact'
import { detectProvider, getDefaultBaseUrl, fetchModels, loadSettings, saveSettings } from '../../lib/api'
import styles from './Settings.module.css'

export function Settings({ onClose }) {
  const [settings, setSettings] = useState(loadSettings)
  const [showKey, setShowKey] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState('')

  const provider = detectProvider(settings.apiKey)

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  useEffect(() => {
    if (!settings.apiKey || !provider) {
      setModels([])
      setModelsError('')
      return
    }

    const baseUrl = settings.baseUrl || getDefaultBaseUrl(provider)
    let cancelled = false

    const load = async () => {
      setModelsLoading(true)
      setModelsError('')
      try {
        const list = await fetchModels(settings.apiKey, baseUrl)
        if (!cancelled) {
          setModels(list)
          if (list.length > 0 && !list.includes(settings.model)) {
            updateSettings({ model: list[0], provider })
          } else {
            updateSettings({ provider })
          }
        }
      } catch (err) {
        if (!cancelled) {
          setModels([])
          setModelsError(err.message)
        }
      } finally {
        if (!cancelled) setModelsLoading(false)
      }
    }

    const timer = setTimeout(load, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [settings.apiKey, settings.baseUrl])

  const handleKeyChange = (e) => {
    const apiKey = e.target.value
    const newProvider = detectProvider(apiKey)
    updateSettings({ apiKey, provider: newProvider || '', model: '' })
    setModels([])
  }

  const handleBaseUrlChange = (e) => {
    updateSettings({ baseUrl: e.target.value, model: '' })
    setModels([])
  }

  const handleModelChange = (e) => {
    updateSettings({ model: e.target.value })
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>Settings</span>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>API Key</label>
            <div className={styles.inputWrapper}>
              <input
                className={styles.input}
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onInput={handleKeyChange}
                placeholder="sk-..."
              />
              <button
                className={styles.toggleVisible}
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {provider && (
              <span className={styles.detected}>
                Detected: {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}
              </span>
            )}
            {modelsError && (
              <span className={styles.error}>{modelsError}</span>
            )}
          </div>

          {models.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Model</label>
              <select
                className={styles.select}
                value={settings.model}
                onChange={handleModelChange}
              >
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {modelsLoading && (
            <span className={styles.loading}>Loading models...</span>
          )}

          <button
            className={styles.advancedToggle}
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            {advancedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Advanced settings</span>
          </button>

          {advancedOpen && (
            <div className={styles.field}>
              <label className={styles.label}>API Base URL</label>
              <input
                className={styles.input}
                type="text"
                value={settings.baseUrl}
                onInput={handleBaseUrlChange}
                placeholder={provider ? getDefaultBaseUrl(provider) : 'https://api.openai.com'}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
