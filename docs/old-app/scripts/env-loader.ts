import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local')

  if (!existsSync(envPath)) {
    console.warn('⚠️  .env.local file not found. Make sure it exists with your Contentful credentials.')
    return
  }

  try {
    const envContent = readFileSync(envPath, 'utf8')
    const envVars = envContent.split('\n').filter((line) => line.trim() && !line.startsWith('#'))

    envVars.forEach((line) => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '')
        process.env[key.trim()] = cleanValue
      }
    })

    // Handle Contentful variable name mapping
    if (process.env.CONTENTFUL_CONTENT_MANAGER && !process.env.CONTENTFUL_MANAGEMENT_TOKEN) {
      process.env.CONTENTFUL_MANAGEMENT_TOKEN = process.env.CONTENTFUL_CONTENT_MANAGER
      console.log('🔄 Mapped CONTENTFUL_CONTENT_MANAGER to CONTENTFUL_MANAGEMENT_TOKEN')
    }

    if (process.env.CONTENTFUL_ACCESS_TOKEN && !process.env.CONTENTFUL_DELIVERY_TOKEN) {
      process.env.CONTENTFUL_DELIVERY_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN
      console.log('🔄 Mapped CONTENTFUL_ACCESS_TOKEN to CONTENTFUL_DELIVERY_TOKEN')
    }

    console.log('✅ Environment variables loaded from .env.local')

    // Debug: Show what variables are available
    console.log('🔍 Available Contentful variables:')
    console.log(`   CONTENTFUL_SPACE_ID: ${process.env.CONTENTFUL_SPACE_ID ? '✅ Set' : '❌ Missing'}`)
    console.log(`   CONTENTFUL_MANAGEMENT_TOKEN: ${process.env.CONTENTFUL_MANAGEMENT_TOKEN ? '✅ Set' : '❌ Missing'}`)
    console.log(`   CONTENTFUL_DELIVERY_TOKEN: ${process.env.CONTENTFUL_DELIVERY_TOKEN ? '✅ Set' : '❌ Missing'}`)
  } catch (error) {
    console.error('❌ Error loading .env.local file:', error)
  }
}
