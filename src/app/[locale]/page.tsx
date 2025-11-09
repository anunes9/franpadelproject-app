import { LoginPage } from '@/components/LoginPage'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="w-full mx-auto h-full object-cover">
          <source
            src="https://videos.ctfassets.net/rqt5vjnpqy42/3ef26Zy6GLC2xqMRKg65N6/ceaff5f51de07147756fdee533f8dfdb/FranPadelProject_teaser.mov"
            type="video/mp4"
          />
        </video>
        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-popover" />
      </div>

      {/* Login Form Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Image
            src="/fran-padel-project-logo.svg"
            alt="Padel Academy"
            width={260}
            height={200}
            className="mx-auto mb-8"
          />

          <LoginPage />
        </div>
      </div>
    </div>
  )
}

