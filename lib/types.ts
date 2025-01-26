import { Document } from "@contentful/rich-text-types"

export interface MesoProps {
  slug: string
  title: string
  concept: string
  description: { json: Document }
  content: { json: Document }
  level: string
  exercisesCollection: {
    items: {
      url: string
      title: string
      width: number
      height: number
    }[]
  }
  videosCollection: {
    items: {
      url: string
      title: string
      width: number
      height: number
    }[]
  }
}

export interface AcademyProps {
  slug: string
  title: string
  level: number
  description: { json: Document }
  hero: { url: string }
}
