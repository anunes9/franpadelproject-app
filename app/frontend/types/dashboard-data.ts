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
  // Its official Board's document, its court diagram, if it has one.
  board: unknown | null
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

// A Quiz question as a Client takes it, in their language, without the answer.
export interface QuizQuestion {
  id: string
  text: string
  options: string[]
}

// A Quiz Attempt's result, shown once straight after submitting. It names the
// wrong questions but never the correct answers.
export interface QuizResult {
  score: number
  passed: boolean
  correct: number
  total: number
  answers: Record<string, number>
  wrongQuestionIds: string[]
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
  // Absent where only the Coach's identity is needed.
  courseProgress?: CoachCourseProgress
}

// One Course of a Coach's progress, the same numbers their Course home shows.
// A Planned Course has no Modules: modulesTotal is 0.
export interface CourseProgressEntry {
  level: Level
  modulesDone: number
  modulesTotal: number
  progress: number
}

export interface CoachCourseProgress {
  courses: CourseProgressEntry[]
  exercisesDone: number
}

// A Coach invitation of a Club that is still waiting to be accepted.
export interface PendingCoachInvitation {
  id: string
  name: string
  email: string
}

export type PlayerPosition = 'left' | 'right' | 'both'
export type PlayerHand = 'left' | 'right'
// A Course Level, shared by Players, Class Groups and Courses.
export type Level = 'beginner' | 'intermediate' | 'advanced'

export interface Player {
  id: string
  name: string
  position: PlayerPosition
  hand: PlayerHand
  level: Level
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

// A Class Group as the Class Group lists show it. startTime is "HH:MM" and
// duration is in minutes (60 or 90).
export interface ClassGroupListItem {
  id: string
  // The Coach's own name for the group; null shows it by its Level.
  name: string | null
  level: Level
  weekdays: Weekday[]
  startTime: string
  duration: number
  coach: string
  playerCount: number
  // Every Class done or skipped, at least one done: kept as history.
  finished: boolean
}

// How far a Training Plan has got: each Module's done and planned Classes
// (skipped ones left out), the Module being taught, and the next Class to
// teach with its number in the plan.
export interface PlanProgress {
  modules: Array<{ number: number; done: number; total: number }>
  currentModule: number | null
  done: number
  total: number
  nextClass: { id: string; date: string; startTime: string; number: number } | null
}

// A Class Group as the Coach's Class Groups page shows it.
export interface ClassGroupCard extends ClassGroupListItem {
  playerNames: string[]
  progress: PlanProgress
}

// A Class of the week on the Class Groups page, numbered in its group's plan.
export interface WeekClass {
  id: string
  date: string
  startTime: string
  duration: number
  kind: 'regular' | 'assessment'
  done: boolean
  number: number
  moduleNumber: number
  group: { id: string; name: string | null; level: Level }
}

// A Class of today on the Coach home, with its group.
export interface TodayClass {
  id: string
  startTime: string
  // Minutes: as long as its group's Classes.
  duration: number
  kind: 'regular' | 'assessment'
  done: boolean
  module: { slug: string; number: number; title: string }
  group: { id: string; name: string | null; level: Level; playerCount: number }
}

// A Class Group as a link to it.
export interface ClassGroupLink {
  id: string
  name: string | null
  level: Level
}

export interface ClassGroup {
  id: string
  name: string | null
  level: Level
  // ISO date (YYYY-MM-DD).
  startsOn: string
  cadence: number
  weekdays: Weekday[]
  startTime: string
  duration: number
  coach: string
  club: ClubSummary
  players: Player[]
  // How many Exercises each Class has, set by the Class duration.
  exercisesPerClass: number
  // Every Class done or skipped, at least one done: kept as history.
  finished: boolean
  // On the group's page: the finished group it continues at the next Level,
  // while the user can see it.
  previousGroup?: ClassGroupLink | null
  // On the group's page: how far its plan has got.
  progress?: PlanProgress
}

// What the create form starts from when continuing a finished group at the
// next Level: that Level and the group's Players still in the Coach's Club.
export interface ClassGroupContinuation {
  from: ClassGroupLink
  level: Level
  playerIds: string[]
}

// One Class of a Training Plan. An Assessment Class is the last of its Module.
export interface TrainingClass {
  id: string
  // Its place in the group's plan: Class 1 is the first by date and time.
  number: number
  // ISO date (YYYY-MM-DD).
  date: string
  startTime: string
  kind: 'regular' | 'assessment'
  done: boolean
  // A skipped Class stays in the plan but no longer takes up its time.
  skipped: boolean
  // Added by hand by the Coach, rather than generated.
  coachAdded: boolean
  module: { slug: string; number: number; title: string; topics: string[] }
  // The Exercises the Coach picked, in the order picked.
  exercises: Array<{ ref: string; title: string }>
}

// How a Class is spent, by its duration: minutes as ranges, and the game
// takes the remaining time.
export interface ClassStructure {
  warmUp: { min: number; max: number }
  exercises: { count: number; minutes: number }
  conditioning: { min: number; max: number }
}

// A Class as its own page shows it, with its Module's description too.
export interface TrainingClassDetail extends TrainingClass {
  module: TrainingClass['module'] & { description: string }
}

// An Exercise of a Class's Module, picked for the Class or left to pick.
export interface ClassExercise {
  ref: string
  title: string
  duration: string | null
  category: 'Technical' | 'Tactical' | null
  // Its first image, if it has one: its court diagram while it has no Board.
  image: string | null
  // Its official Board's document, which is its court diagram, if it has one.
  board: unknown | null
}

// A Module of a group's Course, as the group's plan shows it.
export interface PlanModule {
  id: string
  slug: string
  number: number
  title: string
  description: string
  topics: string[]
}

// A Coach a Club Manager can reassign a Class Group to.
export interface CoachOption {
  id: string
  name: string
}

// A Module a Class can be added for: one of the group's Course.
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
