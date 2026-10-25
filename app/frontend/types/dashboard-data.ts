export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed'

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
  category: 'Technical' | 'Tactical' | null
  media: CourseDocument[]
  description: string
  content: string | null
  moduleId: string | null
  duration: string | null
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
  // The Clubs whose roster this user manages: a Coach's one Club, or a Club
  // Manager's linked Clubs.
  clubs: ClubSummary[]
}

export interface ClubSummary {
  id: string
  name: string
}

export interface ClubCoach {
  id: string
  name: string
  email: string
}

// A Class Group as listed on the Manager's Club overview. Class Groups do not
// exist yet, so the overview always receives an empty list for now.
export interface ClassGroupSummary {
  id: string
  name: string
}

export type PlayerPosition = 'left' | 'right' | 'both'
export type PlayerHand = 'left' | 'right'
export type PlayerLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Player {
  id: string
  name: string
  position: PlayerPosition
  hand: PlayerHand
  level: PlayerLevel
}
