#!/usr/bin/env tsx

/**
 * Test script for the invitation flow
 * This script helps verify that the local Supabase setup is working correctly
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  console.log('Please check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  console.log(`📍 URL: ${supabaseUrl}`)

  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      return false
    }

    console.log('✅ Supabase connection successful')
    console.log(`👤 Current session: ${data.session ? 'Authenticated' : 'Not authenticated'}`)
    return true
  } catch (err) {
    console.error('❌ Connection error:', err)
    return false
  }
}

async function testPasswordReset(email: string) {
  console.log(`\n📧 Testing password reset for: ${email}`)

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
      console.error('❌ Password reset failed:', error.message)
      return false
    }

    console.log('✅ Password reset email sent successfully')
    console.log('📬 Check Inbucket at http://localhost:54324 for the email')
    return true
  } catch (err) {
    console.error('❌ Password reset error:', err)
    return false
  }
}

async function main() {
  console.log('🚀 Testing Invitation Flow Setup\n')

  // Test connection
  const connectionOk = await testSupabaseConnection()
  if (!connectionOk) {
    console.log('\n❌ Setup test failed. Please check your Supabase configuration.')
    process.exit(1)
  }

  // Test password reset if email provided
  const email = process.argv[2]
  if (email) {
    const resetOk = await testPasswordReset(email)
    if (!resetOk) {
      console.log('\n❌ Password reset test failed.')
      process.exit(1)
    }
  } else {
    console.log('\n💡 To test password reset, run:')
    console.log('   npm run test:invitation your-email@example.com')
  }

  console.log('\n✅ All tests passed!')
  console.log('\n📋 Next steps:')
  console.log('1. Open Supabase Studio: http://localhost:54323')
  console.log('2. Go to Authentication → Users')
  console.log('3. Click "Invite User" and enter an email')
  console.log('4. Check Inbucket: http://localhost:54324')
  console.log('5. Click the reset link in the email')
  console.log('6. Set your password at: http://localhost:3000/auth/reset-password')
}

// Run the test
main().catch(console.error)
