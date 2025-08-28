import { NameField } from "@/components/profile/NameField"
import { createClient } from "@/utils/supabase/server"
import { IconUser } from "@tabler/icons-react"
import { redirect } from "next/navigation"

const PRIVACY_POLICY_URL = "https://www.franpadelproject.com/privacy-policy"
const TERMS_OF_SERVICE_URL = "https://www.franpadelproject.com/terms-of-service"

export default async function Page() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) redirect("/login")

  const user = await supabase.from("users_app").select().single()

  return (
    <div className="flow-root">
      <div className="flex items-center gap-2 mb-6">
        <IconUser width={32} height={32} stroke={1.5} />
        <h1 className="text-4xl font-bold underline">Definições</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <span>Nome</span>
        <div className=" col-span-2">
          <NameField name={user.data.name} />
        </div>

        <span>Email</span>
        <span className=" col-span-2">{data.user.email}</span>

        <span>Clube</span>
        <span className=" col-span-2">{user.data.club_name}</span>
      </div>

      <div className="flex flex-col gap-4 border-t border-t-foreground/10 py-4 mt-8">
        <a
          href={PRIVACY_POLICY_URL}
          className="text-sm font-medium text-gray-700 hover:underline hover:font-bold"
          target="_blank"
          rel="noreferrer"
        >
          Política de Privacidade
        </a>

        <a
          href={TERMS_OF_SERVICE_URL}
          className="text-sm font-medium text-gray-700 hover:underline  hover:font-bold"
          target="_blank"
          rel="noreferrer"
        >
          Termos de Serviço
        </a>
      </div>
    </div>
  )
}
