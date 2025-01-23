import { IconLogout } from "@tabler/icons-react"
import { logout } from "@/utils/supabase/actions"

export const LogoutButton = () => (
  <button
    className="flex items-center p-2 space-x-3 rounded-md hover:bg-btn-background-hover text-sm text-gray-300 lg:text-gray-800 w-full"
    onClick={logout}
  >
    <IconLogout width={24} height={24} />
    <span>Sair</span>
  </button>
)
