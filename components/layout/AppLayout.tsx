import { Footer } from "@/components/layout/Footer"
import { Item } from "@/components/layout/Item"
import { LogoutButton } from "@/components/layout/LogoutButton"
import { UserButton } from "@/components/layout/UserButton"
import { createClient } from "@/utils/supabase/server"
import { IconCalendarStats, IconFiles } from "@tabler/icons-react"
import Image from "next/image"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()

  const user = await supabase.from("users_app").select().single()

  if (user.data)
    return (
      <>
        <BetaBanner />

        <div className="flex flex-col lg:grid lg:grid-cols-[300px_minmax(0,_1fr)]">
          <div className="border-r border-r-foreground/10">
            <nav className="hidden lg:block h-[90vh]">
              <div className="py-4 flex items-center justify-center border-b border-b-foreground/10">
                <Image
                  src="/fran-logo.svg"
                  alt="Fran Logo"
                  width={120}
                  height={48}
                />
              </div>

              <div className="flex flex-col gap-2 px-2 py-8">
                <Item
                  title="The Academy"
                  href="/the-academy"
                  icon={
                    <IconCalendarStats width={24} height={24} stroke={1.5} />
                  }
                />

                <Item
                  title="Certification"
                  href="/certification"
                  icon={<IconFiles width={24} height={24} stroke={1.5} />}
                />

                <LogoutButton />
              </div>

              <div className="border-t border-t-foreground/10 px-2 py-4">
                <UserButton user={user.data} />
              </div>

              <div className="border-t border-t-foreground/10 px-2 py-4">
                <Footer />
              </div>
            </nav>
          </div>

          <div className="flex-1 lg:block">
            <div className="m-auto max-w-screen-xl animate-in p-4 md:p-8 lg:p-12">
              <main className="w-full h-full">{children}</main>
            </div>
          </div>
        </div>
      </>
    )

  return <>{children}</>
}

const BetaBanner = () => (
  <div className="sticky w-full bg-indigo-600 px-4 py-2 text-white text-center text-md top-0 font-gtExtendedMedium z-50">
    Fran Methodology App Beta!
  </div>
)
