#!/usr/bin/env tsx

import { loadEnvFile } from './env-loader'
import { getEntriesByType, updateEntry, getEntry, initializeContentfulClient } from '../src/lib/contentful'
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
  content: {
    pt?: string
    'en-US'?: string
  }
  level: string
  duration: {
    pt: string
    'en-US': string
  }
}

interface ContentfulModuleEntry {
  sys: {
    id: string
    version: number
  }
  fields: {
    externalId?: {
      'en-US': string
    }
    title?: {
      pt?: string
      'en-US'?: string
    }
    content?: {
      pt?: string
      'en-US'?: string
    }
    [key: string]: any
  }
}

async function updateModuleContent() {
  try {
    // Validate configuration
    validateContentfulConfig()

    // Get command line arguments
    const args = process.argv.slice(2)
    const environmentId = args.find((arg) => arg.startsWith('--env='))?.split('=')[1] || 'master'
    const dryRun = args.includes('--dry-run')
    const forceUpdate = args.includes('--force')

    console.log('🔄 Updating Module content field from beginner.json...')
    console.log(`   Environment: ${environmentId}`)
    console.log(`   Dry run: ${dryRun}`)
    console.log(`   Force update: ${forceUpdate}`)
    console.log('')

    // Read the beginner.json file
    const beginnerDataPath = join(process.cwd(), 'docs', 'beginner.json')
    const beginnerData = JSON.parse(readFileSync(beginnerDataPath, 'utf8')) as BeginnerModule[]

    console.log(`📖 Found ${beginnerData.length} modules in beginner.json`)
    console.log('')

    // Get all existing Module entries from Contentful
    console.log('🔍 Fetching existing Module entries from Contentful...')
    const existingEntries = await getEntriesByType('modules', environmentId, 1000)

    if (existingEntries.items.length === 0) {
      console.log('❌ No Module entries found in Contentful')
      return
    }

    console.log(`✅ Found ${existingEntries.items.length} Module entries in Contentful`)
    console.log('')

    // Create a map of externalId to beginner data for quick lookup
    const beginnerDataMap = new Map<string, BeginnerModule>()
    beginnerData.forEach((module) => {
      beginnerDataMap.set(module.externalId, module)
    })

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    // Process each existing entry
    for (const entry of existingEntries.items) {
      const moduleEntry = entry as ContentfulModuleEntry
      const externalId = moduleEntry.fields.externalId?.['en-US']

      if (!externalId) {
        console.log(`⚠️  Entry ${moduleEntry.sys.id} has no externalId, skipping...`)
        skippedCount++
        continue
      }

      const beginnerModule = beginnerDataMap.get(externalId)
      if (!beginnerModule) {
        console.log(`⚠️  No matching beginner data found for externalId: ${externalId}`)
        skippedCount++
        continue
      }

      // Validate that the beginner module has content
      if (!beginnerModule.content.pt && !beginnerModule.content['en-US']) {
        console.log(`⚠️  Entry ${externalId} (${moduleEntry.sys.id}) has no content in beginner data, skipping...`)
        skippedCount++
        continue
      }

      const currentContent = moduleEntry.fields.content
      const newContent = {
        pt: beginnerModule.content.pt || '',
        'en-US': beginnerModule.content['en-US'] || '',
      }

      // Check if content needs updating
      const needsUpdate =
        forceUpdate ||
        !currentContent ||
        !currentContent.pt ||
        !currentContent['en-US'] ||
        currentContent.pt !== newContent.pt ||
        currentContent['en-US'] !== newContent['en-US']

      if (!needsUpdate) {
        console.log(`⏭️  Entry ${externalId} (${moduleEntry.sys.id}) already has updated content, skipping...`)
        skippedCount++
        continue
      }

      console.log(`🔄 Updating entry ${externalId} (${moduleEntry.sys.id})...`)
      console.log(`   Current content: ${currentContent ? 'exists' : 'missing'}`)
      console.log(`   New content structure: bilingual object`)

      if (dryRun) {
        console.log(`   📝 Would update content field with:`)
        if (newContent.pt) {
          console.log(`      PT: ${newContent.pt.substring(0, 100)}...`)
        } else {
          console.log(`      PT: (empty)`)
        }
        if (newContent['en-US']) {
          console.log(`      EN: ${newContent['en-US'].substring(0, 100)}...`)
        } else {
          console.log(`      EN: (empty)`)
        }
        console.log('')
      } else {
        try {
          // Update the entry with new content
          const updatedEntry = await updateEntry(moduleEntry.sys.id, { content: newContent }, environmentId)

          console.log(`   ✅ Successfully updated entry`)
          console.log(`   🔗 Published: ${updatedEntry.isPublished()}`)
          console.log(`   📝 Version: ${updatedEntry.sys.version}`)
          console.log('')

          updatedCount++
        } catch (error: any) {
          if (error.status === 409) {
            console.log(`   ⚠️  Version mismatch detected, retrying with latest version...`)
            try {
              // Fetch the latest version and retry
              const latestEntry = await getEntry(moduleEntry.sys.id, environmentId)
              const retryUpdatedEntry = await updateEntry(latestEntry.sys.id, { content: newContent }, environmentId)

              console.log(`   ✅ Successfully updated entry on retry`)
              console.log(`   🔗 Published: ${retryUpdatedEntry.isPublished()}`)
              console.log(`   📝 Version: ${retryUpdatedEntry.sys.version}`)
              console.log('')

              updatedCount++
            } catch (retryError) {
              console.error(`   ❌ Error updating entry ${externalId} on retry:`, retryError)
              console.log('')
              errorCount++
            }
          } else {
            console.error(`   ❌ Error updating entry ${externalId}:`, error)
            console.log('')
            errorCount++
          }
        }
      }
    }

    // Summary
    console.log('📊 Update Summary:')
    console.log(`   Total entries found: ${existingEntries.items.length}`)
    console.log(`   Entries updated: ${updatedCount}`)
    console.log(`   Entries skipped: ${skippedCount}`)
    console.log(`   Errors: ${errorCount}`)

    if (dryRun) {
      console.log('\n🎭 Dry run completed. No entries were actually updated.')
      console.log('   Run without --dry-run to perform actual updates.')
    } else if (updatedCount > 0) {
      console.log('\n🎉 Module content has been successfully updated!')
    } else {
      console.log('\nℹ️  No updates were necessary.')
    }
  } catch (error) {
    console.error('❌ Error updating module content:', error)
    process.exit(1)
  }
}

// Run the script
updateModuleContent()
