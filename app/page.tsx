import { TravelHome } from '@/components/travel-home'
import { getTravelSiteContent, getTravelTrips } from '@/lib/travel-store'
import { branches, categories, homepageContent, whatsappContacts } from '@/lib/travel-data'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<{ lang?: string }> }

export default async function HomePage({ searchParams }: PageProps) {
  const { lang } = await searchParams
  const [allTrips, siteContent, branchContent, categoriesContent, contacts] = await Promise.all([
    getTravelTrips(),
    getTravelSiteContent('homepageContent', homepageContent),
    getTravelSiteContent('branches', branches),
    getTravelSiteContent('categories', categories),
    getTravelSiteContent('whatsappContacts', whatsappContacts),
  ])
  return <TravelHome
    initialLanguage={lang === 'en' ? 'en' : 'ar'}
    initialTrips={allTrips}
    siteContent={siteContent}
    branchContent={branchContent}
    categoriesContent={categoriesContent}
    whatsappPhone={contacts[0]?.number ?? whatsappContacts[0].number}
  />
}
