import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getMeso } from "@/lib/cms"
import { IconBook2 } from "@tabler/icons-react"
import { documentToReactComponents } from "@contentful/rich-text-react-renderer"
import { TheAcademySlugComponent } from "@/components/the-academy/SlugComponent"
import { userCanAccessMeso } from "@/lib/permissions"

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  const canAccess = await userCanAccessMeso(slug)
  if (canAccess) {
    return (
      <div className="bg-red-500 p-4 rounded-lg text-white">
        <h2 className="text-2xl font-bold mb-2">Acesso bloqueado</h2>
        <p>
          Não tem acesso a este conteúdo. Entre em contato com FranPadelProject
          para obter mais informações.
        </p>
      </div>
    )
  }

  const { item } = await getMeso(slug)

  if (!item) {
    redirect("/the-academy")
  }

  return (
    <>
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2">
          <IconBook2 width={32} height={32} stroke={1.5} />
          <h2 className="text-2xl">{item.title}</h2>
        </div>

        <h1 className="text-4xl font-bold">{item.concept}</h1>
      </div>

      <span className="block text-gray-500 text-justify lg:max-w-[80%] mb-6">
        {documentToReactComponents(item.description.json)}
      </span>

      <TheAcademySlugComponent meso={item} />
    </>
  )
}
