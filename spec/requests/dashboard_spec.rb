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

  it "renders the Course home for a Coach without any Weekly Plan data" do
    sign_in create(:user, :coach)

    get "/dashboard"

    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Dashboard/Home"')
    expect(response.body).not_to include("&quot;plan&quot;")
  end

  it "renders the Manager home for a Club Manager without any Weekly Plan data" do
    sign_in create(:user, :club_manager)

    get "/dashboard"

    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Clubs/Show"')
    expect(response.body).not_to include("&quot;plan&quot;")
  end

  %i[coach club_manager].each do |role|

    it "lets a #{role} browse Courses and Exercises and keep their own progress" do
      user = create(:user, role)
      create(:course_module, slug: "module-1", position: 1)
      create(:exercise, ref: "EX-1")
      sign_in user

      get "/dashboard/courses"
      expect(response).to have_http_status(200)
      get "/dashboard/exercises"
      expect(response).to have_http_status(200)
      expect { patch "/dashboard/exercises/EX-1/complete" }.to change { user.exercise_completions.count }.by(1)
    end
  end

  it "no longer routes the Weekly Plan" do
    sign_in create(:user)

    get "/dashboard/plan"

    expect(response).to have_http_status(404)
  end

  it "shares the signed-in user's locale" do
    user = create(:user, name: "Ana Costa", locale: :en)
    sign_in user

    get "/dashboard"

    expect(response.body).to include('"locale":"en"')
  end
end
