#!/usr/bin/env tsx

import { loadEnvFile } from './env-loader'
import { getEntriesByType, initializeContentfulClient } from '../src/lib/contentful'
import { validateContentfulConfig } from '../src/lib/contentful/config'

// Load environment variables
loadEnvFile()

// Initialize Contentful client after environment variables are loaded
initializeContentfulClient()

interface MesoEntry {
  id: string
  title?: string
  description?: string
  fields: Record<string, any>
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

async function getMesoEntries() {
  try {
    // Validate configuration
    validateContentfulConfig()

    console.log('🔍 Fetching all "meso" entries from Contentful...')

    // Get all entries with content type "meso"
    const entries = await getEntriesByType('meso', 'master', 1000)

    if (entries.items.length === 0) {
      console.log('❌ No "meso" entries found in Contentful')
      return
    }

    console.log(`✅ Found ${entries.items.length} "meso" entries:`)
    console.log('')

    // Process and display each entry
    const mesoEntries: MesoEntry[] = entries.items.map((entry) => {
      const fields = entry.fields
      const title = fields.title?.['en-US'] || fields.title?.['es-ES'] || 'No title'
      const description = fields.description?.['en-US'] || fields.description?.['es-ES'] || 'No description'

      return {
        id: entry.sys.id,
        title,
        description,
        fields,
        createdAt: entry.sys.createdAt,
        updatedAt: entry.sys.updatedAt,
        publishedAt: entry.sys.publishedAt,
      }
    })

    // Display entries in a formatted way
    mesoEntries.forEach((entry, index) => {
      console.log(`📋 Entry ${index + 1}:`)
      console.log(`   ID: ${entry.id}`)
      console.log(`   Title: ${entry.title}`)
      console.log(`   Description: ${entry.description}`)
      console.log(`   Created: ${new Date(entry.createdAt).toLocaleString()}`)
      console.log(`   Updated: ${new Date(entry.updatedAt).toLocaleString()}`)
      if (entry.publishedAt) {
        console.log(`   Published: ${new Date(entry.publishedAt).toLocaleString()}`)
      }

      // Display all available fields
      console.log('   Fields:')
      Object.keys(entry.fields).forEach((fieldName) => {
        const fieldValue = entry.fields[fieldName]
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          // Handle localized fields
          const locales = Object.keys(fieldValue)
          locales.forEach((locale) => {
            console.log(`     ${fieldName} (${locale}): ${JSON.stringify(fieldValue[locale])}`)
          })
        } else {
          console.log(`     ${fieldName}: ${JSON.stringify(fieldValue)}`)
        }
      })
      console.log('')
    })

    // Summary
    console.log(`📊 Summary:`)
    console.log(`   Total entries: ${mesoEntries.length}`)
    console.log(`   Published entries: ${mesoEntries.filter((e) => e.publishedAt).length}`)
    console.log(`   Draft entries: ${mesoEntries.filter((e) => !e.publishedAt).length}`)

    // Export to JSON file if requested
    const shouldExport = process.argv.includes('--export')
    if (shouldExport) {
      const fs = await import('fs')
      const path = await import('path')

      const exportPath = path.join(process.cwd(), 'meso-entries.json')
      fs.writeFileSync(exportPath, JSON.stringify(mesoEntries, null, 2))
      console.log(`💾 Entries exported to: ${exportPath}`)
    }
  } catch (error) {
    console.error('❌ Error fetching meso entries:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  getMesoEntries()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}
