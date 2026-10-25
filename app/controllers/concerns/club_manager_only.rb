# Screens only Club Managers use. Anyone else gets a 404, as if the screen did
# not exist.
module ClubManagerOnly
  extend ActiveSupport::Concern

  included do
    before_action :require_club_manager
  end

  private

  def require_club_manager
    raise ActiveRecord::RecordNotFound unless current_user.club_manager?
  end
end
