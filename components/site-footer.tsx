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
        <Link href={`/?lang=${lang}#home`} className="brand footer-brand" aria-label="K Egypt Travel home">
          <span className="brand-mark"><Plane size={21} /></span>
          <span className="brand-words"><strong>K EGYPT</strong><small>TRAVEL</small></span>
        </Link>
        <p>{copy.tagline}</p>
        <div className="footer-social">
          <a href="https://www.facebook.com/ktravelegy" target="_blank" rel="noreferrer" aria-label="K Egypt Travel on Facebook">f</a>
          <a href="https://www.instagram.com/explore/search/keyword/?q=K%20Egypt%20Travel" target="_blank" rel="noreferrer" aria-label="Search K Egypt Travel on Instagram">ig</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} K Egypt Travel. {copy.legal}</span>
        <a href={`https://wa.me/201001859662?text=${encodeURIComponent(copy.message)}`} target="_blank" rel="noreferrer">0100 185 9662</a>
      </div>
    </footer>
  )
}
