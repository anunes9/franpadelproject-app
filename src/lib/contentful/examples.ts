import { createEntry, createAsset, createContentType, getEntriesByType, updateEntry, deleteEntry } from './index'

// Example: Create a content type for a blog post
export const createBlogPostContentType = async () => {
  const blogPostFields = [
    {
      id: 'title',
      name: 'Title',
      type: 'Text',
      required: true,
      localized: true,
    },
    {
      id: 'slug',
      name: 'Slug',
      type: 'Text',
      required: true,
      localized: true,
      validations: [
        {
          unique: true,
        },
      ],
    },
    {
      id: 'content',
      name: 'Content',
      type: 'RichText',
      required: true,
      localized: true,
    },
    {
      id: 'featuredImage',
      name: 'Featured Image',
      type: 'Asset',
      required: false,
      localized: false,
      validations: [
        {
          linkMimetypeGroup: ['image'],
        },
      ],
    },
    {
      id: 'author',
      name: 'Author',
      type: 'Text',
      required: true,
      localized: true,
    },
    {
      id: 'publishDate',
      name: 'Publish Date',
      type: 'Date',
      required: true,
      localized: false,
    },
  ]

  return await createContentType(
    'blogPost',
    'Blog Post',
    'A blog post with title, content, and metadata',
    blogPostFields,
    'master'
  )
}

// Example: Create a blog post entry
export const createBlogPost = async () => {
  const blogPostFields = {
    title: {
      'en-US': 'My First Blog Post',
    },
    slug: {
      'en-US': 'my-first-blog-post',
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
                value: 'This is the content of my first blog post.',
                marks: [],
                data: {},
              },
            ],
          },
        ],
      },
    },
    author: {
      'en-US': 'John Doe',
    },
    publishDate: {
      'en-US': new Date().toISOString().split('T')[0],
    },
  }

  return await createEntry('blogPost', blogPostFields, 'master')
}

// Example: Create a content type for a course module
export const createCourseModuleContentType = async () => {
  const courseModuleFields = [
    {
      id: 'title',
      name: 'Title',
      type: 'Text',
      required: true,
      localized: true,
    },
    {
      id: 'description',
      name: 'Description',
      type: 'Text',
      required: true,
      localized: true,
    },
    {
      id: 'videoUrl',
      name: 'Video URL',
      type: 'Text',
      required: false,
      localized: false,
    },
    {
      id: 'duration',
      name: 'Duration (minutes)',
      type: 'Integer',
      required: true,
      localized: false,
    },
    {
      id: 'difficulty',
      name: 'Difficulty Level',
      type: 'Text',
      required: true,
      localized: true,
      validations: [
        {
          in: ['Beginner', 'Intermediate', 'Advanced'],
        },
      ],
    },
    {
      id: 'exercises',
      name: 'Exercises',
      type: 'Array',
      required: false,
      localized: false,
      items: {
        type: 'Link',
        linkType: 'Entry',
        validations: [
          {
            linkContentType: ['exercise'],
          },
        ],
      },
    },
  ]

  return await createContentType(
    'courseModule',
    'Course Module',
    'A module in a padel course',
    courseModuleFields,
    'master'
  )
}

// Example: Create a course module entry
export const createCourseModule = async () => {
  const moduleFields = {
    title: {
      'en-US': 'Basic Forehand Technique',
    },
    description: {
      'en-US': 'Learn the fundamentals of the forehand stroke in padel.',
    },
    videoUrl: {
      'en-US': 'https://example.com/video/forehand-basics',
    },
    duration: {
      'en-US': 15,
    },
    difficulty: {
      'en-US': 'Beginner',
    },
  }

  return await createEntry('courseModule', moduleFields, 'master')
}

// Example: Get all blog posts
export const getAllBlogPosts = async () => {
  return await getEntriesByType('blogPost', 'master', 100)
}

// Example: Update a blog post
export const updateBlogPost = async (entryId: string, newTitle: string) => {
  const updateFields = {
    title: {
      'en-US': newTitle,
    },
  }

  return await updateEntry(entryId, updateFields, 'master')
}

// Example: Delete a blog post
export const deleteBlogPost = async (entryId: string) => {
  return await deleteEntry(entryId, 'master')
}
