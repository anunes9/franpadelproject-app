require "rails_helper"

RSpec.describe "Exercises", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it "renders the exercises index" do
    get "/dashboard/exercises"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Exercises/Index"')
  end

  it "renders an exercise detail page" do
    get "/dashboard/exercises/EX-01"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Exercises/Show"')
  end

  it "404s for an unknown exercise ref" do
    get "/dashboard/exercises/nope"
    expect(response).to have_http_status(:not_found)
  end
end
