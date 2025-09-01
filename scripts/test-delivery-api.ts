import { config } from 'dotenv'
import { getBeginnerModules, getModuleByExternalId, getAllModules } from '../src/lib/contentful/modules-delivery'

// Load environment variables
config({ path: '.env.local' })

async function testDeliveryAPI() {
  console.log('🧪 Testing Contentful Delivery API...\n')

  try {
    // Test 1: Get all modules
    console.log('📋 Test 1: Getting all modules...')
    const allModules = await getAllModules()
    console.log(`✅ Found ${allModules.length} total modules`)

    if (allModules.length > 0) {
      console.log('📝 Sample modules:')
      allModules.slice(0, 3).forEach((module, index) => {
        console.log(`  ${index + 1}. ${module.title} (${module.level}) - ${module.externalId}`)
      })
    }
    console.log()

    // Test 2: Get beginner modules
    console.log('🎯 Test 2: Getting beginner modules...')
    const beginnerModules = await getBeginnerModules()
    console.log(`✅ Found ${beginnerModules.length} beginner modules`)

    if (beginnerModules.length > 0) {
      console.log('📝 Beginner modules:')
      beginnerModules.forEach((module, index) => {
        console.log(`  ${index + 1}. ${module.title} - ${module.externalId}`)
      })
    }
    console.log()

    // Test 3: Get specific module by externalId
    if (beginnerModules.length > 0) {
      const firstModule = beginnerModules[0]
      console.log(`🔍 Test 3: Getting module with externalId: ${firstModule.externalId}...`)
      const specificModule = await getModuleByExternalId(firstModule.externalId)

      if (specificModule) {
        console.log(`✅ Found module: ${specificModule.title}`)
        console.log(`   Description: ${specificModule.description}`)
        console.log(`   Duration: ${specificModule.duration}`)
        console.log(`   Topics: ${specificModule.topics.join(', ')}`)
        console.log(`   Published: ${specificModule.isPublished}`)
      } else {
        console.log('❌ Module not found')
      }
    } else {
      console.log('⚠️  No beginner modules found, skipping specific module test')
    }

    console.log('\n🎉 All tests completed successfully!')
  } catch (error) {
    console.error('❌ Error testing Delivery API:', error)
    process.exit(1)
  }
}

// Run the test
testDeliveryAPI()
