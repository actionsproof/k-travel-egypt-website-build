import { Analytics } from '@vercel/analytics/next'
import { Tajawal } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import './travel-pages.css'

const tajawal = Tajawal({ subsets: ['arabic', 'latin'], weight: ['400', '500', '700', '800'], variable: '--font-tajawal', display: 'swap' })

export const metadata: Metadata = {
  title: 'K Travel Egypt | Your Journey, Our Care',
  description: 'Discover thoughtfully planned Umrah, honeymoon, international and Egypt trips with K Travel Egypt. Ask our licensed travel team for the latest details on WhatsApp.',
  generator: 'K Travel Egypt',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${tajawal.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
