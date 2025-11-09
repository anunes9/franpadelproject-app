'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { LocaleLink } from '@/components/LocaleLink'

export function LoginForm() {
  const t = useTranslations('auth')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        setError(error.message)
        return
      }

      // Successful login - redirect to dashboard
      router.push('/dashboard')
      router.refresh() // Refresh to update the session state
    } catch (err) {
      setError(t('unexpectedError'))
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-none bg-white">
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-card-foreground font-medium">
              {t('email')}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder={t('enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-input border-border focus:ring-2 focus:ring-accent focus:border-accent"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-card-foreground font-medium">
              {t('password')}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('enterPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-input border-border focus:ring-2 focus:ring-accent focus:border-accent"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                id="remember"
                type="checkbox"
                className="rounded border-border text-accent focus:ring-accent"
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground">
                {t('rememberMe')}
              </Label>
            </div>
            <LocaleLink
              href="/auth/forgot-password"
              className="text-sm text-accent hover:text-accent/80 transition-colors"
              prefetch={false}
            >
              {t('forgotPassword')}
            </LocaleLink>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-accent hover:cursor-pointer text-primary-foreground font-semibold py-2.5 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('signingIn')}
              </>
            ) : (
              t('signIn')
            )}
          </Button>
        </form>

        {/* <div className="relative flex justify-center text-xs uppercase border-t border-border">
          <span className="px-2 text-muted-foreground mt-[-8px] bg-white">Or continue with</span>
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            className="border-border hover:bg-muted bg-transparent hover:cursor-pointer"
            disabled={isLoading}
          >
            <IconBrandGoogleFilled className="mr-2 h-4 w-4" />
            Google
          </Button>
        </div> */}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <a href="#" className="text-accent hover:text-accent/80 font-medium transition-colors">
              {t('signUpHere')}
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
