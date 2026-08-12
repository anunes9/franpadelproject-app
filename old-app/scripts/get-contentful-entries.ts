#!/usr/bin/env tsx

import { loadEnvFile } from './env-loader'
import { getEntriesByType, getAllContentTypes, initializeContentfulClient } from '../src/lib/contentful'
import { validateContentfulConfig } from '../src/lib/contentful/config'

// Load environment variables
loadEnvFile()

// Initialize Contentful client after environment variables are loaded
initializeContentfulClient()

interface ContentfulEntry {
  id: string
  title?: string
  description?: string
  fields: Record<string, any>
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

async function getContentfulEntries() {
  try {
    // Validate configuration
    validateContentfulConfig()

    // Get command line arguments
    const args = process.argv.slice(2)
    const contentTypeId = args[0]
    const shouldExport = args.includes('--export')
    const shouldListTypes = args.includes('--list-types')
    const environmentId = args.find((arg) => arg.startsWith('--env='))?.split('=')[1] || 'master'
    const limit = parseInt(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || '100')

    if (shouldListTypes) {
      console.log('📋 Available content types:')
      const contentTypes = await getAllContentTypes(environmentId)
      contentTypes.items.forEach((contentType) => {
        console.log(`   - ${contentType.sys.id}: ${contentType.name}`)
      })
      return
    }

    if (!contentTypeId) {
      console.log('❌ Please provide a content type ID')
      console.log('Usage: npm run get-entries <contentTypeId> [options]')
      console.log('Options:')
      console.log('  --export          Export entries to JSON file')
      console.log('  --list-types      List all available content types')
      console.log('  --env=<env>       Environment ID (default: master)')
      console.log('  --limit=<number>  Maximum number of entries (default: 100)')
      console.log('')
      console.log('Examples:')
      console.log('  npm run get-entries meso')
      console.log('  npm run get-entries meso --export')
      console.log('  npm run get-entries meso --env=staging --limit=50')
      console.log('  npm run get-entries --list-types')
      return
    }

    console.log(`🔍 Fetching "${contentTypeId}" entries from Contentful...`)
    console.log(`   Environment: ${environmentId}`)
    console.log(`   Limit: ${limit}`)
    console.log('')

    // Get all entries with the specified content type
    const entries = await getEntriesByType(contentTypeId, environmentId, limit)

    if (entries.items.length === 0) {
      console.log(`❌ No "${contentTypeId}" entries found in Contentful`)
      return
    }

    console.log(`✅ Found ${entries.items.length} "${contentTypeId}" entries:`)
    console.log('')

    // Process and display each entry
    const processedEntries: ContentfulEntry[] = entries.items.map((entry) => {
      const fields = entry.fields
      const title =
        fields.title?.['en-US'] ||
        fields.title?.['es-ES'] ||
        fields.name?.['en-US'] ||
        fields.name?.['es-ES'] ||
        'No title'
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
    processedEntries.forEach((entry, index) => {
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
            const value = fieldValue[locale]
            if (typeof value === 'string' && value.length > 100) {
              console.log(`     ${fieldName} (${locale}): ${value.substring(0, 100)}...`)
            } else {
              console.log(`     ${fieldName} (${locale}): ${JSON.stringify(value)}`)
            }
          })
        } else {
          console.log(`     ${fieldName}: ${JSON.stringify(fieldValue)}`)
        }
      })
      console.log('')
    })

    // Summary
    console.log(`📊 Summary:`)
    console.log(`   Content Type: ${contentTypeId}`)
    console.log(`   Environment: ${environmentId}`)
    console.log(`   Total entries: ${processedEntries.length}`)
    console.log(`   Published entries: ${processedEntries.filter((e) => e.publishedAt).length}`)
    console.log(`   Draft entries: ${processedEntries.filter((e) => !e.publishedAt).length}`)

    // Export to JSON file if requested
    if (shouldExport) {
      const fs = await import('fs')
      const path = await import('path')

      const exportPath = path.join(process.cwd(), `${contentTypeId}-entries.json`)
      fs.writeFileSync(exportPath, JSON.stringify(processedEntries, null, 2))
      console.log(`💾 Entries exported to: ${exportPath}`)
    }
  } catch (error) {
    console.error('❌ Error fetching entries:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  getContentfulEntries()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}
