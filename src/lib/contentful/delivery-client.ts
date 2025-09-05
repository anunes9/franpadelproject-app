import { createClient } from 'contentful'
import { validateDeliveryConfig, getContentfulConfig } from './config'

// Contentful Delivery API client
let contentfulDelivery: any = null

// Initialize the delivery client (call this after environment variables are loaded)
export const initializeContentfulDeliveryClient = () => {
  validateDeliveryConfig()
  const config = getContentfulConfig()

  if (!config.deliveryToken) {
    throw new Error('CONTENTFUL_DELIVERY_TOKEN is required')
  }

  console.log('config', config)

  contentfulDelivery = createClient({
    space: config.spaceId!,
    accessToken: config.deliveryToken,
    environment: config.environment || 'master',
  })
  return contentfulDelivery
}

// Get the delivery client instance
export const getContentfulDelivery = () => {
  if (!contentfulDelivery) {
    return initializeContentfulDeliveryClient()
  }
  return contentfulDelivery
}

// Get entries with optional query parameters
export const getEntries = async (query: any = {}) => {
  const client = getContentfulDelivery()
  return await client.getEntries(query)
}

// Get a single entry by ID
export const getEntry = async (entryId: string) => {
  const client = getContentfulDelivery()
  return await client.getEntry(entryId)
}

// Get assets with optional query parameters
export const getAssets = async (query: any = {}) => {
  const client = getContentfulDelivery()
  return await client.getAssets(query)
}

// Get a single asset by ID
export const getAsset = async (assetId: string) => {
  const client = getContentfulDelivery()
  return await client.getAsset(assetId)
}

// Sync content (for incremental updates)
export const sync = async (options: any = {}) => {
  const client = getContentfulDelivery()
  return await client.sync(options)
}
