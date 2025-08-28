"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

export const Item = ({
  title,
  href,
  icon,
  subItem,
}: {
  title: string
  href: string
  icon: ReactNode
  subItem?: boolean
}) => {
  const pathname = usePathname()

  return (
    <Link
      href={href}
      className={`flex items-center justify-start p-2 space-x-3 rounded-md hover:bg-btn-background-hover text-sm text-gray-800 ${
        pathname.includes(href) ? "bg-btn-background" : ""
      } ${subItem ? "ml-8" : ""}`}
    >
      {icon}
      <span>{title}</span>
    </Link>
  )
}
