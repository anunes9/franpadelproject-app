# Screens only Coaches use. Anyone else gets a 404, as if the screen did not
# exist. Pass `only:` / `except:` to limit it to some actions.
module CoachOnly
  extend ActiveSupport::Concern

  class_methods do
    def coach_only(**options)
      before_action :require_coach, **options
    end
  end

  private

  def require_coach
    raise ActiveRecord::RecordNotFound unless current_user.coach?
  end
end
