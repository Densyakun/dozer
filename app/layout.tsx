import './globals.css'
import React from 'react'

export const metadata = {
  title: 'Dozer',
  description: 'Mobile-first AI development environment',
  manifest: '/manifest.json',
  themeColor: '#111827',
  appleWebApp: {
    capable: true,
    title: 'Dozer',
    statusBarStyle: 'default' as const,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
