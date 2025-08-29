import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import LoginForm from '@/components/auth/LoginForm'

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect to home
  if (user) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row justify-center p-8 gap-12">
        {/* Left side - Video and Logo */}
        <div className="flex-1 max-w-2xl">
          <div className="aspect-[9/16] max-h-[80vh] mx-auto bg-gray-200 rounded-lg overflow-hidden mb-8">
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              src="https://videos.ctfassets.net/rqt5vjnpqy42/3ef26Zy6GLC2xqMRKg65N6/ceaff5f51de07147756fdee533f8dfdb/FranPadelProject_teaser.mov"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex-1 max-w-md w-full">
          <div className="bg-white rounded-lg p-8">
            <div className="text-center mb-8">
              <Image
                src="/fran-methodology-logo.png"
                alt="Fran Methodology Logo"
                width={300}
                height={300}
                className="object-contain mx-auto"
              />
            </div>

            <LoginForm />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col justify-center items-center gap-4">
            <div className="flex justify-center items-center gap-6">
              <a href="https://franpadelproject.com" target="_blank" rel="noreferrer">
                <Image alt="fran-logo" src="/fran-logo.svg" height={36} width={64} />
              </a>
              <a href="https://anunes9.github.io/me/" target="_blank" rel="noreferrer">
                <Image alt="an-logo" src="/an-logo.svg" height={48} width={48} />
              </a>

              <span className="text-gray-500 text-sm">© 2025 All rights reserved</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
