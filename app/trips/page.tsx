import { SiteFrame, TripCatalog } from '@/components/travel-pages'
import { getTravelTrips } from '@/lib/travel-store'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<{ lang?: string }> }

export default async function TripsPage({ searchParams }: PageProps) {
  const { lang: requestedLang } = await searchParams
  const lang = requestedLang === 'en' ? 'en' : 'ar'
  const trips = await getTravelTrips()
  return <SiteFrame lang={lang}><TripCatalog lang={lang} tripData={trips} /></SiteFrame>
}
