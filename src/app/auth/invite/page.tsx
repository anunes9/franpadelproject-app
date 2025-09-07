'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function InvitePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleInvitation = async () => {
      try {
        // Get the current session to check if user is authenticated
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          setStatus('error')
          setMessage('Failed to verify invitation. Please try again.')
          return
        }

        if (session?.user) {
          // User is authenticated, redirect to password reset
          setStatus('success')
          setMessage('Invitation verified! Redirecting to set your password...')

          // Redirect to reset password page
          setTimeout(() => {
            router.push('/auth/reset-password')
          }, 2000)
        } else {
          // No session, this shouldn't happen with a valid invitation
          setStatus('error')
          setMessage('Invalid invitation link. Please contact your administrator.')
        }
      } catch (error) {
        console.error('Invitation error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleInvitation()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card border-0 shadow-2xl backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-card-foreground">Verifying Invitation</CardTitle>
            <CardDescription>Please wait while we verify your invitation...</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              {status === 'loading' && (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="text-sm text-muted-foreground">Verifying your invitation...</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <p className="text-sm text-green-600">{message}</p>
                </>
              )}

              {status === 'error' && (
                <>
                  <XCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-destructive">{message}</p>
                  <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
                  >
                    Return to Home
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
