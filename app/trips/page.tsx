import { SiteFrame, TripCatalog } from '@/components/travel-pages'
import { categories } from '@/lib/travel-data'
import { getTravelSiteContent, getTravelTrips } from '@/lib/travel-store'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<{ lang?: string }> }

export default async function TripsPage({ searchParams }: PageProps) {
  const { lang: requestedLang } = await searchParams
  const lang = requestedLang === 'en' ? 'en' : 'ar'
  const [trips, categoryData] = await Promise.all([
    getTravelTrips(),
    getTravelSiteContent('categories', categories),
  ])
  return <SiteFrame lang={lang} homeStyle><TripCatalog lang={lang} tripData={trips} categoryData={categoryData} /></SiteFrame>
}
