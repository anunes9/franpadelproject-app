require "rails_helper"

RSpec.describe "InertiaExample", type: :request do
  it "renders the generated example page via Inertia at root" do
    get "/"
    expect(response).to have_http_status(200)
    expect(response.body).to include("data-page")
  end
end
