import { getAllCourses, getMesosForLevel } from "@/lib/cms"
import { Blocked } from "@/components/Blocked"
import { userCanAccessLevel } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { LevelComponent } from "@/components/the-academy/LevelComponent"

const level = 3

export default async function Page() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) redirect("/login")

  const canAccess = await userCanAccessLevel(level)
  if (!canAccess) return <Blocked />

  const courses = await getAllCourses()
  const currentCourse = courses.items.find((course) => course.level === level)
  const { items } = await getMesosForLevel(currentCourse!.title)

  return <LevelComponent currentCourse={currentCourse} items={items} />
}
