'use client'

import { IconLogout } from '@tabler/icons-react'
import { logout } from '@/app/auth/actions'

export const LogoutButton = () => (
  <button
    onClick={logout}
    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
  >
    <IconLogout width={16} height={16} />
    <span>Logout</span>
  </button>
)
