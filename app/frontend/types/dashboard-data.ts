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
  // The Clubs whose Players this user manages: a Coach's one Club, or a Club
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

// A Coach invitation of a Club that is still waiting to be accepted.
export interface PendingCoachInvitation {
  id: string
  name: string
  email: string
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

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

// A Class Group as the Class Group lists show it. startTime is "HH:MM" and
// duration is in minutes (60 or 90).
export interface ClassGroupListItem {
  id: string
  level: PlayerLevel
  weekdays: Weekday[]
  startTime: string
  duration: number
  coach: string
  playerCount: number
}

export interface ClassGroup {
  id: string
  level: PlayerLevel
  // ISO date (YYYY-MM-DD).
  startsOn: string
  cadence: number
  weekdays: Weekday[]
  startTime: string
  duration: number
  coach: string
  club: ClubSummary
  players: Player[]
}

// One Class of a Training Plan. An Assessment Class is the last of its Module.
export interface TrainingClass {
  id: string
  // ISO date (YYYY-MM-DD).
  date: string
  startTime: string
  kind: 'regular' | 'assessment'
  done: boolean
  // A skipped Class stays in the plan but no longer takes up its time.
  skipped: boolean
  // Added by hand by the Coach, rather than generated.
  coachAdded: boolean
  module: { slug: string; number: number; title: string }
  // The Exercises the Coach picked, in the order picked.
  exercises: Array<{ ref: string; title: string }>
}

// An Exercise of a Class's Module, picked for the Class or left to pick.
export interface ClassExercise {
  ref: string
  title: string
  duration: string | null
  category: 'Technical' | 'Tactical' | null
}

// A Module a Class can be added for: one of the group's Course.
// A Coach a Club Manager can reassign a Class Group to.
export interface CoachOption {
  id: string
  name: string
}

export interface ModuleOption {
  id: string
  number: number
  title: string
}

// A Club's date range with no Classes. Dates are ISO (YYYY-MM-DD), both included.
export interface BreakPeriod {
  id: string
  name: string
  startsOn: string
  endsOn: string
}
