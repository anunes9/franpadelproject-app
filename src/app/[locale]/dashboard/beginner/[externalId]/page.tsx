import { getModuleByExternalId } from '@/lib/contentful/modules-delivery'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ModuleDetail } from '@/components/ModuleDetail'

export default async function BeginnerModuleDetailPage({
  params,
}: {
  params: Promise<{ externalId: string }>
}) {
  const { externalId } = await params
  const locale = await getLocale()
  const module = await getModuleByExternalId(externalId, locale as any)

  if (!module) {
    notFound()
  }

  return <ModuleDetail module={module} backHref="/dashboard/beginner" />
}
