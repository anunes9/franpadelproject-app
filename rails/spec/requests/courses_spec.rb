require "rails_helper"

RSpec.describe "Courses", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it "renders the courses index" do
    get "/dashboard/courses"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Courses/Index"')
  end

  it "renders a course detail page" do
    get "/dashboard/courses/module-1"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Courses/Show"')
  end

  it "404s for an unknown module id" do
    get "/dashboard/courses/nope"
    expect(response).to have_http_status(:not_found)
  end
end
