require "rails_helper"

RSpec.describe "Courses::Quiz", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it "renders the quiz page" do
    create(:course_module, slug: "module-1")

    get "/dashboard/courses/module-1/quiz"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Courses/Quiz"')
  end

  it "redirects a Locked Module's quiz back to the courses index" do
    create(:course_module, slug: "module-1", position: 1)
    create(:course_module, slug: "module-2", position: 2)

    get "/dashboard/courses/module-2/quiz"
    expect(response).to redirect_to("/dashboard/courses")
  end

  it "404s for an unknown module id" do
    get "/dashboard/courses/nope/quiz"
    expect(response).to have_http_status(:not_found)
  end
end
