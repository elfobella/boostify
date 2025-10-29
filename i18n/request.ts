import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from './config'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Locale

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})

