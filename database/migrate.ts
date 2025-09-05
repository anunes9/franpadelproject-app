#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// Database migration runner for FranPadelProject Admin
// Usage: npx tsx database/migrate.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration(filePath: string) {
  console.log(`Running migration: ${filePath}`)

  try {
    const sql = readFileSync(filePath, 'utf-8')

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    for (const statement of statements) {
      if (
        statement.toUpperCase().startsWith('CREATE EXTENSION') ||
        statement.toUpperCase().startsWith('CREATE TYPE') ||
        statement.toUpperCase().startsWith('CREATE TABLE') ||
        statement.toUpperCase().startsWith('CREATE INDEX') ||
        statement.toUpperCase().startsWith('CREATE TRIGGER') ||
        statement.toUpperCase().startsWith('ALTER TABLE') ||
        statement.toUpperCase().startsWith('CREATE POLICY') ||
        statement.toUpperCase().startsWith('INSERT INTO')
      ) {
        console.log(`  Executing: ${statement.substring(0, 50)}...`)

        const { error } = await supabase.rpc('exec_sql', { sql: statement })

        if (error) {
          console.error(`  Error: ${error.message}`)
          // Continue with other statements even if one fails
        } else {
          console.log(`  ✓ Success`)
        }
      }
    }
  } catch (error) {
    console.error(`Failed to run migration ${filePath}:`, error)
  }
}

async function runSeeder(filePath: string) {
  console.log(`Running seeder: ${filePath}`)

  try {
    const sql = readFileSync(filePath, 'utf-8')

    // Execute seeder SQL
    const { error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error(`Error running seeder: ${error.message}`)
    } else {
      console.log(`✓ Seeder completed`)
    }
  } catch (error) {
    console.error(`Failed to run seeder ${filePath}:`, error)
  }
}

async function main() {
  console.log('🚀 Starting database migration...')

  // Run migrations
  const migrationsDir = join(__dirname, 'migrations')
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  console.log(`Found ${migrationFiles.length} migration files`)

  for (const file of migrationFiles) {
    await runMigration(join(migrationsDir, file))
  }

  // Run seeders if --seed flag is provided
  if (process.argv.includes('--seed')) {
    console.log('\n🌱 Running seeders...')

    const seedersDir = join(__dirname, 'seeders')
    const seederFiles = readdirSync(seedersDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()

    console.log(`Found ${seederFiles.length} seeder files`)

    for (const file of seederFiles) {
      await runSeeder(join(seedersDir, file))
    }
  }

  console.log('\n✅ Migration completed!')
  console.log('\n📝 Next steps:')
  console.log('1. Check your Supabase dashboard to verify tables were created')
  console.log('2. Review Row Level Security policies')
  console.log('3. Test the database connection in your application')
}

main().catch(console.error)
