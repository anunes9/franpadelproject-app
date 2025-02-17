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

export interface QuestionProps {
  number: string
  question: string
  answers: string[]
  percentage?: number
  passed: boolean
}

export interface CertificationProps {
  id: string
  answers: Record<string, string>
  percentage?: number
  passed: boolean
}

export interface AcademyProps {
  slug: string
  title: string
  level: number
  description: { json: Document }
  hero: { url: string }
}

export interface UserProps {
  email: string
  name: string
  avatar_url: string
  club_name: string
  club_banner_url: string
  active: boolean
  subscription_pack: string
}
