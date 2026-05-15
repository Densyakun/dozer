import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export function safeRenderTsx(source: string) {
  // Extremely minimal: evaluates a React component factory string in a safe env.
  // WARNING: This is a stub — do NOT use in production without sandboxing.
  // Expect source to export default a React component factory.
  // For example: `export default () => <div>Hi</div>`
  try {
    // eslint-disable-next-line no-new-func -- demo-only dynamic eval; replace with a real sandbox
    const fn = new Function('React', `${source}; return exports.default || module.exports.default`) as (
      react: typeof React
    ) => React.ComponentType<Record<string, never>>
    const Comp = fn(React)
    const html = renderToStaticMarkup(React.createElement(Comp))
    return { ok: true, html }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
