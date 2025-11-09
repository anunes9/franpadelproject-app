import { getEntries, initializeContentfulDeliveryClient } from './delivery-client'
import { validateDeliveryConfig } from './config'
import { contentfulLocaleMap, type Locale } from '@/i18n/config'

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

export async function getAllExercises(locale: Locale = 'en'): Promise<Exercise[]> {
  try {
    // Initialize Contentful delivery client
    initializeContentfulDeliveryClient()

    // Validate configuration
    validateDeliveryConfig()

    const contentfulLocale = contentfulLocaleMap[locale] || contentfulLocaleMap.en

    console.log('🔍 Fetching exercises from Contentful Delivery API...')

    // Get all published entries with content type "exercises"
    const entries = await getEntries({
      content_type: 'exercises',
      include: 2, // Include 2 levels of linked entries
      limit: 100,
      locale: contentfulLocale,
    })

    if (entries.items.length === 0) {
      console.log('❌ No exercises found in Contentful')
      return []
    }

    console.log(`🔍 Found ${entries.items.length} exercises`)

    // Process entries
    const exercises: Exercise[] = entries.items
      .map((entry: any) => {
        const fields = entry.fields
        const title = fields.title || 'No title'
        const description = fields.description || 'No description'
        const externalId = fields.externalId || entry.sys.id

        // Process media if it exists
        let media = undefined
        if (fields.media && fields.media.fields) {
          media = {
            url: fields.media.fields.file?.url || '',
            fileName: fields.media.fields.fileName || '',
            contentType: fields.media.fields.file?.contentType || '',
          }
        }

        return {
          id: entry.sys.id,
          externalId,
          title,
          description,
          media,
        }
      })
      .sort((a: Exercise, b: Exercise) => {
        // Sort by externalId if it's numeric, otherwise by title
        const aId = parseInt(a.externalId) || 0
        const bId = parseInt(b.externalId) || 0
        if (aId && bId) {
          return aId - bId
        }
        return a.title.localeCompare(b.title)
      })

    console.log(`✅ Successfully processed ${exercises.length} exercises`)
    return exercises
  } catch (error) {
    console.error('❌ Error fetching exercises:', error)
    return []
  }
}
