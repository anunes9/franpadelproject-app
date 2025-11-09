import { Award } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Field } from '@/components/Field'
export default function CertificationPage() {
  return (
    <>
      <PageHeader
        color="secondary"
        title="Centro de Certificação"
        level="Beginner"
        progressPercentage={0}
        completedCount={0}
        totalCount={8}
        progressLabel="0/8 mesociclos"
      />

      <Field title="Certificação" icon={<Award className="h-5 w-5" />}>
        Completa os mesociclos para obter certificação.
      </Field>
    </>
  )
}
