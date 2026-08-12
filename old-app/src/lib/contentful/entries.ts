import { getEnvironment } from './client'

// Create a new entry
export const createEntry = async (
  contentTypeId: string,
  fields: Record<string, any>,
  environmentId: string = 'master'
) => {
  const environment = await getEnvironment(environmentId)

  const entry = await environment.createEntry(contentTypeId, {
    fields,
  })

  // Publish the entry
  await entry.publish()

  return entry
}

// Get an entry by ID
export const getEntry = async (entryId: string, environmentId: string = 'master') => {
  const environment = await getEnvironment(environmentId)
  return await environment.getEntry(entryId)
}

// Update an entry
export const updateEntry = async (entryId: string, fields: Record<string, any>, environmentId: string = 'master') => {
  const environment = await getEnvironment(environmentId)
  const entry = await environment.getEntry(entryId)

  // Update fields
  Object.keys(fields).forEach((fieldName) => {
    entry.fields[fieldName] = fields[fieldName]
  })

  // Save and publish
  await entry.update()
  await entry.publish()

  return entry
}

// Delete an entry
export const deleteEntry = async (entryId: string, environmentId: string = 'master') => {
  const environment = await getEnvironment(environmentId)
  const entry = await environment.getEntry(entryId)

  // Unpublish first if published
  if (entry.isPublished()) {
    await entry.unpublish()
  }

  // Delete the entry
  await entry.delete()
}

// Get all entries of a specific content type
export const getEntriesByType = async (
  contentTypeId: string,
  environmentId: string = 'master',
  limit: number = 100
) => {
  const environment = await getEnvironment(environmentId)

  const entries = await environment.getEntries({
    content_type: contentTypeId,
    limit,
  })

  return entries
}
