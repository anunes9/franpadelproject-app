require "rails_helper"

RSpec.describe "Dashboard", type: :request do
  it "redirects an unauthenticated visitor to the login page" do
    get "/dashboard"
    expect(response).to redirect_to(new_user_session_path)
  end

  it "renders the real dashboard home for an authenticated user" do
    user = create(:user)
    create(:course_module, slug: "module-1", title: "Real Module")
    sign_in user

    get "/dashboard"

    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Dashboard/Home"')
    expect(response.body).to include("Real Module")
  end
end
