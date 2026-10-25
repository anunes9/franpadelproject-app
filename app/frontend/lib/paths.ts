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
