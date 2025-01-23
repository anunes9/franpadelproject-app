"use client"

import { Item } from "@/components/layout/Item"
import { LogoutButton } from "@/components/layout/LogoutButton"
import { UserCircle } from "@/components/layout/UserButton"
import {
  IconCalendarStats,
  IconFiles,
  IconLogin,
  IconMenu,
} from "@tabler/icons-react"
import Image from "next/image"
import { useState } from "react"

export const Navbar = ({
  user,
}: {
  user: { name: string; avatar_url: string }
}) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="block lg:hidden">
      <div className="py-4 px-4 grid grid-cols-3 border-b border-b-foreground/10">
        <button onClick={() => setOpen(!open)}>
          <IconMenu width={24} height={24} stroke={1.5} />
        </button>

        <Image
          src="/fran-logo.svg"
          alt="Fran Logo"
          width={120}
          height={48}
          className="mx-auto"
        />

        {user && <UserCircle user={user} />}
      </div>

      <div
        className={`${
          open ? "flex" : "hidden"
        } border-b border-b-foreground/10 flex-col gap-2 p-2`}
      >
        <Item
          title="The Academy"
          href="/the-academy"
          icon={<IconCalendarStats width={24} height={24} stroke={1.5} />}
        />

        <Item
          title="Certification"
          href="/certification"
          icon={<IconFiles width={24} height={24} stroke={1.5} />}
        />

        {user ? (
          <LogoutButton />
        ) : (
          <Item
            title="Entrar"
            href="/login"
            icon={<IconLogin width={24} height={24} stroke={1.5} />}
          />
        )}
      </div>
    </div>
  )
}
