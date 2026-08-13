require "rails_helper"

RSpec.describe "Courses", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it "renders the courses index with real module data" do
    create(:course_module, slug: "module-1", title: "Real Module", position: 1)

    get "/dashboard/courses"

    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Courses/Index"')
    expect(response.body).to include("Real Module")
  end

  it "renders a course detail page with its parsed sections" do
    create(:course_module, slug: "module-1", title: "Real Module",
                            content: "## Heading\n\n- Bullet one;")

    get "/dashboard/courses/module-1"

    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Courses/Show"')
    expect(response.body).to include("Bullet one;")
  end

  it "404s for an unknown module id" do
    get "/dashboard/courses/nope"
    expect(response).to have_http_status(:not_found)
  end

  it "reflects the current user's progress for a module" do
    course_module = create(:course_module, slug: "module-1")
    create(:user_module_progress, user: user, course_module: course_module, status: :done, progress: 100)

    get "/dashboard/courses/module-1"

    expect(response.body).to include('"status":"done"')
    expect(response.body).to include('"progress":100')
  end

  it "lists a module's documents with inline-disposition urls, no download attribute needed" do
    course_module = create(:course_module, slug: "module-1")
    course_module.documents.attach(io: StringIO.new("pdf"), filename: "slides.pdf", content_type: "application/pdf")

    get "/dashboard/courses/module-1"

    expect(response.body).to include('"filename":"slides.pdf"')
    expect(response.body).to include("disposition=inline")
  end
end
