#!/usr/bin/env tsx

import { loadEnvFile } from './env-loader'
import { initializeContentfulClient, getSpace } from '../src/lib/contentful'

async function testContentfulConnection() {
  try {
    console.log('🧪 Testing Contentful connection...')

    // Load environment variables
    loadEnvFile()

    // Initialize client
    initializeContentfulClient()

    console.log('✅ Client initialized successfully')

    // Test getting space
    console.log('🔍 Testing space access...')
    const space = await getSpace()

    console.log('✅ Successfully connected to Contentful!')
    console.log(`📋 Space ID: ${space.sys.id}`)
    console.log(`📋 Space Name: ${space.name}`)
    console.log(`📋 Space Type: ${space.sys.type}`)

    // Test getting environments
    console.log('🔍 Testing environment access...')
    const environments = await space.getEnvironments()

    console.log(`✅ Found ${environments.items.length} environments:`)
    environments.items.forEach((env) => {
      console.log(`   - ${env.sys.id}: ${env.name}`)
    })

    // Test getting content types
    console.log('🔍 Testing content types access...')
    const environment = await space.getEnvironment('master')
    const contentTypes = await environment.getContentTypes()

    console.log(`✅ Found ${contentTypes.items.length} content types:`)
    contentTypes.items.forEach((contentType) => {
      console.log(`   - ${contentType.sys.id}: ${contentType.name}`)
    })

    console.log('🎉 All tests passed! Your Contentful connection is working correctly.')
  } catch (error) {
    console.error('❌ Connection test failed:', error)

    if (error.message?.includes('AccessTokenInvalid')) {
      console.log('\n🔧 Troubleshooting:')
      console.log('1. Check if your CONTENTFUL_CONTENT_MANAGER token is correct')
      console.log('2. Make sure the token has the necessary permissions')
      console.log("3. Verify the token hasn't expired")
      console.log("4. Ensure you're using the Management API token, not the Delivery API token")
    }

    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  testContentfulConnection()
    .then(() => {
      console.log('✅ Test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}
