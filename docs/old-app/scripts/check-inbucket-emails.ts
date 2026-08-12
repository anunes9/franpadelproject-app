#!/usr/bin/env tsx

/**
 * Script to check if Inbucket is running and accessible
 * This helps debug why emails aren't appearing in Inbucket
 */

async function checkInbucket() {
  const inbucketUrl = 'http://127.0.0.1:54324'

  console.log('🔍 Checking Inbucket status...\n')
  console.log(`📍 Inbucket URL: ${inbucketUrl}\n`)

  try {
    // Try to fetch Inbucket API to check if it's running
    const response = await fetch(`${inbucketUrl}/api/v1/mailbox`, {
      method: 'GET',
    })

    if (response.ok) {
      const mailboxes = await response.json()
      console.log('✅ Inbucket is running and accessible\n')

      if (mailboxes && mailboxes.length > 0) {
        console.log(`📧 Found ${mailboxes.length} mailbox(es):\n`)
        mailboxes.forEach((mailbox: string) => {
          console.log(`   - ${mailbox}`)
        })
        console.log('\n💡 Tip: Open Inbucket in your browser to view emails:')
        console.log(`   ${inbucketUrl}\n`)
      } else {
        console.log('📭 No mailboxes found (no emails received yet)\n')
        console.log("💡 Common reasons emails don't appear:")
        console.log("   1. User doesn't exist in Supabase Auth")
        console.log('   2. OTP request failed (check browser console)')
        console.log('   3. Email confirmation is required but not done\n')
      }
    } else {
      console.log(`❌ Inbucket returned status: ${response.status}`)
      console.log('   Make sure Supabase is running: supabase start\n')
    }
  } catch (error) {
    console.error('❌ Could not connect to Inbucket:', error)
    console.log('\n💡 Troubleshooting:')
    console.log('   1. Make sure Supabase is running: supabase start')
    console.log('   2. Check if Inbucket is enabled in supabase/config.toml')
    console.log('   3. Verify Inbucket port (default: 54324)')
    console.log(`   4. Try opening Inbucket manually: ${inbucketUrl}\n`)
  }
}

checkInbucket()


