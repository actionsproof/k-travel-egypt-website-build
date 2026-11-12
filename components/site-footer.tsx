import Link from 'next/link'
import { Plane } from 'lucide-react'

type Language = 'ar' | 'en'

const footerCopy = {
  en: {
    tagline: 'Your Journey, Our Care',
    legal: 'Tourism Category A · License 2469',
    message: 'Hello, I have a question.',
  },
  ar: {
    tagline: 'رحلتك في رعايتنا',
    legal: 'شركة سياحة فئة أ · ترخيص ٢٤٦٩',
    message: 'مرحباً، عندي استفسار.',
  },
}

export function SiteFooter({ lang }: { lang: Language }) {
  const copy = footerCopy[lang]

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <Link href={`/?lang=${lang}#home`} className="brand footer-brand" aria-label="K Travel Egypt home">
          <span className="brand-mark"><Plane size={21} /></span>
          <span className="brand-words"><strong>K TRAVEL</strong><small>EGYPT</small></span>
        </Link>
        <p>{copy.tagline}</p>
        <div className="footer-social">
          <a href="https://www.facebook.com/ktravelegy" target="_blank" rel="noreferrer" aria-label="K Travel Egypt on Facebook">f</a>
          <a href="https://www.instagram.com/explore/search/keyword/?q=K%20Travel%20Egypt" target="_blank" rel="noreferrer" aria-label="Search K Travel Egypt on Instagram">ig</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} K Travel Egypt. {copy.legal}</span>
        <a href={`https://wa.me/201001859662?text=${encodeURIComponent(copy.message)}`} target="_blank" rel="noreferrer">0100 185 9662</a>
      </div>
    </footer>
  )
}
