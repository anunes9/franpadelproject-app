# The Manager home: an overview of one of the Club Manager's linked Clubs,
# with its Coaches, Class Groups and Players, and a switcher between those
# Clubs. Clubs the Manager is not linked to are 404s, and so is the screen for
# anyone who is not a Club Manager.
class ClubsController < DashboardController
  include ClubScoped

  before_action :require_club_manager

  def show
    club = find_accessible_club(params[:id])

    render inertia: "Clubs/Show", props: {
      club: { id: club.id, name: club.name },
      coaches: club.coaches.order(:name).map { |coach| { id: coach.id, name: coach.name, email: coach.email } },
      # Class Groups do not exist yet; the overview shows them as empty until
      # they do.
      classGroups: [],
      players: club.players.alphabetical.map(&:roster_json)
    }
  end

  private

  def require_club_manager
    raise ActiveRecord::RecordNotFound unless current_user.club_manager?
  end
end
