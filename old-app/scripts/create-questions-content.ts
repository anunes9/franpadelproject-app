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

interface QuestionData {
  question: {
    'en-US': string
    pt: string
  }
  answers: {
    'en-US': string[]
    pt: string[]
  }
  correctOption: {
    'en-US': string
    pt: string
  }
}

interface QuestionsData {
  questions: QuestionData[]
}

async function createQuestionsContent() {
  try {
    // Validate configuration
    validateContentfulConfig()

    // Get command line arguments
    const args = process.argv.slice(2)
    const environmentId = args.find((arg) => arg.startsWith('--env='))?.split('=')[1] || 'master'
    const dryRun = args.includes('--dry-run')

    console.log('❓ Creating Questions content from module-1-questions.json...')
    console.log(`   Environment: ${environmentId}`)
    console.log(`   Dry run: ${dryRun}`)
    console.log('')

    // Read the module-1-questions.json file
    const questionsDataPath = join(process.cwd(), 'docs', 'questions', 'module-1-questions.json')
    const questionsData = JSON.parse(readFileSync(questionsDataPath, 'utf8')) as QuestionsData

    console.log(`📖 Found ${questionsData.questions.length} questions in module-1-questions.json`)
    console.log('')

    // Process each question
    for (let i = 0; i < questionsData.questions.length; i++) {
      const question = questionsData.questions[i]
      const questionNumber = i + 1

      console.log(`🔄 Processing question ${questionNumber}/${questionsData.questions.length}`)
      console.log(`   EN: ${question.question['en-US']}`)
      console.log(`   PT: ${question.question['pt']}`)

      // Generate a unique external ID for each question
      const externalId = `module-1-question-${questionNumber.toString().padStart(2, '0')}`

      // Prepare fields for Contentful - matching the questions content type structure
      const fields = {
        question: {
          'en-US': question.question['en-US'],
          pt: question.question['pt'],
        },
        answers: {
          'en-US': question.answers['en-US'],
          pt: question.answers['pt'],
        },
        correctOption: {
          'en-US': question.correctOption['en-US'],
          pt: question.correctOption['pt'],
        },
        module: {
          'en-US': '1', // All questions in this file are from Module 1
        },
      }

      if (dryRun) {
        console.log(`   📝 Would create entry with external ID: ${externalId}`)
        console.log(`   📋 Fields:`, JSON.stringify(fields, null, 2))
        console.log('')
      } else {
        try {
          // Create the entry in Contentful
          const entry = await createEntry('questions', fields, environmentId)
          console.log(`   ✅ Created entry: ${entry.sys.id}`)
          console.log(`   🔗 Published: ${entry.isPublished()}`)
          console.log('')
        } catch (error) {
          console.error(`   ❌ Error creating entry for question ${questionNumber}:`, error)
          console.log('')
        }
      }
    }

    if (dryRun) {
      console.log('🎭 Dry run completed. No entries were actually created.')
      console.log('')
      console.log('💡 To actually create the entries, run the script without --dry-run:')
      console.log('   npm run create-questions-content')
    } else {
      console.log('🎉 All questions have been created successfully!')
      console.log('')
      console.log('📊 Summary:')
      console.log(`   • Total questions created: ${questionsData.questions.length}`)
      console.log(`   • Content type: questions`)
      console.log(`   • Module: 1 (Mesociclo I - Game Initiation Model)`)
      console.log(`   • Environment: ${environmentId}`)
    }
  } catch (error) {
    console.error('❌ Error creating questions content:', error)
    process.exit(1)
  }
}

// Run the script
createQuestionsContent()
