# The Club Manager home: an overview of one of the Club Manager's linked Clubs,
# with its Coaches and Players, and a switcher between those Clubs. Clubs the
# Club Manager is not linked to are 404s, and so is the screen for anyone who
# is not a Club Manager.
class ClubsController < DashboardController
  include ClubScoped
  include ClubManagerOnly

  # The "Clubs/Show" props for a Club, or for no Club while the Club Manager
  # is not linked to any, which the page shows as an empty Club Manager home.
  def self.overview_props(club)
    return { club: nil, coaches: [], classGroups: [], players: [] } unless club

    {
      club: club.summary_json,
      coaches: club.coaches.order(:name).map { |coach| { id: coach.id, name: coach.name, email: coach.email } },
      classGroups: ClassGroup.of_clubs(club).includes(:coach, :players)
                             .order("users.name", :created_at).map(&:list_json),
      players: club.players.alphabetical.map(&:players_json)
    }
  end

  def show
    club = find_accessible_club(params[:id])
    render inertia: "Clubs/Show", props: self.class.overview_props(club).merge(pending_invitations_props(club))
  end

  private

  # The Coach invitations of the Club still waiting to be accepted.
  def pending_invitations_props(club)
    { pendingInvitations: club.coach_invitations.pending.order(:name).map(&:summary_json) }
  end
end
