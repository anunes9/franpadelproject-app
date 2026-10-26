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

    coaches = club.coaches.order(:name).to_a
    # Each Coach's Course progress, the same numbers their Course home shows.
    progress = CourseModule.progress_for(coaches)

    {
      club: club.summary_json,
      coaches: coaches.map do |coach|
        { id: coach.id, name: coach.name, email: coach.email, courseProgress: progress[coach.id] }
      end,
      classGroups: ClassGroup.of_clubs(club).with_finished.includes(:coach, :players)
                             .order("users.name", :created_at).map(&:list_json),
      players: club.players.alphabetical.map(&:players_json)
    }
  end

  def show
    club = find_accessible_club(params[:id])
    render inertia: "Clubs/Show", props: self.class.overview_props(club).merge(
      pending_invitations_props(club),
      # The Coach whose removal was just refused (see ClubCoachesController),
      # for the page to show why by them.
      refusedEdit: flash[:refused_edit]
    )
  end

  private

  # The Coach invitations of the Club still waiting to be accepted.
  def pending_invitations_props(club)
    { pendingInvitations: club.coach_invitations.pending.order(:name).map(&:summary_json) }
  end
end
