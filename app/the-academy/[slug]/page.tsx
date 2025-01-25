import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getMeso } from "@/lib/cms"
import { IconBook2 } from "@tabler/icons-react"
import { documentToReactComponents } from "@contentful/rich-text-react-renderer"
import { TheAcademySlugComponent } from "@/components/the-academy/SlugComponent"

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  // const user = await supabase.from("users_app").select().single()
  if (error || !data?.user) {
    redirect("/login")
  }

  const { item } = await getMeso(slug)

  return (
    <>
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2">
          <IconBook2 width={32} height={32} stroke={1.5} />
          <h1 className="text-2xl">{item.title}</h1>
        </div>

        <h1 className="text-4xl font-bold">{item.concept}</h1>
      </div>

      <span className="block text-gray-500 text-justify lg:max-w-[80%]">
        {documentToReactComponents(item.description.json)}
      </span>

      <TheAcademySlugComponent meso={item} />
    </>
  )
}
