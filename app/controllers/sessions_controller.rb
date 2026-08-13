class SessionsController < Devise::SessionsController
  # On failed login, Devise's Warden failure app recalls this #new action
  # in-process (see devise/failure_app.rb#recall) instead of raising or
  # redirecting, forcing the response status to 422 regardless of what this
  # action itself renders. It also sets flash[:alert] to the "invalid email
  # or password" message before recalling, which is surfaced here as a prop.
  def new
    @title = "Fran Padel Academy — Curso de Padel Online"
    @head_partial = "sessions/seo_meta"
    render inertia: "Auth/Login", props: { errors: flash[:alert] ? { base: "invalid_credentials" } : {} }
  end

  def create
    self.resource = warden.authenticate!(auth_options)
    sign_in(resource_name, resource)
    redirect_to dashboard_path
  end

  def destroy
    sign_out(resource_name)
    redirect_to new_user_session_path
  end

  # Devise's default require_no_authentication before_action (runs on #new)
  # redirects here when someone already signed in visits the login page.
  # The default implementation falls back to root_path, which is this same
  # login page, causing a redirect loop — so it must resolve to the
  # dashboard instead.
  def after_sign_in_path_for(resource)
    dashboard_path
  end
end
