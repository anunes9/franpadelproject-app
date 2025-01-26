import { getAllCourses, getMesosForLevel } from "@/lib/cms"
import { Card } from "@/components/Card"
import { IconBook2, IconCalendarStats } from "@tabler/icons-react"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { userCanAccessLevel } from "@/lib/permissions"
import { Blocked } from "@/components/Blocked"

const level = 1

export default async function Page() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  const canAccess = await userCanAccessLevel(level)
  if (canAccess) return <Blocked />

  const courses = await getAllCourses()
  const currentCourse = courses.items.find((course) => course.level === level)
  const { items } = await getMesosForLevel(currentCourse!.title)

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <IconCalendarStats width={32} height={32} stroke={1.5} />
        <h1 className="text-4xl font-bold underline">{`The Academy / ${
          currentCourse!.title
        }`}</h1>
      </div>

      {currentCourse && (
        <Image
          src={currentCourse?.hero.url}
          alt={currentCourse?.title}
          width={1920}
          height={1080}
          className="mb-6"
        />
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 items-start gap-8 pt-6">
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

      {items.length === 0 && (
        <p className="text-xl text-center font-medium text-gray-600 mb-6">
          A planear os mesociclos...
        </p>
      )}
    </>
  )
}
