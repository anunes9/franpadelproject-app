import { createClient } from 'contentful-management'
import { validateContentfulConfig, getContentfulConfig } from './config'

// Contentful Management API client
let contentfulManagement: any = null

// Initialize the client (call this after environment variables are loaded)
export const initializeContentfulClient = () => {
  validateContentfulConfig()
  const config = getContentfulConfig()

  if (!config.managementToken) {
    throw new Error('CONTENTFUL_MANAGEMENT_TOKEN is required')
  }

  contentfulManagement = createClient({
    accessToken: config.managementToken,
  })
  return contentfulManagement
}

// Get the client instance
export const getContentfulManagement = () => {
  if (!contentfulManagement) {
    return initializeContentfulClient()
  }
  return contentfulManagement
}

// Get the space (workspace) instance
export const getSpace = async () => {
  const { spaceId } = getContentfulConfig()
  const client = getContentfulManagement()
  return await client.getSpace(spaceId)
}

// Get the environment (usually 'master' for production)
export const getEnvironment = async (environmentId: string = 'master') => {
  const space = await getSpace()
  return await space.getEnvironment(environmentId)
}
