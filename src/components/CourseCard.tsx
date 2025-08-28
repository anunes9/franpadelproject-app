import {
  IconShield,
  IconShieldFilled,
  IconShieldHalfFilled,
} from "@tabler/icons-react"
import Image from "next/image"
import { ReactNode } from "react"
import { documentToReactComponents } from "@contentful/rich-text-react-renderer"
import Link from "next/link"
import { Document } from "@contentful/rich-text-types"

export const CourseCard = ({
  title,
  image,
  description,
  href,
}: {
  title: string
  image: string
  href: string
  description?: Document
}) => {
  const icons: { [key: string]: ReactNode } = {
    Beginner: <IconShield width={24} height={24} stroke={1.5} />,
    Intermediate: <IconShieldHalfFilled width={24} height={24} stroke={1.5} />,
    Advanced: <IconShieldFilled width={24} height={24} stroke={1.5} />,
  }
  return (
    <Link
      className="rounded-lg bg-white text-gray-700 shadow hover:shadow-2xl hover:scale-105 transition-all duration-300"
      href={href}
    >
      <Image
        src={image}
        alt={title}
        fill
        className="!relative rounded-lg shadow-md"
      />

      <div className="p-6">
        <div className="flex items-center gap-2">
          {icons[title]}
          <h2 className="block text-2xl font-bold text-projectBlue">{title}</h2>
        </div>

        {description && (
          <div className="mt-2 font-light text-gray-700">
            {documentToReactComponents(description)}
          </div>
        )}
      </div>
    </Link>
  )
}
