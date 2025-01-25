import { documentToReactComponents } from "@contentful/rich-text-react-renderer"
import { Document } from "@contentful/rich-text-types"
import { IconPlus } from "@tabler/icons-react"
import Link from "next/link"
import { ReactNode } from "react"

export const Card = ({
  title,
  href,
  icon,
  descriptionJSON,
  description,
  concept,
}: {
  title: string
  href: string
  icon: ReactNode
  concept?: string
  description?: string
  descriptionJSON?: Document
}) => (
  <Link
    className="rounded-lg bg-white p-6 shadow hover:shadow-2xl hover:scale-105 transition-all duration-300"
    href={href}
  >
    <div>
      <div className="flex gap-2">
        {icon}
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      <h2 className="text-lg font-bold mt-2 text-gray-900">{concept}</h2>
    </div>

    <div className="mt-6">
      {descriptionJSON && documentToReactComponents(descriptionJSON)}
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>

    <div className="flex items-center gap-2 w-fit mt-6 p-2 space-x-3 rounded-md bg-btn-background hover:bg-btn-background-hover text-sm text-gray-800">
      Saber mais <IconPlus height={16} width={16} stroke={2} />
    </div>
  </Link>
)
