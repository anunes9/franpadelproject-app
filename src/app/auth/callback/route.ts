import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'
  const type = searchParams.get('type')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Check if this is a password reset/invitation flow
      // If the user doesn't have a password set (invited user), redirect to reset password
      if (type === 'recovery' || type === 'invite' || !data.session.user.user_metadata?.password_set) {
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalhost = process.env.NODE_ENV === 'development'
        const resetUrl = isLocalhost
          ? `${origin}/auth/reset-password?access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}`
          : `https://${forwardedHost}/auth/reset-password?access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}`
        return NextResponse.redirect(resetUrl)
      }

      // Normal login flow - redirect to intended destination
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalhost = process.env.NODE_ENV === 'development'
      const redirectUrl = isLocalhost ? `${origin}${next}` : `https://${forwardedHost}${next}`
      return NextResponse.redirect(redirectUrl)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/error`)
}
