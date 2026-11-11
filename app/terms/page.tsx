import { InformationPage, SiteFrame } from '@/components/travel-pages'
import { generalTerms } from '@/lib/travel-data'
import { getTravelSiteContent } from '@/lib/travel-store'

type PageProps = { searchParams: Promise<{ lang?: string }> }

export const dynamic = 'force-dynamic'

export default async function TermsPage({ searchParams }: PageProps) {
  const { lang: requestedLang } = await searchParams
  const lang = requestedLang === 'en' ? 'en' : 'ar'
  const terms = await getTravelSiteContent('generalTerms', generalTerms)
  return <SiteFrame lang={lang}><InformationPage page="terms" lang={lang} siteData={{ generalTerms: terms }} /></SiteFrame>
}
