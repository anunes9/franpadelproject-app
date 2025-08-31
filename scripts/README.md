# Contentful Scripts

This directory contains utility scripts for managing Contentful content.

## Prerequisites

Make sure you have set up your environment variables in `.env.local`:

```env
CONTENTFUL_SPACE_ID=your_space_id_here
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token_here
```

The scripts will automatically load environment variables from `.env.local` file.

## Available Scripts

### 1. Get Meso Entries

Fetches all "meso" content type entries from Contentful.

```bash
# Display meso entries in console
npm run get-meso

# Export meso entries to JSON file
npm run get-meso:export
```

### 2. Get Beginner Meso Entries

Fetches all "meso" entries that have level = "Beginner" and exports them to JSON files.

```bash
# Get beginner meso entries and export to JSON
npm run get-beginner-meso
```

This script will:

- Fetch all meso entries from Contentful
- Filter for entries with level = "Beginner" (case-insensitive)
- Display detailed information about each beginner entry
- Export full data to `beginner-meso-entries.json`
- Export summary data to `beginner-meso-summary.json`

### 3. Create Modules Content

Creates "Modules" content type entries in Contentful using data from `docs/beginner.json`.

```bash
# Create modules content (dry run first to preview)
npm run create-modules:dry-run

# Create modules content in Contentful
npm run create-modules

# Create modules content in a specific environment
npm run create-modules --env=staging
```

This script will:

- Read the `docs/beginner.json` file
- Create entries for each mesociclo (module) in the "Modules" content type
- Map the data to the correct Contentful fields:
  - `title`: Module title in Portuguese and English
  - `externalId`: Unique identifier (mesociclo-1, mesociclo-2, etc.)
  - `description`: Module description in Portuguese and English
  - `topics`: Array of topics in Portuguese and English
  - `duration`: Duration in Portuguese and English
  - `level`: Level (Beginner, Intermediate, Advanced)
- Publish each entry automatically

#### Options

- `--dry-run`: Preview what would be created without actually creating entries
- `--env=<environment>`: Specify environment (default: master)

#### Examples

```bash
# Preview what will be created
npm run create-modules:dry-run

# Create all modules in master environment
npm run create-modules

# Create modules in staging environment
npm run create-modules --env=staging
```

### 4. Generic Content Entry Fetcher

A flexible script to fetch entries of any content type.

```bash
# List all available content types
npm run list-content-types

# Get entries of a specific content type
npm run get-entries <contentTypeId>

# Get entries with options
npm run get-entries <contentTypeId> --export --env=staging --limit=50
```

#### Options

- `--export`: Export entries to a JSON file
- `--list-types`: List all available content types
- `--env=<environment>`: Specify environment (default: master)
- `--limit=<number>`: Maximum number of entries (default: 100)

#### Examples

```bash
# Get all meso entries
npm run get-entries meso

# Get meso entries and export to JSON
npm run get-entries meso --export

# Get entries from staging environment
npm run get-entries meso --env=staging

# Get only 10 entries
npm run get-entries meso --limit=10

# Combine multiple options
npm run get-entries meso --export --env=staging --limit=25

# List all content types
npm run list-content-types
```

## Output

The scripts will display:

- Entry ID and basic information
- Title and description (if available)
- Creation, update, and publication dates
- All field values with their locales
- Summary statistics

When using `--export`, a JSON file will be created in the project root with the format:

- `meso-entries.json` for the specific meso script
- `<contentTypeId>-entries.json` for the generic script

## Error Handling

The scripts include proper error handling for:

- Missing environment variables
- Invalid content type IDs
- Network errors
- Authentication issues

## Troubleshooting

1. **"Environment variable is required"**: Make sure your `.env.local` file is properly configured
2. **"No entries found"**: Check if the content type ID exists and has entries
3. **"Authentication failed"**: Verify your management token is correct and has proper permissions
