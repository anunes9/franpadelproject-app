"use client"

import { useEffect, useState } from "react"
import { IconEdit } from "@tabler/icons-react"
import { updateUser } from "@/utils/supabase/actions"
import { useRouter } from "next/navigation"

export const NameField = ({ name }: { name: string }) => {
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState("")
  const [localName, setName] = useState(name as string)
  const router = useRouter()

  useEffect(() => {
    setError("")
  }, [localName])

  const handleUpdateName = async () => {
    if (localName?.length === 0) {
      setError("Name is required")
      return
    }
    const requestOK = await updateUser(localName)
    if (requestOK) {
      setEditMode(false)
      setError("")
      router.refresh()
    } else {
      setName(name)
      setEditMode(false)
      setError("Something went wrong updating the name")
    }
  }

  const handleCancel = () => {
    setName(name)
    setEditMode(false)
    setError("")
  }

  if (editMode)
    return (
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Name"
          className="py-2 px-4 rounded-lg border border-gray-300 w-full bg-slate-100"
          value={localName}
          required
          onChange={(event) => setName(event.target.value)}
        />

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex justify-end gap-4">
          <button
            className="py-2 px-4 rounded-lg text-white bg-gray-400 hover:bg-gray-400/80"
            onClick={handleCancel}
          >
            Cancel
          </button>

          <button
            className="py-2 px-4 rounded-lg text-white bg-projectGreen hover:bg-projectGreen/80"
            onClick={handleUpdateName}
          >
            Update
          </button>
        </div>
      </div>
    )

  return (
    <div className="text-gray-700 flex gap-4 items-center">
      {name}

      <div
        onClick={() => setEditMode(!editMode)}
        className="cursor-pointer hover:bg-foreground/10 p-1 rounded-md"
      >
        <IconEdit height={18} />
      </div>
    </div>
  )
}
