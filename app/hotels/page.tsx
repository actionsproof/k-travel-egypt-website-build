import { HotelDirectory, SiteFrame } from '@/components/travel-pages'
import { hotelDirectory } from '@/lib/travel-data'
import { getTravelSiteContent, getTravelTrips } from '@/lib/travel-store'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<{ lang?: string }> }

export default async function HotelsPage({ searchParams }: PageProps) {
  const { lang: requestedLang } = await searchParams
  const lang = requestedLang === 'en' ? 'en' : 'ar'
  const [trips, hotelGroups] = await Promise.all([
    getTravelTrips(),
    getTravelSiteContent('hotelDirectory', hotelDirectory),
  ])
  return <SiteFrame lang={lang}><HotelDirectory lang={lang} tripData={trips} hotelGroups={hotelGroups} /></SiteFrame>
}
