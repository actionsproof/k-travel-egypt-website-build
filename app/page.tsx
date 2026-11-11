import { TravelHome } from '@/components/travel-home'
import { getTravelTrips } from '@/lib/travel-store'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<{ lang?: string }> }

export default async function HomePage({ searchParams }: PageProps) {
  const { lang } = await searchParams
  const featuredTrips = await getTravelTrips(true)
  return <TravelHome initialLanguage={lang === 'en' ? 'en' : 'ar'} initialTrips={featuredTrips} />
}
