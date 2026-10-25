# The Club Manager home: an overview of one of the Club Manager's linked Clubs,
# with its Coaches and Players, and a switcher between those Clubs. Clubs the
# Club Manager is not linked to are 404s, and so is the screen for anyone who
# is not a Club Manager.
class ClubsController < DashboardController
  include ClubScoped

  before_action :require_club_manager

  # The "Clubs/Show" props for a Club, or for no Club while the Club Manager
  # is not linked to any, which the page shows as an empty Club Manager home.
  def self.overview_props(club)
    return { club: nil, coaches: [], players: [] } unless club

    {
      club: club.summary_json,
      coaches: club.coaches.order(:name).map { |coach| { id: coach.id, name: coach.name, email: coach.email } },
      players: club.players.alphabetical.map(&:players_json)
    }
  end

  def show
    render inertia: "Clubs/Show", props: self.class.overview_props(find_accessible_club(params[:id]))
  end

  private

  def require_club_manager
    raise ActiveRecord::RecordNotFound unless current_user.club_manager?
  end
end
