class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  inertia_share do
    {
      current_user: current_user && {
        email: current_user.email,
        role: current_user.role
      },
      locale: current_user&.locale || "pt"
    }
  end

  private

  # A record's validation errors as the forms read them: per field, a stable
  # code (such as "blank" or "taken") the form maps to its own copy in the
  # Client's language, and the server's message for codes it does not know.
  def form_errors(record)
    record.errors.group_by_attribute.transform_values do |errors|
      errors.map { |error| { code: error.type.to_s, message: error.message } }
    end
  end
end
