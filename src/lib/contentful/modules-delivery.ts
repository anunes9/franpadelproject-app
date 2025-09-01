import { getEntries, initializeContentfulDeliveryClient } from './delivery-client'
import { validateDeliveryConfig } from './config'

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
    // Initialize Contentful delivery client
    initializeContentfulDeliveryClient()

    // Validate configuration
    validateDeliveryConfig()

    console.log('🔍 Fetching beginner modules from Contentful Delivery API...')

    // Get all published entries with content type "modules" and level = "Beginner"
    const entries = await getEntries({
      content_type: 'modules',
      'fields.level': 'Beginner',
      include: 2, // Include 2 levels of linked entries
      limit: 100,
    })

    if (entries.items.length === 0) {
      console.log('❌ No beginner modules found in Contentful')
      return []
    }

    console.log('🔍 Entries:', entries.items.length)

    // Process entries
    const modules: Module[] = entries.items
      .map((entry: any) => {
        const fields = entry.fields
        const title = fields.title || 'No title'
        const description = fields.description || 'No description'
        const level = fields.level || 'No level'
        const externalId = fields.externalId || entry.sys.id
        const duration = fields.duration || 'Unknown'
        const topics = fields.topics || []
        const content = fields.content || null

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
    // Initialize Contentful delivery client
    initializeContentfulDeliveryClient()

    // Validate configuration
    validateDeliveryConfig()

    console.log(`🔍 Fetching module with externalId: ${externalId}`)

    // Get the specific module by externalId
    const entries = await getEntries({
      content_type: 'modules',
      'fields.externalId': externalId,
      include: 2, // Include 2 levels of linked entries
      limit: 1,
    })

    if (entries.items.length === 0) {
      console.log(`❌ No module found with externalId: ${externalId}`)
      return null
    }

    const entry = entries.items[0]
    const fields = entry.fields
    const title = fields.title || 'No title'
    const description = fields.description || 'No description'
    const level = fields.level || 'No level'
    const duration = fields.duration || 'Unknown'
    const topics = fields.topics || []
    const content = fields.content || null

    const module: Module = {
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

    console.log(`✅ Found module: ${module.title}`)
    return module
  } catch (error) {
    console.error('❌ Error fetching module by externalId:', error)
    return null
  }
}

export async function getAllModules(): Promise<Module[]> {
  try {
    // Initialize Contentful delivery client
    initializeContentfulDeliveryClient()

    // Validate configuration
    validateDeliveryConfig()

    console.log('🔍 Fetching all modules from Contentful Delivery API...')

    // Get all published entries with content type "modules"
    const entries = await getEntries({
      content_type: 'modules',
      include: 2, // Include 2 levels of linked entries
      limit: 100,
    })

    if (entries.items.length === 0) {
      console.log('❌ No modules found in Contentful')
      return []
    }

    console.log('🔍 Entries:', entries.items.length)

    // Process entries
    const modules: Module[] = entries.items
      .map((entry: any) => {
        const fields = entry.fields
        const title = fields.title || 'No title'
        const description = fields.description || 'No description'
        const level = fields.level || 'No level'
        const externalId = fields.externalId || entry.sys.id
        const duration = fields.duration || 'Unknown'
        const topics = fields.topics || []
        const content = fields.content || null

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
      .sort((a: Module, b: Module) => {
        // Sort by level first, then by externalId
        const levelOrder = { Beginner: 1, Intermediate: 2, Advanced: 3 }
        const aLevel = levelOrder[a.level as keyof typeof levelOrder] || 4
        const bLevel = levelOrder[b.level as keyof typeof levelOrder] || 4

        if (aLevel !== bLevel) {
          return aLevel - bLevel
        }

        // Within same level, sort by externalId
        const aId = parseInt(a.externalId) || 0
        const bId = parseInt(b.externalId) || 0
        if (aId && bId) {
          return aId - bId
        }
        return a.title.localeCompare(b.title)
      })

    console.log(`✅ Found ${modules.length} modules`)
    return modules
  } catch (error) {
    console.error('❌ Error fetching all modules:', error)
    return []
  }
}

export async function getModulesByLevel(level: string): Promise<Module[]> {
  try {
    // Initialize Contentful delivery client
    initializeContentfulDeliveryClient()

    // Validate configuration
    validateDeliveryConfig()

    console.log(`🔍 Fetching ${level} modules from Contentful Delivery API...`)

    // Get all published entries with content type "modules" and specific level
    const entries = await getEntries({
      content_type: 'modules',
      'fields.level': level,
      include: 2, // Include 2 levels of linked entries
      limit: 100,
    })

    if (entries.items.length === 0) {
      console.log(`❌ No ${level} modules found in Contentful`)
      return []
    }

    console.log('🔍 Entries:', entries.items.length)

    // Process entries
    const modules: Module[] = entries.items
      .map((entry: any) => {
        const fields = entry.fields
        const title = fields.title || 'No title'
        const description = fields.description || 'No description'
        const level = fields.level || 'No level'
        const externalId = fields.externalId || entry.sys.id
        const duration = fields.duration || 'Unknown'
        const topics = fields.topics || []
        const content = fields.content || null

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
      .sort((a: Module, b: Module) => {
        // Sort by externalId if it's numeric, otherwise by title
        const aId = parseInt(a.externalId) || 0
        const bId = parseInt(b.externalId) || 0
        if (aId && bId) {
          return aId - bId
        }
        return a.title.localeCompare(b.title)
      })

    console.log(`✅ Found ${modules.length} ${level} modules`)
    return modules
  } catch (error) {
    console.error(`❌ Error fetching ${level} modules:`, error)
    return []
  }
}
