export function getPortKeyConfig() {
  const apiKey = process.env.PORTKEY_API_KEY?.trim() ?? ''
  const model = process.env.PORTKEY_MODEL?.trim() || 'gpt-4o-mini'
  const baseUrl = (process.env.PORTKEY_BASE_URL?.trim() || 'https://api.portkey.ai/v1').replace(
    /\/$/,
    ''
  )
  const configId = process.env.PORTKEY_CONFIG_ID?.trim() || ''
  return { apiKey, model, baseUrl, configId, connected: Boolean(apiKey && configId) }
}

export function getOpenAIConfig() {
  const { apiKey, model, baseUrl, configId } = getPortKeyConfig()
  return { apiKey, model, baseUrl, configId, connected: Boolean(apiKey) }
}
