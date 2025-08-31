// Export all Contentful management functions
export * from './client'
export * from './entries'
export * from './assets'
export * from './content-types'
export * from './config'

// Re-export commonly used functions for convenience
export { createEntry, getEntry, updateEntry, deleteEntry, getEntriesByType } from './entries'

export { createAsset, getAsset, updateAsset, deleteAsset, getAllAssets } from './assets'

export {
  createContentType,
  getContentType,
  updateContentType,
  deleteContentType,
  getAllContentTypes,
} from './content-types'
