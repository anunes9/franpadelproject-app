#!/usr/bin/env tsx

import { loadEnvFile } from './env-loader'
import { createEntry } from '../src/lib/contentful/entries'
import { initializeContentfulClient } from '../src/lib/contentful/client'
import { validateContentfulConfig } from '../src/lib/contentful/config'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
loadEnvFile()

// Initialize Contentful client after environment variables are loaded
initializeContentfulClient()

interface BeginnerModule {
  externalId: string
  title: {
    pt: string
    'en-US': string
  }
  topics: {
    pt: string[]
    'en-US': string[]
  }
  description: {
    pt: string
    'en-US': string
  }
  content: string
  level: string
  duration: {
    pt: string
    'en-US': string
  }
}

async function createModulesContent() {
  try {
    // Validate configuration
    validateContentfulConfig()

    // Get command line arguments
    const args = process.argv.slice(2)
    const environmentId = args.find((arg) => arg.startsWith('--env='))?.split('=')[1] || 'master'
    const dryRun = args.includes('--dry-run')

    console.log('📚 Creating Modules content from beginner.json...')
    console.log(`   Environment: ${environmentId}`)
    console.log(`   Dry run: ${dryRun}`)
    console.log('')

    // Read the beginner.json file
    const beginnerDataPath = join(process.cwd(), 'docs', 'beginner.json')
    const beginnerData = JSON.parse(readFileSync(beginnerDataPath, 'utf8')) as BeginnerModule[]

    console.log(`📖 Found ${beginnerData.length} modules in beginner.json`)
    console.log('')

    // Process each module
    for (let i = 0; i < beginnerData.length; i++) {
      const module = beginnerData[i]
      const externalId = module.externalId

      console.log(`🔄 Processing module ${i + 1}/${beginnerData.length}: ${module.title.pt}`)

      // Prepare fields for Contentful
      const fields = {
        title: {
          pt: module.title.pt,
          'en-US': module.title['en-US'],
        },
        externalId: {
          'en-US': externalId,
        },
        description: {
          pt: module.description.pt,
          'en-US': module.description['en-US'],
        },
        topics: {
          pt: module.topics.pt,
          'en-US': module.topics['en-US'],
        },
        duration: {
          pt: module.duration.pt,
          'en-US': module.duration['en-US'],
        },
        level: {
          'en-US': module.level,
        },
      }

      if (dryRun) {
        console.log(`   📝 Would create entry with external ID: ${externalId}`)
        console.log(`   📋 Fields:`, JSON.stringify(fields, null, 2))
        console.log('')
      } else {
        try {
          // Create the entry in Contentful
          const entry = await createEntry('modules', fields, environmentId)
          console.log(`   ✅ Created entry: ${entry.sys.id}`)
          console.log(`   🔗 Published: ${entry.isPublished()}`)
          console.log('')
        } catch (error) {
          console.error(`   ❌ Error creating entry for ${externalId}:`, error)
          console.log('')
        }
      }
    }

    if (dryRun) {
      console.log('🎭 Dry run completed. No entries were actually created.')
    } else {
      console.log('🎉 All modules have been created successfully!')
    }
  } catch (error) {
    console.error('❌ Error creating modules content:', error)
    process.exit(1)
  }
}

// Run the script
createModulesContent()
