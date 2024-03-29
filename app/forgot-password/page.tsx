import Link from "next/link"
import { redirect } from "next/navigation"
import { IconChevronLeft } from "@tabler/icons-react"
import FranMethodology from "@assets/fran-methodology.png"
import Image from "next/image"
import { getSession, handleResetPassword } from "@/lib/supabase/api"

export default async function Login({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const session = await getSession()
  if (session) redirect("/club")

  const resetPassword = async (formData: FormData) => {
    "use server"

    const email = formData.get("email") as string

    const error = await handleResetPassword(email)

    if (error)
      return redirect("/forgot-password?message=Could not authenticate user")
    else
      redirect(
        "/forgot-password?message=Success! Check you email for recovery link."
      )
  }

  return (
    <div className="w-screen">
      <div className="flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 m-auto">
        <Link
          href="/login"
          className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
        >
          <IconChevronLeft height={18} />
          Back
        </Link>

        <form
          className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground pt-12 sm:pt-24"
          action={resetPassword}
        >
          <Image
            alt="fran-methodology"
            src={FranMethodology}
            layout="responsive"
            width={448}
            height={448}
          />

          <label className="text-md" htmlFor="email">
            Email
          </label>

          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="email"
            placeholder="you@example.com"
            required
          />

          <button className="bg-green-300 rounded-md px-4 py-2 text-foreground mb-2">
            Recover Password
          </button>

          {searchParams?.message && (
            <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
              {searchParams.message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
