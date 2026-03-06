// app/layout.tsx — Root Layout with PWA support
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MandıraM — Hayvan Kayıt Sistemi',
  description: 'Besiciler için dijital hayvan kayıt, takip ve yönetim sistemi',
  manifest: '/manifest.json',
  themeColor: '#2D6A4F',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MandıraM',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    apple: '/icons/icon-192x192.png',
    icon: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Nunito', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
