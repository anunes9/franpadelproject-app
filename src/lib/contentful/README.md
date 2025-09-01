# Contentful Integration

This directory contains the Contentful integration for the Fran Padel Project app. We use both the **Management API** (for content creation/updates) and **Delivery API** (for reading published content) to provide a complete content management solution.

## 🏗️ Architecture

### Management API (`contentful-management`)

- **Purpose**: Create, update, and manage content
- **Use cases**: Admin tools, content seeding, bulk operations
- **Files**: `client.ts`, `entries.ts`, `assets.ts`, `content-types.ts`

### Delivery API (`contentful`)

- **Purpose**: Read published content efficiently
- **Use cases**: App content display, user-facing features
- **Files**: `delivery-client.ts`, `modules-delivery.ts`

## 📋 Environment Variables

Add these to your `.env.local` file:

```bash
# Required for both APIs
CONTENTFUL_SPACE_ID=your_space_id_here

# Required for Management API (content creation/updates)
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token_here

# Required for Delivery API (content reading)
CONTENTFUL_DELIVERY_TOKEN=your_delivery_token_here

# Optional: Environment (defaults to 'master')
CONTENTFUL_ENVIRONMENT_ID=master
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install contentful contentful-management
```

### 2. Set Up Environment Variables

Get your tokens from the Contentful web app:

- **Space ID**: Found in Settings → General settings
- **Management Token**: Found in Settings → API keys → Content management tokens
- **Delivery Token**: Found in Settings → API keys → Content delivery tokens

### 3. Test the Integration

```bash
# Test Management API
npm run test-contentful

# Test Delivery API
npm run test-delivery
```

## 📚 Usage Examples

### Reading Content (Delivery API)

```typescript
import { getBeginnerModules, getModuleByExternalId } from '@/lib/contentful/modules-delivery'

// Get all beginner modules
const modules = await getBeginnerModules()

// Get a specific module
const module = await getModuleByExternalId('module-1')
```

### Creating Content (Management API)

```typescript
import { createEntry } from '@/lib/contentful/entries'

// Create a new module
const newModule = await createEntry('modules', {
  title: { 'en-US': 'Introduction to Padel' },
  description: { 'en-US': 'Learn the basics of padel' },
  level: { 'en-US': 'Beginner' },
  externalId: { 'en-US': '1' },
  duration: { 'en-US': '30' },
  topics: { 'en-US': ['Basics', 'Rules', 'Equipment'] },
})
```

## 🔧 Available Functions

### Delivery API Functions

#### `modules-delivery.ts`

- `getBeginnerModules()` - Get all beginner-level modules
- `getModuleByExternalId(externalId)` - Get a specific module by external ID
- `getAllModules()` - Get all modules sorted by level
- `getModulesByLevel(level)` - Get modules by specific level

#### `delivery-client.ts`

- `getEntries(query)` - Get entries with optional query parameters
- `getEntry(entryId)` - Get a single entry by ID
- `getAssets(query)` - Get assets with optional query parameters
- `getAsset(assetId)` - Get a single asset by ID
- `sync(options)` - Sync content for incremental updates

### Management API Functions

#### `entries.ts`

- `createEntry(contentTypeId, fields)` - Create a new entry
- `getEntry(entryId)` - Get an entry by ID
- `updateEntry(entryId, fields)` - Update an entry
- `deleteEntry(entryId)` - Delete an entry
- `getEntriesByType(contentTypeId)` - Get all entries of a type

#### `assets.ts`

- `createAsset(fields)` - Create a new asset
- `getAsset(assetId)` - Get an asset by ID
- `updateAsset(assetId, fields)` - Update an asset
- `deleteAsset(assetId)` - Delete an asset
- `getAllAssets()` - Get all assets

## 📖 Content Types

### Module Content Type

The app expects a content type called `modules` with these fields:

```typescript
interface Module {
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
```

## 🔍 Query Examples

### Delivery API Queries

```typescript
// Get all published modules
const allModules = await getEntries({
  content_type: 'modules',
  include: 2,
})

// Get beginner modules only
const beginnerModules = await getEntries({
  content_type: 'modules',
  'fields.level': 'Beginner',
  include: 2,
})

// Get a specific module by external ID
const module = await getEntries({
  content_type: 'modules',
  'fields.externalId': '1',
  limit: 1,
})
```

## 🛠️ Scripts

### Available NPM Scripts

```bash
# Test connections
npm run test-contentful    # Test Management API
npm run test-delivery      # Test Delivery API

# Content management
npm run get-meso           # Get module entries
npm run get-beginner-meso  # Get beginner modules
npm run create-modules     # Create sample modules
npm run list-content-types # List available content types
```

## 🔒 Security Notes

- **Management Token**: Keep this secure - it has full access to create/update content
- **Delivery Token**: This is safe to use in client-side code - it only reads published content
- **Environment Variables**: Never commit tokens to version control
- **Rate Limiting**: Be mindful of API rate limits, especially with the Management API

## 🐛 Troubleshooting

### Common Issues

1. **"CONTENTFUL_DELIVERY_TOKEN is required"**

   - Make sure you've set the delivery token in your environment variables
   - Verify the token has the correct permissions

2. **"No modules found"**

   - Check that your content type is named `modules`
   - Ensure entries are published
   - Verify the content type has the expected fields

3. **"Unable to resolve module 'http'"**
   - This is a Node.js vs browser environment issue
   - The library automatically handles this, but you can force browser version:
   ```typescript
   const { createClient } = require('contentful/dist/contentful.browser.min.js')
   ```

### Debug Commands

```bash
# Debug environment variables
npm run debug-tokens

# Test token directly
npm run test-token
```

## 📚 Additional Resources

- [Contentful JavaScript SDK Documentation](https://github.com/contentful/contentful.js)
- [Contentful Management API Documentation](https://github.com/contentful/contentful-management.js)
- [Contentful REST API Reference](https://www.contentful.com/developers/docs/references/content-delivery-api/)
- [Contentful Query Parameters](https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/search-parameters)
