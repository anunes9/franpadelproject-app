import { usePage } from '@inertiajs/react'

interface CurrentUser {
  email: string
  role: string
}

interface PageProps {
  current_user: CurrentUser
  [key: string]: unknown
}

export default function Home() {
  const { current_user } = usePage<PageProps>().props

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Signed in as {current_user.email} ({current_user.role})</p>
    </div>
  )
}
