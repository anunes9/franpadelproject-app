require "rails_helper"

RSpec.describe "Profile", type: :request do
  let(:user) { create(:user, email: "test@example.com") }

  before { sign_in user }

  it "renders the profile page with real email and role, mock everything else" do
    get "/dashboard/profile"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Profile/Show"')
    expect(response.body).to include("test@example.com")
    expect(response.body).to include(user.role)
  end
end
