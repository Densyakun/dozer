'use client'

export type EvalResult = {
  ok: boolean
  html?: string
  error?: string
}

const REACT_CDN = 'https://unpkg.com/react@18.2.0/umd/react.production.min.js'
const REACT_DOM_CDN = 'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildPreviewHtml(code: string): string {
  const escapedCode = escapeHtml(code)
  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="${REACT_CDN}"></script>
  <script src="${REACT_DOM_CDN}"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script>
    try {
      const code = ${JSON.stringify(code)};
      const fn = new Function('React', 'ReactDOM', code + '\\nreturn typeof exports !== \\'undefined\\' ? exports.default : typeof default !== \\'undefined\\' ? default : null;');
      const Component = fn(React, ReactDOM);
      if (Component && typeof Component === 'function') {
        const element = React.createElement(Component);
        ReactDOM.render(element, document.getElementById('root'));
      } else {
        document.getElementById('root').innerHTML = '<pre style="padding:1rem;background:#fee;white-space:pre-wrap;">No default export found in component</pre>';
      }
    } catch (err) {
      document.getElementById('root').innerHTML = '<pre style="padding:1rem;background:#fee;white-space:pre-wrap;">' + (err.message || String(err)) + '</pre>';
    }
  </script>
</body>
</html>`
}

export function safeRenderTsx(source: string): EvalResult {
  try {
    const html = buildPreviewHtml(source)
    return { ok: true, html }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

export async function evaluateTsxAsync(source: string): Promise<EvalResult> {
  return new Promise((resolve) => {
    try {
      const html = buildPreviewHtml(source)
      resolve({ ok: true, html })
    } catch (err) {
      resolve({ ok: false, error: String(err) })
    }
  })
}