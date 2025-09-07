'use server'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  // type-cast since FormData values are strings
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  redirect('/dashboard')
}

export async function sendOTP(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error('OTP send error:', error)
    redirect('/error')
  }

  redirect('/?sent=true')
}

export async function verifyOTP(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const data = {
    email: formData.get('email') as string,
    token: formData.get('token') as string,
  }

  const { error } = await supabase.auth.verifyOtp({
    email: data.email,
    token: data.token,
    type: 'email',
  })

  if (error) {
    console.error('OTP verification error:', error)
    redirect('/error')
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
    redirect('/error')
  }

  redirect('/')
}
