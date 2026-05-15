export function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? ''
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(
    /\/$/,
    ''
  )
  return { apiKey, model, baseUrl, connected: Boolean(apiKey) }
}
