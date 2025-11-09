'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { LocaleLink } from '@/components/LocaleLink'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const router = useRouter()
  const { signInWithOTP, verifyOTP } = useAuth()
  const t = useTranslations('auth')

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await signInWithOTP(email)

      if (error) {
        // User not found error - "Signups not allowed for otp"
        setError(t('userNotFound') || 'User not found. Contact our team to create an account.')
        return
      }

      setSuccess(t('checkEmailForCode') || 'Check your email for the verification code!')
      setStep('otp')
    } catch (err) {
      setError(t('unexpectedError'))
      console.error('OTP send error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await verifyOTP(email, otp)

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      // Wait a bit for the session to be established
      // Then redirect to dashboard with locale prefix
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 500)
    } catch (err) {
      setError(t('unexpectedError'))
      console.error('OTP verification error:', err)
      setIsLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp('')
    setError(null)
    setSuccess(null)
  }

  return (
    <Card className="border-0 shadow-none bg-white">
      <CardContent className="space-y-4">
        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="space-y-4 mb-8">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
            )}

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

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-accent hover:cursor-pointer text-primary-foreground font-semibold py-2.5 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('sendingCode') || 'Sending Code...'}
                </>
              ) : (
                t('sendVerificationCode') || 'Send Code'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-card-foreground mb-2">
                {t('enterVerificationCode') || 'Enter Verification Code'}
              </h2>
              <p className="text-muted-foreground">
                {t('codeSentTo') || 'We sent a 6-digit code to'} <strong>{email}</strong>
              </p>
            </div>

            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                {success}
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp" className="text-card-foreground font-medium">
                {t('verificationCode') || 'Verification Code'}
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder={t('enterSixDigitCode') || 'Enter 6-digit code'}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg tracking-widest bg-input border-border focus:ring-2 focus:ring-accent focus:border-accent"
                required
                disabled={isLoading}
                maxLength={6}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToEmail}
                className="flex-1 border-border hover:bg-muted bg-transparent hover:cursor-pointer"
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('back') || 'Back'}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-accent hover:cursor-pointer text-primary-foreground font-semibold py-2.5 transition-colors"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('verifying') || 'Verifying...'}
                  </>
                ) : (
                  t('verifyCode') || 'Verify Code'
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <LocaleLink href="#" className="text-accent hover:text-accent/80 font-medium transition-colors">
              {t('signUpHere')}
            </LocaleLink>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
