import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getMesos } from "@/lib/cms"
import { Card } from "@/components/Card"
import { IconBook2, IconCalendarStats } from "@tabler/icons-react"

export default async function Page() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  const { items } = await getMesos()

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <IconCalendarStats width={32} height={32} stroke={1.5} />
        <h1 className="text-4xl font-bold underline">The Academy</h1>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 items-start gap-4 pt-6">
        {items.map((meso) => (
          <Card
            key={meso.slug}
            title={meso.title}
            href={`/the-academy/${meso.slug}`}
            concept={meso.concept}
            descriptionJSON={meso.description.json}
            icon={<IconBook2 height={24} width={24} />}
          />
        ))}
      </div>
    </>
  )
}
