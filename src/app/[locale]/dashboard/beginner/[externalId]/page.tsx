import { getModuleByExternalId } from '@/lib/contentful/modules-delivery'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ModuleDetail } from '@/components/ModuleDetail'
import { isModuleComplete } from '../../actions'

export default async function BeginnerModuleDetailPage({
  params,
}: {
  params: Promise<{ externalId: string }>
}) {
  const { externalId } = await params
  const locale = await getLocale()
  const moduleData = await getModuleByExternalId(externalId, locale as any)

  if (!moduleData) {
    notFound()
  }

  const isCompleted = await isModuleComplete(externalId)

  return <ModuleDetail module={moduleData} backHref="/dashboard/beginner" isCompleted={isCompleted} />
}
