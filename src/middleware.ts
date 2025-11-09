import { updateSession } from '@/utils/supabase/middleware'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // Get the pathname first
  const path = request.nextUrl.pathname

  // Extract locale from path (e.g., /en/dashboard -> /dashboard)
  const localeMatch = path.match(/^\/(en|pt)(\/|$)/)
  const locale = localeMatch ? localeMatch[1] : 'en'
  const pathWithoutLocale = localeMatch ? path.replace(`/${locale}`, '') || '/' : path

  // Public routes that don't require authentication (without locale prefix)
  const publicRoutes = [
    '/',
    '/auth/callback',
    '/auth/confirm',
    '/auth/reset-password',
    '/auth/invite',
    '/auth/forgot-password',
    '/auth/verify',
  ]

  // Handle next-intl locale routing
  const intlResponse = intlMiddleware(request)

  // If intl middleware is redirecting, return it immediately
  // Check for redirect status codes (301, 302, 307, 308)
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    const redirectUrl = intlResponse.headers.get('location')
    if (redirectUrl) {
      try {
        const redirectPath = new URL(redirectUrl, request.url).pathname
        const currentPath = request.nextUrl.pathname

        // Prevent redirect loops - if redirecting to the same path (ignoring trailing slash), don't redirect
        if (
          redirectPath === currentPath ||
          redirectPath === `${currentPath}/` ||
          redirectPath === currentPath.slice(0, -1)
        ) {
          // It's a redirect loop, return a normal response instead
          return NextResponse.next({ request })
        }
      } catch {
        // If URL parsing fails, just return the redirect
      }
    }
    return intlResponse
  }

  // Use intlResponse as the base response, or create a new one if needed
  const response = intlResponse || NextResponse.next({ request })

  // If it's a public route, update session but allow access
  if (publicRoutes.includes(pathWithoutLocale)) {
    // Still update Supabase session for public routes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    await supabase.auth.getUser()
    return response
  }

  // For protected routes, check authentication
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Update session and check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not authenticated and trying to access protected route, redirect to landing page with locale
  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
