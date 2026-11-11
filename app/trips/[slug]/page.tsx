import { notFound } from 'next/navigation'
import { SiteFrame, TripDetail } from '@/components/travel-pages'
import { getTravelTrip } from '@/lib/travel-store'

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Pick<PageProps, 'params'>) {
  const { slug } = await params
  const trip = await getTravelTrip(slug)
  if (!trip) return { title: 'Trip not found | K Travel Egypt' }
  return { title: `${trip.title.en} | K Travel Egypt`, description: trip.summary.en }
}

export default async function TripPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const trip = await getTravelTrip(slug)
  if (!trip) notFound()
  const lang = query.lang === 'en' ? 'en' : 'ar'
  return <SiteFrame lang={lang}><TripDetail trip={trip} lang={lang} /></SiteFrame>
}
