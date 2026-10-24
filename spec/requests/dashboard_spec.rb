require "rails_helper"

RSpec.describe "Dashboard", type: :request do
  it "redirects an unauthenticated visitor to the login page" do
    get "/dashboard"
    expect(response).to redirect_to(new_user_session_path)
  end

  it "renders the real dashboard home for an authenticated user" do
    user = create(:user, name: "Ana Costa")
    create(:course_module, slug: "module-1", title: "Real Module")
    sign_in user

    get "/dashboard"

    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Dashboard/Home"')
    expect(response.body).to include("Real Module")
    expect(response.body).to include("Ana Costa")
  end

  it "exposes the user's weekly plan" do
    user = create(:user)
    create(:plan_entry, user: user, day: :thursday, plannable: create(:exercise, ref: "EX-9"))
    sign_in user

    get "/dashboard"

    expect(response.body).to include('"Thursday":[{')
    expect(response.body).to include('"key":"EX-9"')
  end

  it "shares the signed-in user's locale" do
    user = create(:user, name: "Ana Costa", locale: :en)
    sign_in user

    get "/dashboard"

    expect(response.body).to include('"locale":"en"')
  end
end
