require "rails_helper"

RSpec.describe "Plan", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it "renders the weekly plan page" do
    get "/dashboard/plan"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Plan/Index"')
  end
end
