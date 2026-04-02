const DEFAULT_URLS = {
  openai: 'https://api.openai.com',
  anthropic: 'https://api.anthropic.com'
}

export function detectProvider(apiKey) {
  if (!apiKey) return null
  if (apiKey.startsWith('sk-ant-')) return 'anthropic'
  return 'openai'
}

export function getDefaultBaseUrl(provider) {
  return DEFAULT_URLS[provider] || DEFAULT_URLS.openai
}

export async function fetchModels(apiKey, baseUrl) {
  const provider = detectProvider(apiKey)
  if (!provider) throw new Error('No API key provided')

  const url = baseUrl || getDefaultBaseUrl(provider)

  const res = await fetch(`${url}/v1/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch models (${res.status})`)
  }

  const data = await res.json()
  const models = data.data || []

  return models
    .map(m => m.id)
    .sort()
}

export function loadSettings() {
  return {
    apiKey: localStorage.getItem('apiKey') || '',
    baseUrl: localStorage.getItem('baseUrl') || '',
    model: localStorage.getItem('model') || '',
    provider: localStorage.getItem('provider') || ''
  }
}

export function saveSettings(settings) {
  localStorage.setItem('apiKey', settings.apiKey)
  localStorage.setItem('baseUrl', settings.baseUrl)
  localStorage.setItem('model', settings.model)
  localStorage.setItem('provider', settings.provider)
}
