require "rails_helper"

RSpec.describe "Profile", type: :request do
  let(:user) { create(:user, email: "test@example.com", name: "Ana Costa") }

  before { sign_in user }

  it "renders the profile page with the real signed-in user's data" do
    get "/dashboard/profile"

    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Profile/Show"')
    expect(response.body).to include("test@example.com")
    expect(response.body).to include(user.role)
    expect(response.body).to include("Ana Costa")
  end

  it "shows the user's club name when they belong to one" do
    club = Club.create!(name: "Padel Clube Lisboa")
    user.update!(club: club)

    get "/dashboard/profile"

    expect(response.body).to include("Padel Clube Lisboa")
  end

  describe "PATCH /dashboard/profile" do
    it "updates the current user's level and redirects back" do
      patch "/dashboard/profile", params: { level: "advanced" }, headers: { "HTTP_REFERER" => "/dashboard/profile" }

      expect(response).to redirect_to("/dashboard/profile")
      expect(user.reload.level).to eq("advanced")
    end

    it "updates the current user's hand and redirects back" do
      patch "/dashboard/profile", params: { hand: "left" }, headers: { "HTTP_REFERER" => "/dashboard/profile" }

      expect(response).to redirect_to("/dashboard/profile")
      expect(user.reload.hand).to eq("left")
    end

    it "falls back to the dashboard when there's no referer" do
      patch "/dashboard/profile", params: { level: "advanced" }

      expect(response).to redirect_to(dashboard_path)
    end

    it "rejects an invalid level without changing the user" do
      patch "/dashboard/profile", params: { level: "expert" }

      expect(response).to have_http_status(:unprocessable_content)
      expect(user.reload.level).to be_nil
    end

    it "rejects an invalid hand without changing the user" do
      patch "/dashboard/profile", params: { hand: "both" }

      expect(response).to have_http_status(:unprocessable_content)
      expect(user.reload.hand).to be_nil
    end

    it "requires authentication" do
      sign_out user
      patch "/dashboard/profile", params: { level: "advanced" }
      expect(response).to redirect_to(new_user_session_path)
    end
  end
end
