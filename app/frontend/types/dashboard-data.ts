export type ModuleStatus = 'done' | 'current' | 'locked'

export interface ContentSection {
  heading: string
  items: string[]
}

export interface Module {
  id: string
  n: number
  title: string
  description: string
  topics: string[]
  duration: string
  level: string
  status: ModuleStatus
  progress: number
  sections?: ContentSection[]
}

export interface CourseDocument {
  id: number
  filename: string
  contentType: string
  url: string
}

export interface Exercise {
  ref: string
  title: string
  category: 'Technical' | 'Tactical'
  media: CourseDocument[]
  description: string
  content: string | null
  moduleId: string
  duration: string
  completed: boolean
}

export interface ExerciseModuleOption {
  id: string
  title: string
}

export interface PaginationInfo {
  page: number
  pages: number
  count: number
}

export interface ExerciseFilters {
  category: string
  module: string
}

export interface QuizQuestion {
  q: string
  options: string[]
  correct: number
}

export interface DashboardUser {
  name: string
  initials: string
  club: string | null
}
