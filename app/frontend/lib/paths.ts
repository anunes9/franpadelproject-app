// The dashboard's Club and Player URLs, mirroring config/routes.rb, and the
// matchers that tell which of those screens a URL is on.

export const clubPath = (clubId: string) => `/dashboard/clubs/${clubId}`
export const clubPlayersPath = (clubId: string) => `${clubPath(clubId)}/players`
export const newClubPlayerPath = (clubId: string) => `${clubPlayersPath(clubId)}/new`
export const playerPath = (playerId: string) => `/dashboard/players/${playerId}`
export const editPlayerPath = (playerId: string) => `${playerPath(playerId)}/edit`

// The Club selected in the URL (/dashboard/clubs/:id...), if any.
export const selectedClubId = (pathname: string) => pathname.match(/^\/dashboard\/clubs\/([^/?#]+)/)?.[1]

// The Club Manager home: a Club overview, /dashboard/clubs/:id.
export const isClubOverviewPath = (pathname: string) => /^\/dashboard\/clubs\/[^/?#]+\/?(?:[?#]|$)/.test(pathname)

// A Players screen: a Club's Players, or adding or editing one of them.
export const isPlayersPath = (pathname: string) => /^\/dashboard\/(?:clubs\/[^/?#]+\/)?players/.test(pathname)

// Inviting a Coach to a Club, and the emailed link that accepts it.
export const clubCoachInvitationsPath = (clubId: string) => `${clubPath(clubId)}/coach_invitations`
export const newClubCoachInvitationPath = (clubId: string) => `${clubCoachInvitationsPath(clubId)}/new`
export const acceptCoachInvitationPath = (token: string) => `/invitations/${token}`

// A Club's Break Periods, managed by its Club Managers.
export const clubBreakPeriodsPath = (clubId: string) => `${clubPath(clubId)}/break_periods`
export const newClubBreakPeriodPath = (clubId: string) => `${clubBreakPeriodsPath(clubId)}/new`
export const breakPeriodPath = (breakPeriodId: string) => `/dashboard/break_periods/${breakPeriodId}`
export const editBreakPeriodPath = (breakPeriodId: string) => `${breakPeriodPath(breakPeriodId)}/edit`

// A Coach's Class Groups and their Training Plans.
export const classGroupsPath = '/dashboard/class_groups'
export const newClassGroupPath = `${classGroupsPath}/new`
export const classGroupPath = (classGroupId: string) => `${classGroupsPath}/${classGroupId}`
// Creating the group that continues a finished group at the next Level.
export const newClassGroupFromPath = (classGroupId: string) =>
  `${newClassGroupPath}?from=${encodeURIComponent(classGroupId)}`
// Editing a group's Players and schedule; the edit is sent to classGroupPath.
export const editClassGroupPath = (classGroupId: string) => `${classGroupPath(classGroupId)}/edit`

// A Class of a Training Plan: its page (no edit), moving it (no edit), and
// skipping, unskipping or marking it done. Adding a Class goes to its group.
export type ClassEdit = 'skip' | 'unskip' | 'done' | 'undone'
export const classGroupClassesPath = (classGroupId: string) => `${classGroupPath(classGroupId)}/classes`
export const classPath = (classId: string, edit?: ClassEdit) =>
  edit ? `/dashboard/classes/${classId}/${edit}` : `/dashboard/classes/${classId}`

// The Class Groups page at the week holding `date` (YYYY-MM-DD).
export const classGroupsWeekPath = (date: string) => `${classGroupsPath}?week=${encodeURIComponent(date)}`

// Renaming a group from its page.
export const classGroupNamePath = (classGroupId: string) => `${classGroupPath(classGroupId)}/name`

// Regenerating a group's Training Plan, only on request.
export const classGroupRegenerationPath = (classGroupId: string) => `${classGroupPath(classGroupId)}/regeneration`

// Reassigning a group to another Coach of its Club, by its Club Managers.
export const classGroupReassignmentPath = (classGroupId: string) => `${classGroupPath(classGroupId)}/reassignment`

// Removing a Coach from a Club, by its Club Managers.
export const clubCoachPath = (clubId: string, coachId: string) => `${clubPath(clubId)}/coaches/${coachId}`

// The Exercises a Coach picks for a Class.
export const classExercisePath = (classId: string, exerciseRef: string) =>
  `${classPath(classId)}/exercises/${encodeURIComponent(exerciseRef)}`

// An Exercise of the library.
export const exercisePath = (exerciseRef: string) => `/dashboard/exercises/${encodeURIComponent(exerciseRef)}`

// A Break Periods screen: a Club's Break Periods, or adding or editing one.
// They sit under the Club Manager home in the navigation.
export const isBreakPeriodsPath = (pathname: string) =>
  /^\/dashboard\/(?:clubs\/[^/?#]+\/)?break_periods/.test(pathname)

// A Coach's Boards (Quadro), interactive courts to explain on: their own
// library, a new scratch Board, and one saved Board.
export const boardsPath = '/dashboard/boards'
export const newBoardPath = `${boardsPath}/new`
export const boardPath = (boardId: string) => `${boardsPath}/${boardId}`

// An Exercise's official Board: a copy for a Coach to explain on, or, for
// Admins, editing it.
export const exerciseBoardPath = (ref: string) => `${exercisePath(ref)}/board`
export const editExerciseBoardPath = (ref: string) => `${exerciseBoardPath(ref)}/edit`
