import { getQuestions } from '@/lib/cms'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { userCanAccessLevel } from '@/lib/permissions'
import { Blocked } from '@/components/Blocked'
import { QuestionsForm } from '@/components/certifications/QuestionsForm'
import Image from 'next/image'
import { IconBook2 } from '@tabler/icons-react'
import { createCertification, getCertification } from '@/lib/api'

const level = 1

const BEGINNER = {
  slug: 'beginner',
  title: 'Beginner',
  level: 1,
  hero: {
    url: 'https://images.ctfassets.net/rqt5vjnpqy42/4YNCPWg8W8sMCeArZTzteM/a6fb70d48bb223d56a85545cbf731eaa/methodology-white.png',
  },
}

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) redirect('/login')

  const canAccess = await userCanAccessLevel(level)
  if (!canAccess) return <Blocked />

  const { items } = await getQuestions()

  const certification = await getCertification({ level, userId: data.user.id })

  const handleFormSubmit = async (formData: Record<string, string>) => {
    'use server'
    createCertification({
      formData,
      userId: data.user.id,
      prevCertification: certification.data,
    })
  }

  return (
    <div>
      <Image src={BEGINNER.hero.url} alt={BEGINNER.title} fill className="!relative rounded-lg shadow-md" />

      <h2 className="text-2xl mt-6 mb-4 lg:p-4">
        Teste de Certificação Fran Methodology sobre os módulos do curso de Beginner
      </h2>

      <div className="lg:px-8">
        <MesoHeader title="Mesociclo 1" concept="Serviço, Resposta ao Serviço e 1º Volley" />
        <MesoHeader title="Mesociclo 2" concept="Conceito 5 em Linha" />

        {certification.error && <p className="text-red-500">Erro ao obter a certificação</p>}

        <QuestionsForm questions={items} onSubmit={handleFormSubmit} prevCertification={certification.data} />
      </div>
    </div>
  )
}

const MesoHeader = ({ title, concept }: { title: string; concept: string }) => (
  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
    <div className="flex items-center gap-2">
      <IconBook2 width={32} height={32} stroke={1.5} />
      <h2 className="w-max text-gray-900">{title}</h2>
    </div>
    <h2 className="hidden md:block font-bold text-gray-900">{`>`}</h2>
    <h2 className="font-bold text-gray-900">{concept}</h2>
  </div>
)
