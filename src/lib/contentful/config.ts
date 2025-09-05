// Contentful Configuration
// Make sure to set these environment variables in your .env.local file:

// CONTENTFUL_SPACE_ID=your_space_id_here
// CONTENTFUL_MANAGEMENT_TOKEN=your_management_token_here
// CONTENTFUL_DELIVERY_TOKEN=your_delivery_token_here (optional)
// CONTENTFUL_ENVIRONMENT_ID=master (optional, defaults to 'master')

// Get current configuration (reads from process.env dynamically)
export const getContentfulConfig = (environmentId?: string) => ({
  spaceId: process.env.CONTENTFUL_SPACE_ID,
  managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
  deliveryToken: process.env.CONTENTFUL_DELIVERY_TOKEN,
  environment: environmentId || process.env.CONTENTFUL_ENVIRONMENT_ID || 'master',
})

// Validate required environment variables
export const validateContentfulConfig = () => {
  const config = getContentfulConfig()

  if (!config.spaceId) {
    throw new Error('CONTENTFUL_SPACE_ID environment variable is required')
  }

  if (!config.managementToken) {
    throw new Error('CONTENTFUL_MANAGEMENT_TOKEN environment variable is required')
  }
}

// Validate delivery API configuration
export const validateDeliveryConfig = () => {
  const config = getContentfulConfig()

  if (!config.spaceId) {
    throw new Error('CONTENTFUL_SPACE_ID environment variable is required')
  }

  if (!config.deliveryToken) {
    throw new Error('CONTENTFUL_DELIVERY_TOKEN environment variable is required')
  }
}
