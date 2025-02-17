import { getAllCourses, getMesosForLevel } from "@/lib/cms"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { userCanAccessLevel } from "@/lib/permissions"
import { Blocked } from "@/components/Blocked"
import { LevelComponent } from "@/components/the-academy/LevelComponent"

const level = 1

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
