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

interface ExerciseImage {
  sys: {
    id: string
  }
  contentType: string
  fileName: string
  title: string
}

interface ExerciseImagesData {
  exercises: {
    images: ExerciseImage[]
  }
}

async function createExercisesContent() {
  try {
    // Validate configuration
    validateContentfulConfig()

    // Get command line arguments
    const args = process.argv.slice(2)
    const environmentId = args.find((arg) => arg.startsWith('--env='))?.split('=')[1] || 'master'
    const dryRun = args.includes('--dry-run')

    console.log('🏃 Creating Exercises content from exercise-images.json...')
    console.log(`   Environment: ${environmentId}`)
    console.log(`   Dry run: ${dryRun}`)
    console.log('')

    // Read the exercise-images.json file
    const exerciseDataPath = join(process.cwd(), 'docs', 'exercise-images.json')
    const exerciseData = JSON.parse(readFileSync(exerciseDataPath, 'utf8')) as ExerciseImagesData

    console.log(`📖 Found ${exerciseData.exercises.images.length} exercise images in exercise-images.json`)
    console.log('')

    // Process each exercise image
    for (let i = 0; i < exerciseData.exercises.images.length; i++) {
      const exercise = exerciseData.exercises.images[i]
      const exerciseId = exercise.sys.id

      console.log(`🔄 Processing exercise ${i + 1}/${exerciseData.exercises.images.length}: ${exercise.title}`)

      // Generate a slug based on the exercise title
      const generateSlug = (title: string) => {
        // Handle special case for exercises like "Ex. 1.1" -> "ex-1-1"
        if (title.startsWith('Ex.')) {
          return title
            .toLowerCase()
            .replace(/^ex\.\s*/i, 'ex-') // Replace "Ex. " with "ex-"
            .replace(/\./g, '-') // Replace dots with hyphens
            .replace(/\s+/g, '') // Remove spaces
        }

        // Handle numeric titles like "10.1" -> "ex-10-1"
        if (/^\d+\.\d+$/.test(title)) {
          return `ex-${title.replace(/\./g, '-')}`
        }

        // Default slug generation for other titles
        return title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric chars with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      }

      const exerciseSlug = generateSlug(exercise.title)

      // Prepare fields for Contentful - matching your existing content type structure
      const fields = {
        title: {
          'en-US': exercise.title,
        },
        externalId: {
          'en-US': exerciseSlug,
        },
        description: {
          'en-US': `Exercise ${exercise.title} - ${exercise.fileName}`,
        },
        // Link the media field to the Contentful asset
        media: {
          'en-US': {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: exerciseId,
            },
          },
        },
      }

      if (dryRun) {
        console.log(`   📝 Would create entry with external ID: ${exerciseSlug}`)
        console.log(`   📋 Fields:`, JSON.stringify(fields, null, 2))
        console.log('')
      } else {
        try {
          // Create the entry in Contentful
          const entry = await createEntry('exercises', fields, environmentId)
          console.log(`   ✅ Created entry: ${entry.sys.id}`)
          console.log(`   🔗 Published: ${entry.isPublished()}`)
          console.log('')
        } catch (error) {
          console.error(`   ❌ Error creating entry for ${exerciseId}:`, error)
          console.log('')
        }
      }
    }

    if (dryRun) {
      console.log('🎭 Dry run completed. No entries were actually created.')
    } else {
      console.log('🎉 All exercises have been created successfully!')
    }
  } catch (error) {
    console.error('❌ Error creating exercises content:', error)
    process.exit(1)
  }
}

// Run the script
createExercisesContent()
