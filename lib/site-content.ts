import {
  branches,
  categories,
  faqs,
  generalTerms,
  homepageContent,
  hotelDirectory,
  visaGuides,
  visaServiceGroups,
  visaSupportServices,
  whatsappContacts,
} from '@/lib/travel-data'

export const SITE_CONTENT_DEFAULTS = {
  homepageContent,
  hotelDirectory,
  visaServiceGroups,
  visaSupportServices,
  visaGuides,
  branches,
  whatsappContacts,
  faqs,
  generalTerms,
  categories,
} as const

export type SiteContentKey = keyof typeof SITE_CONTENT_DEFAULTS

export const SITE_CONTENT_LABELS: Record<SiteContentKey, string> = {
  homepageContent: 'Homepage text',
  hotelDirectory: 'Hotels and resorts',
  visaServiceGroups: 'Visa destinations',
  visaSupportServices: 'Visa services',
  visaGuides: 'Visa guides',
  branches: 'Branches and contact details',
  whatsappContacts: 'WhatsApp contacts',
  faqs: 'FAQs',
  generalTerms: 'Travel terms',
  categories: 'Trip categories',
}

function matchesTemplate(template: unknown, value: unknown): boolean {
  if (typeof template === 'string') return typeof value === 'string'
  if (typeof template === 'number') return typeof value === 'number' && Number.isFinite(value)
  if (typeof template === 'boolean') return typeof value === 'boolean'
  if (Array.isArray(template)) return Array.isArray(value) && (template.length === 0 || value.every((entry) => matchesTemplate(template[0], entry)))
  if (template && typeof template === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    const templateRecord = template as Record<string, unknown>
    const valueRecord = value as Record<string, unknown>
    const templateKeys = Object.keys(templateRecord).sort()
    const valueKeys = Object.keys(valueRecord).sort()
    return templateKeys.length === valueKeys.length
      && templateKeys.every((key, index) => key === valueKeys[index] && matchesTemplate(templateRecord[key], valueRecord[key]))
  }
  return template === null && value === null
}

export function isSiteContentKey(value: string): value is SiteContentKey {
  return Object.prototype.hasOwnProperty.call(SITE_CONTENT_DEFAULTS, value)
}

export function normalizeSiteContent(key: string, value: unknown): unknown {
  if (key === 'branches' && Array.isArray(value)) {
    return value.filter((branch) => {
      if (!branch || typeof branch !== 'object' || !('key' in branch)) return true
      return typeof branch.key !== 'string' || !branch.key.toLowerCase().includes('damanhour')
    })
  }

  if (key === 'whatsappContacts' && Array.isArray(value)) {
    return value.map((contact) => {
      if (!contact || typeof contact !== 'object' || !('number' in contact) || contact.number !== '2010120007714') return contact
      return {
        ...contact,
        label: { en: 'Umrah desk', ar: 'مكتب العمرة' },
        number: '201210007714',
        display: '012 1000 7714',
      }
    })
  }

  if (key === 'homepageContent' && value && typeof value === 'object' && 'branchSub' in value) {
    const branchSub = value.branchSub
    if (branchSub && typeof branchSub === 'object' && 'en' in branchSub && 'ar' in branchSub) {
      return {
        ...value,
        branchSub: {
          en: branchSub.en === 'Three branches, one team that’s always happy to help.'
            ? 'Two branches, one team that’s always happy to help.'
            : branchSub.en,
          ar: branchSub.ar === '٣ فروع وفريق واحد دايماً جاهز يساعدك.'
            ? 'فرعين وفريق واحد دايماً جاهز يساعدك.'
            : branchSub.ar,
        },
      }
    }
  }

  if (key === 'faqs' && Array.isArray(value)) {
    return value.map((faq) => {
      if (!faq || typeof faq !== 'object' || !('answer' in faq)) return faq
      const answer = faq.answer
      if (!answer || typeof answer !== 'object' || !('en' in answer) || !('ar' in answer)) return faq
      if (typeof answer.en !== 'string' || !answer.en.includes('Damanhour') || typeof answer.ar !== 'string' || !answer.ar.includes('دمنهور')) return faq
      return {
        ...faq,
        answer: {
          en: 'K Egypt Travel has offices in Alexandria and Cairo. Use the Contact page for addresses and map links.',
          ar: 'كي إيجيبت ترافل ليها فروع في الإسكندرية والقاهرة. صفحة التواصل فيها العناوين وروابط الخرائط.',
        },
      }
    })
  }

  return value
}

export function validateSiteContent(key: SiteContentKey, value: unknown): boolean {
  return matchesTemplate(SITE_CONTENT_DEFAULTS[key], value)
}
