import { InformationPage, SiteFrame } from '@/components/travel-pages'
import { visaGuides } from '@/lib/travel-data'
import { getTravelSiteContent } from '@/lib/travel-store'

type PageProps = { searchParams: Promise<{ lang?: string }> }

export const dynamic = 'force-dynamic'

export default async function VisasPage({ searchParams }: PageProps) {
  const { lang: requestedLang } = await searchParams
  const lang = requestedLang === 'en' ? 'en' : 'ar'
  const guides = await getTravelSiteContent('visaGuides', visaGuides)
  return <SiteFrame lang={lang}><InformationPage page="visas" lang={lang} siteData={{ visaGuides: guides }} /></SiteFrame>
}
