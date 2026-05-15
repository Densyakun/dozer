import React from 'react'

export default function PreviewIframe({ src }: { src: string }) {
  return (
    <div className="w-full h-64 border">
      <iframe src={src} className="w-full h-full" title="preview" />
    </div>
  )
}
