'use client'

import { useState, type FormEvent } from 'react'
import { CalendarDays, MessageCircle, ShieldCheck } from 'lucide-react'
import { trips as fallbackTrips, whatsappContacts, type Localized, type TravelTrip } from '@/lib/travel-data'

type Lang = 'ar' | 'en'
const tx = (value: Localized, lang: Lang) => value[lang]
const whatsappHref = (message: string) => `https://wa.me/${whatsappContacts[0].number}?text=${encodeURIComponent(message)}`

export function InquiryForm({ lang, initialTrip, trips: tripData }: { lang: Lang; initialTrip?: string; trips?: TravelTrip[] }) {
  const isArabic = lang === 'ar'
  const catalogTrips = tripData?.length ? tripData : fallbackTrips
  const [tripSlug, setTripSlug] = useState(initialTrip ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [whatsAppUrl, setWhatsAppUrl] = useState('')
  const selectedTrip = catalogTrips.find((trip) => trip.slug === tripSlug)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const tripName = selectedTrip ? tx(selectedTrip.title, lang) : String(formData.get('tripName') ?? '')
    const childAges = String(formData.get('childAges') ?? '')
    const lines = isArabic
      ? [
          'مرحباً كي إيجيبت ترافل، أريد الاستفسار عن رحلة.',
          `الاسم: ${formData.get('name')}`,
          `الهاتف: ${formData.get('phone')}`,
          `الرحلة: ${tripName || 'غير محددة'}`,
          `الفندق: ${formData.get('hotel') || 'لا يوجد اختيار'}`,
          `الكبار: ${formData.get('adults')}`,
          `الأطفال: ${formData.get('children') || '٠'} · الأعمار: ${childAges || 'غير محددة'}`,
          `التاريخ المفضل: ${formData.get('preferredDate') || 'مرن'}`,
          `ملاحظات: ${formData.get('notes') || 'لا يوجد'}`,
        ]
      : [
          'Hello K Egypt Travel, I’d like to ask about a trip.',
          `Name: ${formData.get('name')}`,
          `Phone: ${formData.get('phone')}`,
          `Trip: ${tripName || 'Not selected'}`,
          `Hotel: ${formData.get('hotel') || 'No preference'}`,
          `Adults: ${formData.get('adults')}`,
          `Children: ${formData.get('children') || '0'} · Ages: ${childAges || 'Not provided'}`,
          `Preferred date: ${formData.get('preferredDate') || 'Flexible'}`,
          `Notes: ${formData.get('notes') || 'None'}`,
        ]
    const waUrl = whatsappHref(lines.join('\n'))
    setWhatsAppUrl(waUrl)
    window.open(waUrl, '_blank', 'noopener,noreferrer')
    setIsSubmitting(true)
    setStatus('idle')

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          phone: formData.get('phone'),
          tripSlug,
          hotel: formData.get('hotel'),
          adults: formData.get('adults'),
          children: formData.get('children'),
          childAges,
          preferredDate: formData.get('preferredDate'),
          notes: formData.get('notes'),
          locale: lang,
          website: formData.get('website'),
        }),
      })
      if (!response.ok) throw new Error('inquiry-save-failed')
      setStatus('success')
      form.reset()
      setTripSlug('')
    } catch {
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <>
    <section className="inner-hero" lang={lang}>
      <div className="inner-hero-copy">
        <span className="inner-eyebrow"><span />{isArabic ? 'ابدأ التخطيط' : 'Start planning'}</span>
        <h1>{isArabic ? 'احكيلنا عن الرحلة اللي في بالك' : 'Tell us about the trip you have in mind'}</h1>
        <p>{isArabic ? 'املأ التفاصيل، وسيفتح واتساب برسالة جاهزة لفريقنا، مع حفظ طلبك للمتابعة.' : 'Share a few details. WhatsApp will open with a ready-to-send message, and we’ll save your request for follow-up.'}</p>
      </div>
      <div className="inner-hero-icon"><CalendarDays size={32} strokeWidth={1.5} /></div>
    </section>
    <main className="inner-content inquiry-layout">
      <form className="inquiry-form" onSubmit={submit}>
        <div className="form-grid">
          <label>{isArabic ? 'الاسم الكامل' : 'Full name'}<input name="name" autoComplete="name" minLength={2} maxLength={100} required placeholder={isArabic ? 'اكتب اسمك' : 'Your name'} /></label>
          <label>{isArabic ? 'رقم الهاتف' : 'Phone number'}<input name="phone" type="tel" autoComplete="tel" maxLength={32} required placeholder="01XXXXXXXXX" /></label>
          <label>{isArabic ? 'الرحلة' : 'Trip'}<select name="trip" value={tripSlug} onChange={(event) => setTripSlug(event.target.value)}><option value="">{isArabic ? 'اختياري' : 'Choose a trip'}</option>{catalogTrips.map((trip) => <option value={trip.slug} key={trip.slug}>{tx(trip.title, lang)}</option>)}</select></label>
          <label>{isArabic ? 'الفندق المفضل' : 'Preferred hotel'}<input name="hotel" maxLength={120} placeholder={isArabic ? 'إن وجد' : 'If you have one in mind'} /></label>
          <label>{isArabic ? 'عدد البالغين' : 'Adults'}<input name="adults" type="number" min="1" max="20" defaultValue="2" required /></label>
          <label>{isArabic ? 'عدد الأطفال' : 'Children'}<input name="children" type="number" min="0" max="20" defaultValue="0" /></label>
          <label>{isArabic ? 'أعمار الأطفال' : 'Children’s ages'}<input name="childAges" maxLength={100} placeholder={isArabic ? 'مثال: ٤، ٨' : 'e.g. 4, 8'} /></label>
          <label>{isArabic ? 'التاريخ المفضل' : 'Preferred date'}<input name="preferredDate" type="date" /></label>
          <label className="form-full">{isArabic ? 'ملاحظات إضافية' : 'Anything else?'}<textarea name="notes" rows={4} maxLength={1200} placeholder={isArabic ? 'أخبرنا بما يساعدنا في ترتيب رحلتك' : 'Tell us what would help us plan your trip'} /></label>
        </div>
        <div className="sr-only" aria-hidden="true"><label htmlFor="inquiry-website">Website</label><input id="inquiry-website" name="website" tabIndex={-1} autoComplete="off" /></div>
        <div className="form-notice"><ShieldCheck size={17} /><p>{isArabic ? 'سيتم حفظ بيانات طلبك للمتابعة من فريق كي إيجيبت ترافل. الأسعار والتأكيدات النهائية على واتساب.' : 'Your request is saved for the K Egypt Travel team to follow up. Quotes and final confirmations are handled on WhatsApp.'}</p></div>
        <button className="detail-quote-button" type="submit" disabled={isSubmitting}>{isSubmitting ? (isArabic ? 'جارٍ الإرسال…' : 'Sending…') : (isArabic ? 'إرسال الطلب وفتح واتساب' : 'Send inquiry & open WhatsApp')}<MessageCircle size={17} /></button>
        {status === 'success' && <p className="form-success" role="status">{isArabic ? 'تم حفظ طلبك. أرسل رسالة واتساب المفتوحة لإتمام التواصل.' : 'Your request has been saved. Send the WhatsApp message to complete the conversation.'}</p>}
        {status === 'error' && <p className="form-error" role="alert">{isArabic ? 'لم نتمكن من حفظ الطلب، لكن يمكنك إرسال الرسالة مباشرة على واتساب.' : 'We couldn’t save your request, but you can send the message directly on WhatsApp.'} {whatsAppUrl && <a href={whatsAppUrl} target="_blank" rel="noreferrer">{isArabic ? 'فتح واتساب' : 'Open WhatsApp'}</a>}</p>}
      </form>
      <aside className="inquiry-aside"><span className="inquiry-aside-icon"><MessageCircle size={22} /></span><h2>{isArabic ? 'نرد عليك بكل التفاصيل' : 'We’ll help with the details'}</h2><p>{isArabic ? 'أرسل طلبك، ثم شارك الرسالة الجاهزة على واتساب. فريقنا يؤكد أحدث المواعيد والتوافر.' : 'Send your request, then share the prefilled WhatsApp message. Our team will confirm current dates and availability.'}</p><p className="price-note-inline">{isArabic ? 'الأسعار تتغير حسب سعر الصرف والموسم؛ نرسل أحدث التفاصيل مباشرة على واتساب.' : 'Prices change with the exchange rate and season; we share the latest details privately on WhatsApp.'}</p></aside>
    </main>
  </>
}
