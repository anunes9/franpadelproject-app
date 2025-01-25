import { Document } from "@contentful/rich-text-types"

export interface MesoProps {
  description: { json: Document }
  slug: string
  title: string
  concept: string
  detailsCollection: {
    items: {
      title: string
      content: { json: Document }
    }[]
  }
  exercisesCollection: {
    items: {
      url: string
      title: string
      width: number
      height: number
    }[]
  }
}
