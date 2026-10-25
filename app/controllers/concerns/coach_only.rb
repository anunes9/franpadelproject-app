# Screens only Coaches use. Anyone else gets a 404, as if the screen did not
# exist. A controller with some actions for other users too skips the check
# for those: `skip_before_action :require_coach, only: :show`.
module CoachOnly
  extend ActiveSupport::Concern

  included do
    before_action :require_coach
  end

  private

  def require_coach
    raise ActiveRecord::RecordNotFound unless current_user.coach?
  end
end
