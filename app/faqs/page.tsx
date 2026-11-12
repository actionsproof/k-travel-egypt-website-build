import type { Metadata } from 'next'
import { InformationPage, SiteFrame } from '@/components/travel-pages'
import { faqs } from '@/lib/travel-data'
import { getTravelSiteContent } from '@/lib/travel-store'

type PageProps = { searchParams: Promise<{ lang?: string }> }

export const metadata: Metadata = {
  title: 'FAQs | K Egypt Travel',
  description: 'Answers to common K Egypt Travel questions about trip quotes, hotel options, children, visas, branches and booking terms.',
}

export const dynamic = 'force-dynamic'

export default async function FaqsPage({ searchParams }: PageProps) {
  const query = await searchParams
  const lang = query.lang === 'en' ? 'en' : 'ar'
  const faqContent = await getTravelSiteContent('faqs', faqs)
  return <SiteFrame lang={lang}><InformationPage page="faqs" lang={lang} siteData={{ faqs: faqContent }} /></SiteFrame>
}
