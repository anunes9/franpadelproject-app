import { createClient } from "@/utils/supabase/server"

export const userCanAccessMeso = async (meso: string) => {
  const supabase = await createClient()
  // Check User session
  // const { data, error } = await supabase.auth.getUser()
  // if (error || !data?.user) return false

  const user = await supabase.from("users_app").select().single()

  // User is not active
  if (!user.data.active) return false

  // Advances users can access all mesos
  if (user.data.subscription_pack === "Advanced") return true

  // Intermediate users can access Beginner 1-8 and 9-15
  if (user.data.subscription_pack === "Intermediate") {
    const splitArray = meso.split("mesociclo-")
    if (splitArray.length === 2) {
      const id = parseInt(splitArray[1])
      return id <= 15
    }
    return false
  }

  // Beginner users can access Beginner 1-8 mesos
  if (user.data.subscription_pack === "Beginner") {
    const splitArray = meso.split("mesociclo-")
    if (splitArray.length === 2) {
      const id = parseInt(splitArray[1])
      return id <= 8
    }
    return false
  }

  return false
}

export const userCanAccessLevel = async (level: number) => {
  const supabase = await createClient()
  const user = await supabase.from("users_app").select().single()

  // User is not active
  if (!user.data.active) return false

  // Advances users can access all mesos
  if (user.data.subscription_pack === "Advanced") return true

  // Intermediate users can access Beginner 1-8 and 9-15
  if (user.data.subscription_pack === "Intermediate") return level === 2

  // Beginner users can access Beginner 1-8 mesos
  if (user.data.subscription_pack === "Beginner") return level === 1

  return false
}
