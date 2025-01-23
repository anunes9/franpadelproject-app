"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

export const Item = ({
  title,
  href,
  icon,
}: {
  title: string
  href: string
  icon: ReactNode
}) => {
  const pathname = usePathname()

  return (
    <Link
      href={href}
      className={`flex items-center justify-center lg:justify-start p-2 space-x-3 rounded-md hover:bg-btn-background-hover text-sm text-gray-800 ${
        pathname === href ? "bg-btn-background" : ""
      }`}
    >
      {icon}
      <span>{title}</span>
    </Link>
  )
}
