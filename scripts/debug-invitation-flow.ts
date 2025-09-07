#!/usr/bin/env tsx

/**
 * Debug script for the invitation flow
 * This script helps debug why users aren't being redirected properly
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugInvitationFlow() {
  console.log('🔍 Debugging Invitation Flow\n')
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  console.log(`🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)

  // Test 1: Check if Supabase is running
  console.log('\n1️⃣ Testing Supabase connection...')
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      return
    }
    console.log('✅ Supabase connection successful')
  } catch (err) {
    console.error('❌ Connection error:', err)
    return
  }

  // Test 2: Check current auth state
  console.log('\n2️⃣ Checking current auth state...')
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()
  if (sessionError) {
    console.error('❌ Session error:', sessionError.message)
  } else if (session) {
    console.log('✅ User is authenticated:', session.user.email)
    console.log('📧 User metadata:', session.user.user_metadata)
  } else {
    console.log('ℹ️ No active session')
  }

  // Test 3: Test password reset email
  console.log('\n3️⃣ Testing password reset email...')
  const testEmail = 'test@example.com'
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
      console.error('❌ Password reset failed:', error.message)
    } else {
      console.log('✅ Password reset email sent successfully')
      console.log('📬 Check Inbucket at http://localhost:54324 for the email')
    }
  } catch (err) {
    console.error('❌ Password reset error:', err)
  }

  // Test 4: Check configuration
  console.log('\n4️⃣ Configuration check...')
  console.log('🔗 Expected redirect URLs:')
  console.log('   - http://localhost:3000/auth/invite (main site_url)')
  console.log('   - http://localhost:3000/auth/callback')
  console.log('   - http://localhost:3000/auth/reset-password')
  console.log('   - https://localhost:3000/auth/invite')
  console.log('   - https://localhost:3000/auth/callback')
  console.log('   - https://localhost:3000/auth/reset-password')

  console.log('\n📋 Next steps for testing:')
  console.log('1. Make sure Supabase is running: supabase start')
  console.log('2. Make sure Next.js is running: npm run dev')
  console.log('3. Go to Supabase Studio: http://localhost:54323')
  console.log('4. Navigate to Authentication → Users')
  console.log('5. Click "Invite User" and enter an email')
  console.log('6. Check Inbucket: http://localhost:54324')
  console.log('7. Click the invitation link in the email')
  console.log('8. The link should redirect to /auth/invite first')
  console.log('9. Then redirect to /auth/reset-password to set password')

  console.log('\n🐛 Common issues:')
  console.log('- Make sure site_url in config.toml matches your app URL')
  console.log('- Check that additional_redirect_urls includes callback and reset-password URLs')
  console.log('- Verify that enable_confirmations = true in config.toml')
  console.log('- Check browser console for any JavaScript errors')
  console.log('- Check Supabase logs: supabase logs')
}

// Run the debug
debugInvitationFlow().catch(console.error)
