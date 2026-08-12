#!/usr/bin/env tsx

import { loadEnvFile } from './env-loader'
import { getEntriesByType, initializeContentfulClient } from '../src/lib/contentful'
import { validateContentfulConfig } from '../src/lib/contentful/config'
import fs from 'fs'
import path from 'path'

// Rich text to markdown converter
function richTextToMarkdown(richText: any): string {
  if (!richText || !richText.content) {
    return ''
  }

  let markdown = ''

  richText.content.forEach((node: any) => {
    switch (node.nodeType) {
      case 'paragraph':
        markdown += processTextContent(node.content) + '\n\n'
        break
      case 'heading-1':
        markdown += '# ' + processTextContent(node.content) + '\n\n'
        break
      case 'heading-2':
        markdown += '## ' + processTextContent(node.content) + '\n\n'
        break
      case 'heading-3':
        markdown += '### ' + processTextContent(node.content) + '\n\n'
        break
      case 'heading-4':
        markdown += '#### ' + processTextContent(node.content) + '\n\n'
        break
      case 'heading-5':
        markdown += '##### ' + processTextContent(node.content) + '\n\n'
        break
      case 'heading-6':
        markdown += '###### ' + processTextContent(node.content) + '\n\n'
        break
      case 'unordered-list':
        node.content.forEach((listItem: any) => {
          markdown += '- ' + processTextContent(listItem.content) + '\n'
        })
        markdown += '\n'
        break
      case 'ordered-list':
        node.content.forEach((listItem: any, index: number) => {
          markdown += `${index + 1}. ` + processTextContent(listItem.content) + '\n'
        })
        markdown += '\n'
        break
      case 'blockquote':
        markdown += '> ' + processTextContent(node.content) + '\n\n'
        break
      case 'hr':
        markdown += '---\n\n'
        break
      case 'embedded-asset-block':
        if (node.data?.target?.sys?.id) {
          markdown += `![Asset ${node.data.target.sys.id}]\n\n`
        }
        break
      default:
        if (node.content) {
          markdown += processTextContent(node.content)
        }
    }
  })

  return markdown.trim()
}

function processTextContent(content: any[]): string {
  if (!content) return ''

  let text = ''
  content.forEach((node: any) => {
    if (node.nodeType === 'text') {
      let nodeText = node.value || ''

      // Apply marks (formatting)
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              nodeText = `**${nodeText}**`
              break
            case 'italic':
              nodeText = `*${nodeText}*`
              break
            case 'underline':
              nodeText = `__${nodeText}__`
              break
            case 'code':
              nodeText = `\`${nodeText}\``
              break
          }
        })
      }

      text += nodeText
    } else if (node.content) {
      text += processTextContent(node.content)
    }
  })

  return text
}

// Load environment variables
loadEnvFile()

// Initialize Contentful client after environment variables are loaded
initializeContentfulClient()

interface MesoEntry {
  id: string
  title?: string
  description?: string
  descriptionMarkdown?: string
  content?: any
  contentMarkdown?: string
  level?: string
  fields: Record<string, any>
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

async function getBeginnerMesoEntries() {
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

    console.log(`✅ Found ${entries.items.length} total "meso" entries`)
    console.log('')

    // Process and filter entries by level = "Beginner"
    const allMesoEntries: MesoEntry[] = entries.items.map((entry) => {
      const fields = entry.fields
      const title = fields.title?.['en-US'] || fields.title?.['es-ES'] || 'No title'
      const description = fields.description?.['en-US'] || fields.description?.['es-ES'] || 'No description'
      const content = fields.content?.['en-US'] || fields.content?.['es-ES'] || null
      const level = fields.level?.['en-US'] || fields.level?.['es-ES'] || 'No level'

      return {
        id: entry.sys.id,
        title,
        description,
        descriptionMarkdown: typeof description === 'object' ? richTextToMarkdown(description) : description,
        content,
        contentMarkdown: content ? richTextToMarkdown(content) : undefined,
        level,
        fields,
        createdAt: entry.sys.createdAt,
        updatedAt: entry.sys.updatedAt,
        publishedAt: entry.sys.publishedAt,
      }
    })

    // Filter entries by level = "Beginner"
    const beginnerEntries = allMesoEntries.filter((entry) => {
      const level = entry.level?.toLowerCase()
      return level === 'beginner'
    })

    console.log(`🎯 Found ${beginnerEntries.length} entries with level = "Beginner":`)
    console.log('')

    // Display beginner entries in a formatted way
    beginnerEntries.forEach((entry, index) => {
      console.log(`📋 Beginner Entry ${index + 1}:`)
      console.log(`   ID: ${entry.id}`)
      console.log(`   Title: ${entry.title}`)
      console.log(`   Description: ${entry.description}`)
      console.log(`   Level: ${entry.level}`)
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
    console.log(`   Total meso entries: ${allMesoEntries.length}`)
    console.log(`   Beginner entries: ${beginnerEntries.length}`)
    console.log(`   Other levels: ${allMesoEntries.length - beginnerEntries.length}`)
    console.log(`   Published beginner entries: ${beginnerEntries.filter((e) => e.publishedAt).length}`)
    console.log(`   Draft beginner entries: ${beginnerEntries.filter((e) => !e.publishedAt).length}`)

    // Always export to JSON file
    const exportPath = path.join(process.cwd(), 'beginner-meso-entries.json')
    fs.writeFileSync(exportPath, JSON.stringify(beginnerEntries, null, 2))
    console.log(`💾 Beginner entries exported to: ${exportPath}`)

    // Also export a summary file with just the essential info
    const summaryData = beginnerEntries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      descriptionMarkdown: entry.descriptionMarkdown,
      contentMarkdown: entry.contentMarkdown,
      level: entry.level,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      publishedAt: entry.publishedAt,
      isPublished: !!entry.publishedAt,
    }))

    const summaryPath = path.join(process.cwd(), 'beginner-meso-summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2))
    console.log(`📋 Summary exported to: ${summaryPath}`)
  } catch (error) {
    console.error('❌ Error fetching beginner meso entries:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  getBeginnerMesoEntries()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}
