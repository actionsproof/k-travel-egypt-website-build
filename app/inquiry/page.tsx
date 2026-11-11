import { InquiryForm } from '@/components/inquiry-form'
import { SiteFrame } from '@/components/travel-pages'
import { getTravelTrips } from '@/lib/travel-store'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<{ lang?: string; trip?: string }> }

export default async function InquiryPage({ searchParams }: PageProps) {
  const query = await searchParams
  const lang = query.lang === 'en' ? 'en' : 'ar'
  const trips = await getTravelTrips()
  return <SiteFrame lang={lang}><InquiryForm lang={lang} initialTrip={query.trip} trips={trips} /></SiteFrame>
}
