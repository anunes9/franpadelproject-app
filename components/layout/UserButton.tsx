import { IconUserCircle } from "@tabler/icons-react"
import Link from "next/link"
import Image from "next/image"

export const UserButton = async ({
  user,
}: {
  user: { name: string; avatar_url: string }
}) => (
  <Link
    className="flex items-center p-2 space-x-4 hover:cursor-pointer hover:bg-btn-background-hover/50 rounded-md"
    href="/profile"
  >
    <div className="rounded-lg bg-gray-200 stroke-gray-500 w-9 h-9 flex justify-center items-center">
      {user.avatar_url ? (
        <Image
          src={user.avatar_url}
          alt="avatar"
          className="!relative w-9 h-9 rounded-sm object-cover"
          fill
        />
      ) : (
        <IconUserCircle
          width={28}
          height={28}
          stroke={1.2}
          className="stroke-gray-600"
        />
      )}
    </div>

    <div>
      <h2 className="text-md font-semibold">{user.name}</h2>
      <span className="flex items-center space-x-1">
        <span className="text-xs hover:underline text-gray-600">
          Definições
        </span>
      </span>
    </div>
  </Link>
)
