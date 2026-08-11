class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  inertia_share do
    {
      current_user: current_user && {
        email: current_user.email,
        role: current_user.role
      }
    }
  end
end
