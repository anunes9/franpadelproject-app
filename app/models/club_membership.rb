# Links a Club Manager to a Club they manage. A Manager can be linked to
# several Clubs; only an Admin creates links.
class ClubMembership < ApplicationRecord
  belongs_to :user
  belongs_to :club

  validates :club_id, uniqueness: { scope: :user_id }
  validate :user_is_club_manager

  def self.ransackable_attributes(_auth_object = nil)
    %w[user_id club_id created_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end

  private

  def user_is_club_manager
    errors.add(:user, "must be a Club Manager") if user && !user.club_manager?
  end
end
