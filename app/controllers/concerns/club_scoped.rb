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

  def accessible_break_periods
    BreakPeriod.where(club: current_user.accessible_clubs)
  end

  # Unlike the Club's roster, a Class Group is private to its Coach: other
  # Coaches of the Club cannot see it, though its Club Managers can.
  def accessible_class_groups
    ClassGroup.visible_to(current_user)
  end
end
