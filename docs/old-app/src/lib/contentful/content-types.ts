import { getEnvironment } from './client'

// Create a new content type
export const createContentType = async (
  contentTypeId: string,
  name: string,
  description: string,
  fields: any[],
  environmentId: string = 'master'
) => {
  const environment = await getEnvironment(environmentId)

  const contentType = await environment.createContentType({
    name,
    description,
    id: contentTypeId,
    fields,
  })

  // Publish the content type
  await contentType.publish()

  return contentType
}

// Get a content type by ID
export const getContentType = async (contentTypeId: string, environmentId: string = 'master') => {
  const environment = await getEnvironment(environmentId)
  return await environment.getContentType(contentTypeId)
}

// Update a content type
export const updateContentType = async (
  contentTypeId: string,
  updates: Record<string, any>,
  environmentId: string = 'master'
) => {
  const environment = await getEnvironment(environmentId)
  const contentType = await environment.getContentType(contentTypeId)

  // Update fields
  Object.keys(updates).forEach((fieldName) => {
    contentType[fieldName] = updates[fieldName]
  })

  // Save and publish
  await contentType.update()
  await contentType.publish()

  return contentType
}

// Delete a content type
export const deleteContentType = async (contentTypeId: string, environmentId: string = 'master') => {
  const environment = await getEnvironment(environmentId)
  const contentType = await environment.getContentType(contentTypeId)

  // Unpublish first if published
  if (contentType.isPublished()) {
    await contentType.unpublish()
  }

  // Delete the content type
  await contentType.delete()
}

// Get all content types
export const getAllContentTypes = async (environmentId: string = 'master', limit: number = 100) => {
  const environment = await getEnvironment(environmentId)

  const contentTypes = await environment.getContentTypes({
    limit,
  })

  return contentTypes
}
