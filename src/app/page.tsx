import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

// Root page redirects to default locale
// The actual landing page is at /[locale]/page.tsx
export default function HomePage() {
  redirect(`/${routing.defaultLocale}`)
}
