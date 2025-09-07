'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

export default function TestInvitationPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { resetPassword } = useAuth()

  const handleTestResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await resetPassword(email)

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Password reset email sent! Check your email for the reset link.')
      }
    } catch (err) {
      setMessage('An unexpected error occurred.')
      console.error('Test error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card border-0 shadow-2xl backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-card-foreground">Test Password Reset</CardTitle>
            <CardDescription>This page helps test the password reset flow for invited users</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleTestResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email to test reset"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input border-border focus:ring-2 focus:ring-accent focus:border-accent"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-2.5 transition-colors"
                disabled={isLoading || !email}
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </Button>
            </form>

            {message && (
              <div
                className={`mt-4 p-3 text-sm rounded-md ${
                  message.includes('Error')
                    ? 'text-destructive bg-destructive/10 border border-destructive/20'
                    : 'text-green-600 bg-green-50 border border-green-200'
                }`}
              >
                {message}
              </div>
            )}

            <div className="mt-6 p-4 bg-muted rounded-md">
              <h3 className="font-medium text-sm mb-2">How to test the invitation flow:</h3>
              <ol className="text-xs text-muted-foreground space-y-1">
                <li>1. Go to Supabase Admin Dashboard</li>
                <li>2. Navigate to Authentication → Users</li>
                <li>3. Click "Invite User" and enter an email</li>
                <li>4. The user will receive an invitation email</li>
                <li>5. When they click the link, they'll be redirected to /auth/reset-password</li>
                <li>6. They can then set their password and complete the flow</li>
              </ol>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="font-medium text-sm mb-2">Test Forgot Password Flow:</h3>
              <p className="text-xs text-muted-foreground mb-2">For existing users who forgot their password:</p>
              <Button
                onClick={() => window.open('/auth/forgot-password', '_blank')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Open Forgot Password Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
