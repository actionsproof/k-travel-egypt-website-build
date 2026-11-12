import { Analytics } from '@vercel/analytics/next'
import { Tajawal } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import './travel-pages.css'

const tajawal = Tajawal({ subsets: ['arabic', 'latin'], weight: ['400', '500', '700', '800'], variable: '--font-tajawal', display: 'swap' })

export const metadata: Metadata = {
  title: 'K Egypt Travel | Your Journey, Our Care',
  description: 'Discover thoughtfully planned Umrah, honeymoon, international and Egypt trips with K Egypt Travel. Ask our licensed travel team for the latest details on WhatsApp.',
  generator: 'K Egypt Travel',
  icons: {
    icon: [{
      url: '/k-travel-icon.svg',
      type: 'image/svg+xml',
    }, {
      url: '/k-travel-icon-32x32.png',
      sizes: '32x32',
      type: 'image/png',
    }],
    shortcut: '/favicon.ico',
    apple: '/k-travel-apple-icon.png',
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
