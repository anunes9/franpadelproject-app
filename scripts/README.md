# Contentful Scripts

This directory contains scripts for managing content in Contentful.

## Available Scripts

### 1. Create Modules Content

Creates module entries from `docs/beginner.json`:

```bash
# Dry run (preview what would be created)
npx tsx scripts/create-modules-content.ts --dry-run

# Create in master environment
npx tsx scripts/create-modules-content.ts

# Create in specific environment
npx tsx scripts/create-modules-content.ts --env=staging
```

### 2. Create Exercises Content

Creates exercise entries from `docs/exercise-images.json`:

```bash
# Dry run (preview what would be created)
npx tsx scripts/create-exercises-content.ts --dry-run

# Create in master environment
npx tsx scripts/create-exercises-content.ts

# Create in specific environment
npx tsx scripts/create-exercises-content.ts --env=staging
```

### 3. Create Questions Content

Creates question entries from `docs/questions/module-1-questions.json`:

```bash
# Dry run (preview what would be created)
npx tsx scripts/create-questions-content.ts --dry-run

# Create in master environment
npx tsx scripts/create-questions-content.ts

# Create in specific environment
npx tsx scripts/create-questions-content.ts --env=staging
```

## Workflow for Content Creation

Since you already have the content types in Contentful, you can directly run the respective scripts to populate them with data:

- **Exercises**: Run `create-exercises-content.ts` to populate the "Exercises" content type
- **Questions**: Run `create-questions-content.ts` to populate the "Questions" content type

## Environment Variables Required

Make sure you have these environment variables set in your `.env.local` file:

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_MANAGEMENT_TOKEN`
- `CONTENTFUL_DELIVERY_TOKEN` (optional, for reading content)

## Notes

- Always use `--dry-run` first to preview what will be created
- The scripts will create entries in the specified environment (defaults to 'master')
- **Exercise entries** will include: title, externalId (slug), description, and linked media assets
- **Question entries** will include: question text, answers array, correct option text in both English and Portuguese, and module number
- The externalId will be generated as a clean slug (e.g., "10.1" → "ex-10-1", questions → "module-1-question-01")
