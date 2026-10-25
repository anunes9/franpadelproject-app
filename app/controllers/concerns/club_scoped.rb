# Finds records only within the Clubs the signed-in user can access, so a
# record of another Club is a 404, as if it did not exist.
module ClubScoped
  extend ActiveSupport::Concern

  private

  def find_accessible_club(id)
    current_user.accessible_clubs.find(id)
  end

  def accessible_players
    Player.where(club: current_user.accessible_clubs)
  end
end
