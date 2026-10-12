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

    expect(response.body).to include('"status":"completed"')
    expect(response.body).to include('"progress":100')
  end

  it "sends the Module's Exercise counts rather than every Exercise" do
    user_module = create(:course_module, slug: "module-1", position: 1)
    done = create(:exercise, course_module: user_module)
    create(:exercise, course_module: user_module)
    create(:exercise_completion, user: user, exercise: done)

    get "/dashboard/courses/module-1"

    expect(response.body).to include('"exerciseStats":{"count":2,"completed":1}')
  end

  it "redirects a Locked Module back to the courses index" do
    create(:course_module, slug: "module-1", position: 1)
    create(:course_module, slug: "module-2", position: 2)

    get "/dashboard/courses/module-2"

    expect(response).to redirect_to("/dashboard/courses")
  end

  it "refuses to complete a Locked Module" do
    create(:course_module, slug: "module-1", position: 1)
    locked = create(:course_module, slug: "module-2", position: 2)

    patch "/dashboard/courses/module-2/complete"

    expect(response).to redirect_to("/dashboard/courses")
    expect(UserModuleProgress.find_by(user: user, course_module: locked)).to be_nil
  end

  it "lists a module's documents with inline-disposition urls, no download attribute needed" do
    course_module = create(:course_module, slug: "module-1")
    course_module.documents.attach(io: StringIO.new("pdf"), filename: "slides.pdf", content_type: "application/pdf")

    get "/dashboard/courses/module-1"

    expect(response.body).to include('"filename":"slides.pdf"')
    expect(response.body).to include("disposition=inline")
  end

  describe "PATCH /dashboard/courses/:id/complete" do
    it "marks the module done for the current user and redirects back to it" do
      course_module = create(:course_module, slug: "module-1")

      patch "/dashboard/courses/module-1/complete"

      expect(response).to redirect_to("/dashboard/courses/module-1")
      progress = UserModuleProgress.find_by(user: user, course_module: course_module)
      expect(progress).to have_attributes(status: "done", progress: 100)
    end

    it "404s for an unknown module id" do
      patch "/dashboard/courses/nope/complete"
      expect(response).to have_http_status(:not_found)
    end
  end
end
