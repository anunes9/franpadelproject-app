import { getEntries, initializeContentfulDeliveryClient } from './delivery-client'
import { validateDeliveryConfig } from './config'
import { FILE_TYPES } from '@/lib/utils'

export interface Question {
  id: string
  externalId: string
  question: string
  answers: string[]
  correctOption: string
}

export interface Exercise {
  id: string
  externalId: string
  title: string
  description?: string
  media?: {
    url: string
    fileName: string
    contentType: string
  }
}

export interface Module {
  id: string
  externalId: string
  title: string
  description: string
  duration: string
  level: string
  topics: string[]
  content?: string // Markdown
  presentation?: {
    fields: {
      file: {
        url: string
        details: { size: number }
        fileName: string
        contentType: typeof FILE_TYPES.PDF
      }
    }
  }
  documents?: {
    fields: {
      file: {
        url: string
        details: { size: number }
        fileName: string
        contentType: string
      }
    }
  }[]
  exercises?: Exercise[]
  questions?: Question[]
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
      locale: 'pt',
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
        const presentation = fields.presentation || null

        return {
          id: entry.sys.id,
          externalId,
          title,
          description,
          duration,
          level,
          topics: Array.isArray(topics) ? topics : [],
          content,
          presentation,
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
      locale: 'pt',
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
    const presentation = fields.presentation || null
    const documents = fields.documents || []
    const exercises = fields.exercises || []
    const questions = fields.questions || []

    console.log('questions', questions)

    // Process exercises if they exist
    let processedExercises: Exercise[] = []
    if (Array.isArray(exercises) && exercises.length > 0) {
      processedExercises = exercises.map((exercise: any) => {
        const exerciseFields = exercise.fields
        return {
          id: exercise.sys.id,
          externalId: exerciseFields.externalId || exercise.sys.id,
          title: exerciseFields.title || 'Untitled Exercise',
          description: exerciseFields.description || undefined,
          media: exerciseFields.media
            ? {
                url: exerciseFields.media.fields.file.url,
                fileName: exerciseFields.media.fields.file.fileName,
                contentType: exerciseFields.media.fields.file.contentType,
              }
            : undefined,
        }
      })
    }

    const processedQuestions: Question[] = questions.map((question: any) => {
      return {
        id: question.sys.id,
        question: question.fields.question,
        answers: question.fields.answers,
        correctOption: question.fields.correctOption,
      }
    })

    const course: Module = {
      id: entry.sys.id,
      externalId,
      title,
      description,
      duration,
      level,
      topics: Array.isArray(topics) ? topics : [],
      content,
      presentation,
      documents,
      exercises: processedExercises,
      questions: processedQuestions,
      createdAt: entry.sys.createdAt,
      updatedAt: entry.sys.updatedAt,
      publishedAt: entry.sys.publishedAt,
      isPublished: !!entry.sys.publishedAt,
    }

    console.log(`✅ Found module: ${course.title}`)
    return course
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
      locale: 'pt',
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
        const presentation = fields.presentation || null

        return {
          id: entry.sys.id,
          externalId,
          title,
          description,
          duration,
          level,
          topics: Array.isArray(topics) ? topics : [],
          content,
          presentation,
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
      locale: 'pt',
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
        const presentation = fields.presentation || null

        return {
          id: entry.sys.id,
          externalId,
          title,
          description,
          duration,
          level,
          topics: Array.isArray(topics) ? topics : [],
          content,
          presentation,
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
