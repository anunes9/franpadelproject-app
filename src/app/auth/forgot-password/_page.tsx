import { Suspense } from 'react'
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
