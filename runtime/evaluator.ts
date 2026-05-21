'use client'

import { safeRenderTsx, type EvalResult } from '../evaluator/tsxSafeEval'

export type EvaluationResult = {
  success: boolean
  html?: string
  error?: string
}

export async function evaluateTSX(code: string): Promise<EvaluationResult> {
  const result: EvalResult = safeRenderTsx(code)
  
  if (result.ok && result.html) {
    return { success: true, html: result.html }
  }
  
  return { success: false, error: result.error ?? 'Unknown error' }
}

export function generatePreviewHtml(code: string): string {
  const result = safeRenderTsx(code)
  return result.html ?? '<!doctype html><html><body><pre>Error: Failed to generate preview</pre></body></html>'
}