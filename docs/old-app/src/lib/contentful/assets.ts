import { getEnvironment } from './client'

// Upload and create an asset
export const createAsset = async (
  file: Buffer | string,
  fileName: string,
  contentType: string,
  environmentId: string = 'master'
) => {
  const environment = await getEnvironment(environmentId)

  // Create the asset
  const asset = await environment.createAsset({
    fields: {
      title: {
        'en-US': fileName,
      },
      description: {
        'en-US': fileName,
      },
      file: {
        'en-US': {
          contentType,
          fileName,
          upload: file,
        },
      },
    },
  })

  // Process and publish the asset
  await asset.processForAllLocales()
  await asset.publish()

  return asset
}

// Get an asset by ID
export const getAsset = async (assetId: string, environmentId: string = 'master') => {
  const environment = await getEnvironment(environmentId)
  return await environment.getAsset(assetId)
}

// Update an asset
export const updateAsset = async (assetId: string, fields: Record<string, any>, environmentId: string = 'master') => {
  const environment = await getEnvironment(environmentId)
  const asset = await environment.getAsset(assetId)

  // Update fields
  Object.keys(fields).forEach((fieldName) => {
    asset.fields[fieldName] = fields[fieldName]
  })

  // Save and publish
  await asset.update()
  await asset.publish()

  return asset
}

// Delete an asset
export const deleteAsset = async (assetId: string, environmentId: string = 'master') => {
  const environment = await getEnvironment(environmentId)
  const asset = await environment.getAsset(assetId)

  // Unpublish first if published
  if (asset.isPublished()) {
    await asset.unpublish()
  }

  // Delete the asset
  await asset.delete()
}

// Get all assets
export const getAllAssets = async (environmentId: string = 'master', limit: number = 100) => {
  const environment = await getEnvironment(environmentId)

  const assets = await environment.getAssets({
    limit,
  })

  return assets
}
