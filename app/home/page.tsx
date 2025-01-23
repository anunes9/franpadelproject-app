import { redirect } from "next/navigation"

import { createClient } from "@/utils/supabase/server"
import { logout } from "@/utils/supabase/actions"

export default async function PrivatePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    console.log(error)
    redirect("/login")
  }

  const user = await supabase.from("users_app").select().single()

  return (
    <div>
      <p>Hello {data.user.email}</p>
      <button onClick={logout}>Logout</button>
      <p>{JSON.stringify(user)}</p>
      <p>Subscription {user.data.subscription_pack}</p>
    </div>
  )
}
