'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, MapPin, MessageCircle, Search, ShieldCheck, Star } from 'lucide-react'
import { branches, categories, faqs, generalTerms, hotelDirectory, mealPlanLabel, mealPlans, trips, visaGuides, visaServiceGroups, visaSupportServices, whatsappContacts, type Localized, type TravelTrip } from '@/lib/travel-data'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

type Lang = 'ar' | 'en'
const tx = (value: Localized, lang: Lang) => value[lang]
const waHref = (message: string, phone = whatsappContacts[0].number) => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
const quoteText = (title: string, lang: Lang) => lang === 'ar' ? `مرحباً كي إيجيبت ترافل، من فضلكم أرسلوا تفاصيل وأسعار: ${title}` : `Hello K Egypt Travel, please send the latest details and a quote for: ${title}`
const categoryText = (id: string, lang: Lang) => categories.find((category) => category.id === id)?.title[lang] ?? (lang === 'ar' ? 'رحلة' : 'Trip')
const galleryByCategory: Record<TravelTrip['category'], string[]> = {
  umrah: ['https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1000&q=85', 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1000&q=85'],
  honeymoon: ['https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1000&q=85', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=85'],
  international: ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1000&q=85', 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1000&q=85'],
  domestic: ['https://images.unsplash.com/photo-1539768942893-daf53e448371?auto=format&fit=crop&w=1000&q=85', 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1000&q=85'],
}

export function SiteFrame({ lang, children, homeStyle = false }: { lang: Lang; children: ReactNode; homeStyle?: boolean }) {
  const isArabic = lang === 'ar'
  const pathname = usePathname()
  const router = useRouter()
  const changeLanguage = (nextLang: Lang) => {
    const query = new URLSearchParams(window.location.search)
    query.set('lang', nextLang)
    router.push(`${pathname}?${query.toString()}${window.location.hash}`)
  }
  const direction = isArabic ? 'rtl' : 'ltr'
  return <div className={`travel-pages${homeStyle ? ' home-frame' : ''}`} dir={direction} lang={lang}>
    <div className="top-note"><span className="top-note-dot" />{isArabic ? 'شركة سياحة مرخصة · فئة أ · الإسكندرية والقاهرة' : 'Licensed tourism company · Category A · Alexandria & Cairo'}</div>
    <SiteHeader lang={lang} onLanguageChange={changeLanguage} />
    {children}
    <SiteFooter lang={lang} />
    <a className={homeStyle ? 'floating-whatsapp' : 'pages-floating-wa'} href={waHref(quoteText(isArabic ? 'رحلتي القادمة' : 'my next trip', lang))} target="_blank" rel="noreferrer" aria-label={isArabic ? 'راسلنا على واتساب' : 'Message K Egypt Travel on WhatsApp'}><MessageCircle size={21} /><span>{isArabic ? 'واتساب' : 'WhatsApp'}</span></a>
  </div>
}

function PageIntro({ eyebrow, title, description, lang }: { eyebrow: string; title: string; description: string; lang: Lang }) {
  return <section className="inner-hero" lang={lang}><div className="inner-hero-copy"><span className="inner-eyebrow"><span />{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className="inner-hero-icon"><CompassIcon /></div></section>
}
function CompassIcon() { return <MapPin size={32} strokeWidth={1.5} /> }

function TripCard({ trip, lang }: { trip: TravelTrip; lang: Lang }) {
  const name = tx(trip.title, lang)
  return <article className="catalog-card"><Link className="catalog-photo" href={`/trips/${trip.slug}?lang=${lang}`} aria-label={lang === 'ar' ? `تفاصيل ${name}` : `View ${name}`}><Image src={trip.image} alt={name} fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 44vw, 30vw" unoptimized /><span className="catalog-photo-shade" /><span className="catalog-tag"><span className="tag-dot" />{tx(trip.tag, lang)}</span><span className="catalog-photo-arrow"><ArrowUpRight size={17} /></span></Link><div className="catalog-card-copy"><span className="catalog-destination"><MapPin size={13} />{tx(trip.destination, lang)}</span><h2><Link href={`/trips/${trip.slug}?lang=${lang}`}>{name}</Link></h2><p className="catalog-duration"><CalendarDays size={14} />{tx(trip.duration, lang)}</p>{trip.dates && <p className="catalog-dates"><Clock3 size={14} />{tx(trip.dates, lang)}</p>}<div className="catalog-card-bottom"><Link className="catalog-detail" href={`/trips/${trip.slug}?lang=${lang}`}>{lang === 'ar' ? 'عرض تفاصيل الرحلة' : 'View trip details'}<ArrowUpRight size={15} /></Link><a className="catalog-wa-link" href={waHref(quoteText(`${name} · ${tx(trip.duration, lang)}${trip.dates ? ` · ${tx(trip.dates, lang)}` : ''}`, lang))} target="_blank" rel="noreferrer">{lang === 'ar' ? 'اسأل عن السعر' : 'Ask for price'}<MessageCircle size={15} /></a></div></div></article>
}

export function TripCatalog({ lang, tripData = trips, categoryData = categories }: { lang: Lang; tripData?: TravelTrip[]; categoryData?: typeof categories }) {
  const isArabic = lang === 'ar'
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState('')
  const filtered = useMemo(() => tripData.filter((trip) => {
    const matchesCategory = category === 'all' || trip.category === category
    const text = `${trip.title.ar} ${trip.title.en} ${trip.destination.ar} ${trip.destination.en}`.toLocaleLowerCase()
    const matchesQuery = !query || text.includes(query.toLocaleLowerCase())
    const dates = `${trip.dates?.ar ?? ''} ${trip.dates?.en ?? ''}`.toLocaleLowerCase()
    return matchesCategory && matchesQuery && (!month || dates.includes(month.toLocaleLowerCase()))
  }), [tripData, category, query, month])
  return <div className="catalog-page">
    <section className="trips-page-heading section-shell"><div className="eyebrow"><span className="eyebrow-dash" />{isArabic ? 'اختاروا رحلتكم' : 'Find your next journey'}</div><h1>{isArabic ? 'رحلات تناسب الحكاية اللي في بالك' : 'Trips for the story you want to tell'}</h1><p>{isArabic ? 'من العمرة وشهر العسل إلى الرحلات الدولية وإجازات مصر. تصفحوا التفاصيل، وكل الأسعار والتأكيدات على واتساب.' : 'From Umrah and honeymoons to international trips and Egypt escapes. Explore the details; quotes and availability are confirmed on WhatsApp.'}</p></section>
    <main className="inner-content"><div className="catalog-filters"><label className="catalog-search"><span className="sr-only">{isArabic ? 'ابحث عن وجهة' : 'Search destinations'}</span><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isArabic ? 'ابحث عن وجهة أو رحلة' : 'Search destinations or trips'} /></label><label className="catalog-month"><span className="sr-only">{isArabic ? 'تصفية حسب الشهر' : 'Filter by month'}</span><CalendarDays size={16} /><select value={month} onChange={(event) => setMonth(event.target.value)}><option value="">{isArabic ? 'كل المواعيد' : 'Any date'}</option>{['November', 'December', 'January', 'March', 'October'].map((value) => <option key={value} value={value}>{isArabic ? ({ November: 'نوفمبر', December: 'ديسمبر', January: 'يناير', March: 'مارس', October: 'أكتوبر' } as Record<string, string>)[value] : value}</option>)}</select></label></div>
      <div className="catalog-category-tabs" role="group" aria-label={isArabic ? 'تصنيف الرحلات' : 'Trip categories'}><button className={category === 'all' ? 'is-active' : ''} onClick={() => setCategory('all')}>{isArabic ? 'كل الرحلات' : 'All trips'}</button>{categoryData.map((item) => <button key={item.id} className={category === item.id ? 'is-active' : ''} onClick={() => setCategory(item.id)}>{tx(item.title, lang)}</button>)}</div>
      <p className="result-count">{isArabic ? `عرض ${filtered.length} رحلة` : `${filtered.length} trips found`}</p>
      {filtered.length ? <div className="catalog-grid">{filtered.map((trip) => <TripCard key={trip.slug} trip={trip} lang={lang} />)}</div> : <div className="empty-results"><Search size={24} /><p>{isArabic ? 'لا توجد رحلات مطابقة. جرّبوا تغيير البحث.' : 'No trips match your filters. Try another search.'}</p></div>}
    </main>
  </div>
}

function SectionList({ title, items, lang, ordered = false }: { title: string; items?: Localized[]; lang: Lang; ordered?: boolean }) {
  if (!items?.length) return null
  const List = ordered ? 'ol' : 'ul'
  return <section className="detail-section"><h2>{title}</h2><List className="check-list">{items.map((text, index) => <li key={`${index}-${text.en}`}>{!ordered && <Check size={16} />}{tx(text, lang)}</li>)}</List></section>
}

export function TripDetail({ trip, lang }: { trip: TravelTrip; lang: Lang }) {
  const isArabic = lang === 'ar'
  const title = tx(trip.title, lang)
  const gallery = trip.media?.length
    ? trip.media.slice(0, 3)
    : [trip.image, ...galleryByCategory[trip.category]].slice(0, 3).map((url, index) => ({
      type: 'image' as const,
      url,
      alt: index === 0 ? title : '',
    }))
  const hotelOptions = trip.hotels.length ? trip.hotels : trip.slug === 'zanzibar-eid' ? trips.find((candidate) => candidate.slug === 'zanzibar-midyear')?.hotels ?? [] : []
  return <><section className="detail-hero"><Image src={trip.image} alt={title} fill priority sizes="100vw" unoptimized /><div className="detail-hero-shade" /><div className="detail-hero-copy"><Link className="back-link" href={`/trips?lang=${lang}`}>{isArabic ? '← كل الرحلات' : '← All trips'}</Link><span className="detail-tag">{tx(trip.tag, lang)}</span><h1>{title}</h1><p><MapPin size={16} />{tx(trip.destination, lang)}<span className="detail-separator">·</span><CalendarDays size={16} />{tx(trip.duration, lang)}</p>{trip.dates && <p className="detail-dates">{tx(trip.dates, lang)}</p>}</div></section>
    <section className="detail-gallery" aria-label={isArabic ? `معرض وسائط ${title}` : `${title} media gallery`}>{gallery.map((media, index) => <div className={`detail-gallery-item detail-gallery-item-${index + 1}`} key={`${media.url}-${index}`}>{media.type === 'video' ? <video src={media.url} poster={media.thumbnail} controls preload="metadata" playsInline aria-label={media.alt || `${title} video ${index + 1}`} /> : <Image src={media.url} alt={media.alt || (index === 0 ? title : isArabic ? `مناظر من ${tx(trip.destination, lang)}` : `Views related to ${tx(trip.destination, lang)}`)} fill sizes="(max-width: 700px) 85vw, 40vw" unoptimized />}</div>)}</section>
    <main className="detail-layout"><article className="detail-main"><section className="detail-section detail-overview"><h2>{isArabic ? 'عن الرحلة' : 'About this trip'}</h2><p>{tx(trip.summary, lang)}</p></section>
      {hotelOptions.length > 0 && <section className="detail-section"><div className="detail-heading-row"><h2>{isArabic ? 'الفنادق والإقامة' : 'Hotels & accommodation'}</h2><Link className="small-link" href={`/hotels?lang=${lang}`}>{isArabic ? 'كل الفنادق' : 'Browse hotels'}<ArrowUpRight size={14} /></Link></div><div className="detail-hotel-list">{hotelOptions.map((hotel, index) => <article className="detail-hotel" key={`${hotel.en}-${index}`}><div className="detail-hotel-icon"><Star size={18} /></div><div><h3>{tx(hotel, lang)}</h3>{hotel.stars && <span className="hotel-stars">{Array.from({ length: hotel.stars }, (_, starIndex) => <Star size={12} key={starIndex} fill="currentColor" />)}</span>}{hotel.location && <p>{tx(hotel.location, lang)}</p>}{hotel.distance && <p>{tx(hotel.distance, lang)}</p>}{hotel.meal && <span className="meal-badge">{mealPlanLabel(hotel.meal, lang)}</span>}{hotel.note && <p>{tx(hotel.note, lang)}</p>}</div></article>)}</div></section>}
      {trip.flights?.length ? <SectionList title={isArabic ? 'الطيران والانتقالات' : 'Flights & transfers'} items={trip.flights} lang={lang} /> : null}
      {trip.itinerary?.length ? <section className="detail-section"><h2>{isArabic ? 'برنامج الرحلة' : 'Day-by-day itinerary'}</h2><div className="itinerary-list">{trip.itinerary.map((day, index) => <article className="itinerary-item" key={`${day.day.en}-${index}`}><div className="itinerary-marker">{String(index + 1).padStart(2, '0')}</div><div><h3>{tx(day.day, lang)}</h3><p>{tx(day.detail, lang)}</p></div></article>)}</div></section> : null}
      <SectionList title={isArabic ? 'يشمل' : 'What’s included'} items={trip.includes} lang={lang} /><SectionList title={isArabic ? 'لا يشمل' : 'Not included'} items={trip.excludes} lang={lang} />
      {trip.visa && <section className="detail-section"><h2>{isArabic ? 'التأشيرة ومتطلبات السفر' : 'Visa & travel requirements'}</h2><p>{tx(trip.visa, lang)}</p><Link className="small-link" href={`/visas?lang=${lang}`}>{isArabic ? 'دليل التأشيرات' : 'Visa guide'}<ArrowUpRight size={14} /></Link></section>}
      <SectionList title={isArabic ? 'الشروط وملاحظات مهمة' : 'Terms & important notes'} items={[...(trip.terms ?? []), ...(trip.notes ?? [])]} lang={lang} />
      <section className="detail-section detail-faq"><h2>{isArabic ? 'أسئلة متكررة' : 'Frequently asked'}</h2><details><summary>{isArabic ? 'كيف أعرف السعر النهائي والتوافر؟' : 'How do I get a quote and confirm availability?'}</summary><p>{isArabic ? 'أرسل اسم الرحلة وتواريخك المفضلة على واتساب، وسيؤكد الفريق أحدث الأسعار والتوافر.' : 'Send the trip name and preferred dates on WhatsApp. The team will confirm the latest quote and availability.'}</p></details><details><summary>{isArabic ? 'هل يمكن تعديل البرنامج؟' : 'Can the itinerary be adjusted?'}</summary><p>{isArabic ? 'أرسلوا طلبكم للفريق؛ أي تعديل يتوقف على التوافر وشروط الفندق والطيران.' : 'Send your request to the team. Changes depend on availability and hotel and airline terms.'}</p></details></section>
    </article><aside className="detail-sidebar"><div className="detail-quote-card"><span className="quote-icon"><MessageCircle size={20} /></span><h2>{isArabic ? 'تفاصيل الرحلة والأسعار على واتساب' : 'Trip details & quotes on WhatsApp'}</h2><p>{isArabic ? 'أرسل اسم الرحلة وتواريخك المفضلة، وفريقنا يرد عليك بأحدث المعلومات.' : 'Share the trip and your preferred dates. Our team will reply with current details.'}</p><a href={waHref(quoteText(`${title} · ${tx(trip.duration, lang)}${trip.dates ? ` · ${tx(trip.dates, lang)}` : ''}`, lang))} target="_blank" rel="noreferrer" className="detail-quote-button">{isArabic ? 'اسأل عن السعر على واتساب' : 'Ask for price on WhatsApp'}<MessageCircle size={17} /></a><Link href={`/inquiry?lang=${lang}&trip=${encodeURIComponent(trip.slug)}`} className="detail-inquiry-link">{isArabic ? 'أرسل طلب رحلة' : 'Send a trip inquiry'}<ArrowRight size={15} /></Link></div><div className="detail-contact-card"><ShieldCheck size={19} /><div><strong>{isArabic ? 'فريق مرخص في مصر' : 'Licensed Egypt-based team'}</strong><span>{isArabic ? 'فئة أ · ترخيص ٢٤٦٩' : 'Category A · License 2469'}</span></div></div></aside></main>
  </>
}

export function HotelDirectory({ lang, tripData = trips, hotelGroups = hotelDirectory }: { lang: Lang; tripData?: TravelTrip[]; hotelGroups?: typeof hotelDirectory }) {
  const isArabic = lang === 'ar'
  const hotelRows = useMemo(() => tripData.flatMap((trip) => trip.hotels.map((hotel, index) => ({ trip, hotel, key: `${trip.slug}-${index}` }))), [tripData])
  const [destination, setDestination] = useState('')
  const [stars, setStars] = useState('')
  const [meal, setMeal] = useState('')
  const [duration, setDuration] = useState('')
  const [season, setSeason] = useState('')
  const visible = hotelRows.filter(({ trip, hotel }) => (!destination || `${trip.destination.en} ${trip.destination.ar}`.toLowerCase().includes(destination.toLowerCase())) && (!stars || hotel.stars === Number(stars)) && (!meal || hotel.meal === meal) && (!duration || `${trip.duration.en} ${trip.duration.ar}`.toLowerCase().includes(duration.toLowerCase())) && (!season || `${trip.dates?.en ?? ''} ${trip.dates?.ar ?? ''}`.toLowerCase().includes(season.toLowerCase())))
  const visibleHotelGroups = hotelGroups.filter((group) => !destination || `${group.destination.en} ${group.destination.ar}`.toLowerCase().includes(destination.toLowerCase()))
  return <><PageIntro lang={lang} eyebrow={isArabic ? 'خيارات الإقامة' : 'Stay your way'} title={isArabic ? 'فنادق تناسب وجهتك' : 'Hotels for the way you travel'} description={isArabic ? 'تصفحوا الفنادق والمنتجعات حسب الوجهة. توافر الفنادق والأسعار والعروض الخاصة تتأكد عند التواصل مع فريقنا.' : 'Browse hotels and resorts by destination. Confirm current availability, prices and special offers with our team.'} /><main className="inner-content"><section className="hotel-directory-section"><div className="hotel-section-heading"><h2>{isArabic ? 'فنادق ومنتجعات حسب الوجهة' : 'Hotels and resorts by destination'}</h2><p>{isArabic ? 'الأسماء المتاحة للاستفسار والحجز حسب التوافر الحالي.' : 'Ask our team about these properties and current availability.'}</p></div><div className="hotel-region-grid">{visibleHotelGroups.map((group) => <article className="hotel-region-card" key={group.destination.en}><h3><MapPin size={17} />{tx(group.destination, lang)}</h3><ul>{group.hotels.map((name) => <li key={name.en}>{tx(name, lang)}</li>)}</ul></article>)}</div></section><section className="hotel-package-section"><div className="hotel-section-heading"><h2>{isArabic ? 'فنادق ضمن برامج الرحلات' : 'Hotels in trip packages'}</h2><p>{isArabic ? 'استخدموا الفلاتر لمقارنة اختيارات الإقامة المضافة لبرامج الرحلات.' : 'Filter accommodation options included in our trip packages.'}</p></div><div className="hotel-filters"><label><span>{isArabic ? 'الوجهة' : 'Destination'}</span><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder={isArabic ? 'ابحث عن وجهة' : 'Search destination'} /></label><label><span>{isArabic ? 'التصنيف' : 'Stars'}</span><select value={stars} onChange={(event) => setStars(event.target.value)}><option value="">{isArabic ? 'كل التصنيفات' : 'Any rating'}</option>{[3, 4, 5].map((value) => <option key={value} value={value}>{value} {isArabic ? 'نجوم' : 'stars'}</option>)}</select></label><label><span>{isArabic ? 'خطة الوجبات' : 'Meal plan'}</span><select value={meal} onChange={(event) => setMeal(event.target.value)}><option value="">{isArabic ? 'كل الخطط' : 'Any meal plan'}</option>{mealPlans.map((plan) => <option key={plan.code} value={plan.code}>{plan.code} · {lang === 'ar' ? plan.ar : plan.en}</option>)}</select></label><label><span>{isArabic ? 'الموسم أو التاريخ' : 'Season or date'}</span><input value={season} onChange={(event) => setSeason(event.target.value)} placeholder={isArabic ? 'مثال: نوفمبر أو 2027' : 'e.g. November or 2027'} /></label><label><span>{isArabic ? 'مدة الرحلة' : 'Duration'}</span><select value={duration} onChange={(event) => setDuration(event.target.value)}><option value="">{isArabic ? 'كل المدد' : 'Any duration'}</option>{['3 nights', '4 nights', '5 nights', '6 nights'].map((value) => <option key={value} value={value}>{isArabic ? value.replace('nights', 'ليالي') : value}</option>)}</select></label></div><p className="result-count">{isArabic ? `${visible.length} اختيار فندق` : `${visible.length} hotel options`}</p><div className="hotel-directory-grid">{visible.map(({ trip, hotel, key }) => <article className="hotel-directory-card" key={key}><span className="hotel-card-icon"><Star size={19} /></span><div><span className="catalog-destination">{tx(trip.destination, lang)}</span><h2>{tx(hotel, lang)}</h2>{hotel.stars && <span className="hotel-stars">{Array.from({ length: hotel.stars }, (_, i) => <Star key={i} size={12} fill="currentColor" />)}</span>}{hotel.meal && <p className="meal-badge">{mealPlanLabel(hotel.meal, lang)}</p>}{hotel.distance && <p>{tx(hotel.distance, lang)}</p>}{hotel.location && <p>{tx(hotel.location, lang)}</p>}<Link href={`/trips/${trip.slug}?lang=${lang}`} className="small-link">{isArabic ? 'عرض الرحلة' : 'View trip'}<ArrowUpRight size={14} /></Link><a className="catalog-wa-link" href={waHref(quoteText(`${tx(trip.title, lang)} · ${tx(hotel, lang)} · ${tx(trip.duration, lang)}${trip.dates ? ` · ${tx(trip.dates, lang)}` : ''}`, lang))} target="_blank" rel="noreferrer">{isArabic ? 'اسأل عن السعر على واتساب' : 'Ask for price on WhatsApp'}<MessageCircle size={15} /></a></div></article>)}</div></section></main></>
}

type InformationContent = {
  visaGuides?: typeof visaGuides
  visaServiceGroups?: typeof visaServiceGroups
  visaSupportServices?: typeof visaSupportServices
  faqs?: typeof faqs
  generalTerms?: typeof generalTerms
  branches?: typeof branches
  whatsappContacts?: typeof whatsappContacts
}

export function InformationPage({ page, lang, siteData }: { page: 'visas' | 'faqs' | 'terms' | 'contact'; lang: Lang; siteData?: InformationContent }) {
  const isArabic = lang === 'ar'
  const visaContent = siteData?.visaGuides ?? visaGuides
  const visaServices = siteData?.visaServiceGroups ?? visaServiceGroups
  const visaSupport = siteData?.visaSupportServices ?? visaSupportServices
  const faqContent = siteData?.faqs ?? faqs
  const termsContent = siteData?.generalTerms ?? generalTerms
  const branchContent = siteData?.branches ?? branches
  const contacts = siteData?.whatsappContacts ?? whatsappContacts
  if (page === 'visas') return <><PageIntro lang={lang} eyebrow={isArabic ? 'قبل السفر' : 'Before you go'} title={isArabic ? 'دليل التأشيرات ومتطلبات السفر' : 'Visa & travel information'} description={isArabic ? 'نساعد في تجهيز ملفات التأشيرات ومتابعة الإجراءات للوجهات التالية. التوافر والمتطلبات والأهلية تتغير ويجب تأكيدها قبل التقديم.' : 'We assist with visa files and application steps for the destinations below. Availability, requirements and eligibility can change and must be confirmed before applying.'} /><main className="inner-content"><section className="visa-service-section"><div className="hotel-section-heading"><h2>{isArabic ? 'وجهات خدمات التأشيرات' : 'Visa assistance destinations'}</h2><p>{isArabic ? 'تواصلوا معنا لتأكيد الخدمة ومتطلبات كل وجهة.' : 'Contact us to confirm assistance and requirements for each destination.'}</p></div><div className="visa-service-grid">{visaServices.map((group) => <article className="info-card visa-service-card" key={group.title.en}><span className="info-icon"><ShieldCheck size={20} /></span><h2>{tx(group.title, lang)}</h2><ul className="visa-country-list">{group.countries.map((country) => <li key={country.en}>{tx(country, lang)}</li>)}</ul><Link className="small-link" href={`/inquiry?lang=${lang}`}>{isArabic ? 'استفسر عن الوجهة' : 'Ask about this destination'}<ArrowUpRight size={14} /></Link></article>)}</div><div className="visa-support-card"><h2>{isArabic ? 'خدماتنا' : 'How we can help'}</h2><ul>{visaSupport.map((service) => <li key={service.en}><Check size={16} />{tx(service, lang)}</li>)}</ul></div></section><section className="visa-guide-section"><div className="hotel-section-heading"><h2>{isArabic ? 'معلومات إضافية عن التأشيرات' : 'Additional visa information'}</h2></div><div className="info-grid">{visaContent.map((guide) => <article className="info-card" key={guide.title.en}><span className="info-icon"><ShieldCheck size={20} /></span><h2>{tx(guide.title, lang)}</h2><p>{tx(guide.content, lang)}</p><Link className="small-link" href={`/inquiry?lang=${lang}`}>{isArabic ? 'اسأل فريق السفر' : 'Ask the travel team'}<ArrowUpRight size={14} /></Link></article>)}</div></section><div className="info-caution"><ShieldCheck size={18} /><p>{isArabic ? 'هذه الخدمات لا تضمن إصدار التأشيرة أو موعداً محدداً. الأهلية والقرار النهائي للجهات المختصة؛ تحققوا من المتطلبات الرسمية الحالية قبل التقديم.' : 'Our services do not guarantee visa issuance or a specific appointment. Eligibility and final decisions rest with the relevant authorities; check current official requirements before applying.'}</p></div></main></>
  if (page === 'faqs') return <><PageIntro lang={lang} eyebrow={isArabic ? 'إجابات سريعة' : 'A few quick answers'} title={isArabic ? 'أسئلة بتتكرر' : 'Frequently asked questions'} description={isArabic ? 'معلومات تساعدك قبل ما تبدأ تخطط. لو لسه محتاج مساعدة، فريقنا قريب منك على واتساب.' : 'A few helpful things to know as you plan. If you need more help, our team is right here on WhatsApp.'} /><main className="inner-content faq-page-list">{faqContent.map((faq, index) => <details className="faq-page-item" key={`${index}-${faq.question.en}`}><summary><span>{tx(faq.question, lang)}</span><ArrowRight size={17} /></summary><p>{tx(faq.answer, lang)}</p></details>)}<a className="detail-quote-button faq-contact" href={waHref(quoteText(isArabic ? 'استفسار عام' : 'a general question', lang))} target="_blank" rel="noreferrer">{isArabic ? 'اسأل فريقنا على واتساب' : 'Ask us on WhatsApp'}<MessageCircle size={17} /></a></main></>
  if (page === 'terms') return <><PageIntro lang={lang} eyebrow={isArabic ? 'معلومات مهمة' : 'Good to know'} title={isArabic ? 'شروط السفر العامة' : 'General travel terms'} description={isArabic ? 'راجعوا النقاط العامة قبل الحجز. الشروط الخاصة بكل رحلة والتغيير والإلغاء والسداد يؤكدها الفريق على واتساب.' : 'Review these general notes before booking. Trip-specific conditions, changes, cancellations and payment details are confirmed by the team on WhatsApp.'} /><main className="inner-content terms-content"><section className="terms-list">{termsContent.map((term, index) => <article key={index}><span>{String(index + 1).padStart(2, '0')}</span><p>{tx(term, lang)}</p></article>)}</section><aside className="terms-callout"><h2>{isArabic ? 'السعر والتأكيد' : 'Quotes & confirmation'}</h2><p>{isArabic ? 'الأسعار تتغير حسب سعر الصرف والموسم، فنبعت أحدث التفاصيل مباشرة على واتساب.' : 'Prices change with the exchange rate and season, so we share the latest details directly on WhatsApp.'}</p><a className="detail-quote-button" href={waHref(quoteText(isArabic ? 'استفسار عن شروط السفر' : 'a question about travel terms', lang))} target="_blank" rel="noreferrer">{isArabic ? 'تواصل مع الفريق' : 'Contact the team'}<MessageCircle size={16} /></a></aside></main></>
  return <><PageIntro lang={lang} eyebrow={isArabic ? 'فروعنا' : 'Find us'} title={isArabic ? 'فريق قريب منك في فرعين' : 'A local team across two branches'} description={isArabic ? 'زورونا من ١٠ صباحاً حتى ١٠ مساءً، أو راسلوا فريقنا مباشرة على واتساب.' : 'Visit us daily from 10 AM to 10 PM, or message our team directly on WhatsApp.'} /><main className="inner-content"><div className="contact-grid">{branchContent.map((branch) => <article className="contact-branch" key={branch.key}><span className="branch-icon"><MapPin size={20} /></span><h2>{tx(branch.name, lang)}</h2><p>{tx(branch.address, lang)}</p><div className="contact-actions"><a className="small-link" href={branch.map} target="_blank" rel="noreferrer">{isArabic ? 'افتح الخريطة' : 'Open map'}<ArrowUpRight size={14} /></a><a className="small-link" href={waHref(quoteText(tx(branch.name, lang), lang))} target="_blank" rel="noreferrer">{isArabic ? 'واتساب' : 'WhatsApp'}<MessageCircle size={14} /></a></div></article>)}</div><section className="contact-phones"><div><h2>{isArabic ? 'تواصل معنا' : 'Talk to our team'}</h2><p>{isArabic ? 'اختر الرقم المناسب، وسنساعدك في تخطيط الرحلة.' : 'Choose a contact and we’ll help you plan your trip.'}</p></div>{contacts.map((contact) => <a key={contact.number} href={waHref(quoteText(isArabic ? 'استفسار عام' : 'a general inquiry', lang), contact.number)} target="_blank" rel="noreferrer"><MessageCircle size={18} /><span>{contact.display}<small>{tx(contact.label, lang)}</small></span></a>)}</section></main></>
}

export function InquiryForm({ lang, initialTrip }: { lang: Lang; initialTrip?: string }) {
  const isArabic = lang === 'ar'
  const [sent, setSent] = useState(false)
  const [tripSlug, setTripSlug] = useState(initialTrip ?? '')
  const selected = trips.find((trip) => trip.slug === tripSlug)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const values = Object.fromEntries(formData.entries())
    const lines = isArabic ? [
      'مرحباً كي إيجيبت ترافل، أريد الاستفسار عن رحلة.', `الاسم: ${values.name}`, `الهاتف: ${values.phone}`, `الرحلة: ${selected ? tx(selected.title, lang) : values.trip || 'غير محددة'}`, `الفندق: ${values.hotel || 'لا يوجد اختيار'}`, `الكبار: ${values.adults}`, `الأطفال والأعمار: ${values.children || 'لا يوجد'}`, `التاريخ المفضل: ${values.date || 'مرن'}`, `ملاحظات: ${values.notes || 'لا يوجد'}`
    ] : [
      'Hello K Egypt Travel, I’d like to ask about a trip.', `Name: ${values.name}`, `Phone: ${values.phone}`, `Trip: ${selected ? tx(selected.title, lang) : values.trip || 'Not selected'}`, `Hotel: ${values.hotel || 'No preference'}`, `Adults: ${values.adults}`, `Children and ages: ${values.children || 'None'}`, `Preferred date: ${values.date || 'Flexible'}`, `Notes: ${values.notes || 'None'}`
    ]
    window.open(waHref(lines.join('\n')), '_blank', 'noopener,noreferrer')
    setSent(true)
  }
  return <><PageIntro lang={lang} eyebrow={isArabic ? 'ابدأ التخطيط' : 'Start planning'} title={isArabic ? 'احكيلنا عن الرحلة اللي في بالك' : 'Tell us about the trip you have in mind'} description={isArabic ? 'املأ التفاصيل لفتح رسالة واتساب جاهزة لفريقنا. لن يتم حفظ طلبك في لوحة متابعة مستقلة في هذه النسخة.' : 'Submit to open a prefilled WhatsApp message to our team. This version does not save inquiries to a separate dashboard.'} /><main className="inner-content inquiry-layout"><form className="inquiry-form" onSubmit={submit}><div className="form-grid"><label>{isArabic ? 'الاسم الكامل' : 'Full name'}<input name="name" autoComplete="name" required placeholder={isArabic ? 'اكتب اسمك' : 'Your name'} /></label><label>{isArabic ? 'رقم الهاتف' : 'Phone number'}<input name="phone" type="tel" autoComplete="tel" required placeholder="01XXXXXXXXX" /></label><label>{isArabic ? 'الرحلة' : 'Trip'}<select name="trip" value={tripSlug} onChange={(event) => setTripSlug(event.target.value)}><option value="">{isArabic ? 'اختياري' : 'Choose a trip'}</option>{trips.map((trip) => <option value={trip.slug} key={trip.slug}>{tx(trip.title, lang)}</option>)}</select></label><label>{isArabic ? 'الفندق المفضل' : 'Preferred hotel'}<input name="hotel" placeholder={isArabic ? 'إن وجد' : 'If you have one in mind'} /></label><label>{isArabic ? 'عدد البالغين' : 'Adults'}<input name="adults" type="number" min="1" max="20" defaultValue="2" required /></label><label>{isArabic ? 'الأطفال وأعمارهم' : 'Children and ages'}<input name="children" placeholder={isArabic ? 'مثال: طفلان، ٤ و٨ سنوات' : 'e.g. 2 children, ages 4 and 8'} /></label><label>{isArabic ? 'التاريخ المفضل' : 'Preferred date'}<input name="date" type="date" /></label><label className="form-full">{isArabic ? 'ملاحظات إضافية' : 'Anything else?'}<textarea name="notes" rows={4} placeholder={isArabic ? 'أخبرنا بما يساعدنا في ترتيب رحلتك' : 'Tell us what would help us plan your trip'} /></label></div><div className="form-notice"><ShieldCheck size={16} /><span>{isArabic ? 'سيتم فتح واتساب مع تفاصيل طلبك. لا تدخل معلومات دفع أو بيانات حساسة.' : 'WhatsApp will open with your inquiry details. Do not include payment or sensitive information.'}</span></div><button className="detail-quote-button" type="submit">{isArabic ? 'إرسال الطلب على واتساب' : 'Send inquiry on WhatsApp'}<MessageCircle size={17} /></button>{sent && <p className="form-success" role="status">{isArabic ? 'تم فتح رسالة واتساب. أرسلها للفريق لاستكمال طلبك.' : 'WhatsApp opened with your message. Send it to our team to continue.'}</p>}</form><aside className="inquiry-aside"><span className="inquiry-icon"><MessageCircle size={24} /></span><h2>{isArabic ? 'عرض مخصص، على واتساب' : 'A personal quote, on WhatsApp'}</h2><p>{isArabic ? 'المواعيد والتوافر والأسعار تتغير حسب الموسم. يرسل فريقنا آخر التفاصيل مباشرة.' : 'Dates, availability and pricing change by season. Our team shares current details directly.'}</p><a href={waHref(quoteText(isArabic ? 'استفسار عام' : 'a general inquiry', lang))} target="_blank" rel="noreferrer">{isArabic ? 'راسلنا مباشرة' : 'Message us directly'}<ArrowUpRight size={15} /></a></aside></main></>
}

export function PageBreadcrumb({ label, lang }: { label: string; lang: Lang }) { return <div className="page-breadcrumb"><Link href={`/?lang=${lang}`}>{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link><span>/</span><span>{label}</span></div> }
