// TypeScript types for Contentful management operations

export interface ContentfulField {
  id: string
  name: string
  type: string
  required?: boolean
  localized?: boolean
  validations?: any[]
  items?: {
    type: string
    validations?: any[]
    linkType?: string
  }
  linkType?: string
}

export interface ContentfulContentType {
  id: string
  name: string
  description: string
  fields: ContentfulField[]
  displayField?: string
}

export interface ContentfulEntry {
  sys: {
    id: string
    type: string
    createdAt: string
    updatedAt: string
    publishedAt?: string
    publishedVersion?: number
    version: number
    space: {
      sys: {
        type: string
        linkType: string
        id: string
      }
    }
    environment: {
      sys: {
        id: string
        type: string
        linkType: string
      }
    }
    contentType: {
      sys: {
        type: string
        linkType: string
        id: string
      }
    }
  }
  fields: Record<string, any>
}

export interface ContentfulAsset {
  sys: {
    id: string
    type: string
    createdAt: string
    updatedAt: string
    publishedAt?: string
    publishedVersion?: number
    version: number
    space: {
      sys: {
        type: string
        linkType: string
        id: string
      }
    }
    environment: {
      sys: {
        id: string
        type: string
        linkType: string
      }
    }
  }
  fields: {
    title: Record<string, string>
    description: Record<string, string>
    file: Record<
      string,
      {
        contentType: string
        fileName: string
        url: string
        details: {
          size: number
          image?: {
            width: number
            height: number
          }
        }
      }
    >
  }
}

export interface CreateEntryOptions {
  contentTypeId: string
  fields: Record<string, any>
  environmentId?: string
}

export interface UpdateEntryOptions {
  entryId: string
  fields: Record<string, any>
  environmentId?: string
}

export interface CreateAssetOptions {
  file: Buffer | string
  fileName: string
  contentType: string
  title?: string
  description?: string
  environmentId?: string
}

export interface CreateContentTypeOptions {
  contentTypeId: string
  name: string
  description: string
  fields: ContentfulField[]
  displayField?: string
  environmentId?: string
}
