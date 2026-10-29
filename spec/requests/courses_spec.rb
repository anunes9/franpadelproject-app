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
    create(:exercise_completion, user: user, exercise: create(:exercise, course_module: course_module))

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

  it "sends the number of questions in the Module's Quiz, or 0 when it has none" do
    course_module = create(:course_module, slug: "module-1", position: 1)

    get "/dashboard/courses/module-1"
    expect(response.body).to include('"quizQuestionCount":0')

    create_list(:quiz_question, 3, quiz: create(:quiz, course_module: course_module))
    get "/dashboard/courses/module-1"
    expect(response.body).to include('"quizQuestionCount":3')
  end

  it "redirects a Locked Module back to the courses index" do
    create(:exercise, course_module: create(:course_module, slug: "module-1", position: 1))
    create(:course_module, slug: "module-2", position: 2)

    get "/dashboard/courses/module-2"

    expect(response).to redirect_to("/dashboard/courses")
  end

  it "lists a module's documents with inline-disposition urls, no download attribute needed" do
    course_module = create(:course_module, slug: "module-1")
    course_module.documents.attach(io: StringIO.new("pdf"), filename: "slides.pdf", content_type: "application/pdf")

    get "/dashboard/courses/module-1"

    expect(response.body).to include('"filename":"slides.pdf"')
    expect(response.body).to include("disposition=inline")
  end

  it "has no manual way to mark a Module as done" do
    create(:course_module, slug: "module-1")

    patch "/dashboard/courses/module-1/complete"

    expect(response).to have_http_status(:not_found)
  end
end
