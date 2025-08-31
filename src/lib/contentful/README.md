# Contentful Management API Integration

This folder contains utilities for managing content on Contentful using the contentful-management.js library.

## Setup

1. Install the required dependency:

```bash
npm install contentful-management
```

2. Set up environment variables in your `.env.local` file:

```env
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token
```

## Files Structure

- `client.ts` - Contentful management client configuration
- `entries.ts` - Functions for managing content entries
- `assets.ts` - Functions for managing assets (images, files)
- `content-types.ts` - Functions for managing content types
- `types.ts` - TypeScript type definitions
- `examples.ts` - Example usage patterns
- `index.ts` - Main export file

## Usage

### Basic Setup

```typescript
import { createEntry, getEntry, updateEntry, deleteEntry } from '@/lib/contentful'
```

### Creating Content Types

```typescript
import { createContentType } from '@/lib/contentful'

const blogPostFields = [
  {
    id: 'title',
    name: 'Title',
    type: 'Text',
    required: true,
    localized: true,
  },
  {
    id: 'content',
    name: 'Content',
    type: 'RichText',
    required: true,
    localized: true,
  },
]

await createContentType('blogPost', 'Blog Post', 'A blog post', blogPostFields)
```

### Creating Entries

```typescript
import { createEntry } from '@/lib/contentful'

const entryFields = {
  title: {
    'en-US': 'My Blog Post',
  },
  content: {
    'en-US': {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            {
              nodeType: 'text',
              value: 'This is my blog post content.',
              marks: [],
              data: {},
            },
          ],
        },
      ],
    },
  },
}

const entry = await createEntry('blogPost', entryFields)
```

### Managing Assets

```typescript
import { createAsset } from '@/lib/contentful'

// Upload an image
const asset = await createAsset(
  imageBuffer, // Buffer or file path
  'my-image.jpg',
  'image/jpeg'
)
```

### Getting Entries

```typescript
import { getEntry, getEntriesByType } from '@/lib/contentful'

// Get a specific entry
const entry = await getEntry('entry-id')

// Get all entries of a content type
const blogPosts = await getEntriesByType('blogPost')
```

### Updating Entries

```typescript
import { updateEntry } from '@/lib/contentful'

const updatedFields = {
  title: {
    'en-US': 'Updated Title',
  },
}

await updateEntry('entry-id', updatedFields)
```

### Deleting Entries

```typescript
import { deleteEntry } from '@/lib/contentful'

await deleteEntry('entry-id')
```

## Environment Variables

Make sure to set these environment variables:

- `CONTENTFUL_SPACE_ID`: Your Contentful space ID
- `CONTENTFUL_MANAGEMENT_TOKEN`: Your Contentful Management API token

## Important Notes

1. **Management Token**: The management token has full access to your Contentful space. Keep it secure and never expose it in client-side code.

2. **Publishing**: All create and update operations automatically publish the content. If you need draft versions, modify the functions accordingly.

3. **Error Handling**: Add proper error handling in your application code when using these functions.

4. **Rate Limits**: Be aware of Contentful's API rate limits when making multiple requests.

## Examples

See `examples.ts` for complete examples of creating content types, entries, and managing content for a padel course application.
