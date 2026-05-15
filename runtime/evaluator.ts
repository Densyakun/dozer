export async function evaluateTSX(code: string) {
  // Minimal safe-eval placeholder for Phase1; real sandbox integration required later.
  // Here we return HTML string to render in iframe preview.
  return `<!doctype html><html><body>${code}</body></html>`
}
