import { Footer } from '@/components/layout/Footer'
import { Item } from '@/components/layout/Item'
import { LogoutButton } from '@/components/layout/LogoutButton'
import { Navbar } from '@/components/layout/Navbar'
import { UserButton } from '@/components/layout/UserButton'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import {
  IconCalendarStats,
  IconCertificate,
  IconLogin,
  IconShield,
  IconShieldFilled,
  IconShieldHalfFilled,
} from '@tabler/icons-react'
import Image from 'next/image'
import Link from 'next/link'

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createSupabaseServerClient()
  const user = await supabase.from('users_app').select().single()

  return (
    <>
      <BetaBanner />

      <div className="flex flex-col lg:grid lg:grid-cols-[300px_minmax(0,_1fr)]">
        <div className="border-r border-r-foreground/10">
          <nav className="hidden lg:block h-[90vh]">
            <div className="py-4 flex items-center justify-center border-b border-b-foreground/10">
              <Link href="/">
                <Image src="/fran-logo.svg" alt="Fran Logo" width={120} height={48} />
              </Link>
            </div>

            <div className="flex flex-col gap-2 px-2 py-8">
              <Item
                title="The Academy"
                href="/the-academy"
                icon={<IconCalendarStats width={24} height={24} stroke={1.5} />}
              />

              <Item
                title="Beginner"
                href="/the-academy/beginner"
                icon={<IconShield width={24} height={24} stroke={1.5} />}
                subItem
              />

              <Item
                title="Intermediate"
                href="/the-academy/intermediate"
                icon={<IconShieldHalfFilled width={24} height={24} stroke={1.5} />}
                subItem
              />

              <Item
                title="Advanced"
                href="/the-academy/advanced"
                icon={<IconShieldFilled width={24} height={24} stroke={1.5} />}
                subItem
              />

              <Item
                title="Certificações"
                href="/certifications"
                icon={<IconCertificate width={24} height={24} stroke={1.5} />}
              />

              {user.data ? (
                <LogoutButton />
              ) : (
                <Item title="Entrar" href="/login" icon={<IconLogin width={24} height={24} stroke={1.5} />} />
              )}
            </div>

            {user.data && (
              <div className="border-t border-t-foreground/10 px-2 py-4">
                <UserButton user={user.data} />
              </div>
            )}

            <div className="border-t border-t-foreground/10 px-2 py-4">
              <Footer />
            </div>
          </nav>
        </div>

        <Navbar user={user?.data} />

        <div className="flex-1 lg:block">
          <div className="m-auto max-w-screen-xl animate-in p-4 md:p-8 lg:p-12">
            <main className="w-full h-full">{children}</main>
          </div>
        </div>

        <div className="block lg:hidden border-t border-t-foreground/10 px-2 py-4">
          <Footer />
        </div>
      </div>
    </>
  )
}

const BetaBanner = () => (
  <div className="sticky w-full bg-indigo-600 px-4 py-2 text-white text-center text-md top-0 font-gtExtendedMedium z-50">
    Welcome to Fran Methodology Beta App
  </div>
)
