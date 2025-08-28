import { login } from "@/utils/supabase/actions"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Image from "next/image"

export default async function LoginPage() {
  const supabase = await createClient()

  const { data } = await supabase.auth.getUser()
  if (data?.user) {
    redirect("/home")
  }

  return (
    <div className="animate-in py-24 px-4 max-w-md m-auto">
      <Image
        priority
        alt="fran-methodology"
        src="/fran-methodology-logo.png"
        width={448}
        height={448}
      />

      <form className="max-w-sm">
        <input
          id="email"
          name="email"
          type="email"
          required
          className="border-2 py-2 px-3 rounded-md mb-4 w-full"
          placeholder="Email"
        />

        <input
          id="password"
          name="password"
          type="password"
          required
          className="border-2 py-2 px-3 rounded-md w-full"
          placeholder="Password"
        />

        <button
          formAction={login}
          className="mt-6 w-full bg-projectGreen text-white py-1 rounded-md text-lg tracking-wide transition duration-1000"
        >
          Log in
        </button>
      </form>

      <div className="flex mt-8">
        <span className="block items-center text-gray-700 font-medium text-sm text-center">
          Don&apos;t have an account?
          <a
            href="https://franpadelproject.com/contact"
            className="ml-2 text-projectGreen font-semibold"
          >
            Contact us
          </a>
        </span>
      </div>
    </div>
  )
}
