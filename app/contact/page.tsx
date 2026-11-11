import { InformationPage, SiteFrame } from '@/components/travel-pages'
import { branches } from '@/lib/travel-data'
import { getTravelSiteContent } from '@/lib/travel-store'

type PageProps = { searchParams: Promise<{ lang?: string }> }

export const dynamic = 'force-dynamic'

export default async function ContactPage({ searchParams }: PageProps) {
  const { lang: requestedLang } = await searchParams
  const lang = requestedLang === 'en' ? 'en' : 'ar'
  const branchContent = await getTravelSiteContent('branches', branches)
  return <SiteFrame lang={lang}><InformationPage page="contact" lang={lang} siteData={{ branches: branchContent }} /></SiteFrame>
}
