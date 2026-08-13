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
end
