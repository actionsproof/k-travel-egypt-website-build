'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Menu, MessageCircle, Plane, X } from 'lucide-react'

type Language = 'ar' | 'en'

const navigation = {
  en: {
    trips: 'Trips',
    why: 'Why K Travel',
    branches: 'Our branches',
    hotels: 'Hotels',
    visas: 'Visa guide',
    faqs: 'FAQs',
    terms: 'Travel terms',
    contact: 'Contact',
    ask: 'Plan your trip',
    switch: 'عربي',
  },
  ar: {
    trips: 'الرحلات',
    why: 'لماذا كي ترافل',
    branches: 'فروعنا',
    hotels: 'الفنادق',
    visas: 'التأشيرات',
    faqs: 'الأسئلة الشائعة',
    terms: 'الشروط',
    contact: 'تواصل معنا',
    ask: 'خطط لرحلتك',
    switch: 'EN',
  },
}

export function SiteHeader({ lang, onLanguageChange }: { lang: Language; onLanguageChange: (lang: Language) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const labels = navigation[lang]
  const home = `/?lang=${lang}`
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <Link href={`${home}#home`} className="brand" aria-label="K Travel Egypt home" onClick={closeMenu}>
        <span className="brand-mark"><Plane size={22} strokeWidth={2.2} /></span>
        <span className="brand-words"><strong>K TRAVEL</strong><small>EGYPT</small></span>
      </Link>
      <nav id="site-navigation" className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
        <Link href={`/trips?lang=${lang}`} onClick={closeMenu}>{labels.trips}</Link>
        <Link href={`${home}#why`} onClick={closeMenu}>{labels.why}</Link>
        <Link href={`${home}#branches`} onClick={closeMenu}>{labels.branches}</Link>
        <Link href={`/hotels?lang=${lang}`} onClick={closeMenu}>{labels.hotels}</Link>
        <Link href={`/visas?lang=${lang}`} onClick={closeMenu}>{labels.visas}</Link>
        <Link href={`/faqs?lang=${lang}`} onClick={closeMenu}>{labels.faqs}</Link>
        <Link href={`/terms?lang=${lang}`} onClick={closeMenu}>{labels.terms}</Link>
        <Link href={`/contact?lang=${lang}`} onClick={closeMenu}>{labels.contact}</Link>
        <Link className="nav-whatsapp" href={`/inquiry?lang=${lang}`} onClick={closeMenu}><MessageCircle size={16} />{labels.ask}</Link>
      </nav>
      <div className="header-actions">
        <button className="language-toggle" onClick={() => { onLanguageChange(lang === 'ar' ? 'en' : 'ar'); closeMenu() }} aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}>
          {labels.switch}<ChevronDown size={14} />
        </button>
        <button className="menu-toggle" aria-label={menuOpen ? (lang === 'ar' ? 'إغلاق القائمة' : 'Close menu') : (lang === 'ar' ? 'فتح القائمة' : 'Open menu')} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}
