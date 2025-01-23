import Link from "next/link"
import { ReactNode } from "react"

export const Card = ({
  title,
  href,
  icon,
  description,
}: {
  title: string
  href: string
  description: string
  icon: ReactNode
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-[0_2px_10px] shadow-gray-900/10">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-base font-semibold leading-7 text-gray-900">
        {title}
      </h2>
    </div>

    <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>

    <Link href={href} className="mt-6 block text-sm font-medium leading-6">
      Saber mais <span aria-hidden="true">→</span>
    </Link>
  </div>
)
