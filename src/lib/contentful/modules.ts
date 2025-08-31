import { getEntriesByType, initializeContentfulClient } from './index'
import { validateContentfulConfig } from './config'
import { ContentfulEntry } from './types'

export interface Module {
  id: string
  externalId: string
  title: string
  description: string
  duration: string
  level: string
  topics: string[]
  content?: any
  createdAt: string
  updatedAt: string
  publishedAt?: string
  isPublished: boolean
}

export async function getBeginnerModules(): Promise<Module[]> {
  try {
    // Initialize Contentful client
    initializeContentfulClient()

    // Validate configuration
    validateContentfulConfig()

    console.log('🔍 Fetching beginner modules from Contentful...')

    // Get all entries with content type "meso" (modules)
    const entries = await getEntriesByType('modules')

    if (entries.items.length === 0) {
      console.log('❌ No modules found in Contentful')
      return []
    }

    console.log('🔍 Entries:', entries.items.length)

    // Process and filter entries by level = "Beginner"
    const modules: Module[] = entries.items
      .map((entry: ContentfulEntry) => {
        const fields = entry.fields
        const title = fields.title?.['en-US'] || fields.title?.['es-ES'] || 'No title'
        const description = fields.description?.['en-US'] || fields.description?.['es-ES'] || 'No description'
        const level = fields.level?.['en-US'] || fields.level?.['es-ES'] || 'No level'
        const externalId = fields.externalId?.['en-US'] || fields.externalId?.['es-ES'] || entry.sys.id
        const duration = fields.duration?.['en-US'] || fields.duration?.['es-ES'] || 'Unknown'
        const topics = fields.topics?.['en-US'] || fields.topics?.['es-ES'] || []
        const content = fields.content?.['en-US'] || fields.content?.['es-ES'] || null

        return {
          id: entry.sys.id,
          externalId,
          title,
          description,
          duration,
          level,
          topics: Array.isArray(topics) ? topics : [],
          content,
          createdAt: entry.sys.createdAt,
          updatedAt: entry.sys.updatedAt,
          publishedAt: entry.sys.publishedAt,
          isPublished: !!entry.sys.publishedAt,
        }
      })
      .filter((module: Module) => {
        const level = module.level?.toLowerCase()
        return level === 'beginner'
      })
      .sort((a: Module, b: Module) => {
        // Sort by externalId if it's numeric, otherwise by title
        const aId = parseInt(a.externalId) || 0
        const bId = parseInt(b.externalId) || 0
        if (aId && bId) {
          return aId - bId
        }
        return a.title.localeCompare(b.title)
      })

    console.log(`✅ Found ${modules.length} beginner modules`)
    return modules
  } catch (error) {
    console.error('❌ Error fetching beginner modules:', error)
    return []
  }
}

export async function getModuleByExternalId(externalId: string): Promise<Module | null> {
  try {
    // Initialize Contentful client
    initializeContentfulClient()

    // Validate configuration
    validateContentfulConfig()

    console.log(`🔍 Fetching module with externalId: ${externalId}`)

    // Get all entries with content type "meso" (modules)
    const entries = await getEntriesByType('modules')

    if (entries.items.length === 0) {
      console.log('❌ No modules found in Contentful')
      return null
    }

    // Find the module with matching externalId
    const moduleEntry = entries.items.find((entry: ContentfulEntry) => {
      const fields = entry.fields
      const entryExternalId = fields.externalId?.['en-US'] || fields.externalId?.['es-ES'] || entry.sys.id
      return entryExternalId === externalId
    })

    if (!moduleEntry) {
      console.log(`❌ No module found with externalId: ${externalId}`)
      return null
    }

    const fields = moduleEntry.fields
    const title = fields.title?.['en-US'] || fields.title?.['es-ES'] || 'No title'
    const description = fields.description?.['en-US'] || fields.description?.['es-ES'] || 'No description'
    const level = fields.level?.['en-US'] || fields.level?.['es-ES'] || 'No level'
    const duration = fields.duration?.['en-US'] || fields.duration?.['es-ES'] || 'Unknown'
    const topics = fields.topics?.['en-US'] || fields.topics?.['es-ES'] || []
    const content = fields.content?.['en-US'] || fields.content?.['es-ES'] || null

    const module: Module = {
      id: moduleEntry.sys.id,
      externalId,
      title,
      description,
      duration,
      level,
      topics: Array.isArray(topics) ? topics : [],
      content,
      createdAt: moduleEntry.sys.createdAt,
      updatedAt: moduleEntry.sys.updatedAt,
      publishedAt: moduleEntry.sys.publishedAt,
      isPublished: !!moduleEntry.sys.publishedAt,
    }

    console.log(`✅ Found module: ${module.title}`)
    return module
  } catch (error) {
    console.error('❌ Error fetching module by externalId:', error)
    return null
  }
}
