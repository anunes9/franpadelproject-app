import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source
            src="/placeholder.mp4?height=1920&width=1080&query=dynamic padel gameplay vertical video with players in action on court"
            type="video/mp4"
          />
        </video>
        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-popover" />
      </div>

      {/* Login Form Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Padel Academy</h1>
            <p className="text-white/80 text-lg">{'Join the game, elevate your play'}</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
