import { NameField } from '@/components/profile/NameField'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { IconUser } from '@tabler/icons-react'
import { redirect } from 'next/navigation'

const PRIVACY_POLICY_URL = 'https://www.franpadelproject.com/privacy-policy'
const TERMS_OF_SERVICE_URL = 'https://www.franpadelproject.com/terms-of-service'

export default async function Page() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) redirect('/')

  const { data: userProfile } = await supabase.from('users_app').select().eq('id', data.user.id).single()

  return (
    <div className="flow-root">
      <div className="flex items-center gap-2 mb-6">
        <IconUser width={32} height={32} stroke={1.5} />
        <h1 className="text-4xl font-bold underline">Profile Settings</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <span>Name</span>
        <div className="col-span-2">
          <NameField name={userProfile?.name || ''} />
        </div>

        <span>Email</span>
        <span className="col-span-2">{data.user.email}</span>

        <span>Club</span>
        <span className="col-span-2">{userProfile?.club_name || 'Not specified'}</span>
      </div>

      <div className="flex flex-col gap-4 border-t border-t-foreground/10 py-4 mt-8">
        <a
          href={PRIVACY_POLICY_URL}
          className="text-sm font-medium text-gray-700 hover:underline hover:font-bold"
          target="_blank"
          rel="noreferrer"
        >
          Privacy Policy
        </a>

        <a
          href={TERMS_OF_SERVICE_URL}
          className="text-sm font-medium text-gray-700 hover:underline hover:font-bold"
          target="_blank"
          rel="noreferrer"
        >
          Terms of Service
        </a>
      </div>
    </div>
  )
}
